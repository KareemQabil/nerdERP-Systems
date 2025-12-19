import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Screen Lock Store
 * 
 * Manages screen lock state with PIN protection.
 * Uses sessionStorage persistence to maintain lock across page refreshes.
 * 
 * Security Note: For production, consider hashing the PIN.
 * For MVP, storing in plain text is acceptable.
 */

interface ScreenLockStore {
    // State
    isLocked: boolean;
    lockCode: string | null;
    lockedAt: string | null;
    lockedBy: string | null;

    // Actions
    lock: (pin: string, userName?: string) => void;
    unlock: (enteredPin: string) => boolean;
    forceUnlock: () => void;
}

export const useScreenLockStore = create<ScreenLockStore>()(
    persist(
        (set, get) => ({
            // Initial State
            isLocked: false,
            lockCode: null,
            lockedAt: null,
            lockedBy: null,

            /**
             * Lock the screen with a 4-digit PIN
             * @param pin - 4-digit code to lock screen
             * @param userName - Optional cashier name for audit
             */
            lock: (pin: string, userName?: string) => {
                if (pin.length !== 4) {
                    console.warn('⚠️ PIN must be 4 digits');
                    return;
                }

                set({
                    isLocked: true,
                    lockCode: pin,
                    lockedAt: new Date().toISOString(),
                    lockedBy: userName || 'Unknown',
                });

                console.log('🔒 Screen locked at:', new Date().toLocaleTimeString('ar-SA'));
            },

            /**
             * Attempt to unlock the screen
             * @param enteredPin - PIN entered by user
             * @returns true if unlock successful, false otherwise
             */
            unlock: (enteredPin: string): boolean => {
                const { lockCode } = get();

                if (!lockCode) {
                    console.warn('⚠️ No lock code set');
                    return false;
                }

                if (enteredPin === lockCode) {
                    set({
                        isLocked: false,
                        lockCode: null,
                        lockedAt: null,
                        lockedBy: null,
                    });

                    console.log('✅ Screen unlocked');
                    return true;
                }

                console.log('❌ Incorrect PIN');
                return false;
            },

            /**
             * Emergency unlock (Manager override)
             * Does NOT require PIN
             */
            forceUnlock: () => {
                set({
                    isLocked: false,
                    lockCode: null,
                    lockedAt: null,
                    lockedBy: null,
                });

                console.log('🚨 Screen force-unlocked (Manager override)');
            },
        }),
        {
            name: 'screen-lock-storage',
            // Use sessionStorage so lock doesn't persist across browser restarts
            // but DOES persist across page refreshes
            storage: {
                getItem: (name) => {
                    const str = sessionStorage.getItem(name);
                    return str ? JSON.parse(str) : null;
                },
                setItem: (name, value) => {
                    sessionStorage.setItem(name, JSON.stringify(value));
                },
                removeItem: (name) => {
                    sessionStorage.removeItem(name);
                },
            },
        }
    )
);
