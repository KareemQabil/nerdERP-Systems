import { Trash2, Plus, Minus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CartItem as CartItemType } from '@/modules/sales/store/cartStore';

export interface CartItemProps {
    item: CartItemType;
    onUpdateQuantity: (itemId: string, quantity: string) => void;
    onRemove: (itemId: string) => void;
}

/**
 * CartItem Component (PHASE 2B + RESTAURANT WORKFLOW)
 * Compact, zero-confusion row with RTL layout + Status indicators
 * 
 * Layout (RTL):
 * [Image] [Name + Breakdown + STATUS BADGE] [Total + Controls]
 * 
 * Status Visual States:
 * - NEW: White background (editable)
 * - SENT: Gray background, locked (needs auth to void)
 * - VOIDED: Red background, strikethrough
 */
export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
    const quantity = parseFloat(item.quantity);
    const unitPrice = parseFloat(item.unitPrice);
    const lineTotal = parseFloat(item.lineTotal);

    const handleIncrease = () => {
        // Can't modify SENT or VOIDED items
        if (item.status !== 'NEW') return;

        const newQty = (quantity + 1).toFixed(3);
        onUpdateQuantity(item.id, newQty);
    };

    const handleDecrease = () => {
        // Can't modify SENT or VOIDED items
        if (item.status !== 'NEW') return;

        if (quantity > 1) {
            const newQty = (quantity - 1).toFixed(3);
            onUpdateQuantity(item.id, newQty);
        }
    };

    return (
        <div className={cn(
            'flex items-start gap-3 p-3 border-b transition-all duration-200',
            // NEW: Editable, white background
            item.status === 'NEW' && 'bg-white/5 hover:bg-white/10 border-white/5',
            // SENT: Locked, gray background
            item.status === 'SENT' && 'bg-gray-800/50 border-gray-700/50 opacity-75',
            // VOIDED: Red, strikethrough
            item.status === 'VOIDED' && 'bg-red-900/20 border-red-800/50 opacity-60'
        )}>
            {/* Right: Product Image */}
            <div className={cn(
                "w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border",
                item.status === 'VOIDED' ? 'border-red-600/50 opacity-50' : 'bg-white/5 border-white/10'
            )}>
                {item.product.imageUrl ? (
                    <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className={cn(
                            "w-full h-full object-cover",
                            item.status === 'VOIDED' && 'grayscale'
                        )}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                        ☕
                    </div>
                )}
            </div>

            {/* Center: Product Info & Breakdown */}
            <div className="flex-1 min-w-0">
                {/* Row 0: Status Badge */}
                {item.status !== 'NEW' && (
                    <div className="mb-1.5">
                        {item.status === 'SENT' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-400 text-[10px] font-bold uppercase">
                                <span>🍳</span>
                                <span>Sent to Kitchen</span>
                            </span>
                        )}
                        {item.status === 'VOIDED' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/30 text-red-400 text-[10px] font-bold uppercase">
                                <AlertTriangle className="w-3 h-3" />
                                <span>VOIDED</span>
                                {item.voidReason && <span>({item.voidReason})</span>}
                            </span>
                        )}
                    </div>
                )}

                {/* Row 1: Product Name */}
                <h4 className={cn(
                    "text-sm font-bold truncate font-['Almarai']",
                    item.status === 'VOIDED' ? 'text-red-400 line-through' : 'text-white'
                )}>
                    {item.product.name}
                </h4>

                {/* Row 2: Base Price Calculation */}
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn(
                        "text-xs font-mono",
                        item.status === 'VOIDED' ? 'text-gray-600' : 'text-gray-400'
                    )}>
                        {unitPrice.toFixed(2)} × {Math.floor(quantity)}
                    </span>
                </div>

                {/* Row 3+: Modifiers List */}
                {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                        {item.selectedModifiers.map((modifier, index) => (
                            <div key={index} className="flex items-center gap-1.5 text-xs">
                                <span className="text-cyan-400">+</span>
                                <span className={cn(
                                    item.status === 'VOIDED' ? 'text-gray-600' : 'text-gray-300'
                                )}>
                                    {modifier.optionName || modifier.modifierName}
                                </span>
                                <span className={cn(
                                    "font-mono font-semibold",
                                    item.status === 'VOIDED' ? 'text-gray-600' : 'text-cyan-400'
                                )}>
                                    {parseFloat(modifier.price).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Special Instructions */}
                {item.specialInstructions && (
                    <div className={cn(
                        "mt-1 text-xs italic",
                        item.status === 'VOIDED' ? 'text-gray-600' : 'text-orange-400'
                    )}>
                        📝 {item.specialInstructions}
                    </div>
                )}
            </div>

            {/* Left: Price & Controls */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {/* Line Total */}
                <div className="text-right">
                    <div className={cn(
                        "text-base font-bold font-mono",
                        item.status === 'VOIDED' ? 'text-red-400 line-through' : 'text-white'
                    )}>
                        {lineTotal.toFixed(2)}
                    </div>
                    <div className={cn(
                        "text-[9px] uppercase",
                        item.status === 'VOIDED' ? 'text-gray-600' : 'text-gray-500'
                    )}>SAR</div>
                </div>

                {/* Quantity Controls + Delete */}
                <div className="flex items-center gap-1">
                    {item.status === 'NEW' && (
                        <>
                            <button
                                onClick={handleDecrease}
                                disabled={quantity <= 1}
                                className="w-6 h-6 rounded bg-slate-700/50 hover:bg-slate-700/70 disabled:opacity-30 border border-slate-600/50 flex items-center justify-center transition-colors"
                            >
                                <Minus className="w-3 h-3 text-slate-400" />
                            </button>
                            <span className="text-xs font-bold text-white font-mono w-6 text-center">
                                {Math.floor(quantity)}
                            </span>
                            <button
                                onClick={handleIncrease}
                                className="w-6 h-6 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 flex items-center justify-center transition-colors"
                            >
                                <Plus className="w-3 h-3 text-cyan-400" />
                            </button>
                        </>
                    )}

                    {item.status === 'SENT' && (
                        <span className="text-[10px] text-gray-500 px-2">
                            Qty: {Math.floor(quantity)}
                        </span>
                    )}

                    {item.status === 'VOIDED' && (
                        <span className="text-[10px] text-red-600 px-2">
                            Qty: {Math.floor(quantity)}
                        </span>
                    )}

                    {/* Delete/Void Button */}
                    {item.status !== 'VOIDED' && (
                        <button
                            onClick={() => onRemove(item.id)}
                            className={cn(
                                "w-6 h-6 rounded border flex items-center justify-center transition-colors ml-1",
                                item.status === 'NEW'
                                    ? "bg-red-500/10 hover:bg-red-500/20 border-red-400/30"
                                    : "bg-red-600/20 hover:bg-red-600/30 border-red-500/50"
                            )}
                            title={item.status === 'SENT' ? 'Void Item (Manager Auth Required)' : 'Remove Item'}
                        >
                            <Trash2 className={cn(
                                "w-3 h-3",
                                item.status === 'NEW' ? "text-red-400" : "text-red-500"
                            )} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
