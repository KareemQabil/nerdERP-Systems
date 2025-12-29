/**
 * Action Section Component
 * Bottom action bar for POS operations
 */

interface ActionSectionProps {
    onPayment: () => void;
    onDiscount?: () => void;
    onHold?: () => void;
    onClear?: () => void;
    itemCount: number;
    isSessionOpen: boolean;
}

export function ActionSection({
    onPayment,
    onDiscount,
    onHold,
    onClear,
    itemCount,
    isSessionOpen,
}: ActionSectionProps) {
    return (
        <div className="action-section">
            {/* Left Actions */}
            <div className="action-section__left">
                {onClear && (
                    <button
                        className="action-btn action-btn--secondary"
                        onClick={onClear}
                        disabled={itemCount === 0}
                    >
                        Clear
                    </button>
                )}
                {onHold && (
                    <button
                        className="action-btn action-btn--secondary"
                        onClick={onHold}
                        disabled={itemCount === 0}
                    >
                        Hold
                    </button>
                )}
                {onDiscount && (
                    <button
                        className="action-btn action-btn--secondary"
                        onClick={onDiscount}
                        disabled={itemCount === 0}
                    >
                        Discount
                    </button>
                )}
            </div>

            {/* Right Actions */}
            <div className="action-section__right">
                <button
                    className="action-btn action-btn--primary action-btn--large"
                    onClick={onPayment}
                    disabled={itemCount === 0 || !isSessionOpen}
                >
                    {!isSessionOpen ? 'Open Session' : `Payment (${itemCount})`}
                </button>
            </div>
        </div>
    );
}
