import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/app/hooks';
import { selectTheme } from '@/features/settings/slices/settingsSlice';
import { MainNavigation } from './MainNavigation';
import { LoadingSpinner } from '../feedback/LoadingSpinner';

/**
 * Main application layout with navigation sidebar
 * Handles the overall page structure for authenticated routes
 *
 * IMPORTANT: Navigation is ALWAYS on the RIGHT side regardless of RTL/LTR.
 * RTL only affects text flow within content areas, not the main layout structure.
 */
export function MainLayout() {
    // Get theme from Redux settings store
    const theme = useAppSelector(selectTheme);

    return (
        <div
            // CRITICAL: Set data-theme here so child component selectors work
            data-theme={theme}
            className={cn(
                'min-h-screen relative overflow-hidden',
                // Dark theme (default) - animated gradient with cyan glow
                'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
                'before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_120%,rgba(6,182,212,0.1),transparent_50%)]',
                // Light theme - clean white with soft cyan accent
                'data-[theme=light]:from-slate-50 data-[theme=light]:via-white data-[theme=light]:to-slate-100',
                'data-[theme=light]:before:bg-[radial-gradient(circle_at_50%_-20%,rgba(14,165,233,0.05),transparent_50%)]',
                // Luxury theme - rich black with gold accents
                'data-[theme=luxury]:from-black data-[theme=luxury]:via-neutral-950 data-[theme=luxury]:to-black',
                'data-[theme=luxury]:before:bg-[radial-gradient(circle_at_50%_120%,rgba(245,158,11,0.15),transparent_50%)]',
            )}
        >
            {/* Main Navigation Sidebar - ALWAYS on RIGHT regardless of RTL/LTR */}
            <MainNavigation />

            {/* Main Content Area - always use right margin for nav on right */}
            <main className="mr-20 min-h-screen relative z-10">
                <Suspense fallback={<PageLoader />}>
                    <Outlet />
                </Suspense>
            </main>
        </div>
    );
}

/** Full page loading state */
function PageLoader() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner size="lg" />
        </div>
    );
}
