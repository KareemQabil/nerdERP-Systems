/**
 * ExpiryCalendar Component
 *
 * Heatmap visualization showing batches expiring soon
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, AlertTriangle, CheckCircle } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { cn } from '@/lib/utils';
import type { InventoryBatch } from '@/services/inventory.service';

// =============================================================================
// TYPES
// =============================================================================

interface ExpiryCalendarProps {
    batches: InventoryBatch[];
    onBatchClick?: (batch: InventoryBatch) => void;
}

interface DayCell {
    date: Date;
    day: number;
    batches: InventoryBatch[];
    expiredCount: number;
    criticalCount: number;
    warningCount: number;
    okCount: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ExpiryCalendar({ batches, onBatchClick }: ExpiryCalendarProps) {
    const { language } = useSettingsStore();

    // Get expiry status
    const getExpiryStatus = (expiryDate: string) => {
        const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (days < 0) return 'expired';
        if (days <= 7) return 'critical';
        if (days <= 30) return 'warning';
        return 'ok';
    };

    // Generate calendar data for current month
    const calendarData = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

        const days: DayCell[] = [];

        // Previous month padding
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push({
                date: new Date(year, month, -startDayOfWeek + i + 1),
                day: 0,
                batches: [],
                expiredCount: 0,
                criticalCount: 0,
                warningCount: 0,
                okCount: 0,
            });
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayBatches = batches.filter((b) => {
                if (!b.expiryDate) return false;
                const expiryDate = new Date(b.expiryDate);
                return (
                    expiryDate.getDate() === day &&
                    expiryDate.getMonth() === month &&
                    expiryDate.getFullYear() === year
                );
            });

            const counts = dayBatches.reduce(
                (acc, batch) => {
                    const status = getExpiryStatus(batch.expiryDate!);
                    acc[`${status}Count`]++;
                    return acc;
                },
                { expiredCount: 0, criticalCount: 0, warningCount: 0, okCount: 0 }
            );

            days.push({
                date,
                day,
                batches: dayBatches,
                ...counts,
            });
        }

        return { days, year, month, monthName: now.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'long' }) };
    }, [batches, language]);

    // Get cell background color
    const getCellBg = (day: DayCell) => {
        if (day.day === 0) return 'bg-transparent';
        if (day.expiredCount > 0) return 'bg-red-500/30 border-red-500/50';
        if (day.criticalCount > 0) return 'bg-orange-500/30 border-orange-500/50';
        if (day.warningCount > 0) return 'bg-yellow-500/20 border-yellow-500/30';
        if (day.okCount > 0) return 'bg-green-500/20 border-green-500/30';
        return 'bg-slate-800/50 border-slate-700/50';
    };

    const weekDays = language === 'ar'
        ? ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-bold text-white">
                        {calendarData.monthName} {calendarData.year}
                    </h3>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-red-500" />
                        <span className="text-slate-400">{language === 'ar' ? 'منتهي' : 'Expired'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-orange-500" />
                        <span className="text-slate-400">{language === 'ar' ? '≤ 7 أيام' : '≤ 7 days'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-yellow-500" />
                        <span className="text-slate-400">{language === 'ar' ? '≤ 30 يوم' : '≤ 30 days'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-green-500" />
                        <span className="text-slate-400">{language === 'ar' ? 'جيد' : 'Good'}</span>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="rounded-lg border border-slate-700/50 overflow-hidden">
                {/* Week day headers */}
                <div className="grid grid-cols-7 bg-slate-800/50 border-b border-slate-700/50">
                    {weekDays.map((day) => (
                        <div
                            key={day}
                            className="py-2 text-center text-sm font-medium text-slate-400"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-px bg-slate-700/30">
                    {calendarData.days.map((day, index) => (
                        <motion.div
                            key={index}
                            whileHover={{ scale: day.day > 0 ? 1.02 : 1 }}
                            whileTap={{ scale: day.day > 0 ? 0.98 : 1 }}
                            onClick={() => day.day > 0 && day.batches.length > 0 && onBatchClick?.(day.batches[0])}
                            className={cn(
                                'aspect-square p-1 border transition-colors cursor-pointer',
                                getCellBg(day),
                                day.day > 0 && 'hover:opacity-80',
                            )}
                        >
                            {day.day > 0 && (
                                <div className="h-full flex flex-col justify-between">
                                    <span className="text-sm font-medium text-white">{day.day}</span>
                                    {day.batches.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {day.batches.length > 3 ? (
                                                <span className="text-xs text-white">
                                                    {day.batches.length} {language === 'ar' ? 'دفعة' : 'batches'}
                                                </span>
                                            ) : (
                                                day.batches.map((batch) => {
                                                    const status = getExpiryStatus(batch.expiryDate!);
                                                    return (
                                                        <div
                                                            key={batch.id}
                                                            className={cn(
                                                                'w-2 h-2 rounded-full',
                                                                status === 'expired' && 'bg-red-500',
                                                                status === 'critical' && 'bg-orange-500',
                                                                status === 'warning' && 'bg-yellow-500',
                                                                status === 'ok' && 'bg-green-500',
                                                            )}
                                                        />
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-lg font-bold text-red-400">
                            {batches.filter((b) => b.expiryDate && new Date(b.expiryDate) < new Date()).length}
                        </span>
                    </div>
                    <p className="text-xs text-red-300 mt-1">
                        {language === 'ar' ? 'منتهية الصلاحية' : 'Expired'}
                    </p>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/20 border border-orange-500/30">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        <span className="text-lg font-bold text-orange-400">
                            {
                                batches.filter((b) => {
                                    if (!b.expiryDate) return false;
                                    const days = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                    return days >= 0 && days <= 7;
                                }).length
                            }
                        </span>
                    </div>
                    <p className="text-xs text-orange-300 mt-1">
                        {language === 'ar' ? 'تنتهي خلال 7 أيام' : 'Expiring within 7 days'}
                    </p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span className="text-lg font-bold text-yellow-400">
                            {
                                batches.filter((b) => {
                                    if (!b.expiryDate) return false;
                                    const days = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                    return days > 7 && days <= 30;
                                }).length
                            }
                        </span>
                    </div>
                    <p className="text-xs text-yellow-300 mt-1">
                        {language === 'ar' ? 'تنتهي خلال 30 يوم' : 'Expiring within 30 days'}
                    </p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/30">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-lg font-bold text-green-400">
                            {
                                batches.filter((b) => {
                                    if (!b.expiryDate) return false;
                                    const days = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                    return days > 30;
                                }).length
                            }
                        </span>
                    </div>
                    <p className="text-xs text-green-300 mt-1">
                        {language === 'ar' ? 'صلاحية جيدة' : 'Good status'}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ExpiryCalendar;
