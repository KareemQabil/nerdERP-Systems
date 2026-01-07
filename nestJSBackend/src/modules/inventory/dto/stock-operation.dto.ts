import { IsNotEmpty, IsUUID, IsNumber, Min, IsEnum, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { StockReferenceType } from '../entities/stock-move.entity';

export class AddStockDto {
    @IsUUID()
    @IsNotEmpty()
    productId: string;

    @IsUUID()
    @IsNotEmpty()
    warehouseId: string;

    @IsNumber()
    @Min(0.001)
    quantity: number;

    @IsNumber()
    @Min(0)
    costPrice: number;

    @IsDateString()
    @IsOptional()
    expiryDate?: string;

    @IsEnum(StockReferenceType)
    @IsOptional()
    referenceType: StockReferenceType = StockReferenceType.MANUAL;

    @IsOptional()
    referenceId?: string;
}

export class DeductStockDto {
    @IsUUID()
    @IsNotEmpty()
    productId: string;

    @IsUUID()
    @IsNotEmpty()
    warehouseId: string;

    @IsNumber()
    @Min(0.001)
    quantity: number;

    @IsEnum(StockReferenceType)
    @IsOptional()
    referenceType: StockReferenceType = StockReferenceType.MANUAL;

    @IsOptional()
    referenceId?: string;

    /**
     * Allow negative stock (overselling)
     *
     * When true, stock deduction will continue even if insufficient stock.
     * Batch quantities may go negative below zero.
     *
     * Business rules:
     * - POS: Can be enabled for customer experience (don't turn away customers)
     * - Production: Should ALWAYS be false (can't manufacture without materials)
     */
    @IsBoolean()
    @IsOptional()
    allowNegativeStock?: boolean;
}
