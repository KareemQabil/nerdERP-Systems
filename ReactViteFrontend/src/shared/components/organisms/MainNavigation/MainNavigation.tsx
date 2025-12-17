import { Home, ShoppingCart, ClipboardList, Users, Package, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface MainNavigationProps {
    activeRoute?: string;
    onNavigate?: (route: string) => void;
}

interface NavItem {
    id: string;
    icon: typeof Home;
    label: string;
    route: string;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'dashboard', icon: Home, label: 'لوحة التحكم', route: '/dashboard' },
    { id: 'pos', icon: ShoppingCart, label: 'نقطة البيع', route: '/pos' },
    { id: 'orders', icon: ClipboardList, label: 'الطلبات', route: '/orders' },
    { id: 'customers', icon: Users, label: 'العملاء', route: '/customers' },
    { id: 'inventory', icon: Package, label: 'المخزون', route: '/inventory' },
    { id: 'settings', icon: Settings, label: 'الإعدادات', route: '/settings' },
];

/**
 * MainNavigation Organism
 * Fixed right sidebar navigation implementing LEGACY_POS_SPEC design
 * 
 * Features (per spec):
 * - Fixed position: right-0 top-0 bottom-0
 * - Width: 80px (w-20)
 * - Background: Gradient from #023047 to #001219
 * - Z-index: 50
 * - Active indicator bar (layoutId for smooth transitions)
 * - Glassmorphism styling
 * - Hover tooltips
 * 
 * Navigation States:
 * - Inactive: bg-[rgba(255,255,255,0.05)], text-[#c2c7ce]
 * - Active: gradient from #22d3ee to #006399, text-[#00373a]
 * - Hover: scale(1.05)
 * 
 * @example
 * <MainNavigation activeRoute="/pos" onNavigate={(route) => navigate(route)} />
 */
export function MainNavigation({ activeRoute = '/pos', onNavigate }: MainNavigationProps) {
    return (
        <nav className="fixed right-0 top-0 bottom-0 w-20 bg-gradient-to-b from-[#023047] to-[#001219] border-l border-[rgba(255,255,255,0.1)] shadow-2xl z-50 flex flex-col">

            {/* Logo Section - 80px height per spec */}
            <div className="h-20 flex items-center justify-center border-b border-[rgba(255,255,255,0.1)]">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <ShoppingCart className="w-6 h-6 text-[#023047]" />
                </div>
            </div>

            {/* Navigation Items - Flex-1 for vertical centering */}
            <div className="flex-1 flex flex-col gap-2 p-2 pt-6">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeRoute === item.route;

                    return (
                        <motion.button
                            key={item.id}
                            onClick={() => onNavigate?.(item.route)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                                'relative w-full h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group',
                                isActive
                                    ? 'bg-gradient-to-b from-[#22d3ee] to-[#006399] text-[#00373a] shadow-lg'
                                    : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#c2c7ce]'
                            )}
                        >
                            {/* Icon - 24px per spec */}
                            <Icon className="w-6 h-6" />

                            {/* Label - 9px per spec */}
                            <span className="text-[9px] font-['Almarai'] font-bold text-center leading-tight">
                                {item.label}
                            </span>

                            {/* Active Indicator Bar - Right edge with layoutId */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-l-full"
                                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                />
                            )}

                            {/* Tooltip - RTL positioning (left side) */}
                            <div
                                className={cn(
                                    'absolute right-full mr-4 px-4 py-2 rounded-lg',
                                    'bg-slate-900/90 border border-white/10',
                                    'text-sm font-medium text-white whitespace-nowrap',
                                    'opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none',
                                    'backdrop-blur-md shadow-xl translate-x-2 group-hover:translate-x-0 transition-transform'
                                )}
                            >
                                {item.label}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* User Profile Section - Bottom */}
            <div className="p-3 border-t border-[rgba(255,255,255,0.1)]">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                        KM
                    </div>
                </div>
            </div>
        </nav>
    );
}
