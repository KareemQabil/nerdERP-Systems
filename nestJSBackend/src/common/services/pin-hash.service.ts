import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

/**
 * PIN Hash Service
 * Handles secure PIN hashing and verification using bcrypt
 */
@Injectable()
export class PinHashService {
    private readonly SALT_ROUNDS = 12; // High security for PINs

    /**
     * Hash a PIN code using bcrypt
     * @param pinCode Plain text PIN (4-6 digits)
     * @returns Hashed PIN
     */
    async hashPin(pinCode: string): Promise<string> {
        if (!pinCode || pinCode.length < 4 || pinCode.length > 6) {
            throw new Error('PIN must be between 4 and 6 digits');
        }

        // Validate PIN contains only digits
        if (!/^\d+$/.test(pinCode)) {
            throw new Error('PIN must contain only digits');
        }

        return await bcrypt.hash(pinCode, this.SALT_ROUNDS);
    }

    /**
     * Verify a PIN against a hash
     * @param pinCode Plain text PIN to verify
     * @param pinHash Hashed PIN to compare against
     * @returns True if PIN matches
     */
    async verifyPin(pinCode: string, pinHash: string): Promise<boolean> {
        if (!pinCode || !pinHash) {
            return false;
        }

        try {
            return await bcrypt.compare(pinCode, pinHash);
        } catch (error) {
            console.error('[PinHashService] Verification error:', error);
            return false;
        }
    }

    /**
     * Check if a hash needs rehashing (if salt rounds changed)
     * @param pinHash Hash to check
     * @returns True if hash should be rehashed
     */
    async needsRehash(pinHash: string): Promise<boolean> {
        try {
            // Extract salt rounds from hash
            const matches = pinHash.match(/^\$2[aby]?\$(\d+)\$/);
            if (!matches) {
                return true; // Not a bcrypt hash, needs rehash
            }

            const currentRounds = parseInt(matches[1], 10);
            return currentRounds < this.SALT_ROUNDS;
        } catch {
            return true;
        }
    }

    /**
     * Validate PIN format before hashing
     * @param pinCode PIN to validate
     * @returns True if valid
     */
    isValidPinFormat(pinCode: string): boolean {
        return (
            typeof pinCode === 'string' &&
            /^\d{4,6}$/.test(pinCode)
        );
    }

    /**
     * Generate a random PIN for new users (optional feature)
     * @param digits Number of digits (default 4)
     * @returns Random PIN
     */
    generateRandomPin(digits: number = 4): string {
        const min = Math.pow(10, digits - 1);
        const max = Math.pow(10, digits) - 1;
        return Math.floor(min + Math.random() * (max - min + 1)).toString();
    }
}
