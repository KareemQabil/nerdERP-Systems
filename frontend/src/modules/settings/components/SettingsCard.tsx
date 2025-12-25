/**
 * Settings Card
 * Reusable card component for settings sections
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings.store';

// =============================================================================
// SETTINGS CARD
// =============================================================================

interface SettingsCardProps {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
}

export function SettingsCard({ title, description, children, className }: SettingsCardProps) {
    const { theme } = useSettingsStore();
    const isDark = theme === 'dark' || theme === 'luxury';

    return (
        <div
            className={cn(
                'rounded-2xl border p-6',
                isDark
                    ? 'bg-slate-800/50 border-slate-700/50'
                    : 'bg-white border-slate-200',
                className
            )}
        >
            <div className="mb-4">
                <h3
                    className={cn(
                        'text-lg font-semibold',
                        isDark ? 'text-white' : 'text-slate-900'
                    )}
                >
                    {title}
                </h3>
                {description && (
                    <p className="mt-1 text-sm text-slate-500">{description}</p>
                )}
            </div>
            <div className="space-y-4">{children}</div>
        </div>
    );
}

// =============================================================================
// SETTINGS ROW
// =============================================================================

interface SettingsRowProps {
    label: string;
    description?: string;
    children: ReactNode;
    className?: string;
}

export function SettingsRow({ label, description, children, className }: SettingsRowProps) {
    const { theme } = useSettingsStore();
    const isDark = theme === 'dark' || theme === 'luxury';

    return (
        <div
            className={cn(
                'flex items-center justify-between py-3 border-b last:border-0',
                isDark ? 'border-slate-700/50' : 'border-slate-100',
                className
            )}
        >
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
                    <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                )}
            </div>
            <div className="ms-4 flex-shrink-0">{children}</div>
        </div>
    );
}

// =============================================================================
// SETTINGS DIVIDER
// =============================================================================

export function SettingsDivider() {
    const { theme } = useSettingsStore();
    const isDark = theme === 'dark' || theme === 'luxury';

    return (
        <div
            className={cn(
                'my-6 h-px',
                isDark ? 'bg-slate-700/50' : 'bg-slate-200'
            )}
        />
    );
}
