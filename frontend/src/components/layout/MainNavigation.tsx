import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectLanguage, selectTheme, toggleLanguage } from '@/features/settings/slices/settingsSlice';
import {
    Store,
    ClipboardList,
    Users,
    Package,
    BarChart3,
    Settings,
    ChefHat,
    Truck,
    Wallet,
    LayoutGrid,
    LogOut,
    Languages,
} from 'lucide-react';

interface NavItem {
    key: string;
    icon: React.ElementType;
    path: string;
}

const navItems: NavItem[] = [
    { key: 'pos', icon: Store, path: '/pos' },
    { key: 'orders', icon: ClipboardList, path: '/orders' },
    { key: 'customers', icon: Users, path: '/customers' },
    { key: 'inventory', icon: Package, path: '/inventory' },
    { key: 'kitchen', icon: ChefHat, path: '/kitchen' },
    { key: 'delivery', icon: Truck, path: '/delivery' },
    { key: 'cash', icon: Wallet, path: '/cash' },
    { key: 'seating', icon: LayoutGrid, path: '/tables' },
    { key: 'reports', icon: BarChart3, path: '/reports' },
    { key: 'settings', icon: Settings, path: '/settings' },
];

/**
 * Main navigation sidebar
 * Fixed on the right side (RTL) with icons and labels
 */
export function MainNavigation() {
    const { t } = useTranslation('common');
    const location = useLocation();
    const dispatch = useAppDispatch();
    const language = useAppSelector(selectLanguage);
    const theme = useAppSelector(selectTheme);

    const handleToggleLanguage = () => dispatch(toggleLanguage());

    return (
        <nav
            data-theme={theme}
            className={cn(
                // ALWAYS on RIGHT side - use fixed positioning with right-0
                'fixed top-0 right-0 h-screen w-20 flex flex-col z-40',
                'border-l transition-all duration-300',
                // Dark theme - glass with subtle gradient
                'backdrop-blur-2xl',
                'bg-gradient-to-b from-slate-900/40 via-slate-900/60 to-slate-900/80',
                'border-slate-700/50 shadow-2xl shadow-black/20',
                // Light theme - SOLID WHITE with shadow
                'data-[theme=light]:backdrop-blur-none',
                'data-[theme=light]:bg-white data-[theme=light]:from-white data-[theme=light]:via-white data-[theme=light]:to-white',
                'data-[theme=light]:border-slate-300 data-[theme=light]:shadow-xl data-[theme=light]:shadow-slate-300/50',
                // Luxury theme - glass with gold accent
                'data-[theme=luxury]:from-black/40 data-[theme=luxury]:via-black/60 data-[theme=luxury]:to-black/80',
                'data-[theme=luxury]:border-amber-600/20 data-[theme=luxury]:shadow-amber-900/20',
            )}
        >
            {/* Logo */}
            <div className={cn(
                'flex items-center justify-center h-16 border-b backdrop-blur-xl',
                'border-slate-700/50',
                'data-[theme=light]:border-slate-300/30',
                'data-[theme=luxury]:border-amber-600/20',
            )}>
                <div className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center',
                    'bg-gradient-to-br shadow-lg transform hover:scale-105 transition-transform',
                    // Dark theme
                    'from-cyan-500 to-cyan-600 shadow-cyan-500/30',
                    // Light theme
                    'data-[theme=light]:from-cyan-600 data-[theme=light]:to-cyan-700 data-[theme=light]:shadow-cyan-600/20',
                    // Luxury theme
                    'data-[theme=luxury]:from-amber-500 data-[theme=luxury]:to-amber-600 data-[theme=luxury]:shadow-amber-500/30',
                )}>
                    <span className="text-2xl font-bold text-white">N</span>
                </div>
            </div>

            {/* Nav Items */}
            <div className="flex-1 py-4 overflow-y-auto scrollbar-thin">
                <ul className="flex flex-col gap-1 px-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <li key={item.key}>
                                <NavLink
                                    to={item.path}
                                    className={cn(
                                        'flex flex-col items-center gap-1 py-3 px-2 rounded-xl',
                                        'transition-all duration-300 group relative backdrop-blur-sm',
                                        isActive
                                            ? cn(
                                                // Active state - glass with gradient
                                                'bg-gradient-to-br shadow-lg',
                                                // Dark theme
                                                'from-cyan-500/20 to-cyan-600/10 text-cyan-400 shadow-cyan-500/20',
                                                'border border-cyan-500/30',
                                                // Light theme
                                                'data-[theme=light]:from-cyan-600/20 data-[theme=light]:to-cyan-700/10',
                                                'data-[theme=light]:text-cyan-700 data-[theme=light]:shadow-cyan-600/10',
                                                'data-[theme=light]:border-cyan-600/30',
                                                // Luxury theme
                                                'data-[theme=luxury]:from-amber-500/20 data-[theme=luxury]:to-amber-600/10',
                                                'data-[theme=luxury]:text-amber-400 data-[theme=luxury]:shadow-amber-500/20',
                                                'data-[theme=luxury]:border-amber-500/30',
                                            )
                                            : cn(
                                                // Inactive base styles
                                                'border transition-all duration-200',
                                                // Theme-specific styles
                                                theme === 'light' ? cn(
                                                    // Light theme - SOLID with prominent hover
                                                    'bg-slate-100/80 text-slate-600 border-slate-200/50',
                                                    'hover:bg-cyan-100 hover:text-cyan-800 hover:border-cyan-300',
                                                    'hover:shadow-md hover:shadow-cyan-200/50',
                                                )
                                                    : theme === 'luxury' ? cn(
                                                        // Luxury theme
                                                        'bg-black/20 text-slate-500 border-transparent',
                                                        'hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-600/50',
                                                    )
                                                        : cn(
                                                            // Dark theme (default)
                                                            'bg-white/5 text-slate-400 border-transparent',
                                                            'hover:bg-white/10 hover:text-white hover:border-slate-600/50',
                                                            'hover:shadow-lg hover:shadow-black/10',
                                                        )
                                            )
                                    )}
                                >
                                    {/* Active indicator */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-indicator"
                                            className={cn(
                                                'absolute inset-y-2 start-0 w-1 rounded-full shadow-lg',
                                                'bg-gradient-to-b',
                                                // Dark theme
                                                'from-cyan-400 to-cyan-500 shadow-cyan-500/50',
                                                // Light theme
                                                'data-[theme=light]:from-cyan-600 data-[theme=light]:to-cyan-700 data-[theme=light]:shadow-cyan-600/30',
                                                // Luxury theme
                                                'data-[theme=luxury]:from-amber-400 data-[theme=luxury]:to-amber-500 data-[theme=luxury]:shadow-amber-500/50',
                                            )}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        />
                                    )}

                                    <Icon className="w-5 h-5" />
                                    <span className="text-[10px] font-medium truncate">
                                        {t(`navigation.${item.key}`)}
                                    </span>
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* Bottom Actions */}
            <div className={cn(
                'p-2 border-t space-y-1',
                'border-slate-700/50',
                // Light theme - darker border
                'data-[theme=light]:border-slate-300 data-[theme=light]:bg-slate-50',
                'data-[theme=luxury]:border-amber-600/20',
            )}>
                {/* Language Toggle */}
                <button
                    onClick={handleToggleLanguage}
                    className={cn(
                        'w-full flex flex-col items-center gap-1 py-3 px-2 rounded-xl',
                        'transition-all duration-200 border',
                        // Theme-specific styles
                        theme === 'light' ? cn(
                            'bg-slate-100/80 text-slate-600 border-slate-200/50',
                            'hover:bg-cyan-100 hover:text-cyan-800 hover:border-cyan-300',
                            'hover:shadow-md hover:shadow-cyan-200/50',
                        )
                            : theme === 'luxury' ? cn(
                                'bg-black/20 text-amber-400/70 border-transparent',
                                'hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-600/50',
                            )
                                : cn(
                                    'bg-white/5 text-slate-400 border-transparent',
                                    'hover:bg-white/10 hover:text-white hover:border-slate-600/50',
                                    'hover:shadow-lg hover:shadow-black/10',
                                )
                    )}
                >
                    <Languages className="w-5 h-5" />
                    <span className="text-[10px] font-medium">
                        {language === 'ar' ? 'EN' : 'عربي'}
                    </span>
                </button>

                {/* Logout */}
                <button
                    className={cn(
                        'w-full flex flex-col items-center gap-1 py-3 px-2 rounded-xl',
                        'transition-all duration-200 border',
                        // Theme-specific styles
                        theme === 'light' ? cn(
                            'bg-red-50 border-red-200 text-red-600',
                            'hover:bg-red-100 hover:border-red-300 hover:shadow-md hover:shadow-red-200/50',
                        )
                            : cn(
                                'bg-red-500/10 border-red-500/30 text-red-400',
                                'hover:bg-red-500/20 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/20',
                            )
                    )}
                >
                    <LogOut className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{t('navigation.logout')}</span>
                </button>
            </div>
        </nav>
    );
}
