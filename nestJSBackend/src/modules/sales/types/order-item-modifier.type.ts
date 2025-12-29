/**
 * Modifier selection stored on order item.
 * Captures complete snapshot of modifier state at time of order.
 *
 * @example
 * {
 *   modifierId: "uuid-size-group",
 *   modifierName: "Size",
 *   optionId: "uuid-large-option",
 *   optionName: "Large",
 *   priceAdjustment: "4.000",
 *   quantity: 1
 * }
 */
export interface OrderItemModifier {
    /** UUID of the modifier group from modifiers table */
    modifierId: string;

    /** Display name of modifier group (snapshot) */
    modifierName: string;

    /** UUID of selected option from modifier_options table */
    optionId: string;

    /** Display name of selected option (snapshot) */
    optionName: string;

    /**
     * Price adjustment from this modifier.
     * Stored as string for decimal precision (10,3).
     * Positive for upcharge, negative for discount.
     */
    priceAdjustment: string;

    /**
     * Quantity of this modifier selection.
     * Usually 1, but can be more for extras like "double espresso".
     */
    quantity: number;
}
