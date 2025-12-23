import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { PaymentMethod } from '../entities/payment-method.entity';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from '../dto/payment-method.dto';

@Injectable()
export class PaymentMethodService {
    constructor(
        @InjectRepository(PaymentMethod)
        private readonly paymentMethodRepo: Repository<PaymentMethod>,
    ) { }

    async findAll(): Promise<PaymentMethod[]> {
        return await this.paymentMethodRepo.find({
            where: { isActive: true },
            order: { methodName: 'ASC' },
        });
    }

    async findById(id: string): Promise<PaymentMethod> {
        const method = await this.paymentMethodRepo.findOne({ where: { id } });
        if (!method) {
            throw new NotFoundException(`Payment method with ID ${id} not found`);
        }
        return method;
    }

    async findByCode(methodCode: string): Promise<PaymentMethod | null> {
        return await this.paymentMethodRepo.findOne({ where: { methodCode } });
    }

    @Transactional()
    async create(dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
        const existing = await this.findByCode(dto.methodCode);
        if (existing) {
            throw new BadRequestException('Payment method code already exists');
        }

        const method = this.paymentMethodRepo.create(dto);
        return await this.paymentMethodRepo.save(method);
    }

    @Transactional()
    async update(id: string, dto: UpdatePaymentMethodDto): Promise<PaymentMethod> {
        const method = await this.findById(id);

        Object.assign(method, dto);
        return await this.paymentMethodRepo.save(method);
    }

    @Transactional()
    async delete(id: string): Promise<void> {
        const method = await this.findById(id);
        await this.paymentMethodRepo.remove(method);
    }
}
