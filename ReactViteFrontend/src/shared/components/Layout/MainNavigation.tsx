import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, ShoppingCart, Package, Users, Box,
    FileText, TrendingUp, UserCog, DollarSign, Settings,
    Truck, ChefHat, BarChart3, Building2, LogOut, Armchair, Palette
} from 'lucide-react';
import { motion } from 'framer-motion';

// Mock auth for now - replace with actual auth context when available
const useAuth = () => ({
    user: { name: 'Admin User', avatar: null },
    logout: () => { window.location.href = '/login'; },
});

interface NavigationItem {
    id: string;
    name: string;
    nameEn: string;
    icon: React.ReactNode;
    path: string;
    badge?: number;
    color: string;
}

export function MainNavigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const navigationItems: NavigationItem[] = [
        {
            id: 'dashboard',
            name: 'لوحة التحكم',
            nameEn: 'Dashboard',
            icon: <LayoutDashboard className="w-6 h-6" />,
            path: '/dashboard',
            color: 'from-[#22d3ee] to-[#0891b2]',
        },
        {
            id: 'pos',
            name: 'نقطة البيع',
            nameEn: 'POS',
            icon: <ShoppingCart className="w-6 h-6" />,
            path: '/pos',
            color: 'from-[#22d3ee] to-[#006399]',
        },
        {
            id: 'orders',
            name: 'الطلبات',
            nameEn: 'Orders',
            icon: <FileText className="w-6 h-6" />,
            path: '/orders',
            badge: 5,
            color: 'from-[#f59e0b] to-[#d97706]',
        },
        {
            id: 'customers',
            name: 'العملاء',
            nameEn: 'Customers',
            icon: <Users className="w-6 h-6" />,
            path: '/customers',
            color: 'from-[#10b981] to-[#059669]',
        },
        {
            id: 'sales',
            name: 'المبيعات',
            nameEn: 'Sales',
            icon: <TrendingUp className="w-6 h-6" />,
            path: '/sales',
            color: 'from-[#06b6d4] to-[#0284c7]',
        },
        {
            id: 'inventory',
            name: 'المخزون',
            nameEn: 'Inventory',
            icon: <Package className="w-6 h-6" />,
            path: '/inventory',
            color: 'from-[#8b5cf6] to-[#6d28d9]',
        },
        {
            id: 'b2b',
            name: 'B2B',
            nameEn: 'B2B',
            icon: <Building2 className="w-6 h-6" />,
            path: '/b2b',
            color: 'from-[#ec4899] to-[#db2777]',
        },
        {
            id: 'reports',
            name: 'التقارير',
            nameEn: 'Reports',
            icon: <TrendingUp className="w-6 h-6" />,
            path: '/reports',
            color: 'from-[#06b6d4] to-[#0891b2]',
        },
        {
            id: 'hr',
            name: 'الموظفين',
            nameEn: 'HR',
            icon: <UserCog className="w-6 h-6" />,
            path: '/hr',
            color: 'from-[#f97316] to-[#ea580c]',
        },
        {
            id: 'cash',
            name: 'التقفيلة',
            nameEn: 'Cash',
            icon: <DollarSign className="w-6 h-6" />,
            path: '/cash',
            color: 'from-[#84cc16] to-[#65a30d]',
        },
        {
            id: 'delivery',
            name: 'التوصيل',
            nameEn: 'Delivery',
            icon: <Truck className="w-6 h-6" />,
            path: '/delivery',
            color: 'from-[#06b6d4] to-[#0e7490]',
        },
        {
            id: 'kitchen',
            name: 'المطبخ',
            nameEn: 'Kitchen',
            icon: <ChefHat className="w-6 h-6" />,
            path: '/kitchen',
            color: 'from-[#ef4444] to-[#dc2626]',
        },
        {
            id: 'analytics',
            name: 'التحليلات',
            nameEn: 'Analytics',
            icon: <BarChart3 className="w-6 h-6" />,
            path: '/analytics',
            color: 'from-[#a855f7] to-[#7c3aed]',
        },
        {
            id: 'settings',
            name: 'الإعدادات',
            nameEn: 'Settings',
            icon: <Settings className="w-6 h-6" />,
            path: '/settings',
            color: 'from-[#6b7280] to-[#4b5563]',
        },
        {
            id: 'seating',
            name: 'تنظيم المقاعد',
            nameEn: 'Seating',
            icon: <Armchair className="w-6 h-6" />,
            path: '/seating',
            color: 'from-[#ec4899] to-[#db2777]',
        },
        {
            id: 'design-system',
            name: 'نظام التصميم',
            nameEn: 'Design System',
            icon: <Palette className="w-6 h-6" />,
            path: '/design-system',
            color: 'from-[#f472b6] to-[#ec4899]',
        },
    ];

    const isActive = (path: string) => location.pathname.startsWith(path);

    return (
        <div className="main-navigation fixed right-0 top-0 bottom-0 w-20 bg-gradient-to-b from-[#023047] to-[#001219] border-l border-[rgba(255,255,255,0.1)] shadow-2xl z-40 flex flex-col">
            {/* Logo */}
            <div className="h-20 flex items-center justify-center border-b border-[rgba(255,255,255,0.1)]">
                <Box className="w-8 h-8 text-cyan-400" />
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-[rgba(255,255,255,0.1)] scrollbar-track-transparent">
                <div className="space-y-2 px-2">
                    {navigationItems.map((item) => (
                        <motion.button
                            key={item.id}
                            data-tour={item.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(item.path)}
                            className={`relative w-full h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group ${isActive(item.path)
                                ? `bg-gradient-to-b ${item.color} text-[#00373a] shadow-lg`
                                : 'bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#c2c7ce]'
                                }`}
                        >
                            {item.icon}
                            <span className="text-[9px] font-['Almarai'] font-bold text-center leading-tight" dir="auto">
                                {item.name.split(' ')[0]}
                            </span>

                            {/* Badge */}
                            {item.badge && (
                                <div className="absolute top-1 left-1 bg-[#fb2c36] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-['Arial'] font-bold border-2 border-[#023047]">
                                    {item.badge}
                                </div>
                            )}

                            {/* Active Indicator */}
                            {isActive(item.path) && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-l-full"
                                />
                            )}

                            {/* Tooltip */}
                            <div className="absolute left-full ml-3 hidden group-hover:block pointer-events-none z-50">
                                <div className="bg-[#1a1c1e] border border-cyan-400 rounded-lg px-3 py-2 shadow-xl">
                                    <p className="text-sm font-['Almarai'] text-[#e2e2e6] whitespace-nowrap" dir="auto">
                                        {item.name}
                                    </p>
                                    <p className="text-xs font-['Inter'] text-[#c2c7ce]">
                                        {item.nameEn}
                                    </p>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* User & Logout */}
            <div className="border-t border-[rgba(255,255,255,0.1)] p-2 space-y-2">
                {/* User Avatar */}
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-[#006399] border-2 border-cyan-400 overflow-hidden">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-['Arial'] font-bold">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                        )}
                    </div>
                    <p className="text-[8px] font-['Almarai'] text-[#c2c7ce] mt-1 text-center leading-tight" dir="auto">
                        {user?.name?.split(' ')[0] || 'Admin'}
                    </p>
                </div>

                {/* Logout */}
                <button
                    onClick={logout}
                    className="w-full h-12 rounded-xl bg-[rgba(251,44,54,0.1)] border border-[#ff6467] hover:bg-[rgba(251,44,54,0.2)] transition-all flex items-center justify-center"
                >
                    <LogOut className="w-5 h-5 text-[#ff6467]" />
                </button>
            </div>
        </div>
    );
}
