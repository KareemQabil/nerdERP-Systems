import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoyaltyService } from '../services/loyalty.service';

@ApiTags('Loyalty Points')
@Controller('loyalty')
export class LoyaltyController {
    constructor(private readonly loyaltyService: LoyaltyService) { }

    @Get('customers/:customerId/summary')
    @ApiOperation({ summary: 'Get customer loyalty summary' })
    @ApiResponse({ status: 200, description: 'Loyalty summary retrieved' })
    async getLoyaltySummary(@Param('customerId') customerId: string) {
        const summary = await this.loyaltyService.getLoyaltySummary(customerId);
        return {
            success: true,
            data: summary,
            timestamp: new Date().toISOString(),
        };
    }

    @Post('customers/:customerId/redeem')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Redeem loyalty points for discount' })
    @ApiResponse({ status: 200, description: 'Points redeemed successfully' })
    async redeemPoints(
        @Param('customerId') customerId: string,
        @Body() body: { points: number },
    ) {
        const result = await this.loyaltyService.redeemPoints(customerId, body.points);
        return {
            success: true,
            data: result,
            messageKey: 'LOYALTY_POINTS_REDEEMED',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('tiers')
    @ApiOperation({ summary: 'Get all loyalty tiers' })
    @ApiResponse({ status: 200, description: 'Loyalty tiers list' })
    async getAllTiers() {
        const tiers = await this.loyaltyService.getAllTiers();
        return {
            success: true,
            data: tiers,
            timestamp: new Date().toISOString(),
        };
    }

    @Post('customers/:customerId/award')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Award points to customer (admin)' })
    @ApiResponse({ status: 200, description: 'Points awarded' })
    async awardPoints(
        @Param('customerId') customerId: string,
        @Body() body: { orderId: string; amount: string },
    ) {
        const transaction = await this.loyaltyService.awardPoints(
            customerId,
            body.orderId,
            body.amount,
        );
        return {
            success: true,
            data: transaction,
            messageKey: 'LOYALTY_POINTS_AWARDED',
            timestamp: new Date().toISOString(),
        };
    }
}
