/**
 * Settings Page
 * Admin interface for configuring the POS system
 * Now renders within MainLayout (shared navigation sidebar)
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    Settings,
    Sliders,
    CreditCard,
    Shield,
    Package,
    Store,
    Palette,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/app/hooks';
import { selectSettings } from '@/features/settings/slices/settingsSlice';

// Section components
import { GeneralSection } from '../components/sections/GeneralSection';
import { FeaturesSection } from '../components/sections/FeaturesSection';
import { POSSection } from '../components/sections/POSSection';
import { PaymentsSection } from '../components/sections/PaymentsSection';
import { SecuritySection } from '../components/sections/SecuritySection';
import { DisplaySection } from '../components/sections/DisplaySection';

// =============================================================================
// TYPES
// =============================================================================

type SettingsSection =
    | 'general'
    | 'features'
    | 'pos'
    | 'payments'
    | 'security'
    | 'display';

interface SectionConfig {
    id: SettingsSection;
    labelKey: string;
    icon: typeof Settings;
    component: React.ComponentType;
}

// =============================================================================
// SECTION CONFIGURATION
// =============================================================================

const SECTIONS: SectionConfig[] = [
    { id: 'general', labelKey: 'settings.sections.general', icon: Store, component: GeneralSection },
    { id: 'features', labelKey: 'settings.sections.features', icon: Sliders, component: FeaturesSection },
    { id: 'pos', labelKey: 'settings.sections.pos', icon: Package, component: POSSection },
    { id: 'payments', labelKey: 'settings.sections.payments', icon: CreditCard, component: PaymentsSection },
    { id: 'security', labelKey: 'settings.sections.security', icon: Shield, component: SecuritySection },
    { id: 'display', labelKey: 'settings.sections.display', icon: Palette, component: DisplaySection },
];

// =============================================================================
// SETTINGS PAGE
// =============================================================================

export function SettingsPage() {
    const { t } = useTranslation('settings');
    const { theme } = useAppSelector(selectSettings);
    const [activeSection, setActiveSection] = useState<SettingsSection>('general');

    const activeConfig = SECTIONS.find((s) => s.id === activeSection);
    const ActiveComponent = activeConfig?.component;

    const isDark = theme === 'dark' || theme === 'luxury';

    return (
        <div className="h-screen flex overflow-hidden">
            {/* Main Content - comes FIRST in DOM, appears on LEFT */}
            <main
                data-theme={theme}
                className={cn(
                    'flex-1 overflow-y-auto',
                    'bg-slate-900/50',
                    'data-[theme=light]:bg-slate-50',
                )}
            >
                <div className="max-w-4xl mx-auto p-8">
                    {/* Section Header */}
                    <div className="mb-8">
                        <h2
                            data-theme={theme}
                            className={cn(
                                'text-2xl font-bold',
                                'text-white',
                                'data-[theme=light]:text-slate-900'
                            )}
                        >
                            {t(`${activeSection}.title`, activeSection)}
                        </h2>
                        <p className="mt-1 text-slate-400">
                            {t(`${activeSection}.description`, '')}
                        </p>
                    </div>

                    {/* Section Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {ActiveComponent && <ActiveComponent />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Settings Sidebar - on RIGHT side to match main nav */}
            <aside
                data-theme={theme}
                className={cn(
                    'w-64 flex-shrink-0 h-full flex flex-col border-l overflow-hidden',
                    'bg-slate-800/30 border-slate-700/50',
                    'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                )}
            >
                {/* Header */}
                <div
                    data-theme={theme}
                    className={cn(
                        'p-6 border-b',
                        'border-slate-700/50',
                        'data-[theme=light]:border-slate-200',
                    )}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center',
                                'bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20'
                            )}
                        >
                            <Settings className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1
                                data-theme={theme}
                                className={cn(
                                    'font-semibold text-lg',
                                    'text-white',
                                    'data-[theme=light]:text-slate-900'
                                )}
                            >
                                {t('title', 'Settings')}
                            </h1>
                            <p className="text-xs text-slate-400">
                                {t('subtitle', 'Configure your POS')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {SECTIONS.map((section) => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.id;

                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                data-theme={theme}
                                className={cn(
                                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group',
                                    isActive
                                        ? isDark
                                            ? 'bg-violet-600/20 text-violet-400'
                                            : 'bg-violet-50 text-violet-600'
                                        : isDark
                                            ? 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'w-5 h-5 flex-shrink-0 transition-colors',
                                        isActive && 'text-violet-500'
                                    )}
                                />
                                <span className="font-medium text-sm flex-1 text-start">
                                    {t(section.labelKey, section.id)}
                                </span>
                                <ChevronRight
                                    className={cn(
                                        'w-4 h-4 opacity-0 -translate-x-2 transition-all',
                                        'group-hover:opacity-50 group-hover:translate-x-0',
                                        isActive && 'opacity-100 translate-x-0'
                                    )}
                                />
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div
                    data-theme={theme}
                    className={cn(
                        'p-4 border-t text-xs text-slate-500',
                        'border-slate-700/50',
                        'data-[theme=light]:border-slate-200',
                    )}
                >
                    <p>NerdPOS v2.0.0</p>
                </div>
            </aside>
        </div>
    );
}

export default SettingsPage;
