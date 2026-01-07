import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import Decimal from 'decimal.js';
import { RegisterSession } from '../entities/register-session.entity';
import { RegisterHandover, HandoverStatus } from '../entities/register-handover.entity';
import { CashTransaction, CashTransactionType } from '../../sales/entities/cash-transaction.entity';
import { Payment, PaymentMethod, PaymentTransactionStatus } from '../../sales/entities/payment.entity';
import {
    CreateRegisterSessionDto,
    CloseRegisterSessionDto,
    BlindCloseSessionDto,
    DropToSafeDto,
    PettyCashDto,
    ReviewSessionDto,
    InitiateHandoverDto,
    AcceptHandoverDto,
    DisputeHandoverDto,
    ResolveHandoverDto,
    SessionReportResponseDto,
} from '../dto/cash.dto';

/**
 * Register Session Service
 * 
 * Handles all cash register session operations including:
 * - Opening/closing sessions (blind close supported)
 * - Cash drops and petty cash
 * - Multi-payment type tracking
 * - Shift handovers
 * - Manager session review
 */
@Injectable()
export class RegisterSessionService {
    constructor(
        @InjectRepository(RegisterSession)
        private readonly sessionRepo: Repository<RegisterSession>,
        @InjectRepository(RegisterHandover)
        private readonly handoverRepo: Repository<RegisterHandover>,
        @InjectRepository(CashTransaction)
        private readonly cashTxRepo: Repository<CashTransaction>,
        @InjectRepository(Payment)
        private readonly paymentRepo: Repository<Payment>,
    ) { }

    // =========================================================================
    // BASIC OPERATIONS
    // =========================================================================

    async findAll(): Promise<RegisterSession[]> {
        return await this.sessionRepo.find({
            order: { openedAt: 'DESC' },
        });
    }

    async findById(id: string): Promise<RegisterSession> {
        const session = await this.sessionRepo.findOne({ where: { id } });
        if (!session) {
            throw new NotFoundException(`Register session with ID ${id} not found`);
        }
        return session;
    }

    async getActiveSession(deviceId: string): Promise<RegisterSession | null> {
        return await this.sessionRepo.findOne({
            where: { deviceId, isOpen: true },
        });
    }

    // =========================================================================
    // SESSION OPEN/CLOSE
    // =========================================================================

    @Transactional()
    async openSession(dto: CreateRegisterSessionDto): Promise<RegisterSession> {
        // Check for existing active session
        const existing = await this.getActiveSession(dto.deviceId);
        if (existing) {
            throw new BadRequestException({
                code: 'CASH_002',
                message: 'Device already has an active session',
                details: { existingSessionId: existing.id },
            });
        }

        // Create new session
        const session = this.sessionRepo.create({
            deviceId: dto.deviceId,
            userId: dto.userId,
            storeId: dto.storeId,
            isOpen: true,
            openingBalance: parseFloat(dto.openingBalance),
            expectedBalance: parseFloat(dto.openingBalance),
            openedAt: new Date(),
            handoverFromSessionId: dto.handoverFromSessionId,
            isBlindClose: true, // Default to blind close
        });

        return await this.sessionRepo.save(session);
    }

    /**
     * BLIND CLOSE SESSION
     * 
     * Cashier enters counted cash WITHOUT seeing expected balance.
     * Discrepancy is calculated server-side and only visible to managers.
     */
    @Transactional()
    async closeSessionBlind(id: string, dto: BlindCloseSessionDto): Promise<{
        success: boolean;
        message: string;
        sessionId: string;
    }> {
        const session = await this.findById(id);

        if (!session.isOpen) {
            throw new BadRequestException({
                code: 'CASH_001',
                message: 'Session is already closed',
            });
        }

        // Calculate expected balance (internal only - not exposed to cashier)
        const expectedBalance = await this.calculateExpectedBalance(id);

        // Calculate discrepancy
        const actualBalance = new Decimal(dto.actualBalance);
        const discrepancy = actualBalance.minus(expectedBalance).toFixed(3);

        // Update session
        session.isOpen = false;
        session.closedAt = new Date();
        session.expectedBalance = parseFloat(expectedBalance);
        session.actualBalance = parseFloat(dto.actualBalance);
        session.discrepancy = parseFloat(discrepancy);
        session.notes = dto.notes || '';
        session.isBlindClose = true;

        await this.sessionRepo.save(session);

        // Return minimal response - NO expected balance or discrepancy to cashier
        return {
            success: true,
            message: 'Session closed successfully. Your manager will review the reconciliation.',
            sessionId: session.id,
        };
    }

    /**
     * LEGACY CLOSE SESSION
     * 
     * Standard close that shows expected balance (not recommended).
     * Kept for backward compatibility.
     */
    @Transactional()
    async closeSession(id: string, dto: CloseRegisterSessionDto): Promise<RegisterSession> {
        const session = await this.findById(id);

        if (!session.isOpen) {
            throw new BadRequestException({
                code: 'CASH_001',
                message: 'Session is already closed',
            });
        }

        // Calculate expected balance
        const expectedBalance = await this.calculateExpectedBalance(id);

        // Calculate discrepancy
        const actualBalance = new Decimal(dto.actualBalance);
        const discrepancy = actualBalance.minus(expectedBalance).toFixed(3);

        // Update session
        session.isOpen = false;
        session.closedAt = new Date();
        session.expectedBalance = parseFloat(expectedBalance);
        session.actualBalance = parseFloat(dto.actualBalance);
        session.discrepancy = parseFloat(discrepancy);
        session.notes = dto.notes || '';
        session.isBlindClose = false;

        return await this.sessionRepo.save(session);
    }

    // =========================================================================
    // BALANCE CALCULATIONS
    // =========================================================================

    /**
     * Calculate expected cash balance for a session
     * This is internal and should NOT be exposed to cashiers
     */
    async calculateExpectedBalance(sessionId: string): Promise<string> {
        const session = await this.findById(sessionId);

        let balance = new Decimal(session.openingBalance);

        // Get all payments for orders in this session
        const payments = await this.paymentRepo
            .createQueryBuilder('payment')
            .leftJoin('payment.order', 'order')
            .where('order.registerSessionId = :sessionId', { sessionId })
            .getMany();

        // Track by payment type
        let totalCashSales = new Decimal(0);
        let totalCardSales = new Decimal(0);
        let totalWalletSales = new Decimal(0);
        let totalCreditSales = new Decimal(0);
        let totalRefunds = new Decimal(0);

        for (const payment of payments) {
            const amount = new Decimal(payment.amount);

            switch (payment.method) {
                case PaymentMethod.CASH:
                    totalCashSales = totalCashSales.plus(amount);
                    break;
                case PaymentMethod.CARD:
                case PaymentMethod.MADA:
                case PaymentMethod.VISA:
                case PaymentMethod.MASTERCARD:
                case PaymentMethod.EPT:
                case PaymentMethod.MEEZA:
                    totalCardSales = totalCardSales.plus(amount);
                    break;
                case PaymentMethod.APPLE_PAY:
                case PaymentMethod.GOOGLE_PAY:
                    totalWalletSales = totalWalletSales.plus(amount);
                    break;
                case PaymentMethod.CREDIT:
                    totalCreditSales = totalCreditSales.plus(amount);
                    break;
            }

            // Check for refunds by status
            if (payment.status === PaymentTransactionStatus.REFUNDED) {
                totalRefunds = totalRefunds.plus(amount);
            }
        }

        // Add cash sales to balance
        balance = balance.plus(totalCashSales);

        // Subtract cash transactions (drops, petty cash)
        const transactions = await this.cashTxRepo.find({
            where: { registerSessionId: sessionId },
        });

        let totalDrops = new Decimal(0);
        let totalPettyCash = new Decimal(0);

        for (const tx of transactions) {
            if (tx.transactionType === CashTransactionType.DROP_TO_SAFE) {
                totalDrops = totalDrops.plus(tx.amount);
                balance = balance.minus(tx.amount);
            } else if (tx.transactionType === CashTransactionType.PETTY_CASH) {
                totalPettyCash = totalPettyCash.plus(tx.amount);
                balance = balance.minus(tx.amount);
            }
        }

        // Update session with payment breakdowns
        session.totalCashSales = parseFloat(totalCashSales.toFixed(3));
        session.totalCardSales = parseFloat(totalCardSales.toFixed(3));
        session.totalWalletSales = parseFloat(totalWalletSales.toFixed(3));
        session.totalCreditSales = parseFloat(totalCreditSales.toFixed(3));
        session.totalDrops = parseFloat(totalDrops.toFixed(3));
        session.totalPettyCash = parseFloat(totalPettyCash.toFixed(3));
        session.totalRefunds = parseFloat(totalRefunds.toFixed(3));

        await this.sessionRepo.save(session);

        return balance.toFixed(3);
    }

    /**
     * Get balance information for a session
     * NOTE: This should only be used internally or by managers
     */
    async getBalance(sessionId: string): Promise<{ expected: string; opening: string; cashSales: string }> {
        const expectedBalance = await this.calculateExpectedBalance(sessionId);
        const session = await this.findById(sessionId);

        return {
            expected: expectedBalance,
            opening: session.openingBalance.toFixed(3),
            cashSales: session.totalCashSales.toFixed(3),
        };
    }

    // =========================================================================
    // MANAGER SESSION REPORT (Full Breakdown)
    // =========================================================================

    /**
     * Get full session report - MANAGERS ONLY
     * 
     * This provides complete visibility into session performance
     * including expected balance and discrepancy
     */
    async getSessionReport(sessionId: string): Promise<SessionReportResponseDto> {
        const session = await this.findById(sessionId);

        // Calculate duration
        const openedAt = new Date(session.openedAt);
        const closedAt = session.closedAt ? new Date(session.closedAt) : new Date();
        const durationMs = closedAt.getTime() - openedAt.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        const duration = `${hours}h ${minutes}m`;

        // Calculate totals
        const totalSales = new Decimal(session.totalCashSales || 0)
            .plus(session.totalCardSales || 0)
            .plus(session.totalWalletSales || 0)
            .plus(session.totalCreditSales || 0);

        // Calculate discrepancy percentage
        const expected = new Decimal(session.expectedBalance || 0);
        const discrepancy = new Decimal(session.discrepancy || 0);
        const discrepancyPercentage = expected.isZero()
            ? '0.00'
            : discrepancy.dividedBy(expected).times(100).toFixed(2);

        return {
            sessionId: session.id,

            // Balances
            openingBalance: (session.openingBalance || 0).toFixed(3),
            expectedBalance: (session.expectedBalance || 0).toFixed(3),
            actualBalance: (session.actualBalance || 0).toFixed(3),
            discrepancy: (session.discrepancy || 0).toFixed(3),
            discrepancyPercentage,

            // Sales breakdown
            totalCashSales: (session.totalCashSales || 0).toFixed(3),
            totalCardSales: (session.totalCardSales || 0).toFixed(3),
            totalWalletSales: (session.totalWalletSales || 0).toFixed(3),
            totalCreditSales: (session.totalCreditSales || 0).toFixed(3),
            totalSales: totalSales.toFixed(3),

            // Deductions
            totalDrops: (session.totalDrops || 0).toFixed(3),
            totalPettyCash: (session.totalPettyCash || 0).toFixed(3),
            totalRefunds: (session.totalRefunds || 0).toFixed(3),

            // Analytics
            orderCount: session.orderCount || 0,
            voidCount: session.voidCount || 0,
            refundCount: session.refundCount || 0,
            priceOverrideCount: session.priceOverrideCount || 0,
            managerInterventions: session.managerInterventions || 0,

            // Times
            openedAt: session.openedAt,
            closedAt: session.closedAt,
            duration,

            // User info (would need user lookup in real implementation)
            cashierName: session.userId, // TODO: Lookup user name
            reviewedByName: session.reviewedByUserId,
            reviewedAt: session.reviewedAt,
        };
    }

    /**
     * Manager reviews and acknowledges a session's discrepancy
     */
    @Transactional()
    async reviewSession(sessionId: string, dto: ReviewSessionDto): Promise<RegisterSession> {
        const session = await this.findById(sessionId);

        session.reviewedByUserId = dto.reviewedByUserId;
        session.reviewedAt = new Date();
        session.managerReviewNotes = dto.notes || '';

        return await this.sessionRepo.save(session);
    }

    // =========================================================================
    // CASH TRANSACTIONS
    // =========================================================================

    @Transactional()
    async dropToSafe(sessionId: string, dto: DropToSafeDto): Promise<CashTransaction> {
        const session = await this.findById(sessionId);

        if (!session.isOpen) {
            throw new BadRequestException({
                code: 'CASH_001',
                message: 'Cannot drop to safe on closed session',
            });
        }

        // Validate amount doesn't exceed current balance
        const currentBalance = await this.calculateExpectedBalance(sessionId);
        const dropAmount = new Decimal(dto.amount);

        if (dropAmount.greaterThan(currentBalance)) {
            throw new BadRequestException({
                code: 'CASH_005',
                message: 'Drop amount exceeds current balance',
                details: { currentBalance, requestedDrop: dto.amount },
            });
        }

        // Create transaction
        const currentBalanceDecimal = new Decimal(currentBalance);
        const dropAmountDecimal = new Decimal(dto.amount);
        const balanceAfter = currentBalanceDecimal.minus(dropAmountDecimal);

        const transaction = this.cashTxRepo.create({
            registerSessionId: sessionId,
            transactionType: CashTransactionType.DROP_TO_SAFE,
            amount: parseFloat(dto.amount),
            balanceAfter: parseFloat(balanceAfter.toFixed(3)),
            performedByUserId: dto.userId,
            notes: dto.reason,
        });

        const saved = await this.cashTxRepo.save(transaction);

        // Recalculate balance
        await this.calculateExpectedBalance(sessionId);

        return saved;
    }

    @Transactional()
    async addPettyCash(sessionId: string, dto: PettyCashDto): Promise<CashTransaction> {
        const session = await this.findById(sessionId);

        if (!session.isOpen) {
            throw new BadRequestException({
                code: 'CASH_001',
                message: 'Cannot add petty cash on closed session',
            });
        }

        const currentBalanceDecimal = await this.calculateExpectedBalance(sessionId);
        const pettyCashDecimal = new Decimal(dto.amount);
        const balanceAfter = new Decimal(currentBalanceDecimal).minus(pettyCashDecimal);

        const transaction = this.cashTxRepo.create({
            registerSessionId: sessionId,
            transactionType: CashTransactionType.PETTY_CASH,
            amount: parseFloat(dto.amount),
            balanceAfter: parseFloat(balanceAfter.toFixed(3)),
            performedByUserId: dto.userId,
            notes: dto.reason,
        });

        const saved = await this.cashTxRepo.save(transaction);

        // Recalculate balance
        await this.calculateExpectedBalance(sessionId);

        return saved;
    }

    // =========================================================================
    // HANDOVER OPERATIONS
    // =========================================================================

    /**
     * Initiate handover from outgoing cashier
     */
    @Transactional()
    async initiateHandover(sessionId: string, dto: InitiateHandoverDto): Promise<RegisterHandover> {
        const session = await this.findById(sessionId);

        if (!session.isOpen) {
            throw new BadRequestException({
                code: 'CASH_001',
                message: 'Cannot initiate handover on closed session',
            });
        }

        // Calculate expected balance (hidden from cashiers)
        const expectedBalance = await this.calculateExpectedBalance(sessionId);
        const fromCount = new Decimal(dto.fromCashierCount);
        const fromDiscrepancy = fromCount.minus(expectedBalance);

        // Create handover record
        const handover = this.handoverRepo.create({
            fromSessionId: sessionId,
            fromUserId: session.userId,
            toUserId: dto.toUserId,
            storeId: session.storeId,
            deviceId: session.deviceId,
            handoverInitiatedAt: new Date(),
            fromCashierCount: parseFloat(dto.fromCashierCount),
            expectedBalance: parseFloat(expectedBalance),
            fromDiscrepancy: parseFloat(fromDiscrepancy.toFixed(3)),
            status: HandoverStatus.PENDING,
            fromNotes: dto.notes,
        });

        return await this.handoverRepo.save(handover);
    }

    /**
     * Accept handover by incoming cashier
     */
    @Transactional()
    async acceptHandover(handoverId: string, dto: AcceptHandoverDto): Promise<{
        handover: RegisterHandover;
        newSession: RegisterSession;
    }> {
        const handover = await this.handoverRepo.findOne({ where: { id: handoverId } });
        if (!handover) {
            throw new NotFoundException(`Handover with ID ${handoverId} not found`);
        }

        if (handover.status !== HandoverStatus.PENDING) {
            throw new BadRequestException({
                code: 'CASH_006',
                message: `Handover is ${handover.status}, cannot accept`,
            });
        }

        // Record incoming cashier count
        const toCount = new Decimal(dto.toCashierCount);
        const fromCount = new Decimal(handover.fromCashierCount);
        const countDiscrepancy = toCount.minus(fromCount);

        handover.toCashierCount = parseFloat(dto.toCashierCount);
        handover.countDiscrepancy = parseFloat(countDiscrepancy.toFixed(3));
        handover.toNotes = dto.notes || '';
        handover.status = HandoverStatus.ACCEPTED;
        handover.handoverCompletedAt = new Date();
        handover.finalBalance = parseFloat(dto.toCashierCount);

        await this.handoverRepo.save(handover);

        // Close old session
        const oldSession = await this.findById(handover.fromSessionId);
        oldSession.isOpen = false;
        oldSession.closedAt = new Date();
        oldSession.actualBalance = handover.fromCashierCount;
        oldSession.expectedBalance = handover.expectedBalance;
        oldSession.discrepancy = handover.fromDiscrepancy || 0;
        oldSession.handoverToSessionId = undefined; // Will be updated below
        await this.sessionRepo.save(oldSession);

        // Create new session for incoming cashier
        const newSession = await this.openSession({
            deviceId: handover.deviceId,
            userId: handover.toUserId,
            storeId: handover.storeId,
            openingBalance: dto.toCashierCount,
            handoverFromSessionId: handover.fromSessionId,
        });

        // Update links
        handover.toSessionId = newSession.id;
        await this.handoverRepo.save(handover);

        oldSession.handoverToSessionId = newSession.id;
        await this.sessionRepo.save(oldSession);

        return { handover, newSession };
    }

    /**
     * Dispute handover by incoming cashier
     */
    @Transactional()
    async disputeHandover(handoverId: string, dto: DisputeHandoverDto): Promise<RegisterHandover> {
        const handover = await this.handoverRepo.findOne({ where: { id: handoverId } });
        if (!handover) {
            throw new NotFoundException(`Handover with ID ${handoverId} not found`);
        }

        if (handover.status !== HandoverStatus.PENDING) {
            throw new BadRequestException({
                code: 'CASH_006',
                message: `Handover is ${handover.status}, cannot dispute`,
            });
        }

        const toCount = new Decimal(dto.toCashierCount);
        const fromCount = new Decimal(handover.fromCashierCount);
        const countDiscrepancy = toCount.minus(fromCount);

        handover.toCashierCount = parseFloat(dto.toCashierCount);
        handover.countDiscrepancy = parseFloat(countDiscrepancy.toFixed(3));
        handover.toNotes = dto.disputeReason;
        handover.status = HandoverStatus.DISPUTED;

        return await this.handoverRepo.save(handover);
    }

    /**
     * Resolve handover dispute by manager
     */
    @Transactional()
    async resolveHandover(handoverId: string, dto: ResolveHandoverDto): Promise<{
        handover: RegisterHandover;
        newSession: RegisterSession;
    }> {
        const handover = await this.handoverRepo.findOne({ where: { id: handoverId } });
        if (!handover) {
            throw new NotFoundException(`Handover with ID ${handoverId} not found`);
        }

        if (handover.status !== HandoverStatus.DISPUTED) {
            throw new BadRequestException({
                code: 'CASH_006',
                message: `Handover is ${handover.status}, cannot resolve`,
            });
        }

        handover.resolvedByUserId = dto.resolvedByUserId;
        handover.managerNotes = dto.managerNotes;
        handover.finalBalance = parseFloat(dto.finalBalance);
        handover.status = HandoverStatus.RESOLVED;
        handover.handoverCompletedAt = new Date();

        await this.handoverRepo.save(handover);

        // Close old session with manager's final balance
        const oldSession = await this.findById(handover.fromSessionId);
        oldSession.isOpen = false;
        oldSession.closedAt = new Date();
        oldSession.actualBalance = parseFloat(dto.finalBalance);
        oldSession.managerInterventions = (oldSession.managerInterventions || 0) + 1;
        await this.sessionRepo.save(oldSession);

        // Create new session
        const newSession = await this.openSession({
            deviceId: handover.deviceId,
            userId: handover.toUserId,
            storeId: handover.storeId,
            openingBalance: dto.finalBalance,
            handoverFromSessionId: handover.fromSessionId,
        });

        handover.toSessionId = newSession.id;
        await this.handoverRepo.save(handover);

        oldSession.handoverToSessionId = newSession.id;
        await this.sessionRepo.save(oldSession);

        return { handover, newSession };
    }

    // =========================================================================
    // ANALYTICS UPDATES
    // =========================================================================

    /**
     * Increment session counters (called by other services)
     */
    @Transactional()
    async incrementSessionCounter(
        sessionId: string,
        counter: 'orderCount' | 'voidCount' | 'refundCount' | 'priceOverrideCount' | 'managerInterventions'
    ): Promise<void> {
        const session = await this.findById(sessionId);
        session[counter] = (session[counter] || 0) + 1;
        await this.sessionRepo.save(session);
    }

    // =========================================================================
    // QUERIES
    // =========================================================================

    async getSessionsByDate(storeId: string, date: string): Promise<RegisterSession[]> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return await this.sessionRepo
            .createQueryBuilder('session')
            .where('session.storeId = :storeId', { storeId })
            .andWhere('session.openedAt >= :start', { start: startOfDay })
            .andWhere('session.openedAt <= :end', { end: endOfDay })
            .orderBy('session.openedAt', 'DESC')
            .getMany();
    }

    async getPendingHandovers(storeId: string): Promise<RegisterHandover[]> {
        return await this.handoverRepo.find({
            where: {
                storeId,
                status: HandoverStatus.PENDING
            },
            order: { handoverInitiatedAt: 'DESC' },
        });
    }

    async getDisputedHandovers(storeId: string): Promise<RegisterHandover[]> {
        return await this.handoverRepo.find({
            where: {
                storeId,
                status: HandoverStatus.DISPUTED
            },
            order: { handoverInitiatedAt: 'DESC' },
        });
    }
}
