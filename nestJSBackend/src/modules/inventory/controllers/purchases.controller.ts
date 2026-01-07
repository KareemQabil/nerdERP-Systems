import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '../entities/purchase-order.entity';
import { InventoryService } from '../services/inventory.service';
import { StockReferenceType } from '../entities/stock-move.entity';
import { IsString, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// =============================================================================
// DTOs
// =============================================================================

class PurchaseInvoiceLineDto {
    @ApiProperty()
    @IsString()
    productId: string;

    @ApiProperty()
    @IsNumber()
    quantity: number;

    @ApiProperty()
    @IsNumber()
    costPrice: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    expiryDate?: string;
}

class CreatePurchaseInvoiceDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    supplierId?: string;

    @ApiProperty()
    @IsString()
    invoiceNumber: string;

    @ApiProperty()
    @IsString()
    invoiceDate: string;

    @ApiProperty()
    @IsString()
    warehouseId: string;

    @ApiProperty({ type: [PurchaseInvoiceLineDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PurchaseInvoiceLineDto)
    lines: PurchaseInvoiceLineDto[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    notes?: string;
}

// =============================================================================
// CONTROLLER
// =============================================================================

@ApiTags('Purchases')
@Controller('purchases')
export class PurchasesController {
    constructor(
        @InjectRepository(PurchaseOrder)
        private readonly purchaseOrderRepo: Repository<PurchaseOrder>,
        @InjectRepository(PurchaseOrderItem)
        private readonly purchaseOrderItemRepo: Repository<PurchaseOrderItem>,
        private readonly inventoryService: InventoryService,
    ) { }

    /**
     * Create a new purchase invoice
     * Immediately creates the purchase order and optionally receives it
     */
    @Post()
    @ApiOperation({ summary: 'Create purchase invoice' })
    @ApiResponse({ status: 201, description: 'Purchase invoice created' })
    @Transactional()
    async createPurchaseInvoice(@Body() dto: CreatePurchaseInvoiceDto) {
        // Generate PO number
        const poNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        // Calculate total
        let totalAmount = 0;
        for (const line of dto.lines) {
            totalAmount += line.quantity * line.costPrice;
        }

        // Create purchase order entity
        const purchaseOrder = this.purchaseOrderRepo.create({
            poNumber,
            status: PurchaseOrderStatus.DRAFT,
            totalAmount,
            notes: dto.notes,
            createdByUserId: 'system', // TODO: Get from auth context
        });

        // Set relationships by ID
        (purchaseOrder as any).receivingWarehouse = { id: dto.warehouseId };
        if (dto.supplierId) {
            (purchaseOrder as any).supplier = { id: dto.supplierId };
        }

        const savedPO = await this.purchaseOrderRepo.save(purchaseOrder);

        // Create items
        const items: PurchaseOrderItem[] = [];
        for (const line of dto.lines) {
            const item = this.purchaseOrderItemRepo.create({
                purchaseOrder: savedPO,
                productId: line.productId,
                productName: `Product ${line.productId}`, // TODO: Fetch actual name
                quantityOrdered: line.quantity,
                quantityReceived: 0,
                unitCost: line.costPrice,
                lineTotal: line.quantity * line.costPrice,
            });
            items.push(await this.purchaseOrderItemRepo.save(item));
        }

        return {
            success: true,
            data: {
                id: savedPO.id,
                poNumber: savedPO.poNumber,
                status: savedPO.status,
                totalAmount: savedPO.totalAmount,
                itemCount: items.length,
            },
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Receive a purchase invoice - adds stock to inventory
     */
    @Post(':id/receive')
    @ApiOperation({ summary: 'Receive purchase invoice items into inventory' })
    @ApiResponse({ status: 200, description: 'Purchase invoice received' })
    @Transactional()
    async receivePurchaseInvoice(@Param('id') id: string) {
        const purchaseOrder = await this.purchaseOrderRepo.findOne({
            where: { id },
            relations: ['items', 'receivingWarehouse'],
        });

        if (!purchaseOrder) {
            return {
                success: false,
                error: { code: 'INV_009', message: 'Purchase order not found' },
                timestamp: new Date().toISOString(),
            };
        }

        if (purchaseOrder.status === PurchaseOrderStatus.RECEIVED) {
            return {
                success: false,
                error: { code: 'INV_010', message: 'Purchase order already received' },
                timestamp: new Date().toISOString(),
            };
        }

        // Add each item to inventory
        for (const item of purchaseOrder.items) {
            await this.inventoryService.addStock({
                productId: item.productId,
                warehouseId: purchaseOrder.receivingWarehouse.id,
                quantity: item.quantityOrdered,
                costPrice: item.unitCost,
                referenceType: StockReferenceType.PURCHASE_ORDER,
                referenceId: purchaseOrder.id,
            });

            // Update received quantity
            item.quantityReceived = item.quantityOrdered;
            await this.purchaseOrderItemRepo.save(item);
        }

        // Update PO status
        purchaseOrder.status = PurchaseOrderStatus.RECEIVED;
        purchaseOrder.receivedAt = new Date();
        await this.purchaseOrderRepo.save(purchaseOrder);

        return {
            success: true,
            data: {
                id: purchaseOrder.id,
                poNumber: purchaseOrder.poNumber,
                status: purchaseOrder.status,
                receivedAt: purchaseOrder.receivedAt,
            },
            message: 'Purchase order received successfully',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get all purchase orders
     */
    @Get()
    @ApiOperation({ summary: 'Get all purchase orders' })
    async getPurchaseOrders(@Query('status') status?: string) {
        const where: any = {};
        if (status) {
            where.status = status;
        }

        const orders = await this.purchaseOrderRepo.find({
            where,
            relations: ['items', 'receivingWarehouse'],
            order: { createdAt: 'DESC' },
        });

        return {
            success: true,
            data: orders,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get a single purchase order by ID
     */
    @Get(':id')
    @ApiOperation({ summary: 'Get purchase order by ID' })
    async getPurchaseOrder(@Param('id') id: string) {
        const order = await this.purchaseOrderRepo.findOne({
            where: { id },
            relations: ['items', 'receivingWarehouse', 'supplier'],
        });

        if (!order) {
            return {
                success: false,
                error: { code: 'INV_009', message: 'Purchase order not found' },
                timestamp: new Date().toISOString(),
            };
        }

        return {
            success: true,
            data: order,
            timestamp: new Date().toISOString(),
        };
    }
}
