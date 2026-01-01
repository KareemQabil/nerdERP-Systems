/**
 * Feature Toggle Component
 * Toggle switch for feature flags with icon and description
 */
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/app/hooks';
import { selectSettings } from '@/features/settings/slices/settingsSlice';
import type { LucideIcon } from 'lucide-react';

// =============================================================================
// FEATURE TOGGLE
// =============================================================================

interface FeatureToggleProps {
    label: string;
    description?: string;
    icon?: LucideIcon;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
}

export function FeatureToggle({
    label,
    description,
    icon: Icon,
    enabled,
    onChange,
    disabled = false,
}: FeatureToggleProps) {
    const { theme } = useAppSelector(selectSettings);
    const isDark = theme === 'dark' || theme === 'luxury';

    return (
        <div
            className={cn(
                'flex items-center gap-4 p-4 rounded-xl transition-colors',
                isDark
                    ? 'bg-slate-700/30 hover:bg-slate-700/50'
                    : 'bg-slate-50 hover:bg-slate-100',
                disabled && 'opacity-50 cursor-not-allowed'
            )}
        >
            {/* Icon */}
            {Icon && (
                <div
                    className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                        enabled
                            ? 'bg-violet-500/20 text-violet-400'
                            : isDark
                                ? 'bg-slate-600/50 text-slate-400'
                                : 'bg-slate-200 text-slate-500'
                    )}
                >
                    <Icon className="w-5 h-5" />
                </div>
            )}

            {/* Label */}
            <div className="flex-1 min-w-0">
                <p
                    className={cn(
                        'font-medium text-sm',
                        isDark ? 'text-slate-200' : 'text-slate-700'
                    )}
                >
                    {label}
                </p>
                {description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {description}
                    </p>
                )}
            </div>

            {/* Toggle Switch */}
            <button
                onClick={() => !disabled && onChange(!enabled)}
                disabled={disabled}
                className={cn(
                    'relative w-12 h-7 rounded-full transition-colors flex-shrink-0',
                    enabled
                        ? 'bg-violet-500'
                        : isDark
                            ? 'bg-slate-600'
                            : 'bg-slate-300',
                    disabled && 'cursor-not-allowed'
                )}
                aria-checked={enabled}
                role="switch"
            >
                <motion.div
                    initial={false}
                    animate={{ x: enabled ? 22 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
                />
            </button>
        </div>
    );
}

// =============================================================================
// FEATURE GROUP
// =============================================================================

interface FeatureGroupProps {
    title: string;
    children: React.ReactNode;
}

export function FeatureGroup({ title, children }: FeatureGroupProps) {
    const { theme } = useAppSelector(selectSettings);
    const isDark = theme === 'dark' || theme === 'luxury';

    return (
        <div className="space-y-3">
            <h4
                className={cn(
                    'text-xs font-semibold uppercase tracking-wider',
                    isDark ? 'text-slate-400' : 'text-slate-500'
                )}
            >
                {title}
            </h4>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

export default FeatureToggle;
