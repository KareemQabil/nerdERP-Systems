import { IsString, IsNumber, IsOptional, IsUUID, IsEnum, Min, Max, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TableStatus {
    AVAILABLE = 'AVAILABLE',
    OCCUPIED = 'OCCUPIED',
    RESERVED = 'RESERVED',
    CLEANING = 'CLEANING',
    BLOCKED = 'BLOCKED',
}

export class CreateTableZoneDto {
    @ApiProperty({ example: 'Main Floor' })
    @IsString()
    zoneName: string;

    @ApiProperty({ example: 'uuid-store-001' })
    @IsUUID()
    storeId: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    displayOrder?: number;
}

export class CreateTableDto {
    @ApiProperty({ example: 'T1' })
    @IsString()
    tableNumber: string;

    @ApiProperty({ example: 2, description: 'Minimum seats' })
    @IsNumber()
    @Min(1)
    minSeats: number;

    @ApiProperty({ example: 4, description: 'Maximum seats' })
    @IsNumber()
    @Min(1)
    maxSeats: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    zoneId?: string;

    @ApiProperty({ example: 'uuid-store-001' })
    @IsUUID()
    storeId: string;

    @ApiProperty({ required: false, description: 'Position on floor plan { x, y }' })
    @IsOptional()
    @IsObject()
    floorPosition?: { x: number; y: number };
}

export class UpdateTableStatusDto {
    @ApiProperty({ enum: TableStatus })
    @IsEnum(TableStatus)
    status: TableStatus;

    @ApiProperty({ required: false, description: 'Order ID when status is OCCUPIED' })
    @IsOptional()
    @IsUUID()
    currentOrderId?: string;
}

export class CreateReservationDto {
    @ApiProperty({ example: 'uuid-table-001' })
    @IsUUID()
    tableId: string;

    @ApiProperty({ example: 'Ahmed Ali' })
    @IsString()
    customerName: string;

    @ApiProperty({ example: '+966501234567' })
    @IsString()
    customerPhone: string;

    @ApiProperty({ example: 4 })
    @IsNumber()
    @Min(1)
    partySize: number;

    @ApiProperty({ example: '2025-12-24T19:00:00Z' })
    @IsString()
    reservationDate: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    customerId?: string;
}

export class UpdateReservationDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    reservationDate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    partySize?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    notes?: string;
}
