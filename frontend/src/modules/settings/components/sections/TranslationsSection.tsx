/**
 * Translations Section
 * Grid editor for managing UI translations
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Search, Save, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SettingsCard } from '../SettingsCard';
import { useConfigStore } from '@/modules/config/store/configStore';
import { configSocket } from '@/lib/config-socket';
import { cn } from '@/lib/utils';

interface TranslationRow {
    key: string;
    ar: string;
    en: string;
    context?: string;
}

export function TranslationsSection() {
    const { t } = useTranslation('settings');
    const queryClient = useQueryClient();
    const { config } = useConfigStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [rows, setRows] = useState<TranslationRow[]>([]);

    // Fetch translations
    const { data: translations, isLoading } = useQuery({
        queryKey: ['translations', config?.store.id],
        queryFn: async () => {
            const storeId = config?.store.id || 'default-store-id';
            const response = await fetch(`/api/translations/${storeId}/ar`);
            const data = await response.json();
            return data.data || [];
        },
    });

    // Update translation mutation
    const updateMutation = useMutation({
        mutationFn: async ({ key, arValue, enValue }: { key: string; arValue: string; enValue: string }) => {
            const storeId = config?.store.id || 'default-store-id';

            // Update both Arabic and English
            await Promise.all([
                fetch(`/api/translations/${storeId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        languageCode: 'ar',
                        translationKey: key,
                        translationValue: arValue,
                    }),
                }),
                fetch(`/api/translations/${storeId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        languageCode: 'en',
                        translationKey: key,
                        translationValue: enValue,
                    }),
                }),
            ]);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['translations'] });
            configSocket.emit('translation:updated');
            setEditingKey(null);
        },
    });

    // Build rows from translations
    useState(() => {
        if (translations && translations.length > 0) {
            const allKeys = new Set<string>();
            translations.forEach((tr: any) => {
                if (tr.translationKey) allKeys.add(tr.translationKey);
            });

            const translationRows: TranslationRow[] = Array.from(allKeys).map((key) => ({
                key,
                ar: translations.find((tr: any) => tr.translationKey === key && tr.languageCode === 'ar')?.translationValue || '',
                en: translations.find((tr: any) => tr.translationKey === key && tr.languageCode === 'en')?.translationValue || '',
            }));

            setRows(translationRows);
        }
    }, [translations]);

    const filteredRows = rows.filter((row) =>
        row.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.ar.includes(searchQuery) ||
        row.en.includes(searchQuery)
    );

    const handleSave = (key: string) => {
        const row = rows.find((r) => r.key === key);
        if (!row) return;

        updateMutation.mutate({
            key,
            arValue: row.ar,
            enValue: row.en,
        });
    };

    const handleCancel = () => {
        setEditingKey(null);
    };

    return (
        <div className="space-y-6">
            <SettingsCard
                title={t('translations.title', 'Translations')}
                description={t('translations.description', 'Edit UI text for all languages')}
            >
                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder={t('translations.search', 'Search translations...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                            'w-full ps-10 pe-4 py-2.5 rounded-xl border',
                            'bg-slate-700/50 border-slate-600 text-white',
                            'placeholder:text-slate-400',
                            'focus:outline-none focus:ring-2 focus:ring-violet-500'
                        )}
                    />
                </div>

                {/* Translations Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-700">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800">
                            <tr>
                                <th className="px-4 py-3 text-right text-slate-300 font-medium">
                                    {t('translations.key', 'Key')}
                                </th>
                                <th className="px-4 py-3 text-right text-slate-300 font-medium">
                                    <Languages className="w-4 h-4 inline me-2" />
                                    {t('translations.arabic', 'Arabic')}
                                </th>
                                <th className="px-4 py-3 text-right text-slate-300 font-medium">
                                    <Languages className="w-4 h-4 inline me-2" />
                                    {t('translations.english', 'English')}
                                </th>
                                <th className="px-4 py-3 text-right text-slate-300 font-medium">
                                    {t('translations.actions', 'Actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            {t('translations.loading', 'Loading...')}
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRows.slice(0, 50).map((row) => {
                                const isEditing = editingKey === row.key;

                                return (
                                    <tr key={row.key} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 font-mono text-slate-400">
                                            {row.key}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={row.ar}
                                                    onChange={(e) => {
                                                        setRows((prev) =>
                                                            prev.map((r) =>
                                                                r.key === row.key
                                                                    ? { ...r, ar: e.target.value }
                                                                    : r
                                                            )
                                                        );
                                                    }}
                                                    className="w-full px-2 py-1 rounded bg-slate-700 border border-slate-600 text-white text-sm"
                                                    dir="rtl"
                                                />
                                            ) : (
                                                <span className="text-white" dir="rtl">
                                                    {row.ar || '-'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={row.en}
                                                    onChange={(e) => {
                                                        setRows((prev) =>
                                                            prev.map((r) =>
                                                                r.key === row.key
                                                                    ? { ...r, en: e.target.value }
                                                                    : r
                                                            )
                                                        );
                                                    }}
                                                    className="w-full px-2 py-1 rounded bg-slate-700 border border-slate-600 text-white text-sm"
                                                />
                                            ) : (
                                                <span className="text-white">
                                                    {row.en || '-'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleSave(row.key)}
                                                        disabled={updateMutation.isPending}
                                                        className="p-1.5 rounded bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancel}
                                                        className="p-1.5 rounded bg-slate-600 hover:bg-slate-500 text-white"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setEditingKey(row.key)}
                                                    className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-white"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredRows.length > 50 && (
                    <p className="mt-4 text-sm text-slate-400 text-center">
                        {t('translations.showingFirst', 'Showing first 50 of {{count}} results').replace(
                            '{{count}}',
                            String(filteredRows.length)
                        )}
                    </p>
                )}
            </SettingsCard>
        </div>
    );
}

export default TranslationsSection;
