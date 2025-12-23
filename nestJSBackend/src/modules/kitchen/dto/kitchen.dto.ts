import { IsString, IsBoolean, IsOptional, IsUUID, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateKitchenStationDto {
    @ApiProperty({ example: 'Grill Station' })
    @IsString()
    stationName: string;

    @ApiProperty({ example: 'GRILL' })
    @IsString()
    stationCode: string;

    @ApiProperty({ example: 'uuid-store-001' })
    @IsUUID()
    storeId: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    printerId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    kdsConfig?: {
        auto_bump_seconds?: number;
        alert_threshold_seconds?: number;
        sound_enabled?: boolean;
    };

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    color?: string;
}

export class UpdateKitchenStationDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    stationName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    printerId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    kdsConfig?: any;
}

export enum TicketStatus {
    NEW = 'NEW',
    IN_PROGRESS = 'IN_PROGRESS',
    READY = 'READY',
    BUMPED = 'BUMPED',
    CANCELLED = 'CANCELLED',
}

export enum TicketPriority {
    NORMAL = 'NORMAL',
    RUSH = 'RUSH',
    VIP = 'VIP',
}

export class CreateTicketDto {
    @ApiProperty({ example: 'uuid-order-001' })
    @IsUUID()
    orderId: string;

    @ApiProperty({ example: 'uuid-station-001' })
    @IsUUID()
    stationId: string;

    @ApiProperty({ enum: TicketPriority, required: false, default: 'NORMAL' })
    @IsOptional()
    @IsEnum(TicketPriority)
    priority?: TicketPriority;
}

export class UpdateTicketStatusDto {
    @ApiProperty({ enum: TicketStatus, example: 'PREPARING' })
    @IsEnum(TicketStatus)
    status: TicketStatus;
}

export class BumpTicketDto {
    @ApiProperty({ example: 'uuid-user-001' })
    @IsUUID()
    userId: string;
}
