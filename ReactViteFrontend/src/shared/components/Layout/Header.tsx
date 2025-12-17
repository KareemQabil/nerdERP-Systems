import { Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
    { id: 'all', label: 'الكل', labelEn: 'All' },
    { id: 'hot', label: 'ساخن', labelEn: 'Hot' },
    { id: 'cold', label: 'بارد', labelEn: 'Cold' },
    { id: 'bakery', label: 'المخبوزات', labelEn: 'Bakery' },
    { id: 'dessert', label: 'الحلويات', labelEn: 'Dessert' },
];

export const Header = () => {
    return (
        <header className="w-full bg-transparent">
            {/* Top Row - Search + Category Pills */}
            <div className="px-4 py-3 flex items-center gap-3 border-b border-white/5">
                {/* Left Side - Dropdown + Search */}
                <div className="flex items-center gap-2">
                    {/* Order Type Dropdown */}
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-surface-dark font-semibold text-sm hover:bg-primary-dark transition-colors">
                        <span>كافيتيريا</span>
                        <ChevronDown className="w-4 h-4" />
                    </button>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            placeholder="بحث... (Ctrl+F)"
                            className="w-64 h-10 bg-surface-light/20 border border-white/10 rounded-lg pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                        />
                    </div>
                </div>

                {/* Center - Category Pills */}
                <div className="flex-1 flex items-center justify-center gap-2">
                    {categories.map((cat, idx) => (
                        <button
                            key={cat.id}
                            className={cn(
                                "px-5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border",
                                idx === 4 // "All" is active
                                    ? "bg-primary text-surface-dark border-primary shadow-lg shadow-primary/20 font-bold"
                                    : "bg-surface-light/20 text-white/70 border-white/10 hover:border-primary/30 hover:bg-surface-light/30 hover:text-white"
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Right Side - User Profile */}
                <div className="flex items-center gap-2">
                    <div className="text-right">
                        <p className="text-xs font-bold text-white leading-tight">Ahmed</p>
                        <p className="text-[10px] text-primary">#POS-01</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-500 border-2 border-surface-dark shadow-lg"></div>
                </div>
            </div>
        </header>
    );
};
