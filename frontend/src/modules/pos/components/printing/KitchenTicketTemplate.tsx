/**
 * KitchenTicketTemplate Component
 *
 * 58mm kitchen ticket template for KDS printing.
 * Used by kitchen staff to prepare orders.
 *
 * Features:
 * - Order number and table
 * - Items grouped by category
 * - Modifiers emphasized
 * - No pricing (kitchen view only)
 * - Priority indicator
 * - Timestamp
 */

import { forwardRef } from 'react';
import { useSettingsStore } from '@/stores/settings.store';

export interface KitchenTicketData {
    orderNumber: string;
    tableNumber?: string;
    station: 'KITCHEN' | 'BAR' | 'DESSERT';
    priority: boolean;
    items: KitchenTicketItem[];
    timestamp: string;
    notes?: string;
}

export interface KitchenTicketItem {
    name: string;
    quantity: number;
    modifiers?: string[];
    notes?: string;
}

export interface KitchenTicketTemplateProps {
    data: KitchenTicketData;
    showLogo?: boolean;
    className?: string;
}

export const KitchenTicketTemplate = forwardRef<HTMLDivElement, KitchenTicketTemplateProps>(
    ({ data, showLogo = false, className }, ref) => {
        const { language } = useSettingsStore();

        const stationName = {
            KITCHEN: language === 'ar' ? 'المطبخ' : 'KITCHEN',
            BAR: language === 'ar' ? 'البار' : 'BAR',
            DESSERT: language === 'ar' ? 'الحلويات' : 'DESSERT',
        }[data.station];

        return (
            <div
                ref={ref}
                className={className}
                style={{
                    width: '58mm',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    padding: '3mm',
                    background: data.priority ? '#fffbeb' : '#fff',
                    color: '#000',
                }}
            >
                {/* Priority Banner */}
                {data.priority && (
                    <div
                        style={{
                            background: '#dc2626',
                            color: '#fff',
                            textAlign: 'center',
                            padding: '4px',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            fontSize: '14px',
                        }}
                    >
                        {language === 'ar' ? 'أولوية' : 'PRIORITY'}
                    </div>
                )}

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>#{data.orderNumber}</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>
                        {stationName}
                    </div>
                    {data.tableNumber && (
                        <div style={{ fontSize: '14px', marginTop: '4px' }}>
                            {language === 'ar' ? 'طاولة' : 'Table'}: {data.tableNumber}
                        </div>
                    )}
                    <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
                        {data.timestamp}
                    </div>
                </div>

                {/* Separator */}
                <div style={{ borderBottom: '1px dashed #000', marginBottom: '8px' }} />

                {/* Items */}
                {data.items.map((item, index) => (
                    <div key={index} style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline' }}>
                            <span
                                style={{
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    marginRight: '8px',
                                    minWidth: '30px',
                                }}
                            >
                                {item.quantity}
                            </span>
                            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.name}</span>
                        </div>

                        {item.modifiers && item.modifiers.length > 0 && (
                            <div style={{ fontSize: '11px', marginLeft: '38px', fontWeight: 'bold' }}>
                                {item.modifiers.map((mod, modIndex) => (
                                    <div key={modIndex}>• {mod}</div>
                                ))}
                            </div>
                        )}

                        {item.notes && (
                            <div
                                style={{
                                    fontSize: '10px',
                                    marginLeft: '38px',
                            fontStyle: 'italic',
                            marginTop: '2px',
                                }}
                            >
                                {language === 'ar' ? 'ملاحظة' : 'Note'}: {item.notes}
                            </div>
                        )}
                    </div>
                ))}

                {/* Order Notes */}
                {data.notes && (
                    <>
                        <div style={{ borderBottom: '1px dashed #000', marginBottom: '8px', marginTop: '8px' }} />
                        <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                            {language === 'ar' ? 'ملاحظات الطلب' : 'Order Notes'}:
                        </div>
                        <div style={{ fontSize: '11px' }}>{data.notes}</div>
                    </>
                )}

                {/* Separator */}
                <div style={{ borderBottom: '1px dashed #000', marginBottom: '8px', marginTop: '8px' }} />

                {/* Footer */}
                <div style={{ fontSize: '10px', textAlign: 'center' }}>
                    {language === 'ar' ? 'تاريخ الطباعة' : 'Printed'}: {new Date().toLocaleTimeString()}
                </div>
            </div>
        );
    }
);

KitchenTicketTemplate.displayName = 'KitchenTicketTemplate';

export default KitchenTicketTemplate;
