import { Component, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error boundary component to catch and display errors gracefully
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        this.props.onReset?.();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex items-center justify-center min-h-[400px] p-8">
                    <div className={cn(
                        'flex flex-col items-center gap-4 max-w-md text-center p-8 rounded-2xl',
                        // Dark theme
                        'bg-slate-800/50 border border-slate-700',
                        // Light theme
                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:shadow-lg',
                    )}>
                        <div className={cn(
                            'w-16 h-16 rounded-full flex items-center justify-center',
                            'bg-red-400/10',
                            'data-[theme=light]:bg-red-50',
                        )}>
                            <AlertCircle className="w-8 h-8 text-red-400 data-[theme=light]:text-red-500" />
                        </div>

                        <div>
                            <h2 className={cn(
                                'text-lg font-bold mb-2',
                                'text-white',
                                'data-[theme=light]:text-slate-900',
                            )}>
                                حدث خطأ غير متوقع
                            </h2>
                            <p className={cn(
                                'text-sm',
                                'text-slate-400',
                                'data-[theme=light]:text-slate-600',
                            )}>
                                نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.
                            </p>
                        </div>

                        {/* Error details (dev only) */}
                        {import.meta.env.DEV && this.state.error && (
                            <pre className={cn(
                                'w-full p-3 rounded-lg text-xs text-start overflow-auto max-h-32',
                                'bg-slate-900 text-red-400',
                                'data-[theme=light]:bg-slate-100 data-[theme=light]:text-red-600',
                            )}>
                                {this.state.error.message}
                            </pre>
                        )}

                        <Button
                            onClick={this.handleReset}
                            leftIcon={<RefreshCw className="w-4 h-4" />}
                        >
                            إعادة المحاولة
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
