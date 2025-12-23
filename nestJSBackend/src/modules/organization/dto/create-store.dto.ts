import { IsString, IsEnum, IsObject, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { StoreType } from '../entities/store.entity';

export class CreateStoreDto {
    @IsUUID()
    organizationId: string;

    @IsString()
    storeCode: string;

    @IsEnum(StoreType)
    storeType: StoreType;

    @IsObject()
    translations: Record<string, { name: string; description?: string }>;

    @IsString()
    @IsOptional()
    timezone?: string = 'Asia/Riyadh';

    @IsObject()
    address: {
        street: string;
        city: string;
        postalCode?: string;
        country: string;
        lat?: number;
        lng?: number;
    };

    @IsObject()
    @IsOptional()
    contact?: {
        phone?: string;
        email?: string;
        whatsapp?: string;
    };

    @IsObject()
    @IsOptional()
    operatingHours?: {
        [key: string]: string[];
    };

    @IsBoolean()
    @IsOptional()
    isActive?: boolean = true;

    @IsUUID()
    @IsOptional()
    parentStoreId?: string;

    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
}
