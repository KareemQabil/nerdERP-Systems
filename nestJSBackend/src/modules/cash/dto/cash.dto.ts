import { IsString, IsNumber, IsOptional, IsUUID, IsEnum, Min, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRegisterSessionDto {
    @ApiProperty({ example: 'uuid-device-001' })
    @IsUUID()
    deviceId: string;

    @ApiProperty({ example: 'uuid-user-001' })
    @IsUUID()
    userId: string;

    @ApiProperty({ example: 'uuid-store-001' })
    @IsUUID()
    storeId: string;

    @ApiProperty({ example: '1000.000', description: 'Opening cash balance in SAR' })
    @IsString()
    openingBalance: string;

    @ApiProperty({ required: false, description: 'If this session is from a handover' })
    @IsOptional()
    @IsUUID()
    handoverFromSessionId?: string;
}

/**
 * Standard close with expected balance visible (legacy)
 */
export class CloseRegisterSessionDto {
    @ApiProperty({ example: '1450.500', description: 'Actual counted cash balance' })
    @IsString()
    actualBalance: string;

    @ApiProperty({ required: false, description: 'Closing notes or discrepancy explanation' })
    @IsOptional()
    @IsString()
    notes?: string;
}

/**
 * Blind close - cashier does NOT see expected balance
 * This is the recommended close method for better cash control
 */
export class BlindCloseSessionDto {
    @ApiProperty({ example: '1450.500', description: 'Actual counted cash balance (cashier enters blind)' })
    @IsString()
    actualBalance: string;

    @ApiProperty({ required: false, description: 'Closing notes' })
    @IsOptional()
    @IsString()
    notes?: string;
}

/**
 * Session report - only for managers (shows full breakdown)
 */
export class SessionReportResponseDto {
    sessionId: string;

    // Balances
    openingBalance: string;
    expectedBalance: string;
    actualBalance: string;
    discrepancy: string;
    discrepancyPercentage: string;

    // Sales breakdown
    totalCashSales: string;
    totalCardSales: string;
    totalWalletSales: string;
    totalCreditSales: string;
    totalSales: string;

    // Deductions
    totalDrops: string;
    totalPettyCash: string;
    totalRefunds: string;

    // Analytics
    orderCount: number;
    voidCount: number;
    refundCount: number;
    priceOverrideCount: number;
    managerInterventions: number;

    // Times
    openedAt: Date;
    closedAt: Date;
    duration: string; // e.g., "8h 30m"

    // User info
    cashierName: string;
    reviewedByName?: string;
    reviewedAt?: Date;
}

/**
 * Manager review of session discrepancy
 */
export class ReviewSessionDto {
    @ApiProperty({ example: 'uuid-manager-001' })
    @IsUUID()
    reviewedByUserId: string;

    @ApiProperty({ required: false, description: 'Manager notes on discrepancy' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ required: false, description: 'Whether discrepancy is approved/accepted' })
    @IsOptional()
    @IsBoolean()
    discrepancyApproved?: boolean;
}

export enum CashTransactionType {
    DROP_TO_SAFE = 'DROP_TO_SAFE',
    PETTY_CASH = 'PETTY_CASH',
    CASH_IN = 'CASH_IN',
    CASH_OUT = 'CASH_OUT',
    FLOAT_ADDITION = 'FLOAT_ADDITION',
    FLOAT_RETURN = 'FLOAT_RETURN',
}

export class CreateCashTransactionDto {
    @ApiProperty({ example: 'uuid-session-001' })
    @IsUUID()
    sessionId: string;

    @ApiProperty({ enum: CashTransactionType, example: 'DROP_TO_SAFE' })
    @IsEnum(CashTransactionType)
    transactionType: CashTransactionType;

    @ApiProperty({ example: '500.000', description: 'Transaction amount in SAR' })
    @IsString()
    amount: string;

    @ApiProperty({ example: 'Midday cash drop to safe' })
    @IsString()
    reason: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    userId?: string;
}

export class DropToSafeDto {
    @ApiProperty({ example: '500.000' })
    @IsString()
    amount: string;

    @ApiProperty({ example: 'Midday drop to safe' })
    @IsString()
    reason: string;

    @ApiProperty()
    @IsUUID()
    userId: string;
}

export class PettyCashDto {
    @ApiProperty({ example: '50.000' })
    @IsString()
    amount: string;

    @ApiProperty({ example: 'Office supplies' })
    @IsString()
    reason: string;

    @ApiProperty()
    @IsUUID()
    userId: string;
}

// =========================================================================
// HANDOVER DTOs
// =========================================================================

/**
 * Initiate handover from outgoing cashier
 */
export class InitiateHandoverDto {
    @ApiProperty({ example: 'uuid-to-user-001', description: 'Incoming cashier user ID' })
    @IsUUID()
    toUserId: string;

    @ApiProperty({ example: '1450.500', description: 'Cash count by outgoing cashier' })
    @IsString()
    fromCashierCount: string;

    @ApiProperty({ required: false, description: 'Notes from outgoing cashier' })
    @IsOptional()
    @IsString()
    notes?: string;
}

/**
 * Accept handover by incoming cashier
 */
export class AcceptHandoverDto {
    @ApiProperty({ example: '1450.500', description: 'Cash count by incoming cashier' })
    @IsString()
    toCashierCount: string;

    @ApiProperty({ required: false, description: 'Notes from incoming cashier' })
    @IsOptional()
    @IsString()
    notes?: string;
}

/**
 * Dispute handover by incoming cashier
 */
export class DisputeHandoverDto {
    @ApiProperty({ example: '1420.000', description: 'Incoming cashier disputed count' })
    @IsString()
    toCashierCount: string;

    @ApiProperty({ description: 'Reason for dispute' })
    @IsString()
    disputeReason: string;
}

/**
 * Resolve handover dispute by manager
 */
export class ResolveHandoverDto {
    @ApiProperty({ example: 'uuid-manager-001' })
    @IsUUID()
    resolvedByUserId: string;

    @ApiProperty({ example: '1435.000', description: 'Final balance after resolution' })
    @IsString()
    finalBalance: string;

    @ApiProperty({ description: 'Manager resolution notes' })
    @IsString()
    managerNotes: string;
}

