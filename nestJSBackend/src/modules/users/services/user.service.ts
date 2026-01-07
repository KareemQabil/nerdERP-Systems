import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import * as bcrypt from 'bcrypt';
import { User, Role, AuditLog } from '../entities/user.entity';
import { PinAttempt } from '../entities/pin-attempt.entity';
import { CreateUserDto, UpdateUserDto, CreateRoleDto, UpdateRoleDto, LoginDto, PinLoginDto } from '../dto/user.dto';
import { PinHashService } from '../../../common/services/pin-hash.service';

@Injectable()
export class UserService {
    private readonly MAX_PIN_ATTEMPTS = 5;
    private readonly LOCKOUT_DURATION_MINUTES = 15;

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepo: Repository<Role>,
        @InjectRepository(AuditLog)
        private readonly auditRepo: Repository<AuditLog>,
        @InjectRepository(PinAttempt)
        private readonly pinAttemptRepo: Repository<PinAttempt>,
        private readonly pinHashService: PinHashService,
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

        // Hash PIN if provided
        let pinHash: string | undefined;
        if (dto.pinCode && this.pinHashService.isValidPinFormat(dto.pinCode)) {
            pinHash = await this.pinHashService.hashPin(dto.pinCode);
        }

        const user = this.userRepo.create({
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            pinCode: dto.pinCode, // Keep for migration compatibility
            pinHash,
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
        if (dto.pinCode !== undefined) {
            // Hash new PIN if provided and valid
            if (dto.pinCode && this.pinHashService.isValidPinFormat(dto.pinCode)) {
                user.pinHash = await this.pinHashService.hashPin(dto.pinCode);
                user.pinCode = dto.pinCode; // Keep for migration compatibility
            } else if (dto.pinCode === null || dto.pinCode === '') {
                // Clear PIN
                user.pinCode = '' as any;
                user.pinHash = '' as any;
            }
        }
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
        // Quick lookup by pinCode for PIN-only login (will be migrated to use userId)
        const user = await this.userRepo.findOne({ where: { pinCode, isActive: true } });
        if (!user) {
            return null;
        }

        // Check for existing lockout for this user/device combination
        const existingAttempt = await this.pinAttemptRepo.findOne({
            where: { userId: user.id, deviceId },
            order: { createdAt: 'DESC' },
        });

        if (existingAttempt && existingAttempt.isLocked()) {
            const remainingSeconds = existingAttempt.getRemainingLockoutSeconds();
            throw new UnauthorizedException(
                `Account locked. Try again in ${Math.ceil(remainingSeconds / 60)} minutes.`
            );
        }

        // Verify PIN using secure hash comparison
        let isValid = false;
        if (user.pinHash) {
            // Use hash verification if available
            isValid = await this.pinHashService.verifyPin(pinCode, user.pinHash);
        } else {
            // Fallback to plaintext comparison during migration period
            isValid = user.pinCode === pinCode;
        }

        if (!isValid) {
            // Increment attempt count or create new attempt record
            let attempt = existingAttempt;
            if (!attempt || attempt.isSuccessful) {
                // Create new attempt record for failed attempt
                attempt = this.pinAttemptRepo.create({
                    userId: user.id,
                    deviceId,
                    attemptCount: 1,
                    isSuccessful: false,
                });
            } else {
                // Increment existing failed attempt count
                attempt.attemptCount++;
                // Apply lockout if max attempts reached
                if (attempt.attemptCount >= this.MAX_PIN_ATTEMPTS) {
                    const lockoutUntil = new Date();
                    lockoutUntil.setMinutes(lockoutUntil.getMinutes() + this.LOCKOUT_DURATION_MINUTES);
                    attempt.lockedUntil = lockoutUntil;
                }
            }
            await this.pinAttemptRepo.save(attempt);

            // Log failed attempt
            await this.createAuditLog({
                entityName: 'User',
                entityId: user.id,
                action: 'PIN_VERIFICATION_FAILED',
                oldValues: null,
                newValues: { attemptCount: attempt.attemptCount, deviceId },
                userId: user.id,
                userName: `${user.firstName} ${user.lastName}`.trim(),
                deviceId,
            });

            return null;
        }

        // PIN is valid - reset attempts and update last login
        if (existingAttempt && !existingAttempt.isSuccessful) {
            // Reset failed attempts on successful login
            existingAttempt.isSuccessful = true;
            existingAttempt.attemptCount = 0;
            existingAttempt.lockedUntil = null;
            await this.pinAttemptRepo.save(existingAttempt);
        } else {
            // Create successful attempt record
            const attempt = this.pinAttemptRepo.create({
                userId: user.id,
                deviceId,
                attemptCount: 1,
                isSuccessful: true,
            });
            await this.pinAttemptRepo.save(attempt);
        }

        // Update last login
        user.lastLoginAt = new Date();
        await this.userRepo.save(user);

        // Log successful login
        await this.createAuditLog({
            entityName: 'User',
            entityId: user.id,
            action: 'PIN_LOGIN_SUCCESS',
            oldValues: null,
            newValues: { deviceId },
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`.trim(),
            deviceId,
        });

        return user;
    }

    /**
     * Validate PIN by user ID (more secure than PIN lookup)
     * Use this when userId is known (e.g., from session, card swipe)
     */
    async validatePinByUserId(userId: string, pinCode: string, deviceId: string): Promise<User | null> {
        const user = await this.findById(userId);
        if (!user || !user.isActive) {
            return null;
        }

        // Check for existing lockout
        const existingAttempt = await this.pinAttemptRepo.findOne({
            where: { userId, deviceId },
            order: { createdAt: 'DESC' },
        });

        if (existingAttempt && existingAttempt.isLocked()) {
            const remainingSeconds = existingAttempt.getRemainingLockoutSeconds();
            throw new UnauthorizedException(
                `Account locked. Try again in ${Math.ceil(remainingSeconds / 60)} minutes.`
            );
        }

        // Verify PIN using secure hash
        let isValid = false;
        if (user.pinHash) {
            isValid = await this.pinHashService.verifyPin(pinCode, user.pinHash);
        } else if (user.pinCode) {
            // Fallback to plaintext during migration
            isValid = user.pinCode === pinCode;
        }

        if (!isValid) {
            // Track failed attempt
            let attempt = existingAttempt;
            if (!attempt || attempt.isSuccessful) {
                attempt = this.pinAttemptRepo.create({
                    userId,
                    deviceId,
                    attemptCount: 1,
                    isSuccessful: false,
                });
            } else {
                attempt.attemptCount++;
                if (attempt.attemptCount >= this.MAX_PIN_ATTEMPTS) {
                    const lockoutUntil = new Date();
                    lockoutUntil.setMinutes(lockoutUntil.getMinutes() + this.LOCKOUT_DURATION_MINUTES);
                    attempt.lockedUntil = lockoutUntil;
                }
            }
            await this.pinAttemptRepo.save(attempt);

            await this.createAuditLog({
                entityName: 'User',
                entityId: userId,
                action: 'PIN_VERIFICATION_FAILED',
                oldValues: null,
                newValues: { attemptCount: attempt.attemptCount, deviceId },
                userId,
                userName: `${user.firstName} ${user.lastName}`.trim(),
                deviceId,
            });

            return null;
        }

        // Reset attempts on success
        if (existingAttempt && !existingAttempt.isSuccessful) {
            existingAttempt.isSuccessful = true;
            existingAttempt.attemptCount = 0;
            existingAttempt.lockedUntil = null;
            await this.pinAttemptRepo.save(existingAttempt);
        }

        user.lastLoginAt = new Date();
        await this.userRepo.save(user);

        await this.createAuditLog({
            entityName: 'User',
            entityId: userId,
            action: 'PIN_LOGIN_SUCCESS',
            oldValues: null,
            newValues: { deviceId },
            userId,
            userName: `${user.firstName} ${user.lastName}`.trim(),
            deviceId,
        });

        return user;
    }

    /**
     * Check if a user is locked out for PIN verification on a specific device
     */
    async isPinLockedOut(userId: string, deviceId: string): Promise<boolean> {
        const attempt = await this.pinAttemptRepo.findOne({
            where: { userId, deviceId },
            order: { createdAt: 'DESC' },
        });
        return attempt ? attempt.isLocked() : false;
    }

    /**
     * Get remaining lockout time in seconds
     */
    async getPinLockoutRemainingSeconds(userId: string, deviceId: string): Promise<number> {
        const attempt = await this.pinAttemptRepo.findOne({
            where: { userId, deviceId },
            order: { createdAt: 'DESC' },
        });
        return attempt ? attempt.getRemainingLockoutSeconds() : 0;
    }

    /**
     * Clear PIN lockout (manager action)
     */
    @Transactional()
    async clearPinLockout(userId: string, deviceId: string, clearedBy: string): Promise<void> {
        const attempt = await this.pinAttemptRepo.findOne({
            where: { userId, deviceId },
            order: { createdAt: 'DESC' },
        });

        if (attempt && attempt.isLocked()) {
            attempt.lockedUntil = null;
            attempt.attemptCount = 0;
            await this.pinAttemptRepo.save(attempt);

            await this.createAuditLog({
                entityName: 'PinAttempt',
                entityId: attempt.id,
                action: 'LOCKOUT_CLEARED',
                oldValues: { lockedUntil: attempt.lockedUntil, attemptCount: attempt.attemptCount },
                newValues: { lockedUntil: null, attemptCount: 0 },
                userId: clearedBy,
                userName: 'Manager',
            });
        }
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
