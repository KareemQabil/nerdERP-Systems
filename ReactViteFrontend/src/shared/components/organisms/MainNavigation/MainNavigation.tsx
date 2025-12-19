import { Home, ShoppingCart, ClipboardList, Users, Package, Settings, User, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface MainNavigationProps {
    activeRoute?: string;
    onNavigate?: (route: string) => void;
    onShift?: () => void;
    onLock?: () => void;
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
export function MainNavigation({ activeRoute = '/pos', onNavigate, onShift, onLock }: MainNavigationProps) {
    return (
        <nav className="fixed right-0 top-0 bottom-0 w-20 bg-gradient-to-b from-[#023047] to-[#001219] border-l border-[rgba(255,255,255,0.1)] shadow-2xl z-50 flex flex-col">


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

            {/* Bottom Actions: User/Shift & Lock */}
            <div className="p-3 border-t border-[rgba(255,255,255,0.1)] space-y-2">
                {/* User/Shift Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onShift}
                    className="w-full h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 hover:border-purple-400/50 flex items-center justify-center transition-all"
                    title="إدارة الوردية"
                >
                    <User className="w-6 h-6 text-purple-400" />
                </motion.button>

                {/* Lock Screen Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onLock}
                    className="w-full h-14 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-400/30 hover:border-red-400/50 flex items-center justify-center transition-all"
                    title="قفل الشاشة"
                >
                    <Lock className="w-6 h-6 text-red-400" />
                </motion.button>
            </div>
        </nav>
    );
}
