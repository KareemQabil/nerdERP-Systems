import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { PromotionUsage } from '../../products/entities/product-variant.entity';

@Injectable()
export class PromotionUsageService {
    constructor(
        @InjectRepository(PromotionUsage)
        private readonly usageRepo: Repository<PromotionUsage>,
    ) { }

    async findByPromotion(promotionId: string): Promise<PromotionUsage[]> {
        return await this.usageRepo.find({
            where: { promotionId },
            order: { appliedAt: 'DESC' },
        });
    }

    async findByCustomer(customerId: string): Promise<PromotionUsage[]> {
        return await this.usageRepo.find({
            where: { customerId },
            order: { appliedAt: 'DESC' },
        });
    }

    async getUsageCount(promotionId: string, customerId?: string): Promise<number> {
        const query = this.usageRepo.createQueryBuilder('usage')
            .where('usage.promotion_id = :promotionId', { promotionId });

        if (customerId) {
            query.andWhere('usage.customer_id = :customerId', { customerId });
        }

        return await query.getCount();
    }

    @Transactional()
    async recordUsage(
        promotionId: string,
        orderId: string,
        discountApplied: number,
        customerId?: string | null,
        storeId?: string | null,
    ): Promise<PromotionUsage> {
        const usage = this.usageRepo.create({
            promotionId,
            orderId,
            customerId: customerId || undefined,
            discountApplied,
            storeId: storeId || undefined,
        });

        return await this.usageRepo.save(usage);
    }

    async getAnalytics(promotionId: string): Promise<{
        totalUsage: number;
        totalDiscount: number;
        uniqueCustomers: number;
    }> {
        const result = await this.usageRepo
            .createQueryBuilder('usage')
            .select('COUNT(*)', 'totalUsage')
            .addSelect('SUM(usage.discount_applied)', 'totalDiscount')
            .addSelect('COUNT(DISTINCT usage.customer_id)', 'uniqueCustomers')
            .where('usage.promotion_id = :promotionId', { promotionId })
            .getRawOne();

        return {
            totalUsage: parseInt(result.totalUsage) || 0,
            totalDiscount: parseFloat(result.totalDiscount) || 0,
            uniqueCustomers: parseInt(result.uniqueCustomers) || 0,
        };
    }
}
