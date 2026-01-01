import type { RouteObject } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';

/**
 * Auth feature routes
 */
export const authRoutes: RouteObject[] = [
    {
        path: '/login',
        element: <LoginPage />,
    },
];
