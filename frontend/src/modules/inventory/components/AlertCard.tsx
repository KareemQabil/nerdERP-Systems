/**
 * AlertCard Component
 *
 * Individual alert card with actions
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Package,
    TrendingDown,
    MoreVertical,
    Check,
    X,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { cn } from '@/lib/utils';
import type { StockAlert } from '@/services/inventory.service';

// =============================================================================
// TYPES
// =============================================================================

interface AlertCardProps {
    alert: StockAlert;
    onAcknowledge?: (alertId: string) => Promise<void>;
    onResolve?: (alertId: string) => Promise<void>;
}

// =============================================================================
// ALERT TYPE CONFIG
// =============================================================================

const ALERT_TYPE_CONFIG: Record<string, { label: string; labelAr: string; icon: any; color: string; bgColor: string }> = {
    LOW_STOCK: {
        label: 'Low Stock',
        labelAr: 'مخزون منخفض',
        icon: TrendingDown,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20 border-yellow-500/30',
    },
    OUT_OF_STOCK: {
        label: 'Out of Stock',
        labelAr: 'نفذ المخزون',
        icon: XCircle,
        color: 'text-red-400',
        bgColor: 'bg-red-500/20 border-red-500/30',
    },
    EXPIRING_SOON: {
        label: 'Expiring Soon',
        labelAr: 'ينتهي قريباً',
        icon: Clock,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20 border-orange-500/30',
    },
    EXPIRED: {
        label: 'Expired',
        labelAr: 'منتهي الصلاحية',
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-600/20 border-red-600/30',
    },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function AlertCard({ alert, onAcknowledge, onResolve }: AlertCardProps) {
    const { language } = useSettingsStore();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const config = ALERT_TYPE_CONFIG[alert.alertType] || ALERT_TYPE_CONFIG.LOW_STOCK;
    const Icon = config.icon;

    const handleAcknowledge = async () => {
        if (!onAcknowledge || isProcessing) return;
        setIsProcessing(true);
        try {
            await onAcknowledge(alert.id);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleResolve = async () => {
        if (!onResolve || isProcessing) return;
        setIsProcessing(true);
        try {
            await onResolve(alert.id);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            className={cn(
                'rounded-xl border-2 overflow-hidden transition-all',
                config.bgColor,
                'border-current',
                alert.isAcknowledged && 'opacity-60',
                alert.isResolved && 'opacity-40',
            )}
        >
            {/* Header */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                        {/* Icon */}
                        <div className={cn('p-2 rounded-lg', config.bgColor)}>
                            <Icon className={cn('w-5 h-5', config.color)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium truncate">
                                {alert.productName || 'Unknown Product'}
                            </h4>
                            <p className={cn('text-sm mt-1', config.color)}>
                                {language === 'ar' ? config.labelAr : config.label}
                            </p>

                            {/* Details */}
                            <div className="mt-2 space-y-1 text-xs text-slate-400">
                                <div className="flex items-center gap-2">
                                    <Package className="w-3 h-3" />
                                    <span>
                                        {language === 'ar' ? 'الكمية الحالية: ' : 'Current: '}
                                        <span className="font-mono text-white">{alert.currentQty}</span>
                                    </span>
                                </div>
                                {alert.threshold && (
                                    <div className="flex items-center gap-2">
                                        <TrendingDown className="w-3 h-3" />
                                        <span>
                                            {language === 'ar' ? 'الحد الأدنى: ' : 'Threshold: '}
                                            <span className="font-mono text-white">{alert.threshold}</span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status Badge */}
                    {alert.isResolved ? (
                        <div className="px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </div>
                    ) : alert.isAcknowledged ? (
                        <div className="px-2 py-1 rounded-full bg-blue-500/20 border border-blue-500/30">
                            <Check className="w-4 h-4 text-blue-400" />
                        </div>
                    ) : (
                        <div className="px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                        </div>
                    )}
                </div>

                {/* Timestamp */}
                <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(alert.createdAt).toLocaleString()}
                </div>
            </div>

            {/* Actions (shown on hover or when expanded) */}
            <motion.div
                initial={false}
                animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                className="overflow-hidden border-t border-current/20"
            >
                <div className="p-3 flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                        {!alert.isAcknowledged && onAcknowledge && (
                            <button
                                onClick={handleAcknowledge}
                                disabled={isProcessing}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors',
                                    'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',
                                    'disabled:opacity-50 disabled:cursor-not-allowed',
                                )}
                            >
                                <Check className="w-4 h-4" />
                                {language === 'ar' ? 'اعتراف' : 'Acknowledge'}
                            </button>
                        )}
                        {!alert.isResolved && onResolve && (
                            <button
                                onClick={handleResolve}
                                disabled={isProcessing}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors',
                                    'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30',
                                    'disabled:opacity-50 disabled:cursor-not-allowed',
                                )}
                            >
                                <CheckCircle className="w-4 h-4" />
                                {language === 'ar' ? 'حل' : 'Resolve'}
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
            </motion.div>

            {/* Expand Button */}
            {!isExpanded && !alert.isResolved && (
                <div className="px-4 pb-3">
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        {language === 'ar' ? 'عرض الإجراءات' : 'Show actions'}
                    </button>
                </div>
            )}
        </motion.div>
    );
}

export default AlertCard;
