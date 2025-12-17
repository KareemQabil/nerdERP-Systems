import { createBrowserRouter, Navigate } from 'react-router-dom';
import POSPage from '@/pages/POSPage';
import UiKitPage from '@/pages/_debug/UiKit';

/**
 * Application Router
 * Configured using createBrowserRouter (React Router v6)
 */
export const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to="/pos" replace />,
    },
    {
        path: '/pos',
        element: <POSPage />,
    },
    {
        path: '/login',
        element: (
            <div className="min-h-screen bg-gradient-to-b from-[#023047] to-[#001219] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-[#e2e2e6] mb-4">Login Page</h1>
                    <p className="text-[#c2c7ce]">Coming soon...</p>
                </div>
            </div>
        ),
    },
    {
        path: '/ui-kit',
        element: <UiKitPage />,
    },
    {
        path: '*',
        element: (
            <div className="min-h-screen bg-gradient-to-b from-[#023047] to-[#001219] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-[#e2e2e6] mb-4">404</h1>
                    <p className="text-xl text-[#c2c7ce] mb-8">الصفحة غير موجودة</p>
                    <a
                        href="/pos"
                        className="inline-block px-6 py-3 bg-cyan-400 text-[#00373a] font-bold rounded-xl hover:bg-cyan-500 transition-colors"
                    >
                        العودة للرئيسية
                    </a>
                </div>
            </div>
        ),
    },
]);
