import { IsString, IsNotEmpty, IsUUID, IsArray } from 'class-validator';

/**
 * Void Item DTO
 * Used to void a single item in an order
 */
export class VoidItemDto {
  @IsString()
  @IsNotEmpty()
  pin: string; // Manager PIN for authorization

  @IsString()
  @IsNotEmpty()
  reason: string; // Reason for voiding
}

/**
 * Void Order DTO
 * Used to void an entire order
 */
export class VoidOrderDto {
  @IsString()
  @IsNotEmpty()
  pin: string; // Manager PIN for authorization

  @IsString()
  @IsNotEmpty()
  reason: string; // Reason for voiding
}

/**
 * Bulk Void Items DTO
 * Used to void multiple items at once
 */
export class BulkVoidItemsDto {
  @IsString()
  @IsNotEmpty()
  pin: string; // Manager PIN for authorization

  @IsString()
  @IsNotEmpty()
  reason: string; // Reason for voiding

  @IsArray()
  @IsUUID('4', { each: true })
  itemIds: string[]; // Item IDs to void
}
