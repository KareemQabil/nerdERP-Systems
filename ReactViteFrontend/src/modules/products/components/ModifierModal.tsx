import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Decimal from 'decimal.js';

interface ModifierModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: { id: string; name: string; salePrice: string } | null;
}

export const ModifierModal = ({ isOpen, onClose, product }: ModifierModalProps) => {
    const [quantity, setQuantity] = useState(1);
    const [size, setSize] = useState('medium');
    const [extras, setExtras] = useState<string[]>([]);

    if (!product) return null;

    const basePrice = new Decimal(product.salePrice);

    // Mock modifiers logic
    const sizePrice = size === 'large' ? new Decimal(5) : size === 'small' ? new Decimal(0) : new Decimal(2);
    const extrasPrice = new Decimal(extras.length * 3);

    const totalPrice = basePrice.plus(sizePrice).plus(extrasPrice).times(quantity);

    const handleExtraChange = (id: string, checked: boolean) => {
        if (checked) setExtras([...extras, id]);
        else setExtras(extras.filter(e => e !== id));
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] glass-modal border border-primary/20 text-white p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 pb-2 border-b border-white/5">
                    <DialogTitle className="text-xl font-bold flex justify-between items-center text-white font-arabic">
                        {product.name}
                        <span className="text-sm font-normal text-muted font-mono">#SKU-123</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Sizes */}
                    <div className="space-y-3">
                        <Label className="text-sm font-bold text-secondary">Size <span className="text-error">*</span></Label>
                        <RadioGroup defaultValue="medium" onValueChange={setSize} className="grid grid-cols-2 gap-3">
                            {['small', 'medium', 'large'].map((opt) => (
                                <div
                                    key={opt}
                                    className={cn(
                                        "flex flex-col items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer transition-all hover:bg-white/10",
                                        size === opt && "border-primary bg-primary/20"
                                    )}
                                    onClick={() => setSize(opt)}
                                >
                                    <RadioGroupItem value={opt} id={opt} className="hidden" />
                                    <Label htmlFor={opt} className="cursor-pointer w-full text-center font-bold capitalize">{opt}</Label>
                                    <span className={cn("text-xs mt-1", size === opt ? "text-primary" : "text-muted")}>
                                        {opt === 'small' ? 'Base Price' : opt === 'medium' ? '+2.00 SAR' : '+5.00 SAR'}
                                    </span>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    {/* Extras */}
                    <div className="space-y-3">
                        <Label className="text-sm font-bold text-secondary">Add-ons</Label>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { id: 'shot', label: 'Extra Espresso Shot', price: '+3.00' },
                                { id: 'milk', label: 'Almond Milk', price: '+2.00' }
                            ].map((addon) => (
                                <div
                                    key={addon.id}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors",
                                        extras.includes(addon.id) && "border-primary/50 bg-primary/10"
                                    )}
                                >
                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id={addon.id}
                                            onCheckedChange={(c) => handleExtraChange(addon.id, c as boolean)}
                                            className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-surface-dark"
                                        />
                                        <Label htmlFor={addon.id} className="cursor-pointer">{addon.label}</Label>
                                    </div>
                                    <span className="text-sm text-primary font-latin">{addon.price} SAR</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-surface-dark/50 border-t border-white/5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-1 border border-white/10">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 hover:text-white" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-bold w-4 text-center font-latin">{quantity}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 hover:text-white" onClick={() => setQuantity(quantity + 1)}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-muted block">Total Amount</span>
                            <span className="text-xl font-bold text-primary font-latin">{totalPrice.toFixed(2)} SAR</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-12 border-white/10 hover:bg-white/10 hover:text-white text-muted bg-transparent" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button className="h-12 btn-primary" onClick={onClose}>
                            Add to Cart
                        </Button>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
};
