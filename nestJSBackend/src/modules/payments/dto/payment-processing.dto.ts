import { IsString, IsNumber, IsEnum, IsOptional, IsUUID, IsArray, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../sales/entities/payment.entity';

/**
 * Process Payment DTO
 * Used to process a single payment for an order
 */
export class ProcessPaymentDto {
  @ApiProperty({ example: 'uuid-order-001', description: 'Order ID to apply payment to' })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CARD, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: 50.00, description: 'Payment amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ required: false, example: 'TERM-001', description: 'Terminal/transaction reference' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ required: false, example: 5.00, description: 'Tip amount (optional)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tipAmount?: number;
}

/**
 * Split Payment Item DTO
 * Single payment method in a split payment
 */
export class SplitPaymentItemDto {
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: 30.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ required: false, example: 'TERM-001' })
  @IsOptional()
  @IsString()
  reference?: string;
}

/**
 * Process Split Payment DTO
 * Used to process multiple payment methods for a single order
 */
export class ProcessSplitPaymentDto {
  @ApiProperty({ example: 'uuid-order-001' })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    type: [SplitPaymentItemDto],
    example: [{ method: PaymentMethod.CASH, amount: 30 }, { method: PaymentMethod.CARD, amount: 20 }],
    description: 'Array of payment methods and amounts'
  })
  @IsArray()
  payments: SplitPaymentItemDto[];
}

/**
 * Process Refund DTO
 * Used to process a refund for a payment
 */
export class ProcessRefundDto {
  @ApiProperty({ example: 'uuid-payment-001', description: 'Payment ID to refund' })
  @IsUUID()
  @IsNotEmpty()
  paymentId: string;

  @ApiProperty({ example: 25.00, description: 'Refund amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'Customer requested refund' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  // PIN authorization handled by guard - authorizingUser attached to request
}

/**
 * Card Payment Details DTO
 * Used for direct card payment processing
 */
export class CardPaymentDto {
  @ApiProperty({ example: '4111111111111111', description: 'Card number' })
  @IsString()
  @IsNotEmpty()
  cardNumber: string;

  @ApiProperty({ example: '12/25', description: 'Card expiry (MM/YY)' })
  @IsString()
  @IsNotEmpty()
  expiry: string;

  @ApiProperty({ example: '123', description: 'Card CVV' })
  @IsString()
  @IsNotEmpty()
  cvv: string;

  @ApiProperty({ required: false, example: 'John Doe', description: 'Cardholder name' })
  @IsOptional()
  @IsString()
  cardHolderName?: string;
}
