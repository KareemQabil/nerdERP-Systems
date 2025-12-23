import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Device } from '../entities/device.entity';
import { CreateDeviceDto, UpdateDeviceDto } from '../dto/user.dto';

@Injectable()
export class DeviceService {
    constructor(
        @InjectRepository(Device)
        private readonly deviceRepo: Repository<Device>,
    ) { }

    async findAll(): Promise<Device[]> {
        return await this.deviceRepo.find({
            where: { isActive: true },
            order: { deviceName: 'ASC' },
        });
    }

    async findByStore(storeId: string): Promise<Device[]> {
        return await this.deviceRepo.find({
            where: { storeId, isActive: true },
            order: { deviceName: 'ASC' },
        });
    }

    async findById(id: string): Promise<Device> {
        const device = await this.deviceRepo.findOne({ where: { id } });
        if (!device) {
            throw new NotFoundException(`Device with ID ${id} not found`);
        }
        return device;
    }

    async findByCode(deviceCode: string): Promise<Device | null> {
        return await this.deviceRepo.findOne({ where: { deviceCode } });
    }

    @Transactional()
    async create(dto: CreateDeviceDto): Promise<Device> {
        // Check if device code exists
        const existing = await this.findByCode(dto.deviceCode);
        if (existing) {
            throw new BadRequestException('Device code already exists');
        }

        const device = this.deviceRepo.create({
            deviceName: dto.deviceName,
            deviceCode: dto.deviceCode,
            deviceType: dto.deviceType,
            storeId: dto.storeId,
            hardwareId: dto.hardwareId,
            config: dto.config,
        });

        return await this.deviceRepo.save(device);
    }

    @Transactional()
    async update(id: string, dto: UpdateDeviceDto): Promise<Device> {
        const device = await this.findById(id);

        if (dto.deviceName) device.deviceName = dto.deviceName;
        if (dto.isActive !== undefined) device.isActive = dto.isActive;
        if (dto.config) device.config = { ...device.config, ...dto.config };

        return await this.deviceRepo.save(device);
    }

    @Transactional()
    async delete(id: string): Promise<void> {
        const device = await this.findById(id);
        await this.deviceRepo.remove(device);
    }

    @Transactional()
    async heartbeat(id: string): Promise<void> {
        const device = await this.findById(id);
        device.lastSeenAt = new Date();
        await this.deviceRepo.save(device);
    }
}
