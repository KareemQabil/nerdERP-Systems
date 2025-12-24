import { cn } from '@/lib/utils';
import { formatCurrency, DecimalUtil } from '@/lib/decimal';
import { useSettingsStore } from '@/stores/settings.store';

export interface PriceDisplayProps {
    /** Price value as string (for precision) */
    value: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Show currency symbol */
    showCurrency?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Strikethrough for original price */
    strikethrough?: boolean;
    /** Color variant */
    variant?: 'default' | 'primary' | 'muted';
}

/**
 * Price display component with proper formatting
 * Uses Inter font for numbers, LTR direction
 */
export function PriceDisplay({
    value,
    size = 'md',
    showCurrency = true,
    className,
    strikethrough = false,
    variant = 'default',
}: PriceDisplayProps) {
    const { language } = useSettingsStore();

    const sizeStyles = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-xl',
        xl: 'text-3xl',
    };

    const variantStyles = {
        default: cn(
            'text-white',
            'data-[theme=light]:text-slate-900',
        ),
        primary: cn(
            'text-cyan-400',
            'data-[theme=light]:text-cyan-600',
            'data-[theme=luxury]:text-amber-400',
        ),
        muted: cn(
            'text-slate-500',
            'data-[theme=light]:text-slate-400',
        ),
    };

    const formattedPrice = showCurrency
        ? formatCurrency(value, 'SAR', language === 'ar' ? 'ar-SA' : 'en-SA')
        : DecimalUtil.formatForDisplay(value);

    return (
        <span
            dir="ltr"
            className={cn(
                'font-inter font-bold tabular-nums',
                sizeStyles[size],
                variantStyles[variant],
                strikethrough && 'line-through opacity-60',
                className
            )}
        >
            {formattedPrice}
        </span>
    );
}

/** Price with discount showing original and discounted price */
export function DiscountedPrice({
    originalPrice,
    discountedPrice,
    size = 'md',
    className,
}: {
    originalPrice: string;
    discountedPrice: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}) {
    return (
        <div className={cn('flex items-center gap-2', className)}>
            <PriceDisplay value={discountedPrice} size={size} variant="primary" />
            <PriceDisplay value={originalPrice} size="sm" strikethrough variant="muted" />
        </div>
    );
}

/** Price breakdown for order summary */
export function PriceRow({
    label,
    value,
    variant = 'default',
    className,
}: {
    label: string;
    value: string;
    variant?: 'default' | 'primary' | 'muted' | 'total';
    className?: string;
}) {
    const isTotal = variant === 'total';

    return (
        <div className={cn(
            'flex items-center justify-between',
            isTotal && 'pt-3 mt-3 border-t border-slate-700 data-[theme=light]:border-slate-200',
            className
        )}>
            <span className={cn(
                isTotal ? 'text-base font-bold' : 'text-sm',
                'text-slate-400',
                'data-[theme=light]:text-slate-600',
                isTotal && 'text-white data-[theme=light]:text-slate-900',
            )}>
                {label}
            </span>
            <PriceDisplay
                value={value}
                size={isTotal ? 'lg' : 'md'}
                variant={isTotal ? 'primary' : variant === 'muted' ? 'muted' : 'default'}
            />
        </div>
    );
}
