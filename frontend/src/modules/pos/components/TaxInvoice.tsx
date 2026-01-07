import { useMemo } from 'react';
import { Receipt, Download, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { cn } from '@/lib/utils';
import { PriceDisplay } from '@/components/shared';
import { Button } from '@/components/ui';

export interface TaxInvoiceProps {
    /** Invoice number */
    invoiceNumber: string;
    /** Invoice date/time */
    invoiceDate: Date;
    /** Seller/Vendor information */
    sellerInfo: {
        name: string;
        taxNumber: string;
        address?: string;
        phone?: string;
    };
    /** Customer information (optional for B2C) */
    customerInfo?: {
        name: string;
        vatNumber?: string;
        address?: string;
    };
    /** Line items */
    items: Array<{
        id: string;
        name: string;
        quantity: number;
        unitPrice: string;
        totalPrice: string;
    }>;
    /** Subtotal before tax */
    subtotal: string;
    /** VAT/Tax amount */
    taxAmount: string;
    /** VAT rate (e.g., 15) */
    taxRate: number;
    /** Discounts applied */
    discountAmount?: string;
    /** Final total */
    total: string;
    /** Payment method */
    paymentMethod: string;
    /** Invoice hash for ZATCA compliance */
    invoiceHash?: string;
    /** QR code data (TLV encoded) */
    qrCodeData?: string;
    /** Optional: on print/download actions */
    onPrint?: () => void;
    onDownload?: () => void;
    onShare?: () => void;
}

/**
 * Tax Invoice Component
 *
 * Displays a ZATCA-compliant tax invoice with:
 * - Invoice number and date
 * - Seller information with tax number
 * - Customer information (if applicable)
 * - Line items with quantities and prices
 * - VAT breakdown (15%)
 * - Invoice hash (SHA-256)
 * - QR code with TLV encoding
 *
 * @see https://zatca.gov.sa/E-InvoicingSystems/Basic/
 */
export function TaxInvoice({
    invoiceNumber,
    invoiceDate,
    sellerInfo,
    customerInfo,
    items,
    subtotal,
    taxAmount,
    taxRate,
    discountAmount,
    total,
    paymentMethod,
    invoiceHash,
    qrCodeData,
    onPrint,
    onDownload,
    onShare,
}: TaxInvoiceProps) {
    const { t, language } = useTranslation('pos');
    const { theme } = useSettingsStore();

    const formattedDate = useMemo(() => {
        return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        }).format(invoiceDate);
    }, [invoiceDate, language]);

    return (
        <div
            data-testid="tax-invoice"
            data-theme={theme}
            className={cn(
                'max-w-2xl mx-auto bg-white text-slate-900 p-6 rounded-lg shadow-lg',
                'print:shadow-none print:rounded-none',
                'data-[theme=dark]:bg-slate-900 data-[theme=dark]:text-white',
            )}
        >
            {/* Header */}
            <div className="border-b border-slate-300 pb-4 mb-4 data-[theme=dark]:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Receipt className="w-6 h-6 text-cyan-600" />
                        <h1 className="text-xl font-bold">
                            {language === 'ar' ? 'فاتورة ضريبية' : 'Tax Invoice'}
                        </h1>
                    </div>
                    <div className="text-right">
                        <div
                            data-testid="invoice-number"
                            className="font-mono font-bold text-lg"
                        >
                            {language === 'ar' ? 'رقم الفاتورة: ' : 'Invoice #: '}
                            {invoiceNumber}
                        </div>
                        <div data-testid="invoice-date" className="text-sm text-slate-600">
                            {formattedDate}
                        </div>
                    </div>
                </div>
            </div>

            {/* Seller Information */}
            <div className="mb-4 p-3 bg-slate-50 rounded data-[theme=dark]:bg-slate-800">
                <h2 className="font-bold text-sm mb-2">
                    {language === 'ar' ? 'معلومات البائع' : 'Seller Information'}
                </h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <span className="text-slate-600">
                            {language === 'ar' ? 'الاسم: ' : 'Name: '}
                        </span>
                        <span data-testid="seller-name">{sellerInfo.name}</span>
                    </div>
                    <div>
                        <span className="text-slate-600">
                            {language === 'ar' ? 'الرقم الضريبي: ' : 'Tax No: '}
                        </span>
                        <span data-testid="tax-number">{sellerInfo.taxNumber}</span>
                    </div>
                    {sellerInfo.address && (
                        <div className="col-span-2">
                            <span className="text-slate-600">
                                {language === 'ar' ? 'العنوان: ' : 'Address: '}
                            </span>
                            {sellerInfo.address}
                        </div>
                    )}
                    {sellerInfo.phone && (
                        <div>
                            <span className="text-slate-600">
                                {language === 'ar' ? 'الهاتف: ' : 'Phone: '}
                            </span>
                            {sellerInfo.phone}
                        </div>
                    )}
                </div>
            </div>

            {/* Customer Information (if applicable) */}
            {customerInfo && (
                <div className="mb-4 p-3 bg-slate-50 rounded data-[theme=dark]:bg-slate-800">
                    <h2 className="font-bold text-sm mb-2">
                        {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
                    </h2>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span className="text-slate-600">
                                {language === 'ar' ? 'الاسم: ' : 'Name: '}
                            </span>
                            <span data-testid="customer-name">{customerInfo.name}</span>
                        </div>
                        {customerInfo.vatNumber && (
                            <div>
                                <span className="text-slate-600">
                                    {language === 'ar' ? 'الرقم الضريبي: ' : 'VAT No: '}
                                </span>
                                {customerInfo.vatNumber}
                            </div>
                        )}
                        {customerInfo.address && (
                            <div className="col-span-2">
                                <span className="text-slate-600">
                                    {language === 'ar' ? 'العنوان: ' : 'Address: '}
                                </span>
                                {customerInfo.address}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Line Items */}
            <div className="mb-4">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b-2 border-slate-300 data-[theme=dark]:border-slate-700">
                            <th className="text-left py-2">
                                {language === 'ar' ? 'الصنف' : 'Item'}
                            </th>
                            <th className="text-center py-2">
                                {language === 'ar' ? 'الكمية' : 'Qty'}
                            </th>
                            <th className="text-right py-2">
                                {language === 'ar' ? 'السعر' : 'Price'}
                            </th>
                            <th className="text-right py-2">
                                {language === 'ar' ? 'الإجمالي' : 'Total'}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr
                                key={item.id}
                                className="border-b border-slate-200 data-[theme=dark]:border-slate-800"
                            >
                                <td className="py-2" data-testid="invoice-item-description">
                                    {item.name}
                                </td>
                                <td className="text-center py-2">{item.quantity}</td>
                                <td className="text-right py-2">
                                    <PriceDisplay value={item.unitPrice} size="sm" />
                                </td>
                                <td className="text-right py-2 font-medium">
                                    <PriceDisplay value={item.totalPrice} size="sm" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="space-y-2 border-t-2 border-slate-300 pt-4 data-[theme=dark]:border-slate-700">
                <div className="flex justify-between text-sm">
                    <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                    <span data-testid="invoice-subtotal">
                        <PriceDisplay value={subtotal} size="sm" />
                    </span>
                </div>

                {discountAmount && parseFloat(discountAmount) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                        <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
                        <span>
                            -<PriceDisplay value={discountAmount} size="sm" />
                        </span>
                    </div>
                )}

                <div className="flex justify-between text-sm">
                    <span>
                        {language === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT'} ({taxRate}%)
                    </span>
                    <span data-testid="vat-amount">
                        <PriceDisplay value={taxAmount} size="sm" />
                    </span>
                </div>

                <div className="flex justify-between text-lg font-bold border-t border-slate-300 pt-2 data-[theme=dark]:border-slate-700">
                    <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                    <span data-testid="invoice-total">
                        <PriceDisplay value={total} size="lg" variant="primary" />
                    </span>
                </div>

                <div className="flex justify-between text-sm text-slate-600 pt-1">
                    <span>{language === 'ar' ? 'طريقة الدفع' : 'Payment'}</span>
                    <span>{paymentMethod}</span>
                </div>
            </div>

            {/* ZATCA Compliance Section */}
            <div className="mt-6 pt-4 border-t border-slate-300 data-[theme=dark]:border-slate-700">
                {/* Invoice Hash */}
                {invoiceHash && (
                    <div className="mb-4 p-2 bg-slate-50 rounded text-xs data-[theme=dark]:bg-slate-800">
                        <div className="text-slate-600 mb-1">
                            {language === 'ar' ? 'تجزئة الفاتورة (SHA-256):' : 'Invoice Hash (SHA-256):'}
                        </div>
                        <div
                            data-testid="invoice-hash"
                            className="font-mono break-all text-slate-800 data-[theme=dark]:text-slate-200"
                        >
                            {invoiceHash}
                        </div>
                    </div>
                )}

                {/* QR Code */}
                {qrCodeData && (
                    <div className="flex justify-center mb-4">
                        <div
                            data-testid="qr-code"
                            className="p-2 bg-white border-2 border-slate-300 rounded"
                        >
                            {/* QR Code rendering - using a simple placeholder for now */}
                            <div className="w-32 h-32 bg-slate-100 flex items-center justify-center">
                                <span className="text-xs text-center text-slate-500">
                                    {language === 'ar' ? 'رمز الاستجابة السريعة' : 'QR Code'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* VAT Rate Display */}
                <div className="text-center text-xs text-slate-600" data-testid="vat-rate">
                    {language === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT'}: {taxRate}%
                </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-center gap-3 no-print">
                {onPrint && (
                    <Button variant="secondary" size="sm" onClick={onPrint} className="gap-2">
                        <Receipt className="w-4 h-4" />
                        {language === 'ar' ? 'طباعة' : 'Print'}
                    </Button>
                )}
                {onDownload && (
                    <Button variant="secondary" size="sm" onClick={onDownload} className="gap-2">
                        <Download className="w-4 h-4" />
                        {language === 'ar' ? 'تحميل' : 'Download'}
                    </Button>
                )}
                {onShare && (
                    <Button variant="secondary" size="sm" onClick={onShare} className="gap-2">
                        <Share2 className="w-4 h-4" />
                        {language === 'ar' ? 'مشاركة' : 'Share'}
                    </Button>
                )}
            </div>
        </div>
    );
}

export default TaxInvoice;
