import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings.store';
import { useTranslation } from '@/hooks/useTranslation';
import type { OrderStatus, AllowedTransition } from '@/types/pos.types';

/**
 * =============================================================================
 * ORDER STATUS STEPPER COMPONENT
 * =============================================================================
 *
 * Visual stepper component for displaying order state progress.
 * Shows current state, allowed transitions, and action buttons.
 *
 * Features:
 * - Visual timeline with icons and labels
 * - Clickable state transitions (if allowed)
 * - Manager approval indicators
 * - Bilingual support (English/Arabic)
 * - Animated state changes
 *
 * @example
 * <OrderStatusStepper
 *   orderId="order-123"
 *   currentStatus="SAVED"
 *   allowedTransitions={[...]}
 *   onTransitionClick={(toState) => handleTransition(toState)}
 * />
 */

interface OrderStatusStepperProps {
    orderId: string;
    currentStatus: OrderStatus;
    allowedTransitions: AllowedTransition[];
    onTransitionClick?: (toState: OrderStatus) => void;
    compact?: boolean;
    showLabels?: boolean;
    orientation?: 'horizontal' | 'vertical';
    disabled?: boolean;
}

/**
 * State step configuration with icons, colors, and labels
 */
const STATUS_STEPS: Record<OrderStatus, {
    icon: string;
    label: string;
    labelAr: string;
    description: string;
    color: string;
    bgColor: string;
    category: 'initial' | 'kitchen' | 'payment' | 'delivery' | 'final';
}> = {
    // Initial states
    DRAFT: {
        icon: '📝',
        label: 'Draft',
        labelAr: 'مسودة',
        description: 'Items being added',
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/20',
        category: 'initial',
    },
    SAVED: {
        icon: '💾',
        label: 'Saved',
        labelAr: 'محفوظة',
        description: 'Order saved, not paid',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        category: 'initial',
    },

    // Kitchen workflow
    FIRED_TO_KITCHEN: {
        icon: '🔥',
        label: 'Sent to Kitchen',
        labelAr: 'أرسلت للمطبخ',
        description: 'Order sent to kitchen',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        category: 'kitchen',
    },
    PREPARING: {
        icon: '👨‍🍳',
        label: 'Preparing',
        labelAr: 'قيد التحضير',
        description: 'Kitchen is preparing',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        category: 'kitchen',
    },
    READY: {
        icon: '✅',
        label: 'Ready',
        labelAr: 'جاهز',
        description: 'Order ready for service',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        category: 'kitchen',
    },
    SERVED: {
        icon: '🍽️',
        label: 'Served',
        labelAr: 'مقدمة',
        description: 'Order has been served',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20',
        category: 'kitchen',
    },

    // Payment workflow
    PAYMENT_PENDING: {
        icon: '💳',
        label: 'Payment Pending',
        labelAr: 'بانتظار الدفع',
        description: 'Awaiting payment',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/20',
        category: 'payment',
    },
    PAYMENT_PROCESSING: {
        icon: '⏳',
        label: 'Processing',
        labelAr: 'جاري المعالجة',
        description: 'Payment being processed',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/20',
        category: 'payment',
    },
    PAID: {
        icon: '✓',
        label: 'Paid',
        labelAr: 'مدفوع',
        description: 'Payment received',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        category: 'payment',
    },
    PARTIALLY_PAID: {
        icon: '💰',
        label: 'Partial Payment',
        labelAr: 'دفع جزئي',
        description: 'Partial payment received',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/20',
        category: 'payment',
    },

    // Delivery workflow
    OUT_FOR_DELIVERY: {
        icon: '🚗',
        label: 'Out for Delivery',
        labelAr: 'خارج للتوصيل',
        description: 'Driver en route',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        category: 'delivery',
    },
    AWAITING_PICKUP: {
        icon: '📦',
        label: 'Awaiting Pickup',
        labelAr: 'بانتظار الاستلام',
        description: 'Ready for pickup',
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/20',
        category: 'delivery',
    },

    // Aggregator workflow
    RECEIVED_FROM_AGGREGATOR: {
        icon: '📱',
        label: 'Aggregator Order',
        labelAr: 'طلب من منصة',
        description: 'Received from Talabat/Marsool',
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/20',
        category: 'initial',
    },

    // Void & Return workflow
    VOID_REQUESTED: {
        icon: '⚠️',
        label: 'Void Requested',
        labelAr: 'طلب إلغاء',
        description: 'Awaiting manager approval',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        category: 'final',
    },
    VOID_APPROVED: {
        icon: '🚫',
        label: 'Void Approved',
        labelAr: 'موافقة على الإلغاء',
        description: 'Void approved, executing',
        color: 'text-red-500',
        bgColor: 'bg-red-500/30',
        category: 'final',
    },
    RETURN_REQUESTED: {
        icon: '🔄',
        label: 'Return Requested',
        labelAr: 'طلب استرجاع',
        description: 'Return awaiting approval',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        category: 'final',
    },
    RETURN_APPROVED: {
        icon: '✓',
        label: 'Return Approved',
        labelAr: 'موافقة على الاسترجاع',
        description: 'Return approved, processing',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/30',
        category: 'final',
    },
    REFUNDED: {
        icon: '💸',
        label: 'Refunded',
        labelAr: 'مسترد',
        description: 'Order refunded',
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/20',
        category: 'final',
    },

    // Final states
    COMPLETED: {
        icon: '✓',
        label: 'Completed',
        labelAr: 'مكتملة',
        description: 'Order completed',
        color: 'text-green-500',
        bgColor: 'bg-green-500/30',
        category: 'final',
    },
    VOID: {
        icon: '✕',
        label: 'Void',
        labelAr: 'ملغاة',
        description: 'Order cancelled',
        color: 'text-red-500',
        bgColor: 'bg-red-500/30',
        category: 'final',
    },

    // Legacy (for backward compatibility)
    ACTIVE: {
        icon: '🔥',
        label: 'Active',
        labelAr: 'نشط',
        description: 'Order active',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        category: 'kitchen',
    },
    VOIDED: {
        icon: '✕',
        label: 'Voided',
        labelAr: 'ملغاة',
        description: 'Order cancelled',
        color: 'text-red-500',
        bgColor: 'bg-red-500/30',
        category: 'final',
    },
    HELD: {
        icon: '⏸️',
        label: 'Held',
        labelAr: 'معلقة',
        description: 'Order parked',
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/20',
        category: 'initial',
    },
};

/**
 * Get workflow steps for order type
 */
function getWorkflowSteps(orderType: string): OrderStatus[] {
    switch (orderType) {
        case 'DINE_IN':
            return [
                'DRAFT',
                'SAVED',
                'FIRED_TO_KITCHEN',
                'PREPARING',
                'READY',
                'SERVED',
                'PAYMENT_PENDING',
                'PAID',
                'COMPLETED',
            ];
        case 'TAKEAWAY':
            return [
                'DRAFT',
                'PAID',
                'FIRED_TO_KITCHEN',
                'PREPARING',
                'READY',
                'AWAITING_PICKUP',
                'COMPLETED',
            ];
        case 'DELIVERY':
            return [
                'DRAFT',
                'SAVED',
                'PAID',
                'FIRED_TO_KITCHEN',
                'PREPARING',
                'READY',
                'OUT_FOR_DELIVERY',
                'COMPLETED',
            ];
        default:
            return [
                'DRAFT',
                'SAVED',
                'FIRED_TO_KITCHEN',
                'PREPARING',
                'READY',
                'PAID',
                'COMPLETED',
            ];
    }
}

/**
 * Order Status Stepper Component
 */
export function OrderStatusStepper({
    orderId,
    currentStatus,
    allowedTransitions,
    onTransitionClick,
    compact = false,
    showLabels = true,
    orientation = 'horizontal',
    disabled = false,
}: OrderStatusStepperProps) {
    const { language, theme } = useSettingsStore();
    const { t } = useTranslation();
    const [hoveredState, setHoveredState] = useState<OrderStatus | null>(null);

    // Get workflow steps (default to dine-in)
    const workflowSteps = getWorkflowSteps('DINE_IN');
    const currentIndex = workflowSteps.indexOf(currentStatus);

    const isVertical = orientation === 'vertical';

    return (
        <div className={cn(
            'relative',
            isVertical ? 'py-2' : 'px-4',
        )} data-theme={theme}>
            <div className={cn(
                'flex gap-1',
                isVertical ? 'flex-col' : 'items-center',
            )}>
                <AnimatePresence mode="wait">
                    {workflowSteps.map((status, index) => {
                        const stepConfig = STATUS_STEPS[status];
                        const isCompleted = index < currentIndex;
                        const isCurrent = index === currentIndex;
                        const isAllowed = allowedTransitions.some(t => t.state === status);
                        const isClickable = !disabled && isAllowed && onTransitionClick;

                        const label = language === 'ar' ? stepConfig.labelAr : stepConfig.label;

                        return (
                            <motion.div
                                key={status}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                    'relative flex flex-col',
                                    isVertical ? 'flex-row items-center gap-3 mb-3 w-full' : 'items-center',
                                )}
                                onMouseEnter={() => setHoveredState(status)}
                                onMouseLeave={() => setHoveredState(null)}
                            >
                                {/* State indicator */}
                                <div
                                    className={cn(
                                        'relative z-10 flex items-center justify-center',
                                        'w-8 h-8 rounded-full border-2 transition-all duration-300',
                                        isCurrent
                                            ? cn(stepConfig.bgColor, stepConfig.color, 'border-current scale-110 shadow-lg')
                                            : isCompleted
                                                ? 'bg-green-500/30 border-green-500 text-green-400'
                                                : 'bg-slate-500/10 border-slate-500/30 text-slate-500',
                                        isClickable && 'cursor-pointer hover:scale-110 hover:shadow-md',
                                        !compact && 'w-10 h-10',
                                    )}
                                    onClick={() => isClickable && onTransitionClick(status)}
                                >
                                    <span className={cn(
                                        'text-sm',
                                        !compact && 'text-base',
                                    )}>
                                        {isCompleted && !isCurrent ? '✓' : stepConfig.icon}
                                    </span>

                                    {/* Pulsing indicator for current state */}
                                    {isCurrent && (
                                        <motion.span
                                            animate={{ scale: [1, 1.3, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className={cn(
                                                'absolute inset-0 rounded-full opacity-50',
                                                stepConfig.bgColor,
                                            )}
                                        />
                                    )}

                                    {/* Approval required indicator */}
                                    {isAllowed && !isClickable && (
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 text-[8px] items-center justify-center text-white font-bold">
                                                !
                                            </span>
                                        </span>
                                    )}
                                </div>

                                {/* Labels */}
                                {showLabels && !compact && (
                                    <div className={cn(
                                        'flex flex-col',
                                        isVertical ? 'ml-3 min-w-[120px]' : 'mt-2 text-center',
                                    )}>
                                        <span className={cn(
                                            'text-xs font-medium whitespace-nowrap',
                                            isCurrent ? stepConfig.color : 'text-slate-500',
                                            isClickable && 'underline decoration-dotted underline-offset-2',
                                        )}>
                                            {label}
                                        </span>
                                        {isCurrent && (
                                            <span className={cn(
                                                'text-[10px]',
                                                stepConfig.color.replace('text-', 'text-opacity-75 ') || 'text-slate-500',
                                            )}>
                                                {stepConfig.description}
                                            </span>
                                        )}
                                        {isAllowed && !isCurrent && (
                                            <span className="text-[10px] text-amber-400">
                                                Click to {label.toLowerCase()}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Connector line (except last item in horizontal) */}
                                {!isVertical && index < workflowSteps.length - 1 && (
                                    <div
                                        className={cn(
                                            'flex-1 h-0.5 min-w-[20px] mx-1 transition-colors duration-300',
                                            index < currentIndex
                                                ? 'bg-green-500/50'
                                                : 'bg-slate-500/20',
                                        )}
                                    />
                                )}

                                {/* Tooltip on hover */}
                                {hoveredState === status && !showLabels && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            'absolute z-50 px-2 py-1 rounded-md text-xs whitespace-nowrap',
                                            'bg-slate-900 text-white',
                                            stepConfig.bgColor,
                                            isVertical
                                                ? 'left-full ml-2 top-1/2 -translate-y-1/2'
                                                : 'top-full mt-2 left-1/2 -translate-x-1/2',
                                        )}
                                    >
                                        <div className="font-medium">{label}</div>
                                        <div className="opacity-75">{stepConfig.description}</div>
                                        {isAllowed && !isCurrent && (
                                            <div className="mt-1 text-amber-400">
                                                {t('common.clickToTransition', 'Click to transition')}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Action buttons for allowed transitions */}
            {!compact && allowedTransitions.length > 0 && (
                <div className={cn(
                    'mt-4 pt-4 border-t flex flex-wrap gap-2',
                    'border-slate-500/20',
                )}>
                    {allowedTransitions.map((transition) => {
                        const config = STATUS_STEPS[transition.state];
                        const label = language === 'ar' ? transition.labelAr : transition.label;

                        return (
                            <motion.button
                                key={transition.state}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={disabled}
                                onClick={() => onTransitionClick?.(transition.state)}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                                    'border transition-all duration-200',
                                    disabled
                                        ? 'opacity-50 cursor-not-allowed bg-slate-500/10 border-slate-500/20 text-slate-500'
                                        : cn(
                                            config.bgColor,
                                            config.color,
                                            'border-current',
                                            'hover:shadow-md cursor-pointer',
                                        ),
                                )}
                            >
                                <span>{config.icon}</span>
                                <span className="text-sm font-medium">
                                    {label}
                                </span>
                                {transition.requiresApproval && (
                                    <span className="text-amber-400" title="Requires manager approval">
                                        🔐
                                    </span>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/**
 * Compact Order Status Badge
 * Simplified version for use in tables/lists
 */
interface OrderStatusBadgeProps {
    status: OrderStatus;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
    animate?: boolean;
}

export function OrderStatusBadge({
    status,
    size = 'sm',
    showIcon = true,
    animate = true,
}: OrderStatusBadgeProps) {
    const { language, theme } = useSettingsStore();
    const config = STATUS_STEPS[status];
    const label = language === 'ar' ? config.labelAr : config.label;

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
    };

    return (
        <motion.div
            initial={animate ? { scale: 0.9, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            data-theme={theme}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border',
                sizeClasses[size],
                config.bgColor,
                config.color,
                'border-current/30',
            )}
        >
            {showIcon && <span>{config.icon}</span>}
            <span className="font-medium capitalize">{label}</span>
        </motion.div>
    );
}

/**
 * Order Status Timeline
 * Vertical timeline showing order history
 */
interface OrderStatusTimelineProps {
    currentStatus: OrderStatus;
    orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
    history?: Array<{
        status: OrderStatus;
        timestamp: Date;
        userName?: string;
    }>;
}

export function OrderStatusTimeline({
    currentStatus,
    orderType,
    history = [],
}: OrderStatusTimelineProps) {
    const { language, theme } = useSettingsStore();
    const workflowSteps = getWorkflowSteps(orderType);
    const currentIndex = workflowSteps.indexOf(currentStatus);

    return (
        <div className="relative py-4" data-theme={theme}>
            {/* Vertical line */}
            <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-500/20" />

            {workflowSteps.map((status, index) => {
                const config = STATUS_STEPS[status];
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const label = language === 'ar' ? config.labelAr : config.label;

                // Find history entry for this status
                const historyEntry = history.find(h => h.status === status);

                return (
                    <div key={status} className="relative flex items-start gap-4 mb-6 last:mb-0">
                        {/* Status dot */}
                        <div className={cn(
                            'relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0',
                            isCurrent
                                ? cn(config.bgColor, config.color, 'border-current')
                                : isCompleted
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'bg-slate-500/10 border-slate-500/30 text-slate-500',
                        )}>
                            {isCompleted && !isCurrent ? '✓' : config.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className={cn(
                                    'font-medium',
                                    isCurrent ? config.color : 'text-slate-700',
                                )}>
                                    {label}
                                </span>
                                {historyEntry && (
                                    <span className="text-xs text-slate-500">
                                        {new Date(historyEntry.timestamp).toLocaleTimeString()}
                                    </span>
                                )}
                            </div>
                            <p className={cn(
                                'text-sm',
                                isCurrent ? config.color.replace('text-', 'text-opacity-75 ') : 'text-slate-500',
                            )}>
                                {config.description}
                            </p>
                            {historyEntry?.userName && (
                                <p className="text-xs text-slate-500 mt-1">
                                    by {historyEntry.userName}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default OrderStatusStepper;
