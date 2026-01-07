/**
 * SyncStatusIndicator Component
 *
 * Visual indicator for offline/sync status in POS and other modules
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wifi,
    WifiOff,
    RefreshCw,
    Cloud,
    CloudOff,
    AlertCircle,
    CheckCircle,
    X,
    Database,
    Clock,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { usePOSOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface SyncStatusIndicatorProps {
    position?: 'header' | 'corner' | 'inline';
    showPendingCount?: boolean;
    showLastSync?: boolean;
    compact?: boolean;
}

// =============================================================================
// STATUS CONFIG
// =============================================================================

const STATUS_CONFIG = {
    online: {
        icon: Wifi,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20',
        borderColor: 'border-emerald-500/30',
        label: 'Online',
        labelAr: 'متصل',
    },
    offline: {
        icon: WifiOff,
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/20',
        borderColor: 'border-slate-500/30',
        label: 'Offline',
        labelAr: 'غير متصل',
    },
    syncing: {
        icon: RefreshCw,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30',
        label: 'Syncing...',
        labelAr: 'جاري المزامنة...',
    },
    error: {
        icon: AlertCircle,
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        label: 'Sync Error',
        labelAr: 'خطأ في المزامنة',
    },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function SyncStatusIndicator({
    position = 'corner',
    showPendingCount = true,
    showLastSync = true,
    compact = false,
}: SyncStatusIndicatorProps) {
    const { language } = useSettingsStore();
    const {
        status,
        isOnline,
        pendingOrders,
        lastSyncAt,
        lastError,
        canSync,
        syncNow,
        clearCache,
    } = usePOSOfflineSync();

    const [showDetails, setShowDetails] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const config = STATUS_CONFIG[status];
    const StatusIcon = config.icon;

    const handleSync = async () => {
        if (!canSync || isSyncing) return;

        setIsSyncing(true);
        try {
            await syncNow();
        } catch (error) {
            console.error('[SyncStatusIndicator] Sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    // Compact inline version
    if (compact) {
        return (
            <div className={cn('flex items-center gap-2', config.color)}>
                <StatusIcon className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
                <span className="text-sm font-medium">
                    {language === 'ar' ? config.labelAr : config.label}
                </span>
                {pendingOrders > 0 && (
                    <span className="text-xs text-slate-400">
                        ({pendingOrders} {language === 'ar' ? 'قيد الانتظار' : 'pending'})
                    </span>
                )}
            </div>
        );
    }

    // Corner floating version
    if (position === 'corner') {
        return (
            <div className="fixed bottom-4 right-4 z-40">
                <AnimatePresence>
                    {showDetails ? (
                        <SyncDetailsPanel
                            status={status}
                            pendingOrders={pendingOrders}
                            lastSyncAt={lastSyncAt}
                            lastError={lastError}
                            isSyncing={isSyncing}
                            canSync={canSync}
                            language={language}
                            onSync={handleSync}
                            onClearCache={clearCache}
                            onClose={() => setShowDetails(false)}
                        />
                    ) : (
                        <motion.button
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={() => setShowDetails(true)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-xl border-2 shadow-lg',
                                'backdrop-blur-sm transition-all hover:scale-105',
                                config.bgColor,
                                config.borderColor,
                                'border-current'
                            )}
                        >
                            <StatusIcon className={cn('w-5 h-5', isSyncing && 'animate-spin')} />
                            {!isOnline && pendingOrders > 0 && (
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                                    {pendingOrders}
                                </span>
                            )}
                            <span className={cn('text-sm font-bold', config.color)}>
                                {language === 'ar' ? config.labelAr : config.label}
                            </span>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Header inline version
    return (
        <div className="flex items-center gap-3">
            <button
                onClick={() => setShowDetails(!showDetails)}
                className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg border',
                    'transition-all hover:scale-105',
                    config.bgColor,
                    config.borderColor,
                    'border-current'
                )}
            >
                <StatusIcon className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
                <span className={cn('text-sm font-medium', config.color)}>
                    {language === 'ar' ? config.labelAr : config.label}
                </span>
                {pendingOrders > 0 && showPendingCount && (
                    <span className="flex items-center justify-center w-5 h-4 rounded bg-red-500 text-white text-xs font-bold">
                        {pendingOrders}
                    </span>
                )}
            </button>

            {showLastSync && lastSyncAt && (
                <span className="text-xs text-slate-500">
                    {language === 'ar' ? 'آخر مزامنة:' : 'Last sync:'}{' '}
                    {formatDistanceToNow(new Date(lastSyncAt), language)}
                </span>
            )}

            {/* Manual sync button */}
            {canSync && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="h-8 px-2"
                >
                    <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
                </Button>
            )}

            {/* Details panel */}
            <AnimatePresence>
                {showDetails && (
                    <SyncDetailsPanel
                        status={status}
                        pendingOrders={pendingOrders}
                        lastSyncAt={lastSyncAt}
                        lastError={lastError}
                        isSyncing={isSyncing}
                        canSync={canSync}
                        language={language}
                        onSync={handleSync}
                        onClearCache={clearCache}
                        onClose={() => setShowDetails(false)}
                        inline
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// =============================================================================
// DETAILS PANEL COMPONENT
// =============================================================================

interface SyncDetailsPanelProps {
    status: string;
    pendingOrders: number;
    lastSyncAt: number | null;
    lastError?: string;
    isSyncing: boolean;
    canSync: boolean;
    language: string;
    onSync: () => void;
    onClearCache: () => Promise<void>;
    onClose: () => void;
    inline?: boolean;
}

function SyncDetailsPanel({
    status,
    pendingOrders,
    lastSyncAt,
    lastError,
    isSyncing,
    canSync,
    language,
    onSync,
    onClearCache,
    onClose,
    inline = false,
}: SyncDetailsPanelProps) {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];

    return (
        <motion.div
            initial={inline ? { opacity: 0, height: 0 } : { scale: 0.9, opacity: 0 }}
            animate={inline ? { opacity: 1, height: 'auto' } : { scale: 1, opacity: 1 }}
            exit={inline ? { opacity: 0, height: 0 } : { scale: 0.9, opacity: 0 }}
            className={cn(
                'bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden',
                !inline && 'w-80'
            )}
        >
            {/* Header */}
            <div className={cn('flex items-center justify-between p-4 border-b border-slate-700', config.bgColor)}>
                <div className="flex items-center gap-2">
                    <Database className={cn('w-5 h-5', config.color)} />
                    <h3 className={cn('font-bold', config.color)}>
                        {language === 'ar' ? 'حالة المزامنة' : 'Sync Status'}
                    </h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-black/20 transition-colors"
                >
                    <X className="w-4 h-4 text-slate-400" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                        {language === 'ar' ? 'الحالة' : 'Status'}
                    </span>
                    <div className="flex items-center gap-2">
                        {status === 'online' ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : status === 'offline' ? (
                            <WifiOff className="w-4 h-4 text-slate-400" />
                        ) : status === 'syncing' ? (
                            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className={cn('text-sm font-medium', config.color)}>
                            {language === 'ar' ? config.labelAr : config.label}
                        </span>
                    </div>
                </div>

                {/* Pending Orders */}
                {pendingOrders > 0 && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">
                            {language === 'ar' ? 'طلبات معلقة' : 'Pending Orders'}
                        </span>
                        <span className="flex items-center gap-2 text-sm font-medium text-yellow-400">
                            <Clock className="w-4 h-4" />
                            {pendingOrders}
                        </span>
                    </div>
                )}

                {/* Last Sync */}
                {lastSyncAt && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">
                            {language === 'ar' ? 'آخر مزامنة' : 'Last Sync'}
                        </span>
                        <span className="text-sm text-slate-300">
                            {formatDistanceToNow(new Date(lastSyncAt), language)}
                        </span>
                    </div>
                )}

                {/* Error */}
                {lastError && (
                    <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                        <p className="text-xs text-red-400">{lastError}</p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 p-4 border-t border-slate-700">
                <Button
                    variant="primary"
                    size="sm"
                    onClick={onSync}
                    disabled={!canSync || isSyncing}
                    className="flex-1"
                >
                    <RefreshCw className={cn('w-4 h-4 mr-2', isSyncing && 'animate-spin')} />
                    {language === 'ar' ? 'مزامنة الآن' : 'Sync Now'}
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onClearCache}
                    disabled={isSyncing}
                >
                    <Database className="w-4 h-4" />
                </Button>
            </div>
        </motion.div>
    );
}

export default SyncStatusIndicator;
