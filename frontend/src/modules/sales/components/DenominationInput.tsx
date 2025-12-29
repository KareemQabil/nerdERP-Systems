import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { PriceDisplay } from '@/components/shared';
import { Input } from '@/components/ui';

interface Denomination {
    value: number;
    label: string;
}

const SAUDI_DENOMINATIONS: Denomination[] = [
    { value: 500, label: '500' },
    { value: 200, label: '200' },
    { value: 100, label: '100' },
    { value: 50, label: '50' },
    { value: 20, label: '20' },
    { value: 10, label: '10' },
    { value: 5, label: '5' },
    { value: 2, label: '2' }, // 2 SAR Coin
    { value: 1, label: '1' }, // 1 SAR Coin
    { value: 0.5, label: '0.50' }, // 50 Halala
    { value: 0.25, label: '0.25' }, // 25 Halala
];

interface DenominationInputProps {
    onTotalChange: (total: string) => void;
    initialTotal?: string;
}

export function DenominationInput({ onTotalChange }: DenominationInputProps) {
    const { t } = useTranslation('pos');
    const { theme } = useSettingsStore();
    const [counts, setCounts] = useState<Record<number, string>>({});

    const total = useMemo(() => {
        return Object.entries(counts).reduce((sum, [val, count]) => {
            const c = parseInt(count) || 0;
            return sum + (parseFloat(val) * c);
        }, 0);
    }, [counts]);

    useEffect(() => {
        onTotalChange(total.toFixed(3));
    }, [total, onTotalChange]);

    const handleCountChange = (value: number, count: string) => {
        setCounts(prev => ({
            ...prev,
            [value]: count
        }));
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SAUDI_DENOMINATIONS.map((denom) => (
                    <div
                        key={denom.value}
                        data-theme={theme}
                        className={cn(
                            'p-2 rounded-xl border flex flex-col gap-1',
                            'bg-slate-800/30 border-slate-700/50',
                            'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-200'
                        )}
                    >
                        <div className="flex justify-between items-center text-xs text-slate-400">
                            <span>{denom.label} SAR</span>
                            {counts[denom.value] && (
                                <span className="text-cyan-400 font-bold">
                                    {(denom.value * (parseInt(counts[denom.value]) || 0)).toFixed(2)}
                                </span>
                            )}
                        </div>
                        <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={counts[denom.value] || ''}
                            onChange={(e) => handleCountChange(denom.value, e.target.value)}
                            className="h-8 text-center font-bold"
                        />
                    </div>
                ))}
            </div>

            <div
                data-theme={theme}
                className={cn(
                    'p-3 rounded-xl flex justify-between items-center font-bold',
                    'bg-slate-800 border border-slate-700',
                    'data-[theme=light]:bg-slate-100 data-[theme=light]:border-slate-200'
                )}
            >
                <span className="text-sm text-slate-400">{t('checkout.totalDenominations', 'Total Breakdown')}</span>
                <PriceDisplay value={total.toFixed(3)} size="lg" variant="primary" />
            </div>
        </div>
    );
}
