import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Table, TableZone, TableStatus } from '../entities/table.entity';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import {
    CreateTableDto,
    CreateTableZoneDto,
    UpdateTableStatusDto,
    CreateReservationDto,
    UpdateReservationDto,
    // TableStatus, // Removed as it's now imported from table.entity
} from '../dto/tables.dto';

@Injectable()
export class TablesService {
    constructor(
        @InjectRepository(Table)
        private readonly tableRepo: Repository<Table>,
        @InjectRepository(TableZone)
        private readonly zoneRepo: Repository<TableZone>,
        @InjectRepository(Reservation)
        private readonly reservationRepo: Repository<Reservation>,
    ) { }

    // ==================== ZONES ====================

    async findAllZones(storeId: string): Promise<TableZone[]> {
        return await this.zoneRepo.find({
            where: { storeId },
            order: { displayOrder: 'ASC' },
        });
    }

    @Transactional()
    async createZone(dto: CreateTableZoneDto): Promise<TableZone> {
        const zone = this.zoneRepo.create(dto);
        return await this.zoneRepo.save(zone);
    }

    // ==================== TABLES ====================

    async findAllTables(storeId: string): Promise<Table[]> {
        return await this.tableRepo.find({
            where: { storeId },
            relations: ['zone'],
            order: { tableNumber: 'ASC' },
        });
    }

    async findTableById(id: string): Promise<Table> {
        const table = await this.tableRepo.findOne({
            where: { id },
            relations: ['zone'],
        });
        if (!table) {
            throw new NotFoundException(`Table with ID ${id} not found`);
        }
        return table;
    }

    async getAvailableTables(storeId: string, partySize?: number): Promise<Table[]> {
        const query = this.tableRepo
            .createQueryBuilder('table')
            .leftJoinAndSelect('table.zone', 'zone')
            .where('table.storeId = :storeId', { storeId })
            .andWhere('table.status = :status', { status: TableStatus.AVAILABLE });

        if (partySize) {
            query.andWhere('table.minSeats <= :partySize', { partySize })
                .andWhere('table.maxSeats >= :partySize', { partySize });
        }

        return await query.orderBy('table.tableNumber', 'ASC').getMany();
    }

    @Transactional()
    async createTable(dto: CreateTableDto): Promise<Table> {
        // Check if table number exists for this store
        const existing = await this.tableRepo.findOne({
            where: { tableNumber: dto.tableNumber, storeId: dto.storeId },
        });

        if (existing) {
            throw new BadRequestException(`Table ${dto.tableNumber} already exists in this store`);
        }

        // Validate zone if provided
        if (dto.zoneId) {
            const zone = await this.zoneRepo.findOne({ where: { id: dto.zoneId } });
            if (!zone) {
                throw new NotFoundException('Zone not found');
            }
        }

        const table = this.tableRepo.create({
            ...dto,
            status: TableStatus.AVAILABLE,
        });

        return await this.tableRepo.save(table);
    }

    @Transactional()
    async updateTableStatus(id: string, dto: UpdateTableStatusDto): Promise<Table> {
        const table = await this.findTableById(id);

        // Validate status transitions
        if (dto.status === TableStatus.OCCUPIED && !dto.currentOrderId) {
            throw new BadRequestException('Order ID required when status is OCCUPIED');
        }

        table.status = dto.status;

        if (dto.status === TableStatus.OCCUPIED) {
            table.currentOrderId = dto.currentOrderId || null!;
            // table.occupiedAt = new Date(); // Removed non-existent field
        } else if (dto.status === TableStatus.AVAILABLE) {
            table.currentOrderId = null!;
            // table.occupiedAt = null; // Removed non-existent field
        }

        return await this.tableRepo.save(table);
    }

    @Transactional()
    async occupyTable(tableId: string, orderId: string): Promise<Table> {
        const table = await this.findTableById(tableId);

        if (table.status === TableStatus.OCCUPIED) {
            throw new BadRequestException({
                code: 'SALES_011',
                message: 'Table already occupied',
            });
        }

        table.status = TableStatus.OCCUPIED;
        table.currentOrderId = orderId;
        // Note: occupiedAt timestamp tracked via createdAt/updatedAt in AbstractEntity
        // table.occupiedAt = new Date(); // Removed non-existent field

        return await this.tableRepo.save(table);
    }

    @Transactional()
    async freeTable(tableId: string): Promise<Table> {
        const table = await this.findTableById(tableId);

        table.status = TableStatus.AVAILABLE;
        table.currentOrderId = null!;
        // Note: Table freed timestamp tracked via updatedAt

        return await this.tableRepo.save(table);
    }

    // ==================== RESERVATIONS ====================

    async findReservationById(id: string): Promise<Reservation> {
        const reservation = await this.reservationRepo.findOne({
            where: { id },
            relations: ['table', 'table.zone'],
        });
        if (!reservation) {
            throw new NotFoundException(`Reservation with ID ${id} not found`);
        }
        return reservation;
    }

    async getTodayReservations(storeId: string, date: string): Promise<Reservation[]> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return await this.reservationRepo
            .createQueryBuilder('reservation')
            .leftJoinAndSelect('reservation.table', 'table')
            .leftJoinAndSelect('table.zone', 'zone')
            .where('table.storeId = :storeId', { storeId })
            .andWhere('reservation.reservationDate >= :start', { start: startOfDay })
            .andWhere('reservation.reservationDate <= :end', { end: endOfDay })
            .andWhere('reservation.status != :cancelled', { cancelled: ReservationStatus.CANCELLED })
            .orderBy('reservation.reservationDate', 'ASC')
            .getMany();
    }

    @Transactional()
    async createReservation(dto: CreateReservationDto): Promise<Reservation> {
        const table = await this.findTableById(dto.tableId);

        // Check if table can accommodate party size
        if (dto.partySize < table.minSeats || dto.partySize > table.maxSeats) {
            throw new BadRequestException(
                `Table ${table.tableNumber} can only accommodate ${table.minSeats} -${table.maxSeats} guests`
            );
        }

        // Check for conflicting reservations (within 2 hours)
        const reservationDate = new Date(dto.reservationDate);
        const twoHoursBefore = new Date(reservationDate.getTime() - 2 * 60 * 60 * 1000);
        const twoHoursAfter = new Date(reservationDate.getTime() + 2 * 60 * 60 * 1000);

        const conflicting = await this.reservationRepo
            .createQueryBuilder('r')
            .where('r.tableId = :tableId', { tableId: dto.tableId })
            .andWhere('r.reservationDate BETWEEN :before AND :after', {
                before: twoHoursBefore,
                after: twoHoursAfter,
            })
            .andWhere('r.status != :cancelled', { cancelled: ReservationStatus.CANCELLED })
            .getOne();

        if (conflicting) {
            throw new BadRequestException('Table already has a reservation at this time');
        }

        const reservation = this.reservationRepo.create({
            ...dto,
            reservationDate: new Date(dto.reservationDate),
            status: ReservationStatus.PENDING,
        });

        return await this.reservationRepo.save(reservation);
    }

    @Transactional()
    async checkInReservation(id: string): Promise<Reservation> {
        const reservation = await this.findReservationById(id);

        if (reservation.status !== ReservationStatus.PENDING) {
            throw new BadRequestException('Reservation already checked in or cancelled');
        }

        // Mark table as reserved
        await this.updateTableStatus(reservation.table.id, {
            status: TableStatus.RESERVED,
        });

        reservation.status = ReservationStatus.CONFIRMED;
        reservation.confirmedAt = new Date();

        return await this.reservationRepo.save(reservation);
    }

    @Transactional()
    async cancelReservation(id: string): Promise<Reservation> {
        const reservation = await this.findReservationById(id);

        reservation.status = ReservationStatus.CANCELLED;

        return await this.reservationRepo.save(reservation);
    }

    @Transactional()
    async updateReservation(id: string, dto: UpdateReservationDto): Promise<Reservation> {
        const reservation = await this.findReservationById(id);

        if (reservation.status === ReservationStatus.CANCELLED) {
            throw new BadRequestException('Cannot update cancelled reservation');
        }

        if (dto.reservationDate) {
            reservation.reservationDate = new Date(dto.reservationDate);
        }

        if (dto.partySize) {
            reservation.partySize = dto.partySize;
        }

        if (dto.notes !== undefined) {
            reservation.notes = dto.notes;
        }

        return await this.reservationRepo.save(reservation);
    }
}
