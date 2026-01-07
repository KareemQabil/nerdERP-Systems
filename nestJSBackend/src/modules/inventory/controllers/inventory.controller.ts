import { Body, Controller, Get, Post, Query, Param } from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { AddStockDto, DeductStockDto } from '../dto/stock-operation.dto';
import { InventoryBatch } from '../entities/inventory-batch.entity';
import { StockMove } from '../entities/stock-move.entity';

// =============================================================================
// RESERVATION DTOs
// =============================================================================

export class ReserveStockDto {
    productId: string;
    warehouseId: string;
    quantity: number;
    sessionId?: string;
    orderId?: string;
    reason?: string;
    expiresInMinutes?: number;
}

export class CommitReservationDto {
    reservationId: string;
}

export class ReleaseReservationDto {
    reservationId: string;
}

export class CheckAvailabilityDto {
    items: Array<{
        productId: string;
        quantity: number;
    }>;
    warehouseId: string;
}

@Controller('inventory')
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    /**
     * Get inventory summary grouped by product and warehouse
     */
    @Get('summary')
    async getSummary(@Query('warehouseId') warehouseId?: string) {
        const data = await this.inventoryService.getInventorySummary(warehouseId);
        return {
            success: true,
            data,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get all batches with optional filters
     */
    @Get('batches')
    async getBatches(
        @Query('warehouseId') warehouseId?: string,
        @Query('productId') productId?: string,
        @Query('qualityStatus') qualityStatus?: string,
        @Query('expiringWithinDays') expiringWithinDays?: string,
    ) {
        const data = await this.inventoryService.getBatches({
            warehouseId,
            productId,
            qualityStatus,
            expiringWithinDays: expiringWithinDays ? parseInt(expiringWithinDays, 10) : undefined,
        });
        return {
            success: true,
            data,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Add stock to inventory (creates new batch)
     */
    @Post('add')
    async addStock(@Body() dto: AddStockDto): Promise<InventoryBatch> {
        return await this.inventoryService.addStock(dto);
    }

    /**
     * Deduct stock from inventory (FIFO)
     */
    @Post('deduct')
    async deductStock(@Body() dto: DeductStockDto): Promise<StockMove[]> {
        return await this.inventoryService.deductInventory(dto);
    }

    // =========================================================================
    // STOCK RESERVATION (for POS checkout)
    // =========================================================================

    /**
     * Reserve stock for checkout
     * Creates a temporary reservation to prevent overselling
     *
     * Error codes:
     * - INV_001: Insufficient stock
     */
    @Post('reserve')
    async reserveStock(@Body() dto: ReserveStockDto) {
        const reservationId = await this.inventoryService.reserveStock({
            productId: dto.productId,
            warehouseId: dto.warehouseId,
            quantity: dto.quantity,
            sessionId: dto.sessionId || crypto.randomUUID(),
            orderId: dto.orderId,
            reason: dto.reason,
            expiresInMinutes: dto.expiresInMinutes,
        });

        return {
            success: true,
            data: {
                reservationId,
                expiresAt: new Date(Date.now() + (dto.expiresInMinutes || 5) * 60 * 1000).toISOString(),
                status: 'PENDING',
            },
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Commit a reservation - actually deduct the stock
     * Called when payment is confirmed and order is finalized
     *
     * Error codes:
     * - INV_003: Reservation not found
     */
    @Post('commit-reservation')
    async commitReservation(@Body() dto: CommitReservationDto) {
        await this.inventoryService.commitReservation(dto.reservationId);
        return {
            success: true,
            message: 'Reservation committed successfully',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Release a reservation - cancel the temporary hold
     * Called when checkout is cancelled or times out
     */
    @Post('release-reservation')
    async releaseReservation(@Body() dto: ReleaseReservationDto) {
        await this.inventoryService.releaseReservation(dto.reservationId);
        return {
            success: true,
            message: 'Reservation released successfully',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Check availability for multiple items (POS checkout)
     * Returns a map of product ID to availability status
     */
    @Post('check-availability')
    async checkAvailability(@Body() dto: CheckAvailabilityDto) {
        const results = await this.inventoryService.checkAvailabilityForPOS(
            dto.items,
            dto.warehouseId,
        );
        return {
            success: true,
            data: Object.fromEntries(results),
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get available stock for a single product
     */
    @Get('available-stock')
    async getAvailableStock(
        @Query('productId') productId: string,
        @Query('warehouseId') warehouseId: string,
    ) {
        const available = await this.inventoryService.getAvailableStock(productId, warehouseId);
        return {
            success: true,
            data: { available: available.toString() },
            timestamp: new Date().toISOString(),
        };
    }
}
