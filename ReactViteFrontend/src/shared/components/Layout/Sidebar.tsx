import { ShoppingCart, FileText, Users, TrendingUp, Package, Building2, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
    icon: React.ElementType;
    label: string;
    active?: boolean;
    badge?: number;
}

const NavItem = ({ icon: Icon, label, active, badge }: NavItemProps) => (
    <button
        className={cn(
            "relative w-full flex flex-col items-center justify-center py-4 gap-2 transition-all group",
            active
                ? "text-surface-dark"
                : "text-white/70 hover:text-white"
        )}
    >
        {/* Active Background Pill */}
        {active && (
            <div className="absolute inset-x-3 inset-y-2 bg-primary rounded-2xl shadow-lg shadow-primary/30" />
        )}

        <div className="relative z-10 flex flex-col items-center gap-1.5">
            <div className="relative">
                <Icon className={cn("w-6 h-6", active ? "stroke-[2.5px]" : "stroke-[2px]")} />
                {badge && (
                    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-surface-dark">
                        {badge}
                    </span>
                )}
            </div>
            <span className={cn(
                "text-[10px] font-semibold leading-tight text-center",
                active ? "text-surface-dark" : "text-inherit"
            )}>
                {label}
            </span>
        </div>
    </button>
);

export const Sidebar = () => {
    return (
        <aside className="w-full h-full bg-[#1a2838] flex flex-col items-center">
            {/* Logo */}
            <div className="w-full flex items-center justify-center py-6 border-b border-white/10">
                <div className="w-12 h-12 flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24 8L35 14.5V27.5L24 34L13 27.5V14.5L24 8Z" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        <path d="M24 21L35 14.5M24 21L13 14.5M24 21V34" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 w-full py-4 overflow-y-auto scrollbar-hide">
                <NavItem icon={ShoppingCart} label="نقطة" active />
                <NavItem icon={FileText} label="الطلبات" badge={3} />
                <NavItem icon={Users} label="العملاء" />
                <NavItem icon={TrendingUp} label="المبيعات" />
                <NavItem icon={Package} label="المخزون" />
                <NavItem icon={Building2} label="الإدارة" />
            </nav>

            {/* Bottom Section - User & Logout */}
            <div className="w-full border-t border-white/10 py-4 flex flex-col items-center gap-3">
                {/* User Profile */}
                <button className="flex flex-col items-center gap-1.5 group">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 group-hover:border-primary transition-colors">
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
                            alt="User"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="text-[10px] font-semibold text-white/70 group-hover:text-white transition-colors">أحمد</span>
                </button>

                {/* Logout Button */}
                <button className="w-14 h-14 rounded-2xl border-2 border-error/50 hover:border-error hover:bg-error/10 flex items-center justify-center text-error transition-all group">
                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
            </div>
        </aside>
    );
};
