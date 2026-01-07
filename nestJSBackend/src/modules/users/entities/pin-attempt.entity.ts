import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { User } from './user.entity';

/**
 * PIN Attempt Entity
 * Tracks failed PIN verification attempts and lockouts
 * Used to prevent brute force attacks on PIN codes
 */
@Entity('pin_attempts')
@Index(['userId', 'deviceId'])
export class PinAttempt extends AbstractEntity {
    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    /**
     * Device identifier to track attempts per device
     * Helps prevent distributed brute force attacks
     */
    @Column({ name: 'device_id' })
    deviceId: string;

    /**
     * IP address of the request
     */
    @Column({ name: 'ip_address', nullable: true })
    ipAddress: string;

    /**
     * Current attempt count (incremented on each failure)
     */
    @Column({ name: 'attempt_count', default: 1 })
    attemptCount: number;

    /**
     * Timestamp when the lockout expires
     * Null if not currently locked out
     */
    @Column({ name: 'locked_until', type: 'timestamp with time zone', nullable: true })
    lockedUntil: Date | null;

    /**
     * Whether this attempt resulted in a successful verification
     * Successful attempts reset the count
     */
    @Column({ name: 'is_successful', default: false })
    isSuccessful: boolean;

    /**
     * Check if the account is currently locked out
     */
    isLocked(): boolean {
        if (!this.lockedUntil) {
            return false;
        }
        return new Date() < this.lockedUntil;
    }

    /**
     * Get remaining lockout time in seconds
     * Returns 0 if not locked
     */
    getRemainingLockoutSeconds(): number {
        if (!this.lockedUntil) {
            return 0;
        }
        const remaining = Math.max(0, this.lockedUntil.getTime() - Date.now());
        return Math.floor(remaining / 1000);
    }
}
