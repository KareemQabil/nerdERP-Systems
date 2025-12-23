import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { KitchenStation } from '../entities/kitchen-station.entity';
import { KitchenTicket, KitchenTicketItem, TicketStatus, TicketPriority } from '../entities/kitchen-ticket.entity';
import { SalesOrder } from '../../sales/entities/sales-order.entity';
import {
    CreateKitchenStationDto,
    UpdateKitchenStationDto,
    UpdateTicketStatusDto,
    BumpTicketDto,
} from '../dto/kitchen.dto';

@Injectable()
export class KitchenService {
    constructor(
        @InjectRepository(KitchenStation)
        private readonly stationRepo: Repository<KitchenStation>,
        @InjectRepository(KitchenTicket)
        private readonly ticketRepo: Repository<KitchenTicket>,
        @InjectRepository(KitchenTicketItem)
        private readonly ticketItemRepo: Repository<KitchenTicketItem>,
        @InjectRepository(SalesOrder)
        private readonly orderRepo: Repository<SalesOrder>,
    ) { }

    // ==================== STATIONS ====================

    async findAllStations(storeId?: string): Promise<KitchenStation[]> {
        const query = this.stationRepo.createQueryBuilder('station')
            .where('station.isActive = :isActive', { isActive: true })
            .orderBy('station.displayOrder', 'ASC');

        if (storeId) {
            query.andWhere('station.storeId = :storeId', { storeId });
        }

        return await query.getMany();
    }

    async findStationById(id: string): Promise<KitchenStation> {
        const station = await this.stationRepo.findOne({ where: { id } });
        if (!station) {
            throw new NotFoundException(`Kitchen station with ID ${id} not found`);
        }
        return station;
    }

    @Transactional()
    async createStation(dto: CreateKitchenStationDto): Promise<KitchenStation> {
        const existing = await this.stationRepo.findOne({
            where: { stationCode: dto.stationCode, storeId: dto.storeId },
        });

        if (existing) {
            throw new BadRequestException('Station code already exists for this store');
        }

        const station = this.stationRepo.create(dto);
        return await this.stationRepo.save(station);
    }

    @Transactional()
    async updateStation(id: string, dto: UpdateKitchenStationDto): Promise<KitchenStation> {
        const station = await this.findStationById(id);
        Object.assign(station, dto);
        return await this.stationRepo.save(station);
    }

    // ==================== TICKETS ====================

    @Transactional()
    async createTicketsFromOrder(orderId: string): Promise<KitchenTicket[]> {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['items', 'items.product'],
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Group items by station
        const stationGroups = new Map<string, any[]>();

        for (const item of order.items) {
            if (item.product?.isKitchenItem) {
                const stations = item.product.kitchenStationIds || [];

                if (stations.length === 0) {
                    // Skip items with no station assignment
                    continue;
                }

                for (const stationId of stations) {
                    if (!stationGroups.has(stationId)) {
                        stationGroups.set(stationId, []);
                    }
                    stationGroups.get(stationId)!.push(item);
                }
            }
        }

        // Create ticket for each station
        const tickets: KitchenTicket[] = [];

        for (const [stationId, items] of stationGroups) {
            // Load station to create proper relation
            const station = await this.stationRepo.findOne({ where: { id: stationId } });
            if (!station) continue;

            const ticket = this.ticketRepo.create({
                station,
                orderId,
                ticketNumber: `T-${order.orderNumber}-${stationId.substring(0, 4)}`,
                orderNumber: order.orderNumber,
                status: TicketStatus.NEW,
                priority: TicketPriority.NORMAL,
                sentAt: new Date(),
            });

            const savedTicket = await this.ticketRepo.save(ticket);

            // Create ticket items
            for (const item of items) {
                await this.ticketItemRepo.save({
                    ticket: savedTicket,
                    orderItemId: item.id,
                    productId: item.product.id,
                    productName: item.product.name,
                    quantity: parseFloat(item.quantity),
                    notes: item.notes || '',
                    isPrepared: false,
                });
            }

            tickets.push(savedTicket);
        }

        return tickets;
    }

    async getActiveTickets(stationId: string): Promise<KitchenTicket[]> {
        return await this.ticketRepo
            .createQueryBuilder('ticket')
            .leftJoinAndSelect('ticket.station', 'station')
            .leftJoinAndSelect('ticket.items', 'items')
            .where('station.id = :stationId', { stationId })
            .andWhere('ticket.status IN (:...statuses)', {
                statuses: [TicketStatus.NEW, TicketStatus.IN_PROGRESS]
            })
            .orderBy('ticket.sentAt', 'ASC')
            .getMany();
    }

    @Transactional()
    async updateTicketStatus(id: string, dto: UpdateTicketStatusDto): Promise<KitchenTicket> {
        const ticket = await this.ticketRepo.findOne({ where: { id } });
        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        ticket.status = dto.status;

        if (dto.status === TicketStatus.IN_PROGRESS && !ticket.startedAt) {
            ticket.startedAt = new Date();
        } else if (dto.status === TicketStatus.READY && !ticket.completedAt) {
            ticket.completedAt = new Date();

            // Calculate prep time
            if (ticket.startedAt) {
                const prepTime = Math.floor(
                    (ticket.completedAt.getTime() - ticket.startedAt.getTime()) / 1000
                );
                ticket.prepTimeSeconds = prepTime;
            }
        }

        return await this.ticketRepo.save(ticket);
    }

    @Transactional()
    async bumpTicket(id: string, dto: BumpTicketDto): Promise<KitchenTicket> {
        const ticket = await this.ticketRepo.findOne({ where: { id } });
        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        ticket.status = TicketStatus.BUMPED;
        ticket.bumpedAt = new Date();
        ticket.bumpedByUserId = dto.userId;

        return await this.ticketRepo.save(ticket);
    }

    async getStationTickets(stationId: string): Promise<KitchenTicket[]> {
        return await this.ticketRepo
            .createQueryBuilder('ticket')
            .leftJoinAndSelect('ticket.station', 'station')
            .leftJoinAndSelect('ticket.items', 'items')
            .where('station.id = :stationId', { stationId })
            .orderBy('ticket.sentAt', 'DESC')
            .take(50)
            .getMany();
    }
}
