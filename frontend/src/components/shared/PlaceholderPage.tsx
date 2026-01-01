/**
 * Placeholder Page Component
 * Reusable placeholder for pages that are not yet implemented
 */
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/app/hooks';
import { selectSettings } from '@/features/settings/slices/settingsSlice';
import type { LucideIcon } from 'lucide-react';

interface PlaceholderPageProps {
    titleKey: string;
    descriptionKey: string;
    icon: LucideIcon;
}

export function PlaceholderPage({ titleKey, descriptionKey, icon: Icon }: PlaceholderPageProps) {
    const { t } = useTranslation('common');
    const { theme } = useAppSelector(selectSettings);
    const isDark = theme === 'dark' || theme === 'luxury';

    return (
        <div className="h-screen flex items-center justify-center p-8">
            <div className="text-center max-w-md">
                <div
                    className={cn(
                        'w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center',
                        'bg-gradient-to-br from-slate-700 to-slate-800',
                        isDark ? 'shadow-xl shadow-black/20' : 'shadow-lg'
                    )}
                >
                    <Icon className="w-10 h-10 text-slate-400" />
                </div>
                <h1
                    className={cn(
                        'text-2xl font-bold mb-2',
                        isDark ? 'text-white' : 'text-slate-900'
                    )}
                >
                    {t(titleKey)}
                </h1>
                <p className="text-slate-400 mb-6">
                    {t(descriptionKey)}
                </p>
                <div
                    className={cn(
                        'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm',
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    )}
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </span>
                    {t('comingSoon', 'Coming Soon')}
                </div>
            </div>
        </div>
    );
}

export default PlaceholderPage;
