import Decimal from 'decimal.js';

// Configure Decimal.js for Saudi currency (3 decimal places for Halala)
Decimal.set({
    precision: 20,
    rounding: Decimal.ROUND_HALF_UP
});

/**
 * Decimal utility class
 * MANDATORY for all money and quantity calculations
 * Based on FRONTEND_BLUEPRINT.md standards
 */
export class DecimalUtil {
    /**
     * Add two decimal numbers
     * @example DecimalUtil.add('10.500', '5.250') => Decimal(15.750)
     */
    static add(a: number | string, b: number | string): Decimal {
        return new Decimal(a).plus(b);
    }

    /**
     * Subtract two decimal numbers
     * @example DecimalUtil.subtract('10.500', '3.250') => Decimal(7.250)
     */
    static subtract(a: number | string, b: number | string): Decimal {
        return new Decimal(a).minus(b);
    }

    /**
     * Multiply two decimal numbers
     * @example DecimalUtil.multiply('5.500', '2') => Decimal(11.000)
     */
    static multiply(a: number | string, b: number | string): Decimal {
        return new Decimal(a).times(b);
    }

    /**
     * Divide two decimal numbers
     * @example DecimalUtil.divide('10.000', '3') => Decimal(3.333)
     */
    static divide(a: number | string, b: number | string): Decimal {
        return new Decimal(a).dividedBy(b);
    }

    /**
     * Calculate percentage of amount
     * @example DecimalUtil.calculatePercentage('100.000', '15') => Decimal(15.000)
     */
    static calculatePercentage(amount: number | string, percentage: number | string): Decimal {
        return new Decimal(amount).times(percentage).dividedBy(100);
    }

    /**
     * Round to specified decimal places
     * @param decimals Default 3 for Saudi currency
     * @example DecimalUtil.round('10.5678', 3) => '10.568'
     */
    static round(value: number | string, decimals: number = 3): string {
        return new Decimal(value).toFixed(decimals);
    }

    /**
     * Format for display (2 decimal places for UI)
     * @example DecimalUtil.formatForDisplay('10.567') => '10.57'
     */
    static formatForDisplay(value: number | string): string {
        return new Decimal(value).toFixed(2);
    }

    /**
     * Format for database storage (3 decimal places)
     * @example DecimalUtil.formatForStorage('10.5') => '10.500'
     */
    static formatForStorage(value: number | string): string {
        return new Decimal(value).toFixed(3);
    }

    /**
     * Sum an array of values
     * @example DecimalUtil.sum(['10.500', '5.250', '3.750']) => Decimal(19.500)
     */
    static sum(values: (number | string)[]): Decimal {
        return values.reduce(
            (acc, val) => acc.plus(val),
            new Decimal(0)
        );
    }

    /**
     * Compare two decimal values
     * @returns -1 if a < b, 0 if a === b, 1 if a > b
     */
    static compare(a: number | string, b: number | string): number {
        return new Decimal(a).comparedTo(b);
    }

    /**
     * Check if value is zero
     * @example DecimalUtil.isZero('0.000') => true
     */
    static isZero(value: number | string): boolean {
        return new Decimal(value).isZero();
    }

    /**
     * Check if value is positive
     * @example DecimalUtil.isPositive('10.500') => true
     */
    static isPositive(value: number | string): boolean {
        return new Decimal(value).isPositive();
    }

    /**
     * Check if value is negative
     * @example DecimalUtil.isNegative('-5.000') => true
     */
    static isNegative(value: number | string): boolean {
        return new Decimal(value).isNegative();
    }

    /**
     * Get absolute value
     * @example DecimalUtil.abs('-10.500') => Decimal(10.500)
     */
    static abs(value: number | string): Decimal {
        return new Decimal(value).abs();
    }
}
