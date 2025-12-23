import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import Decimal from 'decimal.js';
import { CustomerLoyalty, LoyaltyTransaction, LoyaltyTier } from '../entities/loyalty.entity';
import { Customer } from '../entities/customer.entity';

@Injectable()
export class LoyaltyService {
    constructor(
        @InjectRepository(CustomerLoyalty)
        private readonly loyaltyRepo: Repository<CustomerLoyalty>,
        @InjectRepository(LoyaltyTransaction)
        private readonly transactionRepo: Repository<LoyaltyTransaction>,
        @InjectRepository(LoyaltyTier)
        private readonly tierRepo: Repository<LoyaltyTier>,
        @InjectRepository(Customer)
        private readonly customerRepo: Repository<Customer>,
    ) { }

    /**
     * Calculate points earned from an order amount
     * Points = Amount × pointsPerCurrency (from tier)
     */
    async calculatePointsEarned(customerId: string, orderAmount: string): Promise<number> {
        const loyalty = await this.loyaltyRepo.findOne({
            where: { customerId },
        });

        let pointsPerCurrency = 1; // Default: 1 point per 1 SAR

        if (loyalty && loyalty.tierId) {
            const tier = await this.tierRepo.findOne({ where: { id: loyalty.tierId } });
            if (tier) {
                pointsPerCurrency = tier.pointsPerCurrency;
            }
        }

        // Points = Amount × pointsPerCurrency
        const points = new Decimal(orderAmount)
            .times(pointsPerCurrency)
            .toDecimalPlaces(0, Decimal.ROUND_DOWN);

        return points.toNumber();
    }

    /**
     * Award loyalty points after successful order
     */
    @Transactional()
    async awardPoints(
        customerId: string,
        orderId: string,
        orderAmount: string,
    ): Promise<LoyaltyTransaction> {
        // Get or create customer loyalty record
        let loyalty = await this.loyaltyRepo.findOne({ where: { customerId } });

        if (!loyalty) {
            // Create new loyalty record
            const customer = await this.customerRepo.findOne({ where: { id: customerId } });
            if (!customer) {
                throw new NotFoundException('Customer not found');
            }

            // Get default tier (lowest minPoints)
            const defaultTier = await this.tierRepo.findOne({
                order: { minPoints: 'ASC' },
            });

            loyalty = this.loyaltyRepo.create({
                customerId,
                totalPoints: 0,
                availablePoints: 0,
                tierId: defaultTier?.id,
                lifetimeSpend: 0,
                lastActivityDate: new Date(),
            });
        }

        // Calculate points
        const pointsEarned = await this.calculatePointsEarned(customerId, orderAmount);

        // Update loyalty record
        loyalty.availablePoints += pointsEarned;
        loyalty.totalPoints += pointsEarned;
        loyalty.lifetimeSpend = new Decimal(loyalty.lifetimeSpend).plus(orderAmount).toNumber();
        loyalty.lastActivityDate = new Date();

        await this.loyaltyRepo.save(loyalty);

        // Create transaction record
        const transaction = this.transactionRepo.create({
            customerId,
            transactionType: 'EARN',
            points: pointsEarned,
            pointsAfter: loyalty.availablePoints,
            orderId,
            description: `Points earned from order`,
        });

        await this.transactionRepo.save(transaction);

        // Check if tier upgrade is needed
        await this.updateCustomerTier(customerId);

        return transaction;
    }

    /**
     * Redeem loyalty points for discount
     */
    @Transactional()
    async redeemPoints(customerId: string, points: number): Promise<{
        value: string;
        newBalance: number;
    }> {
        const loyalty = await this.loyaltyRepo.findOne({ where: { customerId } });

        if (!loyalty) {
            throw new NotFoundException('Customer loyalty record not found');
        }

        if (loyalty.availablePoints < points) {
            throw new BadRequestException('Insufficient loyalty points');
        }

        // Get tier to determine redemption rate
        let redemptionRate = 0.01; // Default: 100 points = 1 SAR
        if (loyalty.tierId) {
            const tier = await this.tierRepo.findOne({ where: { id: loyalty.tierId } });
            if (tier) {
                redemptionRate = tier.redemptionRate;
            }
        }

        // Calculate monetary value: points × redemptionRate
        const value = new Decimal(points).times(redemptionRate).toFixed(3);

        // Update loyalty record
        loyalty.availablePoints -= points;
        loyalty.lastActivityDate = new Date();

        await this.loyaltyRepo.save(loyalty);

        // Create transaction record
        const transaction = this.transactionRepo.create({
            customerId,
            transactionType: 'REDEEM',
            points: -points, // Negative for redemption
            pointsAfter: loyalty.availablePoints,
            description: `Redeemed ${points} points for ${value} SAR discount`,
        });

        await this.transactionRepo.save(transaction);

        return {
            value,
            newBalance: loyalty.availablePoints,
        };
    }

    /**
     * Update customer tier based on total points
     */
    @Transactional()
    async updateCustomerTier(customerId: string): Promise<void> {
        const loyalty = await this.loyaltyRepo.findOne({ where: { customerId } });
        if (!loyalty) return;

        // Get all tiers sorted by minPoints descending
        const tiers = await this.tierRepo.find({
            order: { minPoints: 'DESC' },
        });

        // Find appropriate tier based on total points
        for (const tier of tiers) {
            if (loyalty.totalPoints >= tier.minPoints) {
                // Update if different
                if (loyalty.tierId !== tier.id) {
                    loyalty.tierId = tier.id;
                    await this.loyaltyRepo.save(loyalty);

                    // Create transaction for tier change
                    await this.transactionRepo.save(
                        this.transactionRepo.create({
                            customerId,
                            transactionType: 'ADJUST',
                            points: 0,
                            pointsAfter: loyalty.availablePoints,
                            description: `Tier upgraded to ${tier.tierName}`,
                        }),
                    );
                }
                break;
            }
        }
    }

    /**
     * Get customer loyalty summary
     */
    async getLoyaltySummary(customerId: string): Promise<{
        availablePoints: number;
        totalPoints: number;
        lifetimeSpend: number;
        tier: LoyaltyTier | null;
        recentTransactions: LoyaltyTransaction[];
    }> {
        const loyalty = await this.loyaltyRepo.findOne({ where: { customerId } });

        if (!loyalty) {
            return {
                availablePoints: 0,
                totalPoints: 0,
                lifetimeSpend: 0,
                tier: null,
                recentTransactions: [],
            };
        }

        let tier: LoyaltyTier | null = null;
        if (loyalty.tierId) {
            tier = await this.tierRepo.findOne({ where: { id: loyalty.tierId } });
        }

        const recentTransactions = await this.transactionRepo.find({
            where: { customerId },
            order: { createdAt: 'DESC' },
            take: 10,
        });

        return {
            availablePoints: loyalty.availablePoints,
            totalPoints: loyalty.totalPoints,
            lifetimeSpend: loyalty.lifetimeSpend,
            tier,
            recentTransactions,
        };
    }

    /**
     * Get all loyalty tiers
     */
    async getAllTiers(): Promise<LoyaltyTier[]> {
        return await this.tierRepo.find({
            order: { minPoints: 'ASC' },
        });
    }
}
