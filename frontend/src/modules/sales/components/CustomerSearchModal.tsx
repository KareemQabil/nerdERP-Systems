/**
 * Customer Search Modal (Stub)
 * TODO: Implement customer search and selection
 */
import type { CustomerInfo } from '@/types/pos.types';

interface CustomerSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (customer: CustomerInfo) => void;
    selectedCustomerId?: string;
}

export function CustomerSearchModal({ isOpen, onClose }: CustomerSearchModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-lg font-semibold mb-4">Customer Search</h2>
                <p className="text-slate-500 mb-4">Customer search coming soon...</p>
                <button
                    onClick={onClose}
                    className="w-full py-2 bg-cyan-500 text-white rounded-lg"
                >
                    Close
                </button>
            </div>
        </div>
    );
}
