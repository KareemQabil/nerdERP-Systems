/**
 * Manager EOD Modal (Stub)
 * End of Day report modal for managers
 */

interface ManagerEODModalProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: string;
    managerId: string;
    onComplete: () => void;
}

export function ManagerEODModal({ isOpen, onClose }: ManagerEODModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-lg font-semibold mb-4">End of Day Report</h2>
                <p className="text-slate-500 mb-4">EOD report generation coming soon...</p>
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
