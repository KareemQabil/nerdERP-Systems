import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { OrdersPage } from '@/modules/sales/pages/OrdersPage';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <OrdersPage />,
            },
            // Other routes placeholders
            { path: 'tables', element: <div>Tables Page</div> },
            { path: 'kitchen', element: <div>Kitchen Page</div> },
        ],
    },
]);
