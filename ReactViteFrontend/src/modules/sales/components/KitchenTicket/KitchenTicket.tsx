import React from 'react';
import type { CartItem } from '../../store/cartStore';

export interface KitchenTicketProps {
  referenceNote?: string;
  items: CartItem[];
  orderTime?: Date;
}

export const KitchenTicket = React.forwardRef<HTMLDivElement, KitchenTicketProps>(
  ({ referenceNote, items, orderTime = new Date() }, ref) => {
    return (
      <div ref={ref} className="kitchen-ticket">
        {/* Inline Styles for Thermal Printing */}
        <style>{`
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          
          .kitchen-ticket {
            width: 80mm;
            padding: 10mm;
            font-family: 'Courier New', monospace;
            background: white;
            color: black;
          }
          
          .kitchen-ticket-header {
            text-align: center;
            margin-bottom: 8mm;
            border-bottom: 2px dashed #000;
            padding-bottom: 5mm;
          }
          
          .kitchen-ticket-reference {
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 3mm;
            letter-spacing: 1px;
          }
          
          .kitchen-ticket-time {
            font-size: 14px;
            margin-top: 2mm;
          }
          
          .kitchen-ticket-item {
            margin-bottom: 6mm;
            border-bottom: 1px solid #ccc;
            padding-bottom: 4mm;
          }
          
          .kitchen-ticket-item-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 2mm;
          }
          
          .kitchen-ticket-quantity {
            font-size: 20px;
            font-weight: bold;
            display: inline-block;
            min-width: 30px;
            margin-right: 5mm;
          }
          
          .kitchen-ticket-modifiers {
            margin-left: 8mm;
            margin-top: 2mm;
          }
          
          .kitchen-ticket-modifier {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 1mm;
            text-transform: uppercase;
          }
          
          .kitchen-ticket-special {
            margin-left: 8mm;
            margin-top: 2mm;
            font-size: 13px;
            font-style: italic;
            background: #f0f0f0;
            padding: 2mm;
            border-left: 3px solid #000;
          }
          
          .kitchen-ticket-footer {
            text-align: center;
            margin-top: 8mm;
            padding-top: 5mm;
            border-top: 2px dashed #000;
            font-size: 12px;
          }
        `}</style>

        {/* HEADER */}
        <div className="kitchen-ticket-header">
          <div className="kitchen-ticket-reference">
            {referenceNote || 'COUNTER ORDER'}
          </div>
          <div className="kitchen-ticket-time">
            {orderTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })}
          </div>
        </div>

        {/* ITEMS */}
        {items.map((item, index) => (
          <div key={index} className="kitchen-ticket-item">
            <div>
              <span className="kitchen-ticket-quantity">
                {item.quantity}x
              </span>
              <span className="kitchen-ticket-item-name">
                {item.product.name}
              </span>
            </div>

            {/* Modifiers */}
            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
              <div className="kitchen-ticket-modifiers">
                {item.selectedModifiers.map((modifier, modIdx) => (
                  <div key={modIdx} className="kitchen-ticket-modifier">
                    → {modifier.modifierName || modifier.optionName}
                  </div>
                ))}
              </div>
            )}

            {/* Special Instructions */}
            {item.specialInstructions && (
              <div className="kitchen-ticket-special">
                NOTE: {item.specialInstructions}
              </div>
            )}
          </div>
        ))}

        {/* FOOTER */}
        <div className="kitchen-ticket-footer">
          <div>*** KITCHEN COPY ***</div>
          <div>{new Date().toLocaleDateString()}</div>
        </div>
      </div>
    );
  }
);

KitchenTicket.displayName = 'KitchenTicket';
