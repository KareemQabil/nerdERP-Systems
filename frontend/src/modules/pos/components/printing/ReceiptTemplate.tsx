/**
 * ReceiptTemplate Component
 *
 * 80mm thermal receipt template for POS printing.
 * Supports react-to-print and includes ZATCA QR code.
 *
 * Features:
 * - Store header with logo
 * - Order details
 * - Line items with modifiers
 * - Tax breakdown (VAT 15%)
 * - Payment info
 * - ZATCA QR code
 * - Footer with terms
 */

import { forwardRef, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSettingsStore } from '@/stores/settings.store';

export interface ReceiptData {
    storeName: string;
    storeAddress?: string;
    storePhone?: string;
    vatNumber?: string;
    orderNumber: string;
    orderDate: string;
    orderTime: string;
    cashierName: string;
    items: ReceiptItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    discount: number;
    total: number;
    paymentMethod: string;
    amountPaid: number;
    change?: number;
    includeZatcaQr?: boolean;
    zatcaQrData?: string;
}

export interface ReceiptItem {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    modifiers?: Array<{ name: string; price: number }>;
}

export interface ReceiptTemplateProps {
    data: ReceiptData;
    showLogo?: boolean;
    logoUrl?: string;
    className?: string;
}

export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>(
    ({ data, showLogo = false, logoUrl, className }, ref) => {
        const { language } = useSettingsStore();

        // Parse ZATCA QR data if present
        const qrContent = useMemo(() => {
            if (!data.zatcaQrData) return null;
            try {
                return JSON.parse(atob(data.zatcaQrData));
            } catch {
                return null;
            }
        }, [data.zatcaQrData]);

        return (
            <div
                ref={ref}
                className={className}
                style={{
                    width: '80mm',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    padding: '4mm',
                    background: '#fff',
                    color: '#000',
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    {showLogo && logoUrl && (
                        <img
                            src={logoUrl}
                            alt="Logo"
                            style={{ width: '32px', height: '32px', marginBottom: '4px' }}
                        />
                    )}
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{data.storeName}</div>
                    {data.storeAddress && (
                        <div style={{ fontSize: '10px' }}>{data.storeAddress}</div>
                    )}
                    {data.storePhone && (
                        <div style={{ fontSize: '10px' }}>{data.storePhone}</div>
                    )}
                    {data.vatNumber && (
                        <div style={{ fontSize: '10px' }}>
                            VAT: {data.vatNumber}
                        </div>
                    )}
                </div>

                {/* Separator */}
                <div style={{ borderBottom: '1px dashed #000', marginBottom: '8px' }} />

                {/* Order Info */}
                <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{language === 'ar' ? 'الطلب' : 'Order'}:</span>
                        <span>#{data.orderNumber}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{language === 'ar' ? 'التاريخ' : 'Date'}:</span>
                        <span>{data.orderDate}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{language === 'ar' ? 'الوقت' : 'Time'}:</span>
                        <span>{data.orderTime}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{language === 'ar' ? 'الكاشير' : 'Cashier'}:</span>
                        <span>{data.cashierName}</span>
                    </div>
                </div>

                {/* Separator */}
                <div style={{ borderBottom: '1px dashed #000', marginBottom: '8px' }} />

                {/* Items Header */}
                <div style={{ display: 'flex', fontWeight: 'bold', marginBottom: '4px', fontSize: '10px' }}>
                    <span style={{ flex: 1 }}>{language === 'ar' ? 'الصنف' : 'Item'}</span>
                    <span style={{ width: '40px', textAlign: 'center' }}>
                        {language === 'ar' ? 'كم' : 'Qty'}
                    </span>
                    <span style={{ width: '60px', textAlign: 'right' }}>
                        {language === 'ar' ? 'سعر' : 'Price'}
                    </span>
                </div>

                {/* Items */}
                {data.items.map((item, index) => (
                    <div key={index} style={{ marginBottom: '4px' }}>
                        <div style={{ display: 'flex', fontSize: '11px' }}>
                            <span style={{ flex: 1 }}>
                                {item.name}
                            </span>
                            <span style={{ width: '40px', textAlign: 'center' }}>
                                {item.quantity}
                            </span>
                            <span style={{ width: '60px', textAlign: 'right' }}>
                                {item.totalPrice.toFixed(2)}
                            </span>
                        </div>
                        {item.modifiers && item.modifiers.length > 0 && (
                            <div style={{ fontSize: '9px', paddingLeft: '4px', opacity: 0.8 }}>
                                {item.modifiers.map((mod, modIndex) => (
                                    <div key={modIndex}>
                                        + {mod.name} ({mod.price.toFixed(2)})
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* Separator */}
                <div style={{ borderBottom: '1px dashed #000', marginBottom: '8px', marginTop: '8px' }} />

                {/* Totals */}
                <div style={{ fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}:</span>
                        <span>{data.subtotal.toFixed(2)}</span>
                    </div>

                    {data.discount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{language === 'ar' ? 'الخصم' : 'Discount'}:</span>
                            <span>-{data.discount.toFixed(2)}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>
                            {language === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT'} ({(data.taxRate * 100).toFixed(0)}%):
                        </span>
                        <span>{data.taxAmount.toFixed(2)}</span>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            marginTop: '4px',
                            borderTop: '1px solid #000',
                            paddingTop: '4px',
                        }}
                    >
                        <span>{language === 'ar' ? 'الإجمالي' : 'TOTAL'}:</span>
                        <span>{data.total.toFixed(2)} {language === 'ar' ? 'ريال' : 'SAR'}</span>
                    </div>
                </div>

                {/* Separator */}
                <div style={{ borderBottom: '1px dashed #000', marginBottom: '8px', marginTop: '8px' }} />

                {/* Payment */}
                <div style={{ fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{language === 'ar' ? 'طريقة الدفع' : 'Payment'}:</span>
                        <span>{data.paymentMethod}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{language === 'ar' ? 'المدفوع' : 'Paid'}:</span>
                        <span>{data.amountPaid.toFixed(2)}</span>
                    </div>
                    {data.change !== undefined && data.change >= 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{language === 'ar' ? 'الباقي' : 'Change'}:</span>
                            <span>{data.change.toFixed(2)}</span>
                        </div>
                    )}
                </div>

                {/* ZATCA QR Code */}
                {data.includeZatcaQr && data.zatcaQrData && (
                    <>
                        <div style={{ marginTop: '12px', textAlign: 'center' }}>
                            <QRCodeSVG
                                value={data.zatcaQrData}
                                size={80}
                                level="L"
                                includeMargin={false}
                            />
                        </div>
                        <div style={{ fontSize: '8px', textAlign: 'center', marginTop: '4px' }}>
                            {language === 'ar' ? 'امسح للتحقق من الفاتورة' : 'Scan to verify invoice'}
                        </div>
                    </>
                )}

                {/* Separator */}
                <div style={{ borderBottom: '1px dashed #000', marginBottom: '8px', marginTop: '8px' }} />

                {/* Footer */}
                <div style={{ fontSize: '10px', textAlign: 'center' }}>
                    <div>{language === 'ar' ? 'شكراً لتسوقكم معنا' : 'Thank you for shopping with us'}</div>
                    <div>{language === 'ar' ? 'لا يوجد استرجاع أو استبدال بعد 14 يوم' : 'No returns or exchanges after 14 days'}</div>
                    <div style={{ marginTop: '8px', fontSize: '9px' }}>
                        {language === 'ar' ? 'فاتورة إلكترونية معتمضة من هيئة الزكاة' : 'ZATCA Certified E-Invoice'}
                    </div>
                </div>
            </div>
        );
    }
);

ReceiptTemplate.displayName = 'ReceiptTemplate';

export default ReceiptTemplate;
