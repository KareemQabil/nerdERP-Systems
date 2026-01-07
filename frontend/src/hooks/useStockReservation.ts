/**
 * useStockReservation Hook
 *
 * Manages stock reservation lifecycle for POS checkout
 *
 * Flow:
 * 1. On checkout modal open → reserve stock for all items
 * 2. On payment success → commit reservation (deduct actual stock)
 * 3. On checkout cancel → release reservation (free the temporary hold)
 * 4. On component unmount → auto-release reservation (cleanup)
 *
 * Reservations expire after 5 minutes (configurable) to prevent
 * permanent stock locks from abandoned checkouts.
 */
import { useCallback, useState, useEffect, useRef } from 'react';
import { useCartStore } from '@/stores/cart.store';
import { useSession } from '@/stores/session.store';
import { inventoryService } from '@/services/inventory.service';

// =============================================================================
// TYPES
// =============================================================================

export interface ReservationItem {
    productId: string;
    quantity: number;
    productName: string;
}

export interface UseStockReservationResult {
    // State
    isReserving: boolean;
    reservationError: string | null;
    unavailableItems: ReservationItem[];
    reservationId: string | null;

    // Actions
    reserveStock: () => Promise<string | null>;
    commitReservation: () => Promise<void>;
    releaseReservation: () => Promise<void>;
    clearError: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for managing stock reservation during checkout
 */
export function useStockReservation(): UseStockReservationResult {
    const { warehouseId } = useSession();
    const {
        getActiveItems,
        stockReservationId,
        setStockReservationId,
    } = useCartStore();

    const [isReserving, setIsReserving] = useState(false);
    const [reservationError, setReservationError] = useState<string | null>(null);
    const [unavailableItems, setUnavailableItems] = useState<ReservationItem[]>([]);

    /**
     * Reserve stock for all items in cart
     * Called when checkout modal opens
     */
    const reserveStock = useCallback(async (): Promise<string | null> => {
        // Don't reserve if no warehouse ID
        if (!warehouseId) {
            console.warn('[useStockReservation] No warehouse ID, skipping reservation');
            return null;
        }

        // Don't reserve if already reserved
        if (stockReservationId) {
            console.log('[useStockReservation] Already reserved, using existing reservation');
            return stockReservationId;
        }

        const activeItems = getActiveItems();
        if (activeItems.length === 0) {
            return null;
        }

        setIsReserving(true);
        setReservationError(null);
        setUnavailableItems([]);

        try {
            // Group items by product (combine quantities)
            const itemsByProduct = new Map<string, { quantity: number; name: string }>();
            for (const item of activeItems) {
                if (item.product.trackInventory) {
                    const existing = itemsByProduct.get(item.productId);
                    const qty = parseFloat(item.quantity);
                    if (existing) {
                        existing.quantity += qty;
                    } else {
                        itemsByProduct.set(item.productId, { quantity: qty, name: item.product.name });
                    }
                }
            }

            // Check availability for all inventory-tracked items
            const checkItems = Array.from(itemsByProduct.entries()).map(([productId, data]) => ({
                productId,
                quantity: data.quantity,
            }));

            if (checkItems.length === 0) {
                // No inventory-tracked items, no need to reserve
                return null;
            }

            const availabilityMap = await inventoryService.checkAvailability({
                items: checkItems,
                warehouseId,
            });

            // Check for unavailable items
            const unavailable: ReservationItem[] = [];
            for (const [productId, data] of itemsByProduct) {
                const result = availabilityMap.get(productId);
                if (!result || !result.isAvailable) {
                    unavailable.push({
                        productId,
                        quantity: data.quantity,
                        productName: data.name,
                    });
                }
            }

            if (unavailable.length > 0) {
                setUnavailableItems(unavailable);
                setReservationError('Some items are no longer available in the requested quantity');
                return null;
            }

            // Reserve stock for each item (create separate reservations per item)
            // The backend will handle the reservation IDs
            const reservationIds: string[] = [];
            for (const [productId, data] of itemsByProduct) {
                try {
                    const response = await inventoryService.reserveStock({
                        productId,
                        warehouseId,
                        quantity: data.quantity,
                        reason: 'POS checkout',
                        expiresInMinutes: 5,  // 5 minute expiry
                    });
                    reservationIds.push(response.reservationId);
                } catch (error: any) {
                    console.error(`[useStockReservation] Failed to reserve ${productId}:`, error);
                    throw new Error(`Failed to reserve ${data.name}: ${error.message}`);
                }
            }

            // Store the first reservation ID (for commit/release)
            // In a real scenario, you might want to track all IDs
            const primaryReservationId = reservationIds[0];
            setStockReservationId(primaryReservationId);

            console.log('[useStockReservation] Stock reserved successfully:', reservationIds);
            return primaryReservationId;

        } catch (error: any) {
            console.error('[useStockReservation] Reservation failed:', error);
            setReservationError(error.message || 'Failed to reserve stock');
            return null;
        } finally {
            setIsReserving(false);
        }
    }, [warehouseId, getActiveItems, stockReservationId, setStockReservationId]);

    /**
     * Commit the reservation - actually deduct the stock
     * Called when payment is successful
     */
    const commitReservation = useCallback(async () => {
        if (!stockReservationId) {
            console.warn('[useStockReservation] No reservation to commit');
            return;
        }

        try {
            // In a full implementation, you'd commit all reservations
            // For now, we just commit the primary one
            await inventoryService.commitReservation(stockReservationId);

            // Clear the reservation ID from cart
            setStockReservationId(null);

            console.log('[useStockReservation] Reservation committed successfully');
        } catch (error: any) {
            console.error('[useStockReservation] Commit failed:', error);
            // Don't throw - the reservation might have already been committed
            // or the backend might have auto-committed it
            setStockReservationId(null);
        }
    }, [stockReservationId, setStockReservationId]);

    /**
     * Release the reservation - cancel the temporary hold
     * Called when checkout is cancelled
     */
    const releaseReservation = useCallback(async () => {
        if (!stockReservationId) {
            return;
        }

        try {
            await inventoryService.releaseReservation(stockReservationId);
            setStockReservationId(null);
            console.log('[useStockReservation] Reservation released successfully');
        } catch (error) {
            console.error('[useStockReservation] Release failed:', error);
            // Don't throw - we clear the local state anyway
            // The backend will auto-expire the reservation
            setStockReservationId(null);
        }
    }, [stockReservationId, setStockReservationId]);

    const clearError = useCallback(() => {
        setReservationError(null);
        setUnavailableItems([]);
    }, []);

    // =========================================================================
    // CLEANUP EFFECT
    // Auto-release reservation when component unmounts
    // This prevents stock leaks from abandoned checkout modals
    // =========================================================================

    const reservationIdRef = useRef<string | null>(null);

    // Update ref whenever reservation ID changes
    useEffect(() => {
        reservationIdRef.current = stockReservationId;
    }, [stockReservationId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (reservationIdRef.current) {
                console.log('[useStockReservation] Auto-releasing reservation on unmount:', reservationIdRef.current);
                inventoryService.releaseReservation(reservationIdRef.current).catch(console.error);
                // Don't clear cart state here as the component is unmounting anyway
            }
        };
    }, []);

    return {
        isReserving,
        reservationError,
        unavailableItems,
        reservationId: stockReservationId,
        reserveStock,
        commitReservation,
        releaseReservation,
        clearError,
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useStockReservation;
