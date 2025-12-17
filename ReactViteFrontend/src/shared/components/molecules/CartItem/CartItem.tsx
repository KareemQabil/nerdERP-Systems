import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/atoms/Button';
import { QuantitySelector } from '../QuantitySelector/QuantitySelector';
import { cn } from '@/lib/utils';

export interface CartItemProps {
    /** Product name */
    name: string;
    /** Quantity */
    quantity: number;
    /** Line total price */
    price: number | string;
    /** Currency */
    currency?: string;
    /** Selected modifiers (e.g., ["Extra Cheese +5.00", "Large Size"]) */
    modifiers?: string[];
    /** Remove item callback */
    onRemove: () => void;
    /** Increment quantity */
    onIncrement: () => void;
    /** Decrement quantity */
    onDecrement: () => void;
    /** Additional CSS classes */
    className?: string;
}

/**
 * CartItem Molecule
 * Row displayed in sidebar cart
 * 
 * Layout: [Qty Selector] [Name + Modifiers] [Price] [Delete]
 * 
 * Features:
 * - Compact layout for cart sidebar
 * - Shows modifiers below name
 * - Touch-friendly delete button (44px)
 * - Name truncation with ellipsis
 * 
 * @example
 * <CartItem 
 *   name="كابتشينو كبير"
 *   quantity={2}
 *   price="50.000"
 *   modifiers={["حجم كبير", "سكر إضافي +2.00"]}
 *   onRemove={() => removeItem(id)}
 *   onIncrement={() => updateQty(q + 1)}
 *   onDecrement={() => updateQty(q - 1)}
 * />
 */
export function CartItem({
    name,
    quantity,
    price,
    currency = 'SAR',
    modifiers,
    onRemove,
    onIncrement,
    onDecrement,
    className,
}: CartItemProps) {
    return (
        <div
            className={cn(
                'flex items-start gap-3 p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]',
                'hover:border-[rgba(255,255,255,0.1)] transition-colors',
                className
            )}
        >
            {/* Quantity Selector */}
            <div className="flex-shrink-0">
                <QuantitySelector
                    value={quantity}
                    onIncrement={onIncrement}
                    onDecrement={onDecrement}
                    size="sm"
                />
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0 space-y-1">
                {/* Product Name */}
                <h4 className="text-sm font-bold text-[#e2e2e6] line-clamp-2">
                    {name}
                </h4>

                {/* Modifiers */}
                {modifiers && modifiers.length > 0 && (
                    <div className="space-y-0.5">
                        {modifiers.map((modifier, index) => (
                            <p
                                key={index}
                                className="text-xs text-[#c2c7ce] truncate"
                                title={modifier}
                            >
                                + {modifier}
                            </p>
                        ))}
                    </div>
                )}
            </div>

            {/* Price & Delete */}
            <div className="flex-shrink-0 flex flex-col items-end gap-2">
                {/* Price */}
                <div className="text-right">
                    <p className="text-base font-bold text-cyan-400 font-inter">
                        {typeof price === 'number' ? price.toFixed(2) : price}
                    </p>
                    <p className="text-xs text-[#c2c7ce] font-inter">{currency}</p>
                </div>

                {/* Delete Button - Touch-friendly (44px) */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-11 w-11 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={onRemove}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
