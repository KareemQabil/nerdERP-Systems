import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge variants for order statuses
 * Following DESIGN_SYSTEM.md status colors
 */
const badgeVariants = cva(
    'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors',
    {
        variants: {
            variant: {
                // Order statuses
                pending: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
                preparing: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
                ready: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
                completed: 'bg-green-500/20 text-green-400 border border-green-500/30',
                void: 'bg-red-500/20 text-red-400 border border-red-500/30',

                // Payment statuses
                unpaid: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
                partial: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
                paid: 'bg-green-500/20 text-green-400 border border-green-500/30',
                refunded: 'bg-red-500/20 text-red-400 border border-red-500/30',

                // General statuses
                success: 'bg-green-500/20 text-green-400 border border-green-500/30',
                warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
                error: 'bg-red-500/20 text-red-400 border border-red-500/30',
                info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
                default: 'bg-[rgba(255,255,255,0.1)] text-[#e2e2e6] border border-[rgba(255,255,255,0.2)]',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

/**
 * Badge Component
 * For displaying order/payment statuses
 * 
 * @example
 * <Badge variant="pending">قيد الانتظار</Badge>
 * <Badge variant="completed">مكتمل</Badge>
 * <Badge variant="void">ملغي</Badge>
 */
function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
