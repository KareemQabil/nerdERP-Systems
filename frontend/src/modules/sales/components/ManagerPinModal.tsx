/**
 * Manager PIN Modal (Stub)
 * TODO: Implement PIN authentication UI
 */
import type { PinAuthorizationRequest } from '@/types/pos.types';

interface ManagerPinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAuthorize: (pin: string, reason?: string) => Promise<boolean>;
    request: PinAuthorizationRequest;
}

export function ManagerPinModal({ isOpen, onClose }: ManagerPinModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-lg font-semibold mb-4">Manager Authorization</h2>
                <p className="text-slate-500 mb-4">PIN authentication coming soon...</p>
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
