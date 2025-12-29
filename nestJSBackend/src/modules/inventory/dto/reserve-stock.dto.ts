import { IsString, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReserveItemDto {
    @IsString()
    productId: string;

    @IsNumber()
    @Min(0.001)
    quantity: number;
}

export class ReserveStockDto {
    @IsString()
    warehouseId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReserveItemDto)
    items: ReserveItemDto[];

    @IsString()
    sessionId: string;
}

export class ReleaseReservationDto {
    @IsString()
    reservationId: string;
}
