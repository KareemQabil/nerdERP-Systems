import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Variant for different card styles */
    variant?: 'default' | 'glass' | 'elevated';
}

/**
 * Card Component
 * Base container for Product Cards and Summary Panels
 * Uses glassmorphism from DESIGN_SYSTEM.md
 * 
 * @example
 * <Card variant="glass">
 *   <CardContent>محتوى البطاقة</CardContent>
 * </Card>
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    // Base styles
                    'rounded-xl transition-all',
                    // Variants
                    {
                        // Default: Solid surface
                        'bg-gradient-to-br from-[#1a1c1e] to-[#2a2f35] border border-[rgba(255,255,255,0.1)]':
                            variant === 'default',
                        // Glass: Glassmorphism effect
                        'bg-[rgba(255,255,255,0.05)] backdrop-blur-md border border-[rgba(255,255,255,0.1)]':
                            variant === 'glass',
                        // Elevated: With shadow
                        'bg-gradient-to-br from-[#1a1c1e] to-[#2a2f35] border border-[rgba(255,255,255,0.1)] shadow-lg':
                            variant === 'elevated',
                    },
                    className
                )}
                {...props}
            />
        );
    }
);

Card.displayName = 'Card';

/**
 * Card Header
 */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn('flex flex-col space-y-1.5 p-6', className)}
            {...props}
        />
    )
);

CardHeader.displayName = 'CardHeader';

/**
 * Card Title
 */
const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3
            ref={ref}
            className={cn('text-xl font-bold leading-none tracking-tight text-[#e2e2e6]', className)}
            {...props}
        />
    )
);

CardTitle.displayName = 'CardTitle';

/**
 * Card Description
 */
const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn('text-sm text-[#c2c7ce]', className)}
        {...props}
    />
));

CardDescription.displayName = 'CardDescription';

/**
 * Card Content
 */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
    )
);

CardContent.displayName = 'CardContent';

/**
 * Card Footer
 */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn('flex items-center p-6 pt-0', className)}
            {...props}
        />
    )
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
