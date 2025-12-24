import Decimal from 'decimal.js';

// Configure for Saudi currency (3 decimal places for Halala)
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// Type alias for all decimal-compatible input types
type DecimalInput = Decimal.Value; // Decimal | string | number

/**
 * Decimal utility functions matching backend precision
 * All money calculations must use these functions
 */
export class DecimalUtil {
    /**
     * Add two decimal numbers
     */
    static add(a: DecimalInput, b: DecimalInput): Decimal {
        return new Decimal(a).plus(b);
    }

    /**
     * Subtract two decimal numbers
     */
    static subtract(a: DecimalInput, b: DecimalInput): Decimal {
        return new Decimal(a).minus(b);
    }

    /**
     * Multiply two decimal numbers
     */
    static multiply(a: DecimalInput, b: DecimalInput): Decimal {
        return new Decimal(a).times(b);
    }

    /**
     * Divide two decimal numbers
     */
    static divide(a: DecimalInput, b: DecimalInput): Decimal {
        return new Decimal(a).dividedBy(b);
    }

    /**
     * Calculate percentage
     * @example calculatePercentage(100, 15) // 15.000
     */
    static calculatePercentage(amount: DecimalInput, percentage: DecimalInput): Decimal {
        return new Decimal(amount).times(percentage).dividedBy(100);
    }

    /**
     * Round to 3 decimal places (Saudi currency)
     */
    static round(value: DecimalInput, decimals = 3): string {
        return new Decimal(value).toFixed(decimals);
    }

    /**
     * Format for display (2 decimals for UI)
     */
    static formatForDisplay(value: DecimalInput): string {
        return new Decimal(value).toFixed(2);
    }

    /**
     * Compare two decimals
     * Returns: -1 (a < b), 0 (a === b), 1 (a > b)
     */
    static compare(a: DecimalInput, b: DecimalInput): number {
        return new Decimal(a).comparedTo(b);
    }

    /**
     * Check if value is zero
     */
    static isZero(value: DecimalInput): boolean {
        return new Decimal(value).isZero();
    }

    /**
     * Check if value is positive
     */
    static isPositive(value: DecimalInput): boolean {
        return new Decimal(value).isPositive();
    }

    /**
     * Check if value is negative
     */
    static isNegative(value: DecimalInput): boolean {
        return new Decimal(value).isNegative();
    }

    /**
     * Get absolute value
     */
    static abs(value: DecimalInput): Decimal {
        return new Decimal(value).abs();
    }

    /**
     * Sum array of decimals
     */
    static sum(values: DecimalInput[]): Decimal {
        return values.reduce<Decimal>(
            (acc, val) => acc.plus(new Decimal(val)),
            new Decimal(0)
        );
    }

    /**
     * Get minimum value
     */
    static min(a: DecimalInput, b: DecimalInput): Decimal {
        return Decimal.min(new Decimal(a), new Decimal(b));
    }

    /**
     * Get maximum value
     */
    static max(a: DecimalInput, b: DecimalInput): Decimal {
        return Decimal.max(new Decimal(a), new Decimal(b));
    }
}

// Type-safe decimal for React components
export type DecimalValue = Decimal | number | string;

// Convert backend decimal string to Decimal object
export const parseDecimal = (value: string | number | null | undefined): Decimal => {
    if (value === null || value === undefined) return new Decimal(0);
    return new Decimal(value);
};

// Convert Decimal to backend format (string with 3 decimals)
export const toBackendDecimal = (value: Decimal | number | string): string => {
    return new Decimal(value).toFixed(3);
};

// Format currency for display
export const formatCurrency = (
    value: number | string,
    currency = 'SAR',
    locale = 'ar-SA'
): string => {
    const numValue = new Decimal(value).toNumber();
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numValue);
};

// Export Decimal class for advanced usage
export { Decimal };
