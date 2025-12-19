import React, { forwardRef } from 'react';
import type { Order } from '@/modules/sales/types/pos.types';

export interface ReceiptTemplateProps {
    order: Order;
}

/**
 * ReceiptTemplate Component  
 * Hidden printable receipt (thermal printer optimized)
 * 
 * Features:
 * - Hidden from screen, visible only @media print
 * - Minimalist black & white design
 * - Shows items with modifiers
 * - Totals breakdown
 * - Invoice number & timestamp
 */
export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>(
    ({ order }, ref) => {
        const formatDate = (isoDate: string) => {
            const date = new Date(isoDate);
            return date.toLocaleString('ar-SA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });
        };

        return (
            <div ref={ref} className="receipt-template">
                {/* Header */}
                <div className="receipt-header">
                    <h1>☕ NerdCafe POS</h1>
                    <p>نظام نقاط البيع</p>
                    <div className="receipt-divider" />
                </div>

                {/* Invoice Info */}
                <div className="receipt-info">
                    <div className="info-row">
                        <span>Invoice:</span>
                        <strong>{order.invoiceNumber}</strong>
                    </div>
                    <div className="info-row">
                        <span>Date:</span>
                        <span>{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="info-row">
                        <span>Payment:</span>
                        <span>{order.paymentMethod.toUpperCase()}</span>
                    </div>
                    <div className="receipt-divider" />
                </div>

                {/* Items */}
                <div className="receipt-items">
                    {order.items.map((item, index) => (
                        <div key={index} className="receipt-item">
                            <div className="item-header">
                                <span className="item-name">{item.product.name}</span>
                                <span className="item-price">{item.lineTotal.toFixed(2)}</span>
                            </div>
                            <div className="item-details">
                                <span>{item.quantity} × {item.unitPrice.toFixed(2)}</span>
                            </div>
                            {item.modifiers && item.modifiers.length > 0 && (
                                <div className="item-modifiers">
                                    {item.modifiers.map((mod, modIndex) => (
                                        <div key={modIndex} className="modifier-line">
                                            + {mod.name} (+{mod.price.toFixed(2)})
                                        </div>
                                    ))}
                                </div>
                            )}
                            {item.notes && (
                                <div className="item-notes">
                                    📝 {item.notes}
                                </div>
                            )}
                        </div>
                    ))}
                    <div className="receipt-divider" />
                </div>

                {/* Totals */}
                <div className="receipt-totals">
                    <div className="total-row">
                        <span>Subtotal:</span>
                        <span>{order.subtotal.toFixed(2)} SAR</span>
                    </div>
                    {order.discount > 0 && (
                        <div className="total-row">
                            <span>Discount:</span>
                            <span>-{order.discount.toFixed(2)} SAR</span>
                        </div>
                    )}
                    <div className="total-row">
                        <span>Tax (15%):</span>
                        <span>{order.tax.toFixed(2)} SAR</span>
                    </div>
                    <div className="receipt-divider-bold" />
                    <div className="total-row total-final">
                        <strong>TOTAL:</strong>
                        <strong>{order.total.toFixed(2)} SAR</strong>
                    </div>
                </div>

                {/* Footer */}
                <div className="receipt-footer">
                    <div className="receipt-divider" />
                    <p>Thank you! | شكراً لك</p>
                    <p className="qr-placeholder">[ZATCA QR CODE]</p>
                </div>

                {/* Print-only Styles */}
                <style>{`
                    /* Hide from screen, show only in print */
                    .receipt-template {
                        display: none;
                    }

                    @media print {
                        .receipt-template {
                            display: block;
                            width: 80mm;
                            font-family: 'Courier New', monospace;
                            font-size: 12px;
                            color: #000;
                            background: #fff;
                            padding: 10mm;
                        }

                        .receipt-header {
                            text-align: center;
                            margin-bottom: 5mm;
                        }

                        .receipt-header h1 {
                            font-size: 18px;
                            font-weight: bold;
                            margin: 0;
                        }

                        .receipt-header p {
                            font-size: 10px;
                            margin: 2px 0;
                        }

                        .receipt-divider {
                            border-bottom: 1px dashed #000;
                            margin: 3mm 0;
                        }

                        .receipt-divider-bold {
                            border-bottom: 2px solid #000;
                            margin: 3mm 0;
                        }

                        .receipt-info {
                            margin-bottom: 3mm;
                        }

                        .info-row {
                            display: flex;
                            justify-content: space-between;
                            margin: 1mm 0;
                        }

                        .receipt-items {
                            margin-bottom: 3mm;
                        }

                        .receipt-item {
                            margin-bottom: 3mm;
                        }

                        .item-header {
                            display: flex;
                            justify-content: space-between;
                            font-weight: bold;
                        }

                        .item-details {
                            font-size: 10px;
                            color: #666;
                            margin-top: 1mm;
                        }

                        .item-modifiers {
                            margin-left: 3mm;
                            margin-top: 1mm;
                        }

                        .modifier-line {
                            font-size: 10px;
                            color: #666;
                        }

                        .item-notes {
                            font-size: 10px;
                            font-style: italic;
                            margin-top: 1mm;
                        }

                        .receipt-totals {
                            margin-bottom: 5mm;
                        }

                        .total-row {
                            display: flex;
                            justify-content: space-between;
                            margin: 1mm 0;
                        }

                        .total-final {
                            font-size: 14px;
                            font-weight: bold;
                        }

                        .receipt-footer {
                            text-align: center;
                            margin-top: 5mm;
                        }

                        .receipt-footer p {
                            margin: 2mm 0;
                        }

                        .qr-placeholder {
                            font-size: 10px;
                            color: #666;
                            margin-top: 3mm;
                        }

                        /* Hide everything else when printing */
                        body * {
                            visibility: hidden;
                        }

                        .receipt-template,
                        .receipt-template * {
                            visibility: visible;
                        }

                        .receipt-template {
                            position: absolute;
                            left: 0;
                            top: 0;
                        }
                    }
                `}</style>
            </div>
        );
    }
);

ReceiptTemplate.displayName = 'ReceiptTemplate';
