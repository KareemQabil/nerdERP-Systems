/**
 * Delivery Zone Service
 * H-POS: Zone-based delivery pricing management
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import Decimal from 'decimal.js';
import { DeliveryZone } from '../entities/delivery-zone.entity';
import { CreateDeliveryZoneDto, UpdateDeliveryZoneDto, DeliveryFeeResponse } from '../dto/delivery-zone.dto';

@Injectable()
export class DeliveryZoneService {
    constructor(
        @InjectRepository(DeliveryZone)
        private readonly zoneRepo: Repository<DeliveryZone>,
    ) { }

    /**
     * Get all delivery zones for a store
     */
    async findAll(storeId: string): Promise<DeliveryZone[]> {
        return await this.zoneRepo.find({
            where: { storeId, isActive: true },
            order: { displayOrder: 'ASC', zoneName: 'ASC' },
        });
    }

    /**
     * Get a single delivery zone by ID
     */
    async findById(id: string): Promise<DeliveryZone> {
        const zone = await this.zoneRepo.findOneBy({ id });
        if (!zone) {
            throw new NotFoundException(`Delivery zone ${id} not found`);
        }
        return zone;
    }

    /**
     * Get a delivery zone by code
     */
    async findByCode(storeId: string, zoneCode: string): Promise<DeliveryZone | null> {
        return await this.zoneRepo.findOne({
            where: { storeId, zoneCode, isActive: true },
        });
    }

    /**
     * Create a new delivery zone
     */
    @Transactional()
    async create(dto: CreateDeliveryZoneDto): Promise<DeliveryZone> {
        // Check for duplicate zone code
        const existing = await this.zoneRepo.findOne({
            where: { storeId: dto.storeId, zoneCode: dto.zoneCode },
        });

        if (existing) {
            throw new BadRequestException(`Zone code ${dto.zoneCode} already exists`);
        }

        const zone = this.zoneRepo.create(dto);
        return await this.zoneRepo.save(zone);
    }

    /**
     * Update an existing delivery zone
     */
    @Transactional()
    async update(id: string, dto: UpdateDeliveryZoneDto): Promise<DeliveryZone> {
        const zone = await this.findById(id);
        Object.assign(zone, dto);
        return await this.zoneRepo.save(zone);
    }

    /**
     * Delete a delivery zone (soft delete via isActive)
     */
    @Transactional()
    async delete(id: string): Promise<void> {
        const zone = await this.findById(id);
        zone.isActive = false;
        await this.zoneRepo.save(zone);
    }

    /**
     * Calculate delivery fee for an order
     * Returns 0 if order meets free delivery threshold
     */
    async calculateDeliveryFee(
        zoneId: string,
        orderTotal: number | string,
    ): Promise<DeliveryFeeResponse> {
        const zone = await this.findById(zoneId);

        if (!zone.isActive) {
            throw new BadRequestException('Delivery zone is not active');
        }

        const total = new Decimal(orderTotal);
        const minimumOrder = zone.minimumOrderValue ? new Decimal(zone.minimumOrderValue) : null;
        const freeThreshold = zone.freeDeliveryMinimum ? new Decimal(zone.freeDeliveryMinimum) : null;

        // Check minimum order value
        if (minimumOrder && total.lessThan(minimumOrder)) {
            throw new BadRequestException({
                code: 'DELIVERY_001',
                message: `Minimum order value is ${minimumOrder.toFixed(2)} for zone ${zone.zoneName}`,
            });
        }

        // Check if eligible for free delivery
        const isFreeDelivery = freeThreshold ? total.greaterThanOrEqualTo(freeThreshold) : false;

        return {
            zoneId: zone.id,
            zoneName: zone.zoneName,
            deliveryFee: isFreeDelivery ? 0 : zone.deliveryFee,
            isFreeDelivery,
            freeDeliveryThreshold: zone.freeDeliveryMinimum,
            estimatedMinutes: zone.estimatedDeliveryMinutes,
        };
    }

    /**
     * Get H-POS delivery zones for frontend
     * Returns simplified structure for cart UI
     */
    async getZonesForPOS(storeId: string): Promise<Array<{
        id: string;
        code: string;
        name: string;
        fee: number;
        freeAbove: number | null;
        estimatedMinutes: number | null;
        color: string | null;
    }>> {
        const zones = await this.findAll(storeId);

        return zones.map(zone => ({
            id: zone.id,
            code: zone.zoneCode,
            name: zone.zoneName,
            fee: zone.deliveryFee,
            freeAbove: zone.freeDeliveryMinimum,
            estimatedMinutes: zone.estimatedDeliveryMinutes,
            color: zone.color,
        }));
    }
}
