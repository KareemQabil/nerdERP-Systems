import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings.store';
import type { KitchenStatus } from '@/types/pos.types';

interface KitchenStatusBadgeProps {
    status: KitchenStatus;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    animate?: boolean;
    estimatedMinutes?: number;
}

const STATUS_CONFIG: Record<KitchenStatus, {
    icon: string;
    label: string;
    labelAr: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    pulseColor?: string;
}> = {
    PENDING: {
        icon: '⏳',
        label: 'Pending',
        labelAr: 'قيد الانتظار',
        bgColor: 'bg-slate-500/20',
        textColor: 'text-slate-400',
        borderColor: 'border-slate-500/30',
    },
    FIRED: {
        icon: '🔥',
        label: 'Sent to Kitchen',
        labelAr: 'تم الإرسال',
        bgColor: 'bg-orange-500/20',
        textColor: 'text-orange-400',
        borderColor: 'border-orange-500/30',
        pulseColor: 'animate-pulse',
    },
    PREPARING: {
        icon: '🍳',
        label: 'Preparing',
        labelAr: 'قيد التحضير',
        bgColor: 'bg-yellow-500/20',
        textColor: 'text-yellow-400',
        borderColor: 'border-yellow-500/30',
        pulseColor: 'animate-pulse',
    },
    READY: {
        icon: '✅',
        label: 'Ready',
        labelAr: 'جاهز',
        bgColor: 'bg-green-500/20',
        textColor: 'text-green-400',
        borderColor: 'border-green-500/30',
    },
    SERVED: {
        icon: '✓',
        label: 'Served',
        labelAr: 'تم التقديم',
        bgColor: 'bg-slate-500/10',
        textColor: 'text-slate-500',
        borderColor: 'border-slate-500/20',
    },
};

const SIZE_CONFIG = {
    sm: {
        wrapper: 'px-1.5 py-0.5 text-xs gap-1',
        icon: 'text-xs',
    },
    md: {
        wrapper: 'px-2 py-1 text-sm gap-1.5',
        icon: 'text-sm',
    },
    lg: {
        wrapper: 'px-3 py-1.5 text-base gap-2',
        icon: 'text-base',
    },
};

/**
 * Kitchen Status Badge Component
 * Displays the current kitchen status of an order item with icons, labels, and animations
 */
export function KitchenStatusBadge({
    status,
    showLabel = true,
    size = 'sm',
    animate = true,
    estimatedMinutes,
}: KitchenStatusBadgeProps) {
    const { language, theme } = useSettingsStore();
    const config = STATUS_CONFIG[status];
    const sizeConfig = SIZE_CONFIG[size];

    const label = language === 'ar' ? config.labelAr : config.label;

    return (
        <motion.div
            initial={animate ? { scale: 0.9, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            data-theme={theme}
            className={cn(
                'inline-flex items-center rounded-full border',
                config.bgColor,
                config.textColor,
                config.borderColor,
                sizeConfig.wrapper,
                config.pulseColor && animate && config.pulseColor,
                // Light theme adjustments
                theme === 'light' && 'border-opacity-50',
            )}
        >
            <span className={sizeConfig.icon}>{config.icon}</span>

            {showLabel && (
                <span className="font-medium capitalize">
                    {label}
                </span>
            )}

            {estimatedMinutes !== undefined && status === 'PREPARING' && (
                <span className="opacity-75">
                    ({estimatedMinutes}m)
                </span>
            )}
        </motion.div>
    );
}

/**
 * Kitchen Status Progress Bar
 * Visual timeline of order status through kitchen
 */
interface KitchenStatusProgressProps {
    currentStatus: KitchenStatus;
    showLabels?: boolean;
}

const PROGRESS_STAGES: KitchenStatus[] = ['PENDING', 'FIRED', 'PREPARING', 'READY', 'SERVED'];

export function KitchenStatusProgress({ currentStatus, showLabels = false }: KitchenStatusProgressProps) {
    const { language, theme } = useSettingsStore();
    const currentIndex = PROGRESS_STAGES.indexOf(currentStatus);

    return (
        <div className="flex items-center gap-1" data-theme={theme}>
            {PROGRESS_STAGES.map((stage, index) => {
                const config = STATUS_CONFIG[stage];
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const label = language === 'ar' ? config.labelAr : config.label;

                return (
                    <React.Fragment key={stage}>
                        <div className="flex flex-col items-center">
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: isCurrent ? 1.2 : 1,
                                    opacity: isCompleted || isCurrent ? 1 : 0.4,
                                }}
                                className={cn(
                                    'w-6 h-6 rounded-full flex items-center justify-center text-xs',
                                    isCompleted ? 'bg-green-500/30 text-green-400' :
                                        isCurrent ? cn(config.bgColor, config.textColor) :
                                            'bg-slate-500/10 text-slate-500',
                                )}
                            >
                                {isCompleted ? '✓' : config.icon}
                            </motion.div>

                            {showLabels && (
                                <span className={cn(
                                    'text-[10px] mt-1 text-center max-w-[50px] truncate',
                                    isCurrent ? config.textColor : 'text-slate-500',
                                )}>
                                    {label}
                                </span>
                            )}
                        </div>

                        {/* Connector line (except after last item) */}
                        {index < PROGRESS_STAGES.length - 1 && (
                            <div
                                className={cn(
                                    'flex-1 h-0.5 min-w-[20px]',
                                    index < currentIndex ? 'bg-green-500/50' : 'bg-slate-500/20',
                                )}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

export default KitchenStatusBadge;
