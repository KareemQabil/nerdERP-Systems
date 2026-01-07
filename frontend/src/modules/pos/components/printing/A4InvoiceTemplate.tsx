/**
 * A4InvoiceTemplate Component
 *
 * A4 tax invoice template for ZATCA compliance.
 * Used for formal tax invoices with full details.
 *
 * Features:
 * - Company header with logo
 * - Invoice number, date, due date
 * - Bill to / Ship to
 * - Line items table
 * - Tax calculation details
 * - Bank details
 * - Terms and conditions
 * - ZATCA block with QR and signature
 */

import { forwardRef, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSettingsStore } from '@/stores/settings.store';
import type { ReceiptData } from './ReceiptTemplate';

export interface InvoiceData extends ReceiptData {
    invoiceNumber: string;
    dueDate?: string;
    billTo?: {
        name: string;
        address?: string;
        vatNumber?: string;
    };
    shipTo?: {
        name: string;
        address?: string;
    };
    bankDetails?: {
        bankName: string;
        accountNumber: string;
        iban: string;
    };
}

export interface ReceiptItem {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    modifiers?: Array<{ name: string; price: number }>;
}

export interface A4InvoiceTemplateProps {
    data: InvoiceData;
    showLogo?: boolean;
    logoUrl?: string;
    className?: string;
}

export const A4InvoiceTemplate = forwardRef<HTMLDivElement, A4InvoiceTemplateProps>(
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
                    width: '210mm',
                    minHeight: '297mm',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '12px',
                    padding: '15mm',
                    background: '#fff',
                    color: '#000',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                        {showLogo && logoUrl && (
                            <img
                                src={logoUrl}
                                alt="Logo"
                                style={{ width: '80px', height: '80px', marginBottom: '10px' }}
                            />
                        )}
                        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px 0' }}>
                            {data.storeName}
                        </h1>
                        {data.storeAddress && (
                            <div style={{ fontSize: '11px', color: '#666', marginBottom: '3px' }}>
                                {data.storeAddress}
                            </div>
                        )}
                        {data.storePhone && (
                            <div style={{ fontSize: '11px', color: '#666', marginBottom: '3px' }}>
                                {language === 'ar' ? 'هاتف' : 'Tel'}: {data.storePhone}
                            </div>
                        )}
                        {data.vatNumber && (
                            <div style={{ fontSize: '11px', color: '#666' }}>
                                {language === 'ar' ? 'الرقم الضريبي' : 'VAT Reg'}: {data.vatNumber}
                            </div>
                        )}
                    </div>

                    {/* Invoice Title */}
                    <div style={{ textAlign: 'right' }}>
                        <div
                            style={{
                                fontSize: '32px',
                                fontWeight: 'bold',
                                color: '#1e40af',
                                marginBottom: '10px',
                            }}
                        >
                            {language === 'ar' ? 'فاتورة ضريبية' : 'TAX INVOICE'}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                            <div>
                                <strong>{language === 'ar' ? 'رقم الفاتورة' : 'Invoice No'}:</strong> {data.invoiceNumber}
                            </div>
                            <div>
                                <strong>{language === 'ar' ? 'رقم الطلب' : 'Order No'}:</strong> #{data.orderNumber}
                            </div>
                            <div>
                                <strong>{language === 'ar' ? 'التاريخ' : 'Date'}:</strong> {data.orderDate}
                            </div>
                            {data.dueDate && (
                                <div>
                                    <strong>{language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}:</strong> {data.dueDate}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bill To / Ship To */}
                <div style={{ display: 'flex', gap: '40px', marginBottom: '20px' }}>
                    {data.billTo && (
                        <div style={{ flex: 1 }}>
                            <div
                                style={{
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    background: '#f3f4f6',
                                    padding: '5px 10px',
                                    marginBottom: '8px',
                                }}
                            >
                                {language === 'ar' ? 'فاتورة إلى' : 'BILL TO'}
                            </div>
                            <div style={{ fontSize: '12px' }}>
                                <div style={{ fontWeight: 'bold' }}>{data.billTo.name}</div>
                                {data.billTo.address && <div>{data.billTo.address}</div>}
                                {data.billTo.vatNumber && (
                                    <div style={{ fontSize: '11px', color: '#666' }}>
                                        VAT: {data.billTo.vatNumber}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {data.shipTo && (
                        <div style={{ flex: 1 }}>
                            <div
                                style={{
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    background: '#f3f4f6',
                                    padding: '5px 10px',
                                    marginBottom: '8px',
                                }}
                            >
                                {language === 'ar' ? 'شحن إلى' : 'SHIP TO'}
                            </div>
                            <div style={{ fontSize: '12px' }}>
                                <div style={{ fontWeight: 'bold' }}>{data.shipTo.name}</div>
                                {data.shipTo.address && <div>{data.shipTo.address}</div>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Items Table */}
                <table
                    style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        marginBottom: '20px',
                        fontSize: '11px',
                    }}
                >
                    <thead>
                        <tr style={{ background: '#1e40af', color: '#fff' }}>
                            <th
                                style={{
                                    border: '1px solid #ddd',
                                    padding: '8px',
                                    textAlign: 'left',
                                    width: '50%',
                                }}
                            >
                                {language === 'ar' ? 'الصنف' : 'Description'}
                            </th>
                            <th
                                style={{
                                    border: '1px solid #ddd',
                                    padding: '8px',
                                    textAlign: 'center',
                                    width: '10%',
                                }}
                            >
                                {language === 'ar' ? 'الكمية' : 'Qty'}
                            </th>
                            <th
                                style={{
                                    border: '1px solid #ddd',
                                    padding: '8px',
                                    textAlign: 'right',
                                    width: '15%',
                                }}
                            >
                                {language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}
                            </th>
                            <th
                                style={{
                                    border: '1px solid #ddd',
                                    padding: '8px',
                                    textAlign: 'right',
                                    width: '25%',
                                }}
                            >
                                {language === 'ar' ? 'الإجمالي' : 'Total'}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map((item, index) => (
                            <tr key={index}>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                    <div>{item.name}</div>
                                    {item.modifiers && item.modifiers.length > 0 && (
                                        <div style={{ fontSize: '10px', color: '#666' }}>
                                            {item.modifiers.map((mod) => mod.name).join(', ')}
                                        </div>
                                    )}
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                                    {item.quantity}
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>
                                    {item.unitPrice.toFixed(2)}
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>
                                    {item.totalPrice.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
                    <div style={{ width: '300px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                            <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}:</span>
                            <span>{data.subtotal.toFixed(2)} {language === 'ar' ? 'ريال' : 'SAR'}</span>
                        </div>

                        {data.discount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                <span>{language === 'ar' ? 'الخصم' : 'Discount'}:</span>
                                <span>-{data.discount.toFixed(2)} {language === 'ar' ? 'ريال' : 'SAR'}</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                            <span>
                                {language === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT'} ({(data.taxRate * 100).toFixed(0)}%):
                            </span>
                            <span>{data.taxAmount.toFixed(2)} {language === 'ar' ? 'ريال' : 'SAR'}</span>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '12px 0',
                                borderTop: '2px solid #000',
                                fontWeight: 'bold',
                                fontSize: '16px',
                            }}
                        >
                            <span>{language === 'ar' ? 'الإجمالي' : 'TOTAL'}:</span>
                            <span>{data.total.toFixed(2)} {language === 'ar' ? 'ريال' : 'SAR'}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Info */}
                <div style={{ marginBottom: '30px', fontSize: '11px' }}>
                    <div
                        style={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            background: '#f3f4f6',
                            padding: '5px 10px',
                            marginBottom: '8px',
                        }}
                    >
                        {language === 'ar' ? 'معلومات الدفع' : 'Payment Information'}
                    </div>
                    <div>
                        <strong>{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}:</strong> {data.paymentMethod}
                    </div>
                    <div>
                        <strong>{language === 'ar' ? 'المدفوع' : 'Amount Paid'}:</strong> {data.amountPaid.toFixed(2)} {language === 'ar' ? 'ريال' : 'SAR'}
                    </div>
                    {data.change !== undefined && data.change >= 0 && (
                        <div>
                            <strong>{language === 'ar' ? 'الباقي' : 'Change'}:</strong> {data.change.toFixed(2)} {language === 'ar' ? 'ريال' : 'SAR'}
                        </div>
                    )}
                </div>

                {/* Bank Details */}
                {data.bankDetails && (
                    <div style={{ marginBottom: '30px', fontSize: '11px' }}>
                        <div
                            style={{
                                fontSize: '12px',
                                fontWeight: 'bold',
                                background: '#f3f4f6',
                                padding: '5px 10px',
                                marginBottom: '8px',
                            }}
                        >
                            {language === 'ar' ? 'البنك' : 'Bank Details'}
                        </div>
                        <div>
                            <strong>{language === 'ar' ? 'البنك' : 'Bank'}:</strong> {data.bankDetails.bankName}
                        </div>
                        <div>
                            <strong>{language === 'ar' ? 'رقم الحساب' : 'Account No'}:</strong> {data.bankDetails.accountNumber}
                        </div>
                        <div>
                            <strong>IBAN:</strong> {data.bankDetails.iban}
                        </div>
                    </div>
                )}

                {/* ZATCA Compliance Block */}
                {data.includeZatcaQr && (
                    <div
                        style={{
                            border: '2px solid #1e40af',
                            padding: '15px',
                            marginBottom: '30px',
                            background: '#f8fafc',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
                                    {language === 'ar' ? 'توثيق زاتكا' : 'ZATCA Compliance'}
                                </div>
                                {qrContent && (
                                    <div style={{ fontSize: '10px', lineHeight: '1.6' }}>
                                        <div>
                                            <strong>{language === 'ar' ? 'البائع' : 'Seller'}:</strong> {qrContent.seller}
                                        </div>
                                        <div>
                                            <strong>{language === 'ar' ? 'الرقم الضريبي' : 'VAT No'}:</strong> {qrContent.vatNo}
                                        </div>
                                        <div>
                                            <strong>{language === 'ar' ? 'الوقت' : 'Timestamp'}:</strong> {new Date(qrContent.timestamp).toLocaleString()}
                                        </div>
                                        <div>
                                            <strong>{language === 'ar' ? 'الإجمالي' : 'Total'}:</strong> {qrContent.total} {language === 'ar' ? 'ريال' : 'SAR'}
                                        </div>
                                        <div>
                                            <strong>{language === 'ar' ? 'الضريبة' : 'VAT'}:</strong> {qrContent.vat} {language === 'ar' ? 'ريال' : 'SAR'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {data.zatcaQrData && (
                                <div style={{ textAlign: 'center' }}>
                                    <QRCodeSVG
                                        value={data.zatcaQrData}
                                        size={100}
                                        level="L"
                                        includeMargin={false}
                                    />
                                    <div style={{ fontSize: '9px', marginTop: '4px' }}>
                                        {language === 'ar' ? 'امسح للتحقق' : 'Scan to verify'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Terms and Conditions */}
                <div style={{ fontSize: '10px', color: '#666', marginBottom: '20px' }}>
                    <div
                        style={{
                            fontSize: '11px',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                        }}
                    >
                        {language === 'ar' ? 'الشروط والأحكام' : 'Terms and Conditions'}
                    </div>
                    <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                        <li>{language === 'ar' ? 'المدفوعات غير قابلة للاسترداد' : 'Payments are non-refundable'}</li>
                        <li>
                            {language === 'ar'
                                ? 'الأسعار خاضعة لضريبة القيمة المضافة بنسبة 15%'
                                : 'Prices are inclusive of 15% VAT'}
                        </li>
                        <li>
                            {language === 'ar'
                                ? 'يجب الإبلاغ عن أي أخطاء في الفاتورة خلال 7 أيام'
                                : 'Any errors in this invoice must be reported within 7 days'}
                        </li>
                        <li>
                            {language === 'ar'
                                ? 'هذه الفاتورة معتمدة من هيئة الزكاة والدخل'
                                : 'This invoice is certified by ZATCA'}
                        </li>
                    </ol>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', fontSize: '10px', color: '#999', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                    <div>{language === 'ar' ? 'شكراً لتعاملكم معنا' : 'Thank you for your business'}</div>
                    <div style={{ marginTop: '5px' }}>
                        {language === 'ar' ? 'فاتورة إلكترونية معتمضة' : 'Certified E-Invoice'} | {new Date().toLocaleString()}
                    </div>
                </div>
            </div>
        );
    }
);

A4InvoiceTemplate.displayName = 'A4InvoiceTemplate';

export default A4InvoiceTemplate;
