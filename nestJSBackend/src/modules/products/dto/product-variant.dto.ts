import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class CreateProductVariantDto {
    @IsString()
    productId: string;

    @IsString()
    variantName: string;

    @IsOptional()
    translations?: Record<string, { name: string }>;

    @IsString()
    @IsOptional()
    sku?: string;

    @IsString()
    @IsOptional()
    barcode?: string;

    @IsNumber()
    @IsOptional()
    priceAdjustment?: number;

    @IsOptional()
    attributes?: Record<string, string>;
}

export class CreateComboDto {
    @IsString()
    comboName: string;

    @IsOptional()
    translations?: Record<string, { name: string; description?: string }>;

    @IsNumber()
    comboPrice: number;

    @IsArray()
    components: Array<{
        product_id: string;
        quantity: number;
        is_required: boolean;
        allow_swap?: boolean;
        swap_options?: string[];
    }>;

    @IsNumber()
    @IsOptional()
    displayOrder?: number;
}
