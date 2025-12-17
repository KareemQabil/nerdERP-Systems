import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/shared/components/Layout/MainLayout';
import POSRefinedScreen from '@/modules/sales/pages/OrdersPage';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <POSRefinedScreen />,
            },
            // Other routes placeholders
            { path: 'tables', element: <div>Tables Page</div> },
            { path: 'kitchen', element: <div>Kitchen Page</div> },
        ],
    },
]);
