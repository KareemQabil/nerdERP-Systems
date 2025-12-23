import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promotion } from './entities/promotion.entity';
import { GiftCard, GiftCardTransaction } from './entities/gift-card.entity';
import { LoyaltyTier, CustomerLoyalty, LoyaltyTransaction } from './entities/loyalty.entity';
import { Customer, CustomerAddress } from './entities/customer.entity';
import { PromotionUsage } from '../products/entities/product-variant.entity';
import { CustomerService } from './services/customer.service';
import { PromotionUsageService } from './services/promotion-usage.service';
import { LoyaltyService } from './services/loyalty.service';
import { CustomerController } from './controllers/customer.controller';
import { LoyaltyController } from './controllers/loyalty.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Promotion,
            GiftCard,
            GiftCardTransaction,
            LoyaltyTier,
            CustomerLoyalty,
            LoyaltyTransaction,
            Customer,
            CustomerAddress,
            PromotionUsage,
        ]),
    ],
    controllers: [CustomerController, LoyaltyController],
    providers: [CustomerService, PromotionUsageService, LoyaltyService],
    exports: [CustomerService, PromotionUsageService, LoyaltyService],
})
export class PromotionsModule { }
