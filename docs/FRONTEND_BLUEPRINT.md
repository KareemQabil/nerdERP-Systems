# NerdPOS Frontend Architecture Blueprint

## Project Context

**Frontend Stack:** React 18 + Vite + TypeScript + Shadcn/UI + Zustand + TanStack Query  
**Backend:** NestJS API (see API_STANDARDS.md)  
**Target Devices:** Desktop (Cashier), Tablet (Waiter), Kitchen Display (KDS)  
**Version:** 2.0.0

---

## 1. Technology Stack

### 1.1 Core Technologies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.7",
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.2",
    "decimal.js": "^10.4.3",
    "date-fns": "^3.0.6",
    "zod": "^3.22.4",
    "react-hook-form": "^7.49.2",
    "@hookform/resolvers": "^3.3.3"
  },
  "devDependencies": {
    "vite": "^5.0.8",
    "typescript": "^5.3.3",
    "@types/react": "^18.2.45",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1"
  }
}
```

### 1.2 Shadcn/UI Components

```bash
# Install Shadcn/UI CLI
npx shadcn-ui@latest init

# Add required components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add form
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add alert-dialog
```

---

## 2. Project Structure: Module-Based Architecture

### 2.1 Folder Structure (Matches Backend Schema Modules)

```
src/
├── app/                          # App shell
│   ├── App.tsx
│   ├── router.tsx                # React Router setup
│   └── providers.tsx             # Global providers
│
├── modules/                      # 🔥 Feature modules (1-to-1 with backend)
│   ├── sales/                    # SALES_CORE module
│   │   ├── components/
│   │   │   ├── OrderList.tsx
│   │   │   ├── OrderForm.tsx
│   │   │   ├── OrderItemCard.tsx
│   │   │   ├── PaymentDialog.tsx
│   │   │   └── RefundDialog.tsx
│   │   ├── hooks/
│   │   │   ├── useOrders.ts
│   │   │   ├── useOrderMutations.ts
│   │   │   └── usePayments.ts
│   │   ├── store/
│   │   │   ├── orderStore.ts     # Zustand store
│   │   │   └── cartStore.ts
│   │   ├── types/
│   │   │   ├── order.types.ts
│   │   │   └── payment.types.ts
│   │   ├── utils/
│   │   │   ├── calculateOrderTotal.ts
│   │   │   └── formatOrderNumber.ts
│   │   └── pages/
│   │       ├── OrdersPage.tsx
│   │       └── OrderDetailPage.tsx
│   │
│   ├── kitchen/                  # KITCHEN module
│   │   ├── components/
│   │   │   ├── TicketCard.tsx
│   │   │   ├── StationBoard.tsx
│   │   │   └── TicketTimer.tsx
│   │   ├── hooks/
│   │   │   ├── useKitchenTickets.ts
│   │   │   └── useWebSocket.ts   # Real-time updates
│   │   ├── store/
│   │   │   └── kitchenStore.ts
│   │   └── pages/
│   │       └── KitchenDisplayPage.tsx
│   │
│   ├── products/                 # PRODUCTS module
│   │   ├── components/
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ModifierSelector.tsx
│   │   │   └── CategoryTabs.tsx
│   │   ├── hooks/
│   │   │   ├── useProducts.ts
│   │   │   └── useModifiers.ts
│   │   ├── store/
│   │   │   └── productStore.ts
│   │   └── pages/
│   │       └── ProductsPage.tsx
│   │
│   ├── inventory/                # INVENTORY module
│   │   ├── components/
│   │   │   ├── StockTable.tsx
│   │   │   ├── BatchList.tsx
│   │   │   ├── PurchaseOrderForm.tsx
│   │   │   └── StockAlertBadge.tsx
│   │   ├── hooks/
│   │   │   ├── useInventory.ts
│   │   │   ├── useBatches.ts
│   │   │   └── usePurchaseOrders.ts
│   │   ├── store/
│   │   │   └── inventoryStore.ts
│   │   └── pages/
│   │       ├── InventoryPage.tsx
│   │       └── PurchaseOrdersPage.tsx
│   │
│   ├── cash/                     # CASH_REGISTER module
│   │   ├── components/
│   │   │   ├── RegisterSessionCard.tsx
│   │   │   ├── OpenSessionDialog.tsx
│   │   │   ├── CloseSessionDialog.tsx
│   │   │   ├── CashTransactionForm.tsx
│   │   │   └── SessionSummary.tsx
│   │   ├── hooks/
│   │   │   ├── useRegisterSession.ts
│   │   │   └── useCashTransactions.ts
│   │   ├── store/
│   │   │   └── cashStore.ts
│   │   └── pages/
│   │       └── CashRegisterPage.tsx
│   │
│   ├── tables/                   # TABLES module
│   │   ├── components/
│   │   │   ├── TableGrid.tsx
│   │   │   ├── TableCard.tsx
│   │   │   └── ZoneSelector.tsx
│   │   ├── hooks/
│   │   │   └── useTables.ts
│   │   ├── store/
│   │   │   └── tableStore.ts
│   │   └── pages/
│   │       └── TablesPage.tsx
│   │
│   ├── customers/                # CRM module
│   │   ├── components/
│   │   │   ├── CustomerList.tsx
│   │   │   ├── CustomerForm.tsx
│   │   │   └── LoyaltyCard.tsx
│   │   ├── hooks/
│   │   │   └── useCustomers.ts
│   │   ├── store/
│   │   │   └── customerStore.ts
│   │   └── pages/
│   │       └── CustomersPage.tsx
│   │
│   ├── auth/                     # SYSTEM.AUTH
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── PinPad.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── store/
│   │   │   └── authStore.ts
│   │   └── pages/
│   │       └── LoginPage.tsx
│   │
│   └── reports/                  # REPORTING_CACHE
│       ├── components/
│       │   ├── SalesChart.tsx
│       │   ├── DateRangePicker.tsx
│       │   └── ExportButton.tsx
│       ├── hooks/
│       │   └── useReports.ts
│       └── pages/
│           └── ReportsPage.tsx
│
├── shared/                       # Shared utilities
│   ├── components/               # Global components
│   │   ├── Layout/
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── EmptyState.tsx
│   ├── hooks/                    # Global hooks
│   │   ├── useApi.ts
│   │   ├── useToast.ts
│   │   └── useDebounce.ts
│   ├── lib/                      # Core utilities
│   │   ├── api.ts                # Axios instance
│   │   ├── decimal.ts            # Decimal.js utilities
│   │   ├── errorHandler.ts       # Global error handler
│   │   └── queryClient.ts        # TanStack Query config
│   ├── constants/
│   │   ├── errorCodes.ts         # Matches API_STANDARDS.md
│   │   └── enums.ts              # OrderType, PaymentStatus, etc.
│   └── types/
│       ├── api.types.ts          # API response types
│       └── common.types.ts       # Shared types
│
├── styles/
│   ├── globals.css               # Tailwind base
│   └── themes.css                # Custom themes
│
└── config/
    ├── env.ts                    # Environment variables
    └── routes.ts                 # Route constants
```

---

## 3. Decimal Handling Strategy

### 3.1 Why Decimal.js?

**Problem:** JavaScript's `Number` type uses floating-point arithmetic, causing precision errors:

```javascript
// ❌ WRONG - JavaScript floating point
0.1 + 0.2 // 0.30000000000004

// ✅ CORRECT - Decimal.js
new Decimal(0.1).plus(0.2).toNumber() // 0.3
```

### 3.2 Installation

```bash
npm install decimal.js
npm install --save-dev @types/decimal.js
```

### 3.3 Decimal Utility Functions

Create `src/shared/lib/decimal.ts`:

```typescript
import Decimal from 'decimal.js';

// Configure for Saudi currency (3 decimal places for Halala)
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export class DecimalUtil {
  /**
   * Add two decimal numbers
   */
  static add(a: number | string, b: number | string): Decimal {
    return new Decimal(a).plus(b);
  }

  /**
   * Subtract two decimal numbers
   */
  static subtract(a: number | string, b: number | string): Decimal {
    return new Decimal(a).minus(b);
  }

  /**
   * Multiply two decimal numbers
   */
  static multiply(a: number | string, b: number | string): Decimal {
    return new Decimal(a).times(b);
  }

  /**
   * Divide two decimal numbers
   */
  static divide(a: number | string, b: number | string): Decimal {
    return new Decimal(a).dividedBy(b);
  }

  /**
   * Calculate percentage
   * @example calculatePercentage(100, 15) // 15.000
   */
  static calculatePercentage(amount: number | string, percentage: number | string): Decimal {
    return new Decimal(amount).times(percentage).dividedBy(100);
  }

  /**
   * Round to 3 decimal places (Saudi currency)
   */
  static round(value: number | string, decimals = 3): string {
    return new Decimal(value).toFixed(decimals);
  }

  /**
   * Format for display (2 decimals for UI)
   */
  static formatForDisplay(value: number | string): string {
    return new Decimal(value).toFixed(2);
  }

  /**
   * Compare two decimals
   * Returns: -1 (a < b), 0 (a === b), 1 (a > b)
   */
  static compare(a: number | string, b: number | string): number {
    return new Decimal(a).comparedTo(b);
  }

  /**
   * Check if value is zero
   */
  static isZero(value: number | string): boolean {
    return new Decimal(value).isZero();
  }

  /**
   * Get absolute value
   */
  static abs(value: number | string): Decimal {
    return new Decimal(value).abs();
  }

  /**
   * Sum array of decimals
   */
  static sum(values: (number | string)[]): Decimal {
    return values.reduce(
      (acc, val) => acc.plus(val),
      new Decimal(0)
    );
  }
}

// Type-safe decimal for React components
export type DecimalValue = Decimal | number | string;

// Convert backend decimal string to Decimal object
export const parseDecimal = (value: string | number | null | undefined): Decimal => {
  if (value === null || value === undefined) return new Decimal(0);
  return new Decimal(value);
};

// Convert Decimal to backend format (string with 3 decimals)
export const toBackendDecimal = (value: Decimal | number | string): string => {
  return new Decimal(value).toFixed(3);
};
```

### 3.4 Usage in Components

```typescript
import { DecimalUtil, parseDecimal } from '@/shared/lib/decimal';
import { OrderItem } from '@/modules/sales/types/order.types';

// Example: Calculate order item total
const calculateItemTotal = (item: OrderItem) => {
  const unitPrice = parseDecimal(item.unitPrice);
  const quantity = parseDecimal(item.quantity);
  const modifiersTotal = parseDecimal(item.modifiersTotal);
  const discount = parseDecimal(item.lineDiscount);

  // (unitPrice + modifiersTotal) * quantity - discount
  const subtotal = DecimalUtil.add(unitPrice, modifiersTotal);
  const total = DecimalUtil.multiply(subtotal, quantity);
  const finalTotal = DecimalUtil.subtract(total, discount);

  return finalTotal.toFixed(3); // "45.500"
};

// Example: Calculate tax
const calculateTax = (subtotal: string, taxRate: string) => {
  return DecimalUtil.calculatePercentage(subtotal, taxRate).toFixed(3);
};

// Example: Display price in UI
const PriceDisplay = ({ amount }: { amount: string }) => {
  return (
    <span className="font-bold">
      {DecimalUtil.formatForDisplay(amount)} SAR
    </span>
  );
};
```

### 3.5 Type Definitions for Backend Decimals

```typescript
// src/shared/types/api.types.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  messageKey?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    data: T[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    messageKey: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
  path: string;
}

// Decimal fields from backend (always string)
export type BackendDecimal = string;

// Example: Order type with decimals
export interface Order {
  id: string;
  orderNumber: string;
  subtotal: BackendDecimal;        // "45.500"
  discountAmount: BackendDecimal;  // "0.000"
  totalTax: BackendDecimal;        // "6.825"
  totalGross: BackendDecimal;      // "52.325"
  createdAt: string;
  // ... other fields
}
```

---

## 4. State Management: Zustand Stores

### 4.1 Store Structure per Module

Each module has its own Zustand store:

```typescript
// src/modules/sales/store/orderStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Order } from '../types/order.types';

interface OrderState {
  // State
  currentOrder: Order | null;
  selectedTableId: string | null;
  
  // Actions
  setCurrentOrder: (order: Order | null) => void;
  setSelectedTable: (tableId: string | null) => void;
  clearOrder: () => void;
}

export const useOrderStore = create<OrderState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        currentOrder: null,
        selectedTableId: null,

        // Actions
        setCurrentOrder: (order) => set({ currentOrder: order }),
        setSelectedTable: (tableId) => set({ selectedTableId: tableId }),
        clearOrder: () => set({ currentOrder: null, selectedTableId: null }),
      }),
      {
        name: 'order-storage', // LocalStorage key
        partialize: (state) => ({ selectedTableId: state.selectedTableId }), // Only persist this
      }
    ),
    { name: 'OrderStore' }
  )
);
```

### 4.2 Cart Store (Critical for POS)

```typescript
// src/modules/sales/store/cartStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { DecimalUtil } from '@/shared/lib/decimal';
import { Product, ModifierSelection } from '@/modules/products/types/product.types';

export interface CartItem {
  id: string; // Temporary ID for cart
  product: Product;
  quantity: string; // Decimal as string
  selectedModifiers: ModifierSelection[];
  specialInstructions?: string;
  lineTotal: string; // Calculated
}

interface CartState {
  items: CartItem[];
  
  addItem: (product: Product, modifiers: ModifierSelection[], quantity?: string) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: string) => void;
  clearCart: () => void;
  
  // Computed values
  getSubtotal: () => string;
  getTotalTax: () => string;
  getGrandTotal: () => string;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  devtools(
    (set, get) => ({
      items: [],

      addItem: (product, modifiers, quantity = '1') => {
        const newItem: CartItem = {
          id: crypto.randomUUID(),
          product,
          quantity,
          selectedModifiers: modifiers,
          lineTotal: calculateLineTotal(product, modifiers, quantity),
        };
        
        set((state) => ({ items: [...state.items, newItem] }));
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== cartItemId),
        }));
      },

      updateQuantity: (cartItemId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === cartItemId
              ? { ...item, quantity, lineTotal: calculateLineTotal(item.product, item.selectedModifiers, quantity) }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getSubtotal: () => {
        const items = get().items;
        return DecimalUtil.sum(items.map((item) => item.lineTotal)).toFixed(3);
      },

      getTotalTax: () => {
        const subtotal = get().getSubtotal();
        // Assuming 15% VAT
        return DecimalUtil.calculatePercentage(subtotal, '15').toFixed(3);
      },

      getGrandTotal: () => {
        const subtotal = get().getSubtotal();
        const tax = get().getTotalTax();
        return DecimalUtil.add(subtotal, tax).toFixed(3);
      },

      getItemCount: () => {
        return get().items.length;
      },
    }),
    { name: 'CartStore' }
  )
);

// Helper function
const calculateLineTotal = (
  product: Product,
  modifiers: ModifierSelection[],
  quantity: string
): string => {
  const basePrice = parseDecimal(product.salePrice);
  const modifiersTotal = DecimalUtil.sum(
    modifiers.map((m) => m.priceAdjustment || '0')
  );
  
  const itemPrice = DecimalUtil.add(basePrice, modifiersTotal);
  return DecimalUtil.multiply(itemPrice, quantity).toFixed(3);
};
```

### 4.3 Register Session Store (Critical for Cash Management)

```typescript
// src/modules/cash/store/cashStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { RegisterSession } from '../types/cash.types';

interface CashState {
  activeSession: RegisterSession | null;
  
  setActiveSession: (session: RegisterSession | null) => void;
  isSessionOpen: () => boolean;
}

export const useCashStore = create<CashState>()(
  devtools(
    persist(
      (set, get) => ({
        activeSession: null,

        setActiveSession: (session) => set({ activeSession: session }),

        isSessionOpen: () => {
          const session = get().activeSession;
          return session !== null && session.status === 'OPEN';
        },
      }),
      {
        name: 'cash-storage',
        partialize: (state) => ({ activeSession: state.activeSession }),
      }
    ),
    { name: 'CashStore' }
  )
);
```

---

## 5. Data Fetching: TanStack Query

### 5.1 Query Client Setup

```typescript
// src/shared/lib/queryClient.ts
import { QueryClient, DefaultOptions } from '@tanstack/react-query';

const queryConfig: DefaultOptions = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
    retry: 1,
    refetchOnWindowFocus: false,
  },
  mutations: {
    retry: 0,
  },
};

export const queryClient = new QueryClient({ defaultOptions: queryConfig });
```

### 5.2 API Client Setup

```typescript
// src/shared/lib/api.ts
import axios from 'axios';
import { useAuthStore } from '@/modules/auth/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorResponse = error.response?.data;
    
    // Handle specific error codes
    if (errorResponse?.error?.code === 'AUTH_004') {
      // Token expired
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);
```

### 5.3 Custom Hooks Pattern

```typescript
// src/modules/sales/hooks/useOrders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api';
import { Order, CreateOrderDto } from '../types/order.types';
import { PaginatedResponse, ApiResponse } from '@/shared/types/api.types';

// Query keys
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

// Fetch orders with pagination
export const useOrders = (filters: Record<string, any>) => {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Order>>('/sales/orders', {
        params: filters,
      });
      return data.data;
    },
  });
};

// Fetch single order
export const useOrder = (orderId: string) => {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Order>>(`/sales/orders/${orderId}`);
      return data.data;
    },
    enabled: !!orderId,
  });
};

// Create order mutation
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: CreateOrderDto) => {
      const { data } = await apiClient.post<ApiResponse<Order>>('/sales/orders', orderData);
      return data.data;
    },
    onSuccess: () => {
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
};

// Complete order (triggers FIFO, ZATCA)
export const useCompleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await apiClient.post<ApiResponse<Order>>(`/sales/orders/${orderId}/complete`);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (error: any) => {
      // Handle specific errors
      const errorCode = error.response?.data?.error?.code;
      
      if (errorCode === 'INV_002') {
        // Insufficient stock
        toast.error('Not enough stock to complete order');
      } else if (errorCode === 'ZATCA_001') {
        // ZATCA hash chain broken - CRITICAL
        toast.error('ZATCA compliance error - contact support immediately');
      }
    },
  });
};
```

---

## 6. Routing Structure

```typescript
// src/app/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/shared/components/Layout/MainLayout';

// Lazy load pages
const OrdersPage = lazy(() => import('@/modules/sales/pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('@/modules/sales/pages/OrderDetailPage'));
const KitchenDisplayPage = lazy(() => import('@/modules/kitchen/pages/KitchenDisplayPage'));
const InventoryPage = lazy(() => import('@/modules/inventory/pages/InventoryPage'));
const CashRegisterPage = lazy(() => import('@/modules/cash/pages/CashRegisterPage'));
const TablesPage = lazy(() => import('@/modules/tables/pages/TablesPage'));
const CustomersPage = lazy(() => import('@/modules/customers/pages/CustomersPage'));
const ReportsPage = lazy(() => import('@/modules/reports/pages/ReportsPage'));
const LoginPage = lazy(() => import('@/modules/auth/pages/LoginPage'));

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      // POS / Sales
      { path: '/', element: <OrdersPage /> },
      { path: '/orders', element: <OrdersPage /> },
      { path: '/orders/:orderId', element: <OrderDetailPage /> },
      
      // Tables (Dine-in)
      { path: '/tables', element: <TablesPage /> },
      
      // Kitchen Display
      { path: '/kitchen', element: <KitchenDisplayPage /> },
      
      // Inventory
      { path: '/inventory', element: <InventoryPage /> },
      
      // Cash Register
      { path: '/cash-register', element: <CashRegisterPage /> },
      
      // Customers
      { path: '/customers', element: <CustomersPage /> },
      
      // Reports
      { path: '/reports', element: <ReportsPage /> },
    ],
  },
]);
```

---

## 7. Component Patterns

### 7.1 Feature Component Example: Order Item Card

```typescript
// src/modules/sales/components/OrderItemCard.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { DecimalUtil, parseDecimal } from '@/shared/lib/decimal';
import { OrderItem } from '../types/order.types';

interface OrderItemCardProps {
  item: OrderItem;
  onRemove?: (itemId: string) => void;
  readOnly?: boolean;
}

export const OrderItemCard = ({ item, onRemove, readOnly = false }: OrderItemCardProps) => {
  const lineTotal = parseDecimal(item.lineTotal);
  const quantity = parseDecimal(item.quantity);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-semibold">{item.productName}</h4>
            <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
            
            {/* Modifiers */}
            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
              <div className="mt-2 space-y-1">
                {item.selectedModifiers.map((mod, idx) => (
                  <Badge key={idx} variant="secondary" className="mr-1">
                    {mod.optionName}
                    {DecimalUtil.compare(mod.price, 0) > 0 && (
                      <span className="ml-1">+{DecimalUtil.formatForDisplay(mod.price)}</span>
                    )}
                  </Badge>
                ))}
              </div>
            )}

            {/* Special Instructions */}
            {item.specialInstructions && (
              <p className="mt-2 text-sm italic text-muted-foreground">
                Note: {item.specialInstructions}
              </p>
            )}
          </div>

          {/* Quantity & Price */}
          <div className="text-right ml-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Qty: {quantity.toFixed(0)}</span>
              {!readOnly && onRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(item.id)}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="font-bold text-lg mt-1">
              {DecimalUtil.formatForDisplay(lineTotal)} SAR
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 7.2 Modifier Selector Component

```typescript
// src/modules/products/components/ModifierSelector.tsx
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DecimalUtil } from '@/shared/lib/decimal';
import { Modifier, ModifierOption } from '../types/product.types';

interface ModifierSelectorProps {
  modifier: Modifier;
  onSelectionChange: (selectedOptions: ModifierOption[]) => void;
}

export const ModifierSelector = ({ modifier, onSelectionChange }: ModifierSelectorProps) => {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelection = (optionId: string, checked: boolean) => {
    let newSelection: string[];

    if (modifier.maxSelection === 1) {
      // Radio behavior
      newSelection = [optionId];
    } else {
      // Checkbox behavior
      if (checked) {
        if (selected.length >= modifier.maxSelection) {
          toast.error(`Maximum ${modifier.maxSelection} selections allowed`);
          return;
        }
        newSelection = [...selected, optionId];
      } else {
        newSelection = selected.filter((id) => id !== optionId);
      }
    }

    setSelected(newSelection);
    
    const selectedOptions = modifier.options.filter((opt) =>
      newSelection.includes(opt.id)
    );
    onSelectionChange(selectedOptions);
  };

  const validateSelection = () => {
    if (modifier.isRequired && selected.length < modifier.minSelection) {
      return `Select at least ${modifier.minSelection} option(s)`;
    }
    return null;
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold">
          {modifier.name}
          {modifier.isRequired && <span className="text-red-500 ml-1">*</span>}
        </h4>
        <span className="text-sm text-muted-foreground">
          Select {modifier.minSelection}-{modifier.maxSelection}
        </span>
      </div>

      {modifier.maxSelection === 1 ? (
        <RadioGroup value={selected[0]} onValueChange={(val) => handleSelection(val, true)}>
          {modifier.options.map((option) => (
            <div key={option.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id}>{option.name}</Label>
              </div>
              {DecimalUtil.compare(option.priceAdjustment, 0) > 0 && (
                <span className="text-sm text-muted-foreground">
                  +{DecimalUtil.formatForDisplay(option.priceAdjustment)} SAR
                </span>
              )}
            </div>
          ))}
        </RadioGroup>
      ) : (
        <div className="space-y-2">
          {modifier.options.map((option) => (
            <div key={option.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={selected.includes(option.id)}
                  onCheckedChange={(checked) => handleSelection(option.id, checked as boolean)}
                />
                <Label htmlFor={option.id}>{option.name}</Label>
              </div>
              {DecimalUtil.compare(option.priceAdjustment, 0) > 0 && (
                <span className="text-sm text-muted-foreground">
                  +{DecimalUtil.formatForDisplay(option.priceAdjustment)} SAR
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {validateSelection() && (
        <p className="text-sm text-red-500">{validateSelection()}</p>
      )}
    </div>
  );
};
```

---

## 8. WebSocket Integration (Kitchen Display)

```typescript
// src/modules/kitchen/hooks/useWebSocket.ts
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { kitchenTicketKeys } from './useKitchenTickets';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

export const useKitchenWebSocket = () => {
  const ws = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);

      // Handle kitchen ticket events
      if (message.event.startsWith('kitchen:ticket:')) {
        // Invalidate kitchen tickets query to refetch
        queryClient.invalidateQueries({ queryKey: kitchenTicketKeys.lists() });
        
        // Play sound notification
        if (message.event === 'kitchen:ticket:created') {
          playNotificationSound();
        }
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt reconnection after 5 seconds
      setTimeout(() => {
        if (ws.current?.readyState === WebSocket.CLOSED) {
          ws.current = new WebSocket(WS_URL);
        }
      }, 5000);
    };

    return () => {
      ws.current?.close();
    };
  }, [queryClient]);

  const send = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return { send };
};

const playNotificationSound = () => {
  const audio = new Audio('/sounds/notification.mp3');
  audio.play().catch((err) => console.error('Failed to play sound:', err));
};
```

---

## 9. Environment Configuration

```bash
# .env.example
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
VITE_ZATCA_ENABLED=true
VITE_ENVIRONMENT=development
```

---

## 10. Build & Deployment

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check

# Lint
npm run lint
```

---

## 11. Performance Optimization

### 11.1 Code Splitting

```typescript
// Lazy load heavy modules
const InventoryPage = lazy(() => import('@/modules/inventory/pages/InventoryPage'));
const ReportsPage = lazy(() => import('@/modules/reports/pages/ReportsPage'));
```

### 11.2 Memoization

```typescript
import { useMemo } from 'react';
import { DecimalUtil } from '@/shared/lib/decimal';

const OrderSummary = ({ items }: { items: OrderItem[] }) => {
  const subtotal = useMemo(() => {
    return DecimalUtil.sum(items.map((item) => item.lineTotal)).toFixed(2);
  }, [items]);

  return <div>Subtotal: {subtotal} SAR</div>;
};
```

### 11.3 Virtual Scrolling (Large Lists)

```bash
npm install @tanstack/react-virtual
```

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const ProductGrid = ({ products }: { products: Product[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Product card height
  });

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ProductCard product={products[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 12. Testing Setup

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
  },
});
```

---

**Document Version:** 2.0.0  
**Last Updated:** 2025-01-26  
**Maintained By:** NerdPOS Frontend Team