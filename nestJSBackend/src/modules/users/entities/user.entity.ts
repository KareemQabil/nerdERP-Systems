import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

/**
 * Role Entity
 * RBAC with granular permissions
 */
@Entity('roles')
export class Role extends AbstractEntity {
    @Column({ name: 'role_name' })
    roleName: string;

    @Column({ name: 'role_code', unique: true })
    roleCode: string; // 'ADMIN', 'MANAGER', 'CASHIER', 'WAITER'

    /**
     * Permissions as array of action strings
     * Example: ['orders.*', 'products.view', 'inventory.adjust', 'reports.sales']
     */
    @Column({ type: 'jsonb' })
    permissions: string[];

    @Column({ name: 'is_system_role', default: false })
    isSystemRole: boolean;

    @Column({ name: 'parent_role_id', nullable: true })
    parentRoleId: string; // For role inheritance
}

/**
 * User Entity
 * System users with role-based permissions
 */
@Entity('users')
export class User extends AbstractEntity {
    @Column({ unique: true })
    email: string;

    @Column({ name: 'password_hash' })
    passwordHash: string;

    @Column({ name: 'first_name' })
    firstName: string;

    @Column({ name: 'last_name' })
    lastName: string;

    @Column({ nullable: true })
    phone: string;

    /**
     * PIN for quick POS login (4-6 digits)
     */
    @Column({ name: 'pin_code', nullable: true })
    pinCode: string;

    @Column({ name: 'role_id', nullable: true })
    roleId: string;

    @ManyToOne(() => Role, { eager: true, nullable: true })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'last_login_at', type: 'timestamp with time zone', nullable: true })
    lastLoginAt: Date;

    @Column({ name: 'store_id', nullable: true })
    storeId: string; // null = access to all stores

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;
}

/**
 * Audit Log Entity
 * Immutable record of all system changes
 */
@Entity('audit_logs')
export class AuditLog extends AbstractEntity {
    @Column({ name: 'entity_name' })
    entityName: string;

    @Column({ name: 'entity_id' })
    entityId: string;

    @Column()
    action: string; // 'CREATE', 'UPDATE', 'DELETE', 'VOID', 'REFUND'

    @Column({ type: 'jsonb', nullable: true, name: 'old_values' })
    oldValues: Record<string, any>;

    @Column({ type: 'jsonb', name: 'new_values' })
    newValues: Record<string, any>;

    @Column({ name: 'user_id' })
    userId: string;

    @Column({ name: 'user_name' })
    userName: string;

    @Column({ name: 'ip_address', nullable: true })
    ipAddress: string;

    @Column({ name: 'device_id', nullable: true })
    deviceId: string;

    @Column({ name: 'store_id', nullable: true })
    storeId: string;
}
