import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Customer, CustomerAddress } from '../entities/customer.entity';
import { CustomerLoyalty, LoyaltyTransaction } from '../entities/loyalty.entity';
import { CreateCustomerDto, UpdateCustomerDto, CreateCustomerAddressDto } from '../dto/customer.dto';

@Injectable()
export class CustomerService {
    constructor(
        @InjectRepository(Customer)
        private readonly customerRepo: Repository<Customer>,
        @InjectRepository(CustomerAddress)
        private readonly addressRepo: Repository<CustomerAddress>,
        @InjectRepository(CustomerLoyalty)
        private readonly loyaltyRepo: Repository<CustomerLoyalty>,
    ) { }

    async findAll(): Promise<Customer[]> {
        return await this.customerRepo.find({
            where: { isActive: true },
            relations: ['addresses'],
            order: { createdAt: 'DESC' },
        });
    }

    async findById(id: string): Promise<Customer> {
        const customer = await this.customerRepo.findOne({
            where: { id },
            relations: ['addresses'],
        });

        if (!customer) {
            throw new NotFoundException(`Customer with ID ${id} not found`);
        }

        return customer;
    }

    async findByPhone(phone: string): Promise<Customer | null> {
        return await this.customerRepo.findOne({
            where: { phone },
            relations: ['addresses'],
        });
    }

    async findByEmail(email: string): Promise<Customer | null> {
        return await this.customerRepo.findOne({
            where: { email },
            relations: ['addresses'],
        });
    }

    @Transactional()
    async create(dto: CreateCustomerDto): Promise<Customer> {
        // Check for duplicates
        if (dto.phone) {
            const existing = await this.findByPhone(dto.phone);
            if (existing) {
                throw new BadRequestException('Customer with this phone number already exists');
            }
        }

        // Generate customer code
        const customerCode = await this.generateCustomerCode();

        const customer = this.customerRepo.create({
            customerCode,
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            phone: dto.phone,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
            gender: dto.gender,
            metadata: dto.metadata,
            tags: dto.tags,
        });

        const savedCustomer = await this.customerRepo.save(customer);

        // Create addresses
        if (dto.addresses && dto.addresses.length > 0) {
            const addresses = dto.addresses.map((addrDto, index) =>
                this.addressRepo.create({
                    ...addrDto,
                    customerId: savedCustomer.id,
                    isDefault: index === 0, // First address is default
                }),
            );

            await this.addressRepo.save(addresses);
        }

        // Initialize loyalty record
        const loyalty = this.loyaltyRepo.create({
            customerId: savedCustomer.id,
            totalPoints: 0,
            availablePoints: 0,
            lifetimeSpend: 0,
        });

        await this.loyaltyRepo.save(loyalty);

        return await this.findById(savedCustomer.id);
    }

    @Transactional()
    async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
        const customer = await this.findById(id);

        Object.assign(customer, {
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            phone: dto.phone,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
            gender: dto.gender,
            metadata: dto.metadata,
            tags: dto.tags,
            notes: dto.notes,
        });

        await this.customerRepo.save(customer);

        return await this.findById(id);
    }

    @Transactional()
    async delete(id: string): Promise<void> {
        const customer = await this.findById(id);

        // Soft delete by marking inactive
        customer.isActive = false;
        await this.customerRepo.save(customer);
    }

    @Transactional()
    async addAddress(customerId: string, dto: CreateCustomerAddressDto): Promise<CustomerAddress> {
        await this.findById(customerId); // Validate customer exists

        const address = this.addressRepo.create({
            ...dto,
            customerId,
        });

        return await this.addressRepo.save(address);
    }

    @Transactional()
    async setDefaultAddress(customerId: string, addressId: string): Promise<void> {
        await this.findById(customerId);

        // Unset all defaults
        await this.addressRepo
            .createQueryBuilder()
            .update()
            .set({ isDefault: false })
            .where('customer_id = :customerId', { customerId })
            .execute();

        // Set new default
        await this.addressRepo
            .createQueryBuilder()
            .update()
            .set({ isDefault: true })
            .where('id = :addressId', { addressId })
            .execute();
    }

    @Transactional()
    async updateOrderStats(customerId: string, orderAmount: number): Promise<void> {
        const customer = await this.findById(customerId);

        customer.orderCount += 1;
        customer.lifetimeSpend += orderAmount;
        customer.lastVisitDate = new Date();

        await this.customerRepo.save(customer);
    }

    private async generateCustomerCode(): Promise<string> {
        const count = await this.customerRepo.count();
        return `CUST${String(count + 1).padStart(6, '0')}`;
    }
}
