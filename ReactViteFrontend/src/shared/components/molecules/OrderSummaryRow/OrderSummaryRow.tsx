import * as React from 'react';
import { cn } from '@/lib/utils';

export interface OrderSummaryRowProps {
    /** Label (e.g., "Subtotal", "Tax", "Total") */
    label: string;
    /** Value (price) */
    value: number | string;
    /** Currency */
    currency?: string;
    /** Variant */
    variant?: 'default' | 'highlight';
    /** Additional CSS classes */
    className?: string;
}

/**
 * OrderSummaryRow Molecule
 * Displays label-value pair for order totals
 * 
 * Layout: [Label (left)] .............. [Value (right)]
 * 
 * Variants:
 * - default: Subtotal, Tax (normal size)
 * - highlight: Total (larger, bold)
 * 
 * @example
 * <OrderSummaryRow label="المجموع الفرعي" value="100.000" />
 * <OrderSummaryRow label="الضريبة (15%)" value="15.000" />
 * <OrderSummaryRow label="الإجمالي" value="115.000" variant="highlight" />
 */
export function OrderSummaryRow({
    label,
    value,
    currency = 'SAR',
    variant = 'default',
    className,
}: OrderSummaryRowProps) {
    const isHighlight = variant === 'highlight';

    return (
        <div
            className={cn(
                'flex items-center justify-between py-2',
                isHighlight && 'pt-3 border-t border-[rgba(255,255,255,0.1)]',
                className
            )}
        >
            {/* Label */}
            <span
                className={cn(
                    'text-[#c2c7ce]',
                    isHighlight ? 'text-lg font-bold text-[#e2e2e6]' : 'text-base'
                )}
            >
                {label}
            </span>

            {/* Value */}
            <div className="flex items-baseline gap-2">
                <span
                    className={cn(
                        'font-bold font-inter text-cyan-400',
                        isHighlight ? 'text-2xl' : 'text-lg'
                    )}
                >
                    {typeof value === 'number' ? value.toFixed(2) : value}
                </span>
                <span
                    className={cn(
                        'font-inter text-[#c2c7ce]',
                        isHighlight ? 'text-sm' : 'text-xs'
                    )}
                >
                    {currency}
                </span>
            </div>
        </div>
    );
}
