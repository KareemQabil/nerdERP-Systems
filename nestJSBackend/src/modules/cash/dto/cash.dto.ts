import { IsString, IsNumber, IsOptional, IsUUID, IsEnum, Min } from 'class-validator';
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
}

export class CloseRegisterSessionDto {
    @ApiProperty({ example: '1450.500', description: 'Actual counted cash balance' })
    @IsString()
    actualBalance: string;

    @ApiProperty({ required: false, description: 'Closing notes or discrepancy explanation' })
    @IsOptional()
    @IsString()
    notes?: string;
}

export enum CashTransactionType {
    DROP_TO_SAFE = 'DROP_TO_SAFE',
    PETTY_CASH = 'PETTY_CASH',
    CASH_IN = 'CASH_IN',
    CASH_OUT = 'CASH_OUT',
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
