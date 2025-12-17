import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { InventoryBatch } from '../entities/inventory-batch.entity';
import { StockMove, StockMoveType, StockReferenceType } from '../entities/stock-move.entity';
import { AddStockDto, DeductStockDto } from '../dto/stock-operation.dto';
import { Product } from '../../products/entities/product.entity';
import { Warehouse } from '../entities/warehouse.entity';

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(InventoryBatch)
        private readonly batchRepo: Repository<InventoryBatch>,
        @InjectRepository(StockMove)
        private readonly stockMoveRepo: Repository<StockMove>,
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        @InjectRepository(Warehouse)
        private readonly warehouseRepo: Repository<Warehouse>,
    ) { }

    @Transactional()
    async addStock(dto: AddStockDto): Promise<InventoryBatch> {
        const product = await this.productRepo.findOneBy({ id: dto.productId });
        if (!product) throw new BadRequestException('Product not found');

        const warehouse = await this.warehouseRepo.findOneBy({ id: dto.warehouseId });
        if (!warehouse) throw new BadRequestException('Warehouse not found');

        // 1. Create Batch
        const batch = this.batchRepo.create({
            product,
            warehouse,
            qtyRemaining: dto.quantity,
            costPerUnit: dto.costPrice,
            receivedDate: new Date(),
            expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        });
        await this.batchRepo.save(batch);

        // 2. Create Stock Move
        const move = this.stockMoveRepo.create({
            product,
            warehouse,
            batch,
            quantity: dto.quantity,
            moveType: StockMoveType.IN,
            referenceType: dto.referenceType || StockReferenceType.MANUAL,
            referenceId: dto.referenceId,
            costPerUnit: dto.costPrice,
        });
        await this.stockMoveRepo.save(move);

        return batch;
    }

    @Transactional()
    async deductInventory(dto: DeductStockDto): Promise<StockMove[]> {
        const { productId, warehouseId, quantity } = dto;
        let qtyToDeduct = quantity;

        // 1. Fetch batches FIFO (Oldest First)
        const batches = await this.batchRepo.find({
            where: {
                product: { id: productId },
                warehouse: { id: warehouseId },
                qtyRemaining: MoreThan(0),
            },
            order: { receivedDate: 'ASC' },
        });

        const totalAvailable = batches.reduce((sum, b) => sum + Number(b.qtyRemaining), 0);
        if (totalAvailable < qtyToDeduct) {
            throw new BadRequestException({
                code: 'INV_002',
                message: `Insufficient stock. Required: ${qtyToDeduct}, Available: ${totalAvailable}`,
            });
        }

        const moves: StockMove[] = [];

        // 2. Iterate and Deduct
        for (const batch of batches) {
            if (qtyToDeduct <= 0) break;

            const batchQty = Number(batch.qtyRemaining);
            const deduction = Math.min(batchQty, qtyToDeduct);

            // Update Batch
            batch.qtyRemaining = batchQty - deduction;
            await this.batchRepo.save(batch);

            // Create Stock Move
            const move = this.stockMoveRepo.create({
                product: { id: productId },
                warehouse: { id: warehouseId },
                batch: batch,
                quantity: deduction,
                moveType: StockMoveType.OUT,
                referenceType: dto.referenceType || StockReferenceType.MANUAL,
                referenceId: dto.referenceId,
                costPerUnit: batch.costPerUnit, // COGS tracking
            });
            await this.stockMoveRepo.save(move);
            moves.push(move);

            qtyToDeduct -= deduction;
        }

        return moves;
    }
}
