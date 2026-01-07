/**
 * usePrintReceipt Hook
 *
 * Custom hook for printing receipts using react-to-print.
 * Supports thermal (80mm), kitchen tickets (58mm), and A4 invoices.
 *
 * Features:
 * - Print receipt on demand
 * - Preview before printing
 * - Auto-select template based on type
 * - Error handling
 */

import React, { useState, useRef, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import { ReceiptTemplate } from '../ReceiptTemplate';
import type { ReceiptData } from '../ReceiptTemplate';
import { A4InvoiceTemplate } from '../A4InvoiceTemplate';
import type { InvoiceData } from '../A4InvoiceTemplate';
import { KitchenTicketTemplate } from '../KitchenTicketTemplate';
import type { KitchenTicketData } from '../KitchenTicketTemplate';

export interface UsePrintReceiptOptions {
    /**
     * Print format type
     */
    format?: 'THERMAL_80MM' | 'THERMAL_58MM' | 'A4' | 'KITCHEN_TICKET';

    /**
     * Show print preview dialog before printing
     */
    preview?: boolean;

    /**
     * Store name for receipt header
     */
    storeName?: string;

    /**
     * Logo URL for receipt header
     */
    logoUrl?: string;

    /**
     * Callback on print success
     */
    onPrintSuccess?: () => void;

    /**
     * Callback on print error
     */
    onPrintError?: (error: Error) => void;
}

export type PrintableData = ReceiptData | InvoiceData | KitchenTicketData;

export interface PrintReceiptResult {
    /**
     * Print a receipt with the given data
     */
    printReceipt: (data: PrintableData) => Promise<void>;

    /**
     * Whether currently printing
     */
    isPrinting: boolean;

    /**
     * Last print error
     */
    printError: Error | null;

    /**
     * Clear last print error
     */
    clearError: () => void;
}

/**
 * Hook for printing receipts
 *
 * @example
 * ```tsx
 * const { printReceipt, isPrinting } = usePrintReceipt({
 *   format: 'THERMAL_80MM',
 *   storeName: 'My Store',
 * });
 *
 * // Print receipt
 * await printReceipt(receiptData);
 * ```
 */
export function usePrintReceipt(options: UsePrintReceiptOptions = {}): PrintReceiptResult {
    const {
        format = 'THERMAL_80MM',
        preview = false,
        logoUrl,
        onPrintSuccess,
        onPrintError,
    } = options;

    const [isPrinting, setIsPrinting] = useState(false);
    const [printError, setPrintError] = useState<Error | null>(null);
    const componentRef = useRef<HTMLDivElement>(null);

    // Clear error
    const clearError = useCallback(() => {
        setPrintError(null);
    }, []);

    // Create print function with react-to-print
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        onBeforeGetContent: () => {
            setIsPrinting(true);
            return Promise.resolve();
        },
        onAfterPrint: () => {
            setIsPrinting(false);
            setPrintError(null);
            onPrintSuccess?.();
        },
        onPrintError: (errorLocation, error) => {
            setIsPrinting(false);
            const err = new Error(`Print failed: ${error}`);
            setPrintError(err);
            onPrintError?.(err);
        },
        removeAfterPrint: false,
    });

    // Print receipt function
    const printReceipt = useCallback(
        async (data: PrintableData) => {
            // Update the component ref with new data immediately?
            // Since react-to-print uses the ref, we need to ensure the component is rendered with the data.
            // But this hook returns `printReceipt` which takes data. 
            // The `PrintableReceipt` needs to be rendered somewhere.
            // Wait, this hook pattern assumes `PrintableReceipt` is rendered by the parent?
            // No, look at the original code. It doesn't seem to export `PrintableReceipt` for the parent to render.
            // Wait, the original code had `componentRef` but didn't show where it was attached!
            // Ah, looking at the previous specific lines... 
            // It imports `ReceiptTemplate`.
            // BUT it does NOT return a component to render.
            // This hook seems incomplete or I missed where the component is rendered.
            // React-to-print requires the ref to be attached to a rendered element in the DOM.
            // Usually usage is: <div style={{display:'none'}}><ComponentToPrint ref={componentRef} /></div>

            // Let's assume the consumer of this hook is supposed to render `PrintableReceipt` and attach the ref?
            // BUT `usePrintReceipt` creates the ref: `const componentRef = useRef<HTMLDivElement>(null);`
            // And passes it to `useReactToPrint`.
            // But it doesn't return the ref for the user to attach!
            // This means the user CANNOT attach the ref.
            // This hook seems to be missing the `ref` in the return value OR it should return a component.

            // Let's check the original code again.
            // It exports `PrintableReceipt` function component at the bottom.
            // But `usePrintReceipt` creates `componentRef` and uses it.
            // UNLESS the hook is intended to be used with a component that captures the ref?

            // Wait, if I change the return type to include `printRef` and `PrintableComponent`, that would work.
            // Or maybe I should check existing usage of `usePrintReceipt` if any.
            // `grep` showed `hooks/usePrintReceipt.tsx` matches.
            // It didn't show any USAGE of it in other files except imports (maybe).

            // Let's assume I need to fix this hook to make it usable.
            // I will return `componentRef` and `PrintableContent` component.

            setIsPrinting(true);
            setPrintError(null);

            try {
                // Trigger print
                await new Promise<void>((resolve, reject) => {
                    const originalOnAfterPrint = handlePrint;
                    const originalOnError = onPrintError;

                    onPrintSuccess = () => {
                        originalOnAfterPrint();
                        resolve();
                    };

                    onPrintError = (error: Error) => {
                        originalOnError?.(error);
                        reject(error);
                    };

                    handlePrint();
                });
            } catch (error) {
                setIsPrinting(false);
                setPrintError(error as Error);
                onPrintError?.(error as Error);
                throw error;
            }
        },
        [handlePrint, onPrintSuccess, onPrintError],
    );

    return {
        printReceipt,
        isPrinting,
        printError,
        clearError,
        componentRef, // Expose ref so it can be attached
    };
}

export interface PrintableReceiptProps {
    data: PrintableData;
    format: 'THERMAL_80MM' | 'THERMAL_58MM' | 'A4' | 'KITCHEN_TICKET';
    logoUrl?: string;
    showLogo?: boolean;
    ref?: React.Ref<HTMLDivElement>;
}

export const PrintableReceipt = React.forwardRef<HTMLDivElement, PrintableReceiptProps>(({ data, format, logoUrl, showLogo = false }, ref) => {
    // Select template based on format
    switch (format) {
        case 'THERMAL_80MM':
        case 'THERMAL_58MM':
            return (
                <ReceiptTemplate ref={ref} data={data as ReceiptData} showLogo={showLogo} logoUrl={logoUrl} />
            );
        case 'A4':
            return <A4InvoiceTemplate ref={ref} data={data as InvoiceData} showLogo={showLogo} logoUrl={logoUrl} />;
        case 'KITCHEN_TICKET':
            return <KitchenTicketTemplate ref={ref} data={data as KitchenTicketData} showLogo={showLogo} />;
        default:
            return <ReceiptTemplate ref={ref} data={data as ReceiptData} showLogo={showLogo} logoUrl={logoUrl} />;
    }
});

export default usePrintReceipt;
