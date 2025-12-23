import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CashManagementService } from '../services/cash-management.service';
import { CashTransactionType } from '../entities/cash-transaction.entity';

@Controller('api/v1/cash')
export class CashManagementController {
    constructor(private readonly cashService: CashManagementService) { }

    @Get('sessions/:sessionId/transactions')
    async getSessionTransactions(@Param('sessionId') sessionId: string) {
        const transactions = await this.cashService.getSessionTransactions(sessionId);
        return {
            success: true,
            data: transactions,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('sessions/:sessionId/balance')
    async getCurrentBalance(@Param('sessionId') sessionId: string) {
        const balance = await this.cashService.calculateCurrentBalance(sessionId);
        return {
            success: true,
            data: { balance },
            timestamp: new Date().toISOString(),
        };
    }

    @Post('transactions')
    async recordTransaction(
        @Body()
        dto: {
            registerSessionId: string;
            type: CashTransactionType;
            amount: number;
            userId: string;
            orderId?: string;
            notes?: string;
        },
    ) {
        const transaction = await this.cashService.recordTransaction(
            dto.registerSessionId,
            dto.type,
            dto.amount,
            dto.userId,
            dto.orderId,
            dto.notes,
        );
        return {
            success: true,
            data: transaction,
            messageKey: 'TRANSACTION_RECORDED',
            timestamp: new Date().toISOString(),
        };
    }

    @Post('drop-to-safe')
    async dropToSafe(
        @Body() dto: { registerSessionId: string; amount: number; userId: string; notes?: string },
    ) {
        const transaction = await this.cashService.dropToSafe(
            dto.registerSessionId,
            dto.amount,
            dto.userId,
            dto.notes,
        );
        return {
            success: true,
            data: transaction,
            messageKey: 'CASH_DROPPED',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('bank-drops/:storeId')
    async getBankDrops(@Param('storeId') storeId: string) {
        const drops = await this.cashService.getAllBankDrops(storeId);
        return {
            success: true,
            data: drops,
            timestamp: new Date().toISOString(),
        };
    }

    @Post('bank-drops')
    async createBankDrop(
        @Body() dto: { storeId: string; amount: number; userId: string; notes?: string },
    ) {
        const drop = await this.cashService.createBankDrop(
            dto.storeId,
            dto.amount,
            dto.userId,
            dto.notes,
        );
        return {
            success: true,
            data: drop,
            messageKey: 'BANK_DROP_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Post('bank-drops/:id/verify')
    async verifyBankDrop(
        @Param('id') id: string,
        @Body() dto: { userId: string; bankReference?: string },
    ) {
        const drop = await this.cashService.verifyBankDrop(id, dto.userId, dto.bankReference);
        return {
            success: true,
            data: drop,
            messageKey: 'BANK_DROP_VERIFIED',
            timestamp: new Date().toISOString(),
        };
    }
}
