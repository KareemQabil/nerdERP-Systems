import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import * as bcrypt from 'bcrypt';
import { User, Role, AuditLog } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto, CreateRoleDto, UpdateRoleDto, LoginDto, PinLoginDto } from '../dto/user.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepo: Repository<Role>,
        @InjectRepository(AuditLog)
        private readonly auditRepo: Repository<AuditLog>,
    ) { }

    // ========== User CRUD ==========

    async findAll(): Promise<User[]> {
        return await this.userRepo.find({
            where: { isActive: true },
            order: { createdAt: 'DESC' },
        });
    }

    async findById(id: string): Promise<User> {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.userRepo.findOne({ where: { email } });
    }

    @Transactional()
    async create(dto: CreateUserDto): Promise<User> {
        // Check if email exists
        const existing = await this.findByEmail(dto.email);
        if (existing) {
            throw new BadRequestException('Email already exists');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = this.userRepo.create({
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            pinCode: dto.pinCode,
            roleId: dto.roleId,
            storeId: dto.storeId,
            metadata: dto.metadata,
        });

        const saved = await this.userRepo.save(user);

        // Create audit log
        await this.createAuditLog({
            entityName: 'User',
            entityId: saved.id,
            action: 'CREATE',
            oldValues: null,
            newValues: { email: saved.email, role: dto.roleId },
            userId: 'system',
            userName: 'System',
        });

        return saved;
    }

    @Transactional()
    async update(id: string, dto: UpdateUserDto): Promise<User> {
        const user = await this.findById(id);
        const oldValues = { ...user };

        if (dto.email && dto.email !== user.email) {
            const existing = await this.findByEmail(dto.email);
            if (existing) {
                throw new BadRequestException('Email already exists');
            }
            user.email = dto.email;
        }

        if (dto.password) {
            user.passwordHash = await bcrypt.hash(dto.password, 10);
        }

        if (dto.firstName) user.firstName = dto.firstName;
        if (dto.lastName) user.lastName = dto.lastName;
        if (dto.phone !== undefined) user.phone = dto.phone;
        if (dto.pinCode !== undefined) user.pinCode = dto.pinCode;
        if (dto.roleId) user.roleId = dto.roleId;
        if (dto.isActive !== undefined) user.isActive = dto.isActive;
        if (dto.storeId !== undefined) user.storeId = dto.storeId;
        if (dto.metadata) user.metadata = dto.metadata;

        const saved = await this.userRepo.save(user);

        await this.createAuditLog({
            entityName: 'User',
            entityId: id,
            action: 'UPDATE',
            oldValues,
            newValues: saved,
            userId: 'system',
            userName: 'System',
        });

        return saved;
    }

    @Transactional()
    async delete(id: string): Promise<void> {
        const user = await this.findById(id);

        await this.createAuditLog({
            entityName: 'User',
            entityId: id,
            action: 'DELETE',
            oldValues: user,
            newValues: null,
            userId: 'system',
            userName: 'System',
        });

        await this.userRepo.remove(user);
    }

    // ========== Role CRUD ==========

    async findAllRoles(): Promise<Role[]> {
        return await this.roleRepo.find({ order: { roleName: 'ASC' } });
    }

    async findRoleById(id: string): Promise<Role> {
        const role = await this.roleRepo.findOne({ where: { id } });
        if (!role) {
            throw new NotFoundException(`Role with ID ${id} not found`);
        }
        return role;
    }

    @Transactional()
    async createRole(dto: CreateRoleDto): Promise<Role> {
        const existing = await this.roleRepo.findOne({ where: { roleCode: dto.roleCode } });
        if (existing) {
            throw new BadRequestException('Role code already exists');
        }

        const role = this.roleRepo.create({
            roleName: dto.roleName,
            roleCode: dto.roleCode,
            permissions: dto.permissions,
            parentRoleId: dto.parentRoleId,
        });

        return await this.roleRepo.save(role);
    }

    @Transactional()
    async updateRole(id: string, dto: UpdateRoleDto): Promise<Role> {
        const role = await this.findRoleById(id);

        if (dto.roleName) role.roleName = dto.roleName;
        if (dto.permissions) role.permissions = dto.permissions;
        if (dto.parentRoleId !== undefined) role.parentRoleId = dto.parentRoleId;

        return await this.roleRepo.save(role);
    }

    @Transactional()
    async deleteRole(id: string): Promise<void> {
        const role = await this.findRoleById(id);

        if (role.isSystemRole) {
            throw new BadRequestException('Cannot delete system role');
        }

        // Check if any users have this role
        const usersCount = await this.userRepo.count({ where: { roleId: id } });
        if (usersCount > 0) {
            throw new BadRequestException(`Cannot delete role. ${usersCount} user(s) have this role.`);
        }

        await this.roleRepo.remove(role);
    }

    // ========== Authentication ==========

    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.findByEmail(email);
        if (!user || !user.isActive) {
            return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return null;
        }

        // Update last login
        user.lastLoginAt = new Date();
        await this.userRepo.save(user);

        return user;
    }

    async validatePin(pinCode: string, deviceId: string): Promise<User | null> {
        const user = await this.userRepo.findOne({ where: { pinCode, isActive: true } });
        if (!user) {
            return null;
        }

        // Update last login
        user.lastLoginAt = new Date();
        await this.userRepo.save(user);

        return user;
    }

    // ========== Audit Logging ==========

    @Transactional()
    async createAuditLog(data: {
        entityName: string;
        entityId: string;
        action: string;
        oldValues: any;
        newValues: any;
        userId: string;
        userName: string;
        ipAddress?: string;
        deviceId?: string;
        storeId?: string;
    }): Promise<AuditLog> {
        const log = this.auditRepo.create(data);
        return await this.auditRepo.save(log);
    }

    async getAuditLogs(entityName: string, entityId: string): Promise<AuditLog[]> {
        return await this.auditRepo.find({
            where: { entityName, entityId },
            order: { createdAt: 'DESC' },
        });
    }
}
