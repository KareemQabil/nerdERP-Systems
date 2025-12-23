import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { CashTransaction, CashTransactionType, BankDrop } from '../entities/cash-transaction.entity';

@Injectable()
export class CashManagementService {
    constructor(
        @InjectRepository(CashTransaction)
        private readonly transactionRepo: Repository<CashTransaction>,
        @InjectRepository(BankDrop)
        private readonly bankDropRepo: Repository<BankDrop>,
    ) { }

    async getSessionTransactions(registerSessionId: string): Promise<CashTransaction[]> {
        return await this.transactionRepo.find({
            where: { registerSessionId },
            order: { createdAt: 'ASC' },
        });
    }

    async calculateCurrentBalance(registerSessionId: string): Promise<number> {
        const transactions = await this.getSessionTransactions(registerSessionId);

        let balance = 0;
        for (const txn of transactions) {
            if (txn.transactionType === CashTransactionType.SALE ||
                txn.transactionType === CashTransactionType.OPENING_BALANCE) {
                balance += parseFloat(txn.amount as any);
            } else {
                balance -= parseFloat(txn.amount as any);
            }
        }

        return balance;
    }

    @Transactional()
    async recordTransaction(
        registerSessionId: string,
        type: CashTransactionType,
        amount: number,
        userId: string,
        orderId?: string,
        notes?: string,
    ): Promise<CashTransaction> {
        const currentBalance = await this.calculateCurrentBalance(registerSessionId);
        const newBalance = type === CashTransactionType.SALE || type === CashTransactionType.OPENING_BALANCE
            ? currentBalance + amount
            : currentBalance - amount;

        const transaction = this.transactionRepo.create({
            registerSessionId,
            transactionType: type,
            amount,
            balanceAfter: newBalance,
            orderId,
            performedByUserId: userId,
            notes,
        });

        return await this.transactionRepo.save(transaction);
    }

    @Transactional()
    async dropToSafe(
        registerSessionId: string,
        amount: number,
        userId: string,
        notes?: string,
    ): Promise<CashTransaction> {
        return await this.recordTransaction(
            registerSessionId,
            CashTransactionType.DROP_TO_SAFE,
            amount,
            userId,
            undefined,
            notes,
        );
    }

    async getAllBankDrops(storeId: string): Promise<BankDrop[]> {
        return await this.bankDropRepo.find({
            where: { storeId },
            order: { droppedAt: 'DESC' },
        });
    }

    @Transactional()
    async createBankDrop(
        storeId: string,
        amount: number,
        userId: string,
        notes?: string,
    ): Promise<BankDrop> {
        const dropNumber = await this.generateDropNumber(storeId);

        const drop = this.bankDropRepo.create({
            dropNumber,
            storeId,
            amount,
            droppedByUserId: userId,
            notes,
        });

        return await this.bankDropRepo.save(drop);
    }

    @Transactional()
    async verifyBankDrop(
        dropId: string,
        userId: string,
        bankReference?: string | null,
    ): Promise<BankDrop> {
        const drop = await this.bankDropRepo.findOne({ where: { id: dropId } });
        if (!drop) {
            throw new Error(`Bank drop with ID ${dropId} not found`);
        }

        drop.verifiedByUserId = userId;
        drop.verifiedAt = new Date();
        if (bankReference) {
            drop.bankReference = bankReference;
        }

        return await this.bankDropRepo.save(drop);
    }

    private async generateDropNumber(storeId: string): Promise<string> {
        const count = await this.bankDropRepo.count({ where: { storeId } });
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `DROP-${date}-${String(count + 1).padStart(4, '0')}`;
    }
}
