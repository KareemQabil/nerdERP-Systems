import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Printer,
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    ChevronDown,
    ChevronUp,
    Settings,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { Button } from '@/components/ui';
import type {
    PrinterRoutingConfig,
    StationMapping,
    PriorityLevel,
    OrderTypeRule,
} from '@/types/pos.types';

// =============================================================================
// PRINTER ROUTING CONFIG EDITOR
// =============================================================================

interface PrinterRoutingConfigEditorProps {
    storeId: string;
    config: PrinterRoutingConfig | null;
    onLoadConfig: (storeId: string) => Promise<PrinterRoutingConfig | null>;
    onSaveConfig: (storeId: string, config: PrinterRoutingConfig) => Promise<void>;
    onTestRoute?: (params: { orderId: string; orderType: string }) => Promise<void>;
    printers: Array<{ id: string; name: string; type: string; isActive: boolean }>;
    templates: Array<{ id: string; name: string; paperSize: string }>;
    stations: Array<{ id: string; code: string; name: string }>;
}

/**
 * PrinterRoutingConfigEditor
 *
 * Admin interface for configuring printer routing rules.
 * Allows admins to:
 * - Map kitchen stations to printers
 * - Configure fallback printers
 * - Set priority levels for print jobs
 * - Configure order-type-specific routing
 * - Test routing configurations
 */
export function PrinterRoutingConfigEditor({
    storeId,
    config,
    onLoadConfig,
    onSaveConfig,
    onTestRoute,
    printers,
    templates,
    stations,
}: PrinterRoutingConfigEditorProps) {
    const { t } = useTranslation('admin');
    const { theme, language } = useSettingsStore();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [localConfig, setLocalConfig] = useState<PrinterRoutingConfig>({
        version: '1.0',
        stationMappings: [],
        orderTypeRules: [],
        priorityConfig: {
            levels: [
                { level: 1, name: 'EMERGENCY', queuePosition: 'front' },
                { level: 2, name: 'EXPEDITE', queuePosition: 'front' },
                { level: 3, name: 'NORMAL', queuePosition: 'back' },
            ],
            autoEscalation: {
                enabled: false,
                waitTimeMinutes: 5,
            },
        },
        falloverConfig: {
            globalEnabled: true,
            maxRetryAttempts: 2,
            alertThreshold: 1,
        },
    });

    // Load config on mount
    useEffect(() => {
        if (!config) {
            loadConfig();
        } else {
            setLocalConfig(config);
        }
    }, [config]);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const loadedConfig = await onLoadConfig(storeId);
            if (loadedConfig) {
                setLocalConfig(loadedConfig);
            }
        } catch (error) {
            console.error('Failed to load printer routing config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveMessage(null);

        try {
            await onSaveConfig(storeId, localConfig);
            setHasChanges(false);
            setSaveMessage({
                type: 'success',
                text: language === 'ar' ? 'تم الحفظ بنجاح' : 'Configuration saved successfully',
            });
        } catch (error) {
            setSaveMessage({
                type: 'error',
                text: (error as Error).message || (language === 'ar' ? 'فشل الحفظ' : 'Failed to save configuration'),
            });
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMessage(null), 3000);
        }
    };

    const updateStationMapping = (index: number, updates: Partial<StationMapping>) => {
        setLocalConfig((prev) => ({
            ...prev,
            stationMappings: prev.stationMappings.map((mapping, i) =>
                i === index ? { ...mapping, ...updates } : mapping
            ),
        }));
        setHasChanges(true);
    };

    const addStationMapping = () => {
        const newMapping: StationMapping = {
            stationId: '',
            stationCode: '',
            primaryPrinterId: '',
            fallbackPrinterIds: [],
            falloverConfig: {
                enabled: true,
                maxRetryAttempts: 2,
                alertOnFallover: true,
            },
            templateId: '',
        };

        setLocalConfig((prev) => ({
            ...prev,
            stationMappings: [...prev.stationMappings, newMapping],
        }));
        setHasChanges(true);
        setExpandedSection(`station-${localConfig.stationMappings.length}`);
    };

    const removeStationMapping = (index: number) => {
        setLocalConfig((prev) => ({
            ...prev,
            stationMappings: prev.stationMappings.filter((_, i) => i !== index),
        }));
        setHasChanges(true);
    };

    const updateOrderTypeRule = (index: number, updates: Partial<OrderTypeRule>) => {
        setLocalConfig((prev) => ({
            ...prev,
            orderTypeRules: prev.orderTypeRules.map((rule, i) =>
                i === index ? { ...rule, ...updates } : rule
            ),
        }));
        setHasChanges(true);
    };

    const addOrderTypeRule = () => {
        const newRule: OrderTypeRule = {
            orderType: 'DINE_IN',
            autoPrint: {
                customerReceipt: true,
                kitchenTickets: true,
            },
            receiptPrinterId: '',
            receiptTemplateId: '',
        };

        setLocalConfig((prev) => ({
            ...prev,
            orderTypeRules: [...prev.orderTypeRules, newRule],
        }));
        setHasChanges(true);
        setExpandedSection(`ordertype-${localConfig.orderTypeRules.length}`);
    };

    const removeOrderTypeRule = (index: number) => {
        setLocalConfig((prev) => ({
            ...prev,
            orderTypeRules: prev.orderTypeRules.filter((_, i) => i !== index),
        }));
        setHasChanges(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        'bg-gradient-to-br from-cyan-500 to-cyan-600',
                    )}>
                        <Printer className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2
                            data-theme={theme}
                            className={cn(
                                'text-lg font-bold',
                                'text-white',
                                'data-[theme=light]:text-slate-900',
                            )}
                        >
                            {t('printerRouting.title', 'Printer Routing Configuration')}
                        </h2>
                        <p className="text-xs text-slate-400">
                            v{localConfig.version} • {hasChanges && (
                                <span className="text-yellow-400">
                                    {language === 'ar' ? 'له تغييرات غير محفوظة' : 'Unsaved changes'}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="secondary" onClick={loadConfig}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                    >
                        {saving ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            />
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {t('save', 'Save')}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Save Message */}
            <AnimatePresence>
                {saveMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                            'rounded-xl p-3 flex items-center gap-2',
                            saveMessage.type === 'success'
                                ? 'bg-green-500/20 border border-green-500/30'
                                : 'bg-red-500/20 border border-red-500/30',
                        )}
                    >
                        {saveMessage.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                        )}
                        <span className={cn(
                            'text-sm',
                            saveMessage.type === 'success' ? 'text-green-400' : 'text-red-400',
                        )}>
                            {saveMessage.text}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Station Mappings */}
            <div
                data-theme={theme}
                className={cn(
                    'rounded-xl border-2 overflow-hidden',
                    'bg-slate-800/50 border-slate-700/50',
                    'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                )}
            >
                <div
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedSection(expandedSection === 'stations' ? null : 'stations')}
                >
                    <div>
                        <h3
                            data-theme={theme}
                            className={cn(
                                'font-bold text-sm',
                                'text-white',
                                'data-[theme=light]:text-slate-900',
                            )}
                        >
                            {t('printerRouting.stationMappings', 'Station Mappings')}
                        </h3>
                        <p className="text-xs text-slate-400">
                            {localConfig.stationMappings.length} {language === 'ar' ? 'محطات' : 'stations'}
                        </p>
                    </div>
                    {expandedSection === 'stations' ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                </div>

                {expandedSection === 'stations' && (
                    <div className="p-4 pt-0 space-y-3">
                        {localConfig.stationMappings.map((mapping, index) => (
                            <StationMappingEditor
                                key={index}
                                mapping={mapping}
                                index={index}
                                stations={stations}
                                printers={printers}
                                templates={templates}
                                onUpdate={(updates) => updateStationMapping(index, updates)}
                                onRemove={() => removeStationMapping(index)}
                            />
                        ))}

                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={addStationMapping}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {t('printerRouting.addStation', 'Add Station Mapping')}
                        </Button>
                    </div>
                )}
            </div>

            {/* Order Type Rules */}
            <div
                data-theme={theme}
                className={cn(
                    'rounded-xl border-2 overflow-hidden',
                    'bg-slate-800/50 border-slate-700/50',
                    'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                )}
            >
                <div
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedSection(expandedSection === 'ordertypes' ? null : 'ordertypes')}
                >
                    <div>
                        <h3
                            data-theme={theme}
                            className={cn(
                                'font-bold text-sm',
                                'text-white',
                                'data-[theme=light]:text-slate-900',
                            )}
                        >
                            {t('printerRouting.orderTypeRules', 'Order Type Rules')}
                        </h3>
                        <p className="text-xs text-slate-400">
                            {localConfig.orderTypeRules.length} {language === 'ar' ? 'قواعد' : 'rules'}
                        </p>
                    </div>
                    {expandedSection === 'ordertypes' ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                </div>

                {expandedSection === 'ordertypes' && (
                    <div className="p-4 pt-0 space-y-3">
                        {localConfig.orderTypeRules.map((rule, index) => (
                            <OrderTypeRuleEditor
                                key={index}
                                rule={rule}
                                index={index}
                                printers={printers}
                                templates={templates}
                                onUpdate={(updates) => updateOrderTypeRule(index, updates)}
                                onRemove={() => removeOrderTypeRule(index)}
                            />
                        ))}

                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={addOrderTypeRule}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {t('printerRouting.addOrderTypeRule', 'Add Order Type Rule')}
                        </Button>
                    </div>
                )}
            </div>

            {/* Priority Configuration */}
            <div
                data-theme={theme}
                className={cn(
                    'rounded-xl border-2 overflow-hidden',
                    'bg-slate-800/50 border-slate-700/50',
                    'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                )}
            >
                <div
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedSection(expandedSection === 'priority' ? null : 'priority')}
                >
                    <div>
                        <h3
                            data-theme={theme}
                            className={cn(
                                'font-bold text-sm',
                                'text-white',
                                'data-[theme=light]:text-slate-900',
                            )}
                        >
                            {t('printerRouting.priorityConfig', 'Priority Configuration')}
                        </h3>
                        <p className="text-xs text-slate-400">
                            {localConfig.priorityConfig.levels.length} {language === 'ar' ? 'مستويات' : 'levels'}
                        </p>
                    </div>
                    {expandedSection === 'priority' ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                </div>

                {expandedSection === 'priority' && (
                    <div className="p-4 pt-0 space-y-2">
                        {localConfig.priorityConfig.levels.map((level, index) => (
                            <div
                                key={index}
                                data-theme={theme}
                                className={cn(
                                    'rounded-lg p-3 flex items-center justify-between',
                                    'bg-slate-700/30',
                                    'data-[theme=light]:bg-slate-100',
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        'px-2 py-1 rounded text-xs font-bold',
                                        level.queuePosition === 'front'
                                            ? 'bg-orange-500/20 text-orange-400'
                                            : 'bg-slate-500/20 text-slate-400',
                                    )}>
                                        Level {level.level}
                                    </span>
                                    <span
                                        data-theme={theme}
                                        className={cn(
                                            'text-sm',
                                            'text-white',
                                            'data-[theme=light]:text-slate-900',
                                        )}
                                    >
                                        {level.name}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-400">
                                    {level.queuePosition === 'front'
                                        ? t('printerRouting.frontQueue', 'Front of Queue')
                                        : t('printerRouting.backQueue', 'Back of Queue')}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface StationMappingEditorProps {
    mapping: StationMapping;
    index: number;
    stations: Array<{ id: string; code: string; name: string }>;
    printers: Array<{ id: string; name: string; type: string; isActive: boolean }>;
    templates: Array<{ id: string; name: string; paperSize: string }>;
    onUpdate: (updates: Partial<StationMapping>) => void;
    onRemove: () => void;
}

function StationMappingEditor({
    mapping,
    stations,
    printers,
    templates,
    onUpdate,
    onRemove,
}: StationMappingEditorProps) {
    const { t } = useTranslation('admin');
    const { theme } = useSettingsStore();

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            data-theme={theme}
            className={cn(
                'rounded-lg p-3 border-2 space-y-3',
                'bg-slate-700/30 border-slate-600/30',
                'data-[theme=light]:bg-slate-100 data-[theme=light]:border-slate-300',
            )}
        >
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">
                    {t('printerRouting.mapping', 'Mapping')} #{mapping.index + 1}
                </span>
                <button
                    onClick={onRemove}
                    className="p-1 rounded hover:bg-red-500/20 transition-colors"
                >
                    <Trash2 className="w-4 h-4 text-red-400" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {/* Station */}
                <div>
                    <label className="text-xs text-slate-400 block mb-1">
                        {t('printerRouting.station', 'Station')}
                    </label>
                    <select
                        value={mapping.stationId}
                        onChange={(e) => onUpdate({ stationId: e.target.value })}
                        data-theme={theme}
                        className={cn(
                            'w-full px-2 py-1.5 rounded-lg border text-sm',
                            'bg-slate-800 border-slate-700',
                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-300',
                            'text-white',
                            'data-[theme=light]:text-slate-900',
                        )}
                    >
                        <option value="">{t('select', 'Select')}...</option>
                        {stations.map((station) => (
                            <option key={station.id} value={station.id}>
                                {station.name} ({station.code})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Primary Printer */}
                <div>
                    <label className="text-xs text-slate-400 block mb-1">
                        {t('printerRouting.primaryPrinter', 'Primary Printer')}
                    </label>
                    <select
                        value={mapping.primaryPrinterId}
                        onChange={(e) => onUpdate({ primaryPrinterId: e.target.value })}
                        data-theme={theme}
                        className={cn(
                            'w-full px-2 py-1.5 rounded-lg border text-sm',
                            'bg-slate-800 border-slate-700',
                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-300',
                            'text-white',
                            'data-[theme=light]:text-slate-900',
                        )}
                    >
                        <option value="">{t('select', 'Select')}...</option>
                        {printers.filter((p) => p.isActive).map((printer) => (
                            <option key={printer.id} value={printer.id}>
                                {printer.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Template */}
                <div>
                    <label className="text-xs text-slate-400 block mb-1">
                        {t('printerRouting.template', 'Template')}
                    </label>
                    <select
                        value={mapping.templateId}
                        onChange={(e) => onUpdate({ templateId: e.target.value })}
                        data-theme={theme}
                        className={cn(
                            'w-full px-2 py-1.5 rounded-lg border text-sm',
                            'bg-slate-800 border-slate-700',
                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-300',
                            'text-white',
                            'data-[theme=light]:text-slate-900',
                        )}
                    >
                        <option value="">{t('select', 'Select')}...</option>
                        {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                                {template.name} ({template.paperSize})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Fallover Config */}
            <div>
                <label className="flex items-center gap-2 text-xs text-slate-400">
                    <input
                        type="checkbox"
                        checked={mapping.falloverConfig?.enabled ?? true}
                        onChange={(e) =>
                            onUpdate({
                                falloverConfig: {
                                    ...mapping.falloverConfig,
                                    enabled: e.target.checked,
                                },
                            })
                        }
                        className="rounded"
                    />
                    {t('printerRouting.enableFallover', 'Enable Fallover')}
                </label>
            </div>
        </motion.div>
    );
}

interface OrderTypeRuleEditorProps {
    rule: OrderTypeRule;
    index: number;
    printers: Array<{ id: string; name: string; type: string; isActive: boolean }>;
    templates: Array<{ id: string; name: string; paperSize: string }>;
    onUpdate: (updates: Partial<OrderTypeRule>) => void;
    onRemove: () => void;
}

function OrderTypeRuleEditor({
    rule,
    printers,
    templates,
    onUpdate,
    onRemove,
}: OrderTypeRuleEditorProps) {
    const { t } = useTranslation('admin');
    const { theme } = useSettingsStore();

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            data-theme={theme}
            className={cn(
                'rounded-lg p-3 border-2 space-y-3',
                'bg-slate-700/30 border-slate-600/30',
                'data-[theme=light]:bg-slate-100 data-[theme=light]:border-slate-300',
            )}
        >
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400">
                    {rule.orderType}
                </span>
                <button
                    onClick={onRemove}
                    className="p-1 rounded hover:bg-red-500/20 transition-colors"
                >
                    <Trash2 className="w-4 h-4 text-red-400" />
                </button>
            </div>

            <div className="space-y-2">
                {/* Auto Print Options */}
                <label className="flex items-center gap-2 text-xs text-slate-400">
                    <input
                        type="checkbox"
                        checked={rule.autoPrint?.customerReceipt ?? false}
                        onChange={(e) =>
                            onUpdate({
                                autoPrint: {
                                    ...rule.autoPrint,
                                    customerReceipt: e.target.checked,
                                },
                            })
                        }
                        className="rounded"
                    />
                    {t('printerRouting.autoPrintReceipt', 'Auto-print Customer Receipt')}
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-400">
                    <input
                        type="checkbox"
                        checked={rule.autoPrint?.kitchenTickets ?? false}
                        onChange={(e) =>
                            onUpdate({
                                autoPrint: {
                                    ...rule.autoPrint,
                                    kitchenTickets: e.target.checked,
                                },
                            })
                        }
                        className="rounded"
                    />
                    {t('printerRouting.autoPrintKitchen', 'Auto-print Kitchen Tickets')}
                </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {/* Receipt Printer */}
                <div>
                    <label className="text-xs text-slate-400 block mb-1">
                        {t('printerRouting.receiptPrinter', 'Receipt Printer')}
                    </label>
                    <select
                        value={rule.receiptPrinterId}
                        onChange={(e) => onUpdate({ receiptPrinterId: e.target.value })}
                        data-theme={theme}
                        className={cn(
                            'w-full px-2 py-1.5 rounded-lg border text-sm',
                            'bg-slate-800 border-slate-700',
                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-300',
                            'text-white',
                            'data-[theme=light]:text-slate-900',
                        )}
                    >
                        <option value="">{t('select', 'Select')}...</option>
                        {printers.filter((p) => p.isActive).map((printer) => (
                            <option key={printer.id} value={printer.id}>
                                {printer.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Receipt Template */}
                <div>
                    <label className="text-xs text-slate-400 block mb-1">
                        {t('printerRouting.receiptTemplate', 'Receipt Template')}
                    </label>
                    <select
                        value={rule.receiptTemplateId}
                        onChange={(e) => onUpdate({ receiptTemplateId: e.target.value })}
                        data-theme={theme}
                        className={cn(
                            'w-full px-2 py-1.5 rounded-lg border text-sm',
                            'bg-slate-800 border-slate-700',
                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-300',
                            'text-white',
                            'data-[theme=light]:text-slate-900',
                        )}
                    >
                        <option value="">{t('select', 'Select')}...</option>
                        {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                                {template.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </motion.div>
    );
}

export default PrinterRoutingConfigEditor;
