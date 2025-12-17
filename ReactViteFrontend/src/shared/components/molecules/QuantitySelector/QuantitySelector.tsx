import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/shared/components/atoms/Button';
import { cn } from '@/lib/utils';

export interface QuantitySelectorProps {
    /** Current quantity value */
    value: number;
    /** Minimum allowed value */
    min?: number;
    /** Maximum allowed value */
    max?: number;
    /** Increment callback */
    onIncrement: () => void;
    /** Decrement callback */
    onDecrement: () => void;
    /** Change callback (for direct input) */
    onChange?: (value: number) => void;
    /** Size variant */
    size?: 'sm' | 'default' | 'lg';
    /** Additional CSS classes */
    className?: string;
}

/**
 * QuantitySelector Molecule
 * CRITICAL for POS - Fast quantity adjustment
 * 
 * Features:
 * - Large touch targets (44px+)
 * - Prevents going below min (default 1)
 * - Visual feedback on disabled states
 * - Direct input support (optional)
 * 
 * @example
 * <QuantitySelector 
 *   value={quantity}
 *   onIncrement={() => setQuantity(q => q + 1)}
 *   onDecrement={() => setQuantity(q => Math.max(1, q - 1))}
 * />
 */
export function QuantitySelector({
    value,
    min = 1,
    max = 999,
    onIncrement,
    onDecrement,
    onChange,
    size = 'default',
    className,
}: QuantitySelectorProps) {
    const canDecrement = value > min;
    const canIncrement = value < max;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseInt(e.target.value, 10);
        if (!isNaN(newValue) && newValue >= min && newValue <= max && onChange) {
            onChange(newValue);
        }
    };

    const sizeClasses = {
        sm: { button: 'h-9 w-9', input: 'h-9 w-16 text-sm' },
        default: { button: 'h-11 w-11', input: 'h-11 w-20 text-base' },
        lg: { button: 'h-14 w-14', input: 'h-14 w-24 text-lg' },
    };

    const currentSize = sizeClasses[size];

    return (
        <div className={cn('flex items-center gap-2', className)}>
            {/* Decrement Button */}
            <Button
                variant="outline"
                size={size}
                className={cn(
                    currentSize.button,
                    'p-0 flex-shrink-0',
                    !canDecrement && 'opacity-50'
                )}
                onClick={onDecrement}
                disabled={!canDecrement}
            >
                <Minus className="h-4 w-4" />
            </Button>

            {/* Quantity Display/Input */}
            {onChange ? (
                // Editable input
                <input
                    type="number"
                    value={value}
                    onChange={handleInputChange}
                    min={min}
                    max={max}
                    className={cn(
                        currentSize.input,
                        'rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]',
                        'text-[#e2e2e6] text-center font-bold font-inter',
                        'focus:border-cyan-400 focus:outline-none transition-colors',
                        // Hide spinner arrows
                        '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                    )}
                />
            ) : (
                // Display only
                <div
                    className={cn(
                        currentSize.input,
                        'rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]',
                        'text-[#e2e2e6] text-center font-bold font-inter',
                        'flex items-center justify-center'
                    )}
                >
                    {value}
                </div>
            )}

            {/* Increment Button */}
            <Button
                variant="outline"
                size={size}
                className={cn(
                    currentSize.button,
                    'p-0 flex-shrink-0',
                    !canIncrement && 'opacity-50'
                )}
                onClick={onIncrement}
                disabled={!canIncrement}
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    );
}
