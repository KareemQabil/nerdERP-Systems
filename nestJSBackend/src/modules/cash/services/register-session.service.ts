import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import Decimal from 'decimal.js';
import { RegisterSession } from '../entities/register-session.entity';
import { CashTransaction, CashTransactionType } from '../../sales/entities/cash-transaction.entity';
import { Payment } from '../../sales/entities/payment.entity';
import {
    CreateRegisterSessionDto,
    CloseRegisterSessionDto,
    DropToSafeDto,
    PettyCashDto,
} from '../dto/cash.dto';

@Injectable()
export class RegisterSessionService {
    constructor(
        @InjectRepository(RegisterSession)
        private readonly sessionRepo: Repository<RegisterSession>,
        @InjectRepository(CashTransaction)
        private readonly cashTxRepo: Repository<CashTransaction>,
        @InjectRepository(Payment)
        private readonly paymentRepo: Repository<Payment>,
    ) { }

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
        });

        return await this.sessionRepo.save(session);
    }

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

        return await this.sessionRepo.save(session);
    }

    async calculateExpectedBalance(sessionId: string): Promise<string> {
        const session = await this.findById(sessionId);

        let balance = new Decimal(session.openingBalance);

        // Add cash sales
        const cashSales = await this.paymentRepo
            .createQueryBuilder('payment')
            .leftJoin('payment.order', 'order')
            .where('order.registerSessionId = :sessionId', { sessionId })
            .andWhere('payment.paymentMethod = :method', { method: 'CASH' })
            .getMany();

        const totalCashSales = cashSales.reduce(
            (sum, payment) => sum.plus(payment.amount),
            new Decimal(0)
        );

        balance = balance.plus(totalCashSales);

        // Subtract cash transactions (drops, petty cash)
        const transactions = await this.cashTxRepo.find({
            where: { registerSessionId: sessionId },
        });

        for (const tx of transactions) {
            if (tx.transactionType === CashTransactionType.DROP_TO_SAFE ||
                tx.transactionType === CashTransactionType.PETTY_CASH) {
                balance = balance.minus(tx.amount);
            }
        }

        // Update session totals
        session.totalCashSales = parseFloat(totalCashSales.toFixed(3));
        session.totalDrops = parseFloat(
            transactions
                .filter(t => t.transactionType === CashTransactionType.DROP_TO_SAFE)
                .reduce((sum, t) => sum.plus(t.amount), new Decimal(0))
                .toFixed(3)
        );
        session.totalPettyCash = parseFloat(
            transactions
                .filter(t => t.transactionType === CashTransactionType.PETTY_CASH)
                .reduce((sum, t) => sum.plus(t.amount), new Decimal(0))
                .toFixed(3)
        );

        await this.sessionRepo.save(session);

        return balance.toFixed(3);
    }

    async getBalance(sessionId: string): Promise<{ expected: string; opening: string; cashSales: string }> {
        const expectedBalance = await this.calculateExpectedBalance(sessionId);
        const session = await this.findById(sessionId);

        return {
            expected: expectedBalance,
            opening: session.openingBalance.toFixed(3),
            cashSales: session.totalCashSales.toFixed(3),
        };
    }

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
}
