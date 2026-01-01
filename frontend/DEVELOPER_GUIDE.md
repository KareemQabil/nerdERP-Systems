# NerdPOS Developer & Architecture Guide

> **Last Updated:** December 2025
> **Version:** 2.0.0
> **Tech Stack:** React 18 + TypeScript + Redux Toolkit + RTK Query + TailwindCSS + Vite

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Principles](#architecture-principles)
3. [Project Structure](#project-structure)
4. [Feature-Based Architecture](#feature-based-architecture)
5. [State Management with Redux](#state-management-with-redux)
6. [API Layer with RTK Query](#api-layer-with-rtk-query)
7. [Multi-Theme System](#multi-theme-system)
8. [UI/UX Best Practices](#uiux-best-practices)
9. [Creating a New Feature](#creating-a-new-feature)
10. [Component Patterns](#component-patterns)
11. [TypeScript Guidelines](#typescript-guidelines)
12. [Internationalization (i18n)](#internationalization-i18n)
13. [Performance Optimization](#performance-optimization)
14. [Testing Strategy](#testing-strategy)
15. [Common Pitfalls](#common-pitfalls)

---

## 🎯 Project Overview

NerdPOS is a modern Point of Sale (POS) system built with React and TypeScript, featuring:

- **Feature-based architecture** for scalability
- **Redux Toolkit** for predictable state management
- **RTK Query** for efficient API data fetching and caching
- **Multi-theme support** (Light, Dark, Luxury) with glassmorphism
- **RTL/LTR support** for Arabic and English
- **Type-safe** development with TypeScript
- **Offline-first** capabilities with Redux Persist

---

## 🏗️ Architecture Principles

### 1. **Feature-Based Organization**
Code is organized by business domain/feature, not technical layer.

```
✅ GOOD: /features/pos/
  ├── components/
  ├── slices/
  ├── api/
  ├── hooks/
  └── types/

❌ BAD: /components/, /redux/, /api/
```

### 2. **Separation of Concerns**
- **Components**: UI rendering and user interaction
- **Slices**: Local state management (Redux)
- **API**: Server communication (RTK Query)
- **Hooks**: Reusable logic and abstractions
- **Types**: TypeScript interfaces and types

### 3. **Single Source of Truth**
- Redux store is the single source of truth for application state
- RTK Query manages server state separately from client state
- No prop drilling - use Redux selectors

### 4. **Immutability**
- All state updates use Redux Toolkit's Immer-powered reducers
- Never mutate state directly outside reducers

---

## 📁 Project Structure

```
mini-erp-front-2/
├── public/                      # Static assets
├── src/
│   ├── app/                     # App-level configuration
│   │   ├── store.ts            # Redux store configuration
│   │   ├── hooks.ts            # Typed Redux hooks
│   │   └── App.tsx             # Root component
│   │
│   ├── features/               # Feature modules (domain-driven)
│   │   ├── auth/              # Authentication feature
│   │   │   ├── components/    # Auth-specific components
│   │   │   ├── slices/        # authSlice.ts (Redux)
│   │   │   ├── api/           # Auth API endpoints (RTK Query)
│   │   │   ├── hooks/         # useAuth, etc.
│   │   │   └── types/         # Auth type definitions
│   │   │
│   │   ├── pos/               # Point of Sale feature
│   │   │   ├── components/    # POS UI components
│   │   │   ├── pages/         # POSPage.tsx
│   │   │   ├── slices/        # cartSlice, sessionSlice, etc.
│   │   │   ├── api/           # productsApi, ordersApi, etc.
│   │   │   └── hooks/         # usePOSData, etc.
│   │   │
│   │   ├── settings/          # Settings feature
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── slices/        # settingsSlice.ts
│   │   │   └── api/
│   │   │
│   │   ├── customers/         # Customer management
│   │   ├── inventory/         # Inventory management
│   │   └── reports/           # Reports & analytics
│   │
│   ├── components/            # Shared/reusable components
│   │   ├── ui/               # Generic UI components (Button, Input, etc.)
│   │   └── shared/           # Business-shared components
│   │
│   ├── hooks/                # Global hooks
│   │   ├── useFeature.ts     # Feature flag access
│   │   └── usePermission.ts  # Permission checking
│   │
│   ├── lib/                  # Utilities and helpers
│   │   ├── utils.ts         # General utilities (cn, etc.)
│   │   └── api.ts           # Axios instance, API config
│   │
│   ├── types/               # Global TypeScript types
│   │   ├── config.types.ts
│   │   ├── product.types.ts
│   │   └── order.types.ts
│   │
│   ├── config/              # App configuration
│   │   └── i18n.config.ts   # Internationalization setup
│   │
│   ├── routes/              # Route definitions
│   │   └── index.tsx
│   │
│   ├── index.css            # Global styles & theme variables
│   └── main.tsx             # App entry point
│
├── tailwind.config.js        # TailwindCSS configuration
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite build configuration
```

---

## 🎨 Feature-Based Architecture

### When to Create a New Feature

Create a new feature module when:
- ✅ It represents a **distinct business domain** (e.g., "customers", "inventory")
- ✅ It has **its own data models** and API endpoints
- ✅ It will have **multiple related components**
- ✅ It requires **independent state management**

### Feature Module Template

```
features/[feature-name]/
├── components/              # Feature-specific components
│   ├── FeatureCard.tsx
│   ├── FeatureList.tsx
│   └── FeatureModal.tsx
│
├── pages/                   # Feature pages (if applicable)
│   └── FeaturePage.tsx
│
├── slices/                  # Redux slices for this feature
│   └── featureSlice.ts
│
├── api/                     # RTK Query API definitions
│   └── featureApi.ts
│
├── hooks/                   # Feature-specific custom hooks
│   └── useFeatureData.ts
│
├── types/                   # Feature-specific types
│   └── feature.types.ts
│
└── index.ts                 # Public API (exports)
```

---

## 🔄 State Management with Redux

### Redux Store Structure

```typescript
{
  // Feature Slices (Client State)
  auth: { user, token, permissions, ... }
  settings: { theme, language, direction }
  cart: { items, total, discount, ... }
  session: { sessionId, cashier, startTime, ... }
  order: { currentOrder, draftOrders, ... }
  config: { features, posConfig, organization, ... }
  ui: { modals, notifications, loading, ... }

  // RTK Query APIs (Server State - auto-managed)
  productsApi: { queries, mutations, ... }
  ordersApi: { queries, mutations, ... }
  customersApi: { queries, mutations, ... }
}
```

### Creating a Redux Slice

**File:** `src/features/[feature]/slices/featureSlice.ts`

```typescript
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';

// =============================================================================
// TYPES
// =============================================================================

export interface FeatureState {
  items: Item[];
  selectedId: string | null;
  isLoading: boolean;
  error: string | null;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: FeatureState = {
  items: [],
  selectedId: null,
  isLoading: false,
  error: null,
};

// =============================================================================
// ASYNC THUNKS (for complex async logic)
// =============================================================================

export const fetchFeatureData = createAsyncThunk(
  'feature/fetchData',
  async (params: FetchParams) => {
    const response = await featureService.getData(params);
    return response.data;
  }
);

// =============================================================================
// SLICE
// =============================================================================

const featureSlice = createSlice({
  name: 'feature',
  initialState,
  reducers: {
    // Synchronous actions
    setSelectedId: (state, action: PayloadAction<string>) => {
      state.selectedId = action.payload;
    },

    addItem: (state, action: PayloadAction<Item>) => {
      state.items.push(action.payload);
    },

    updateItem: (state, action: PayloadAction<{ id: string; data: Partial<Item> }>) => {
      const item = state.items.find(i => i.id === action.payload.id);
      if (item) {
        Object.assign(item, action.payload.data);
      }
    },

    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(i => i.id !== action.payload);
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  // Handle async thunk states
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeatureData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeatureData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchFeatureData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Failed to fetch data';
      });
  },
});

// =============================================================================
// ACTIONS
// =============================================================================

export const { setSelectedId, addItem, updateItem, removeItem, clearError } = featureSlice.actions;

// =============================================================================
// SELECTORS
// =============================================================================

export const selectFeature = (state: RootState) => state.feature;
export const selectItems = (state: RootState) => state.feature.items;
export const selectSelectedId = (state: RootState) => state.feature.selectedId;
export const selectIsLoading = (state: RootState) => state.feature.isLoading;

// Memoized selector using createSelector (for derived data)
import { createSelector } from '@reduxjs/toolkit';

export const selectSelectedItem = createSelector(
  [selectItems, selectSelectedId],
  (items, selectedId) => items.find(item => item.id === selectedId)
);

// =============================================================================
// REDUCER
// =============================================================================

export default featureSlice.reducer;
```

### Using Redux in Components

```typescript
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { selectItems, addItem, fetchFeatureData } from '@/features/feature/slices/featureSlice';

function FeatureComponent() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectItems);

  // Dispatch synchronous action
  const handleAdd = (item: Item) => {
    dispatch(addItem(item));
  };

  // Dispatch async thunk
  const handleFetch = () => {
    dispatch(fetchFeatureData({ page: 1 }));
  };

  return (
    <div>
      <button onClick={handleFetch}>Fetch Data</button>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Best Practices

1. **Use TypedUseSelectorHook**: Always use `useAppSelector` and `useAppDispatch` (typed hooks)
2. **Colocate Selectors**: Define selectors in the same file as the slice
3. **Memoize Derived Data**: Use `createSelector` for computed values
4. **Keep Actions Simple**: Complex logic goes in thunks or services
5. **Normalize Data**: Use normalized state shape for collections (consider `@reduxjs/toolkit`'s `createEntityAdapter`)

---

## 🌐 API Layer with RTK Query

### Creating an API Service

**File:** `src/features/[feature]/api/featureApi.ts`

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Feature, CreateFeatureRequest, UpdateFeatureRequest } from '../types/feature.types';

// =============================================================================
// API DEFINITION
// =============================================================================

export const featureApi = createApi({
  reducerPath: 'featureApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      // Add auth token
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),

  // Tag types for cache invalidation
  tagTypes: ['Feature'],

  endpoints: (builder) => ({
    // Query: GET request
    getFeatures: builder.query<Feature[], { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 }) => ({
        url: '/features',
        params: { page, limit },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Feature' as const, id })),
              { type: 'Feature', id: 'LIST' },
            ]
          : [{ type: 'Feature', id: 'LIST' }],
    }),

    // Query: GET single item
    getFeatureById: builder.query<Feature, string>({
      query: (id) => `/features/${id}`,
      providesTags: (result, error, id) => [{ type: 'Feature', id }],
    }),

    // Mutation: POST request
    createFeature: builder.mutation<Feature, CreateFeatureRequest>({
      query: (body) => ({
        url: '/features',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Feature', id: 'LIST' }],
    }),

    // Mutation: PUT/PATCH request
    updateFeature: builder.mutation<Feature, UpdateFeatureRequest>({
      query: ({ id, ...body }) => ({
        url: `/features/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Feature', id }],
    }),

    // Mutation: DELETE request
    deleteFeature: builder.mutation<void, string>({
      query: (id) => ({
        url: `/features/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Feature', id }],
    }),
  }),
});

// =============================================================================
// EXPORT HOOKS
// =============================================================================

export const {
  useGetFeaturesQuery,
  useGetFeatureByIdQuery,
  useCreateFeatureMutation,
  useUpdateFeatureMutation,
  useDeleteFeatureMutation,
} = featureApi;
```

### Register API in Store

**File:** `src/app/store.ts`

```typescript
import { featureApi } from '@/features/feature/api/featureApi';

const apiReducers = {
  // ... other APIs
  [featureApi.reducerPath]: featureApi.reducer,
};

const apiMiddlewares = [
  // ... other middlewares
  featureApi.middleware,
];
```

### Using RTK Query in Components

```typescript
import {
  useGetFeaturesQuery,
  useCreateFeatureMutation,
  useUpdateFeatureMutation,
} from '@/features/feature/api/featureApi';

function FeatureList() {
  // Query hook - automatically fetches, caches, and refetches
  const { data: features, isLoading, error, refetch } = useGetFeaturesQuery({ page: 1 });

  // Mutation hooks
  const [createFeature, { isLoading: isCreating }] = useCreateFeatureMutation();
  const [updateFeature, { isLoading: isUpdating }] = useUpdateFeatureMutation();

  const handleCreate = async (data: CreateFeatureRequest) => {
    try {
      await createFeature(data).unwrap();
      // Success! Cache is automatically invalidated
    } catch (err) {
      console.error('Failed to create:', err);
    }
  };

  if (isLoading) return <Skeleton />;
  if (error) return <Error error={error} />;

  return (
    <div>
      {features?.map(feature => (
        <FeatureCard key={feature.id} feature={feature} />
      ))}
    </div>
  );
}
```

### RTK Query Best Practices

1. **Use Tags for Cache Invalidation**: Properly tag queries and invalidate on mutations
2. **Handle Loading States**: Always show loading and error states
3. **Optimistic Updates**: Use `onQueryStarted` for optimistic UI updates
4. **Polling**: Use `pollingInterval` for real-time data (use sparingly)
5. **Skip Queries**: Use `skip` option to conditionally fetch
6. **Transform Responses**: Use `transformResponse` to normalize data

---

## 🎨 Multi-Theme System

### Theme Architecture

The app supports three themes:
- **Light**: Clean, bright interface
- **Dark**: Easy on the eyes with cyan accents
- **Luxury**: Premium gold/black aesthetic with glassmorphism

### How Themes Work

1. **CSS Variables**: All colors are defined as CSS custom properties in `index.css`
2. **Data Attribute**: Theme is applied via `data-theme` attribute on `<html>`
3. **Redux State**: Current theme is stored in `settingsSlice`

### Theme CSS Variables

**File:** `src/index.css`

```css
:root {
  /* Light Theme */
  --primary: #0891b2;          /* Cyan-600 */
  --on-primary: #FFFFFF;
  --background: #f8fafc;
  --on-background: #0f172a;
  --surface: rgba(255, 255, 255, 0.7);  /* Glass effect */
  --glass-medium: rgba(255, 255, 255, 0.5);
  --glass-border: rgba(255, 255, 255, 0.2);
}

[data-theme="dark"] {
  /* Dark Theme */
  --primary: #22d3ee;          /* Cyan-400 */
  --on-primary: #0a1929;
  --background: #020617;
  --on-background: #f1f5f9;
  --surface: rgba(15, 23, 42, 0.6);
  --glass-medium: rgba(15, 23, 42, 0.6);
  --glass-border: rgba(148, 163, 184, 0.15);
}

[data-theme="luxury"] {
  /* Luxury Theme */
  --primary: #f59e0b;          /* Amber-500 */
  --on-primary: #000000;
  --background: #000000;
  --on-background: #fafaf9;
  --surface: rgba(10, 10, 10, 0.65);
  --glass-medium: rgba(10, 10, 10, 0.65);
  --glass-border: rgba(245, 158, 11, 0.2);
}
```

### Using Themes in Components

#### Method 1: CSS Variables (Recommended)

```typescript
// Direct CSS variable usage in Tailwind
<div className="bg-surface text-on-surface">
  <h1 className="text-primary">Themed Heading</h1>
</div>
```

#### Method 2: Data Attribute with cn() Utility

```typescript
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/app/hooks';
import { selectSettings } from '@/features/settings/slices/settingsSlice';

function ThemedComponent() {
  const { theme } = useAppSelector(selectSettings);
  const isDark = theme === 'dark' || theme === 'luxury';

  return (
    <div
      className={cn(
        'rounded-lg p-4',
        isDark
          ? 'bg-slate-800 text-white'
          : 'bg-white text-slate-900'
      )}
    >
      Content
    </div>
  );
}
```

#### Method 3: data-theme Selector

```typescript
<div
  data-theme={theme}
  className={cn(
    'p-4',
    'bg-white data-[theme=dark]:bg-slate-800',
    'text-slate-900 data-[theme=dark]:text-white'
  )}
>
  Content
</div>
```

### Glassmorphism Effects

```tsx
// Apply glassmorphism
<div className="glass rounded-xl p-6">
  {/* Glass card with blur and transparency */}
</div>

// Lighter glass
<div className="glass-light rounded-xl p-4">
  {/* Subtle glass effect */}
</div>

// Stronger glass
<div className="glass-strong rounded-xl p-6">
  {/* More opaque glass */}
</div>

// Manual glass effect
<div className="backdrop-blur-2xl bg-glass-medium border border-glass-border rounded-xl">
  {/* Custom glass styling */}
</div>
```

### Custom Theme Animations

```tsx
// Pulse glow effect (for badges, notifications)
<div className="animate-pulse-glow">Badge</div>

// Breathing effect
<div className="animate-breathe">Breathing Card</div>

// Shimmer loading
<div className="animate-shimmer skeleton h-20">Loading...</div>

// Float animation
<div className="animate-float">Floating Element</div>

// Count pop animation
<span className="animate-count-pop">42</span>
```

### Theme Best Practices

1. **Always Use CSS Variables**: Never hardcode colors - use `--primary`, `--surface`, etc.
2. **Test All Themes**: Every component should work in all three themes
3. **Use isDark Helper**: For binary light/dark logic, check `theme === 'dark' || theme === 'luxury'`
4. **Glassmorphism Everywhere**: Use glass effects for modern, layered UI
5. **Consistent Borders**: Use `border-glass-border` for glass effect borders
6. **Animation Sparingly**: Use animations to enhance UX, not overwhelm

---

## 🎯 UI/UX Best Practices

### Component Design Principles

#### 1. Responsive by Default
```tsx
// Mobile-first approach
<div className="flex flex-col md:flex-row gap-4">
  <aside className="w-full md:w-64">Sidebar</aside>
  <main className="flex-1">Content</main>
</div>
```

#### 2. Loading States
```tsx
function ProductList() {
  const { data, isLoading } = useGetProductsQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-32" />
        ))}
      </div>
    );
  }

  return <>{/* Actual content */}</>;
}
```

#### 3. Error Handling
```tsx
function DataComponent() {
  const { data, error, refetch } = useGetDataQuery();

  if (error) {
    return (
      <div className="glass p-6 rounded-xl text-center">
        <p className="text-error mb-4">Failed to load data</p>
        <button onClick={refetch} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return <>{/* Success state */}</>;
}
```

#### 4. Accessibility
```tsx
// Use semantic HTML
<button
  onClick={handleClick}
  disabled={isLoading}
  aria-label="Add to cart"
  className="btn-primary"
>
  {isLoading ? 'Adding...' : 'Add to Cart'}
</button>

// Keyboard navigation
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleAction()}
  onClick={handleAction}
>
  Clickable Div
</div>
```

#### 5. Feedback & Confirmation
```tsx
// Visual feedback on actions
const [showSuccess, setShowSuccess] = useState(false);

const handleSave = async () => {
  await saveMutation.mutateAsync(data);
  setShowSuccess(true);
  setTimeout(() => setShowSuccess(false), 2000);
};

return (
  <>
    <button onClick={handleSave}>Save</button>
    {showSuccess && (
      <div className="fixed top-4 right-4 glass-strong p-4 rounded-xl animate-slide-up">
        ✓ Saved successfully
      </div>
    )}
  </>
);
```

### Styling Guidelines

#### Class Name Order (Recommended)
```tsx
<div className={cn(
  // Layout
  'flex items-center justify-between',
  // Spacing
  'p-4 gap-3',
  // Size
  'w-full h-20',
  // Colors & Background
  'bg-surface text-on-surface',
  // Borders
  'border border-outline rounded-xl',
  // Effects
  'backdrop-blur-2xl shadow-lg',
  // Transitions
  'transition-all duration-300',
  // States
  'hover:bg-primary-container active:scale-95',
  // Conditional
  isDark && 'border-slate-700'
)}>
  Content
</div>
```

#### Spacing System
```
Spacing: 0.25rem increments (Tailwind default)
gap-2  = 0.5rem  (8px)
gap-4  = 1rem    (16px)
gap-6  = 1.5rem  (24px)
gap-8  = 2rem    (32px)

Component padding:
- Small:  p-3 (12px)
- Medium: p-4 (16px)
- Large:  p-6 (24px)

Card spacing:
- Compact: p-4 gap-3
- Normal:  p-6 gap-4
- Spacious: p-8 gap-6
```

#### Border Radius
```
rounded-lg   = 0.5rem  (8px)  - Small cards
rounded-xl   = 0.75rem (12px) - Standard cards
rounded-2xl  = 1rem    (16px) - Large cards, modals
rounded-3xl  = 1.5rem  (24px) - Hero elements
```

### Animation Guidelines

```tsx
// Entrance animations
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// Exit animations
<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      Content
    </motion.div>
  )}
</AnimatePresence>

// Stagger children
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    visible: { transition: { staggerChildren: 0.1 } }
  }}
>
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      {item.name}
    </motion.div>
  ))}
</motion.div>
```

---

## 🚀 Creating a New Feature

### Step-by-Step Guide

#### Step 1: Create Feature Folder

```bash
mkdir -p src/features/my-feature/{components,pages,slices,api,hooks,types}
```

#### Step 2: Define Types

**File:** `src/features/my-feature/types/my-feature.types.ts`

```typescript
export interface MyFeature {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMyFeatureRequest {
  name: string;
  description: string;
}

export interface UpdateMyFeatureRequest {
  id: string;
  name?: string;
  description?: string;
}
```

#### Step 3: Create Redux Slice

**File:** `src/features/my-feature/slices/myFeatureSlice.ts`

```typescript
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import type { MyFeature } from '../types/my-feature.types';

interface MyFeatureState {
  selectedId: string | null;
  filters: {
    search: string;
    status: 'all' | 'active' | 'inactive';
  };
}

const initialState: MyFeatureState = {
  selectedId: null,
  filters: {
    search: '',
    status: 'all',
  },
};

const myFeatureSlice = createSlice({
  name: 'myFeature',
  initialState,
  reducers: {
    setSelectedId: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload;
    },
    setSearchFilter: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<'all' | 'active' | 'inactive'>) => {
      state.filters.status = action.payload;
    },
  },
});

export const { setSelectedId, setSearchFilter, setStatusFilter } = myFeatureSlice.actions;

export const selectMyFeature = (state: RootState) => state.myFeature;
export const selectSelectedId = (state: RootState) => state.myFeature.selectedId;
export const selectFilters = (state: RootState) => state.myFeature.filters;

export default myFeatureSlice.reducer;
```

#### Step 4: Create API Service

**File:** `src/features/my-feature/api/myFeatureApi.ts`

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { MyFeature, CreateMyFeatureRequest, UpdateMyFeatureRequest } from '../types/my-feature.types';
import type { RootState } from '@/app/store';

export const myFeatureApi = createApi({
  reducerPath: 'myFeatureApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['MyFeature'],
  endpoints: (builder) => ({
    getMyFeatures: builder.query<MyFeature[], void>({
      query: () => '/my-features',
      providesTags: ['MyFeature'],
    }),
    getMyFeatureById: builder.query<MyFeature, string>({
      query: (id) => `/my-features/${id}`,
      providesTags: (result, error, id) => [{ type: 'MyFeature', id }],
    }),
    createMyFeature: builder.mutation<MyFeature, CreateMyFeatureRequest>({
      query: (body) => ({
        url: '/my-features',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MyFeature'],
    }),
    updateMyFeature: builder.mutation<MyFeature, UpdateMyFeatureRequest>({
      query: ({ id, ...body }) => ({
        url: `/my-features/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'MyFeature', id }],
    }),
    deleteMyFeature: builder.mutation<void, string>({
      query: (id) => ({
        url: `/my-features/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MyFeature'],
    }),
  }),
});

export const {
  useGetMyFeaturesQuery,
  useGetMyFeatureByIdQuery,
  useCreateMyFeatureMutation,
  useUpdateMyFeatureMutation,
  useDeleteMyFeatureMutation,
} = myFeatureApi;
```

#### Step 5: Register in Store

**File:** `src/app/store.ts`

```typescript
// Import slice
import myFeatureReducer from '@/features/my-feature/slices/myFeatureSlice';

// Import API
import { myFeatureApi } from '@/features/my-feature/api/myFeatureApi';

// Add to feature reducers
const featureReducers = {
  // ... existing reducers
  myFeature: myFeatureReducer,
};

// Add to API reducers
const apiReducers = {
  // ... existing APIs
  [myFeatureApi.reducerPath]: myFeatureApi.reducer,
};

// Add to API middlewares
const apiMiddlewares = [
  // ... existing middlewares
  myFeatureApi.middleware,
];
```

#### Step 6: Create Components

**File:** `src/features/my-feature/components/MyFeatureCard.tsx`

```typescript
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/app/hooks';
import { selectSettings } from '@/features/settings/slices/settingsSlice';
import type { MyFeature } from '../types/my-feature.types';

interface MyFeatureCardProps {
  feature: MyFeature;
  onSelect: () => void;
}

export function MyFeatureCard({ feature, onSelect }: MyFeatureCardProps) {
  const { theme } = useAppSelector(selectSettings);
  const isDark = theme === 'dark' || theme === 'luxury';

  return (
    <div
      onClick={onSelect}
      className={cn(
        'glass p-4 rounded-xl cursor-pointer transition-all',
        'hover:border-primary hover:shadow-lg',
        isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
      )}
    >
      <h3 className="text-lg font-bold text-on-surface mb-2">
        {feature.name}
      </h3>
      <p className="text-sm text-on-surface-variant">
        {feature.description}
      </p>
    </div>
  );
}
```

#### Step 7: Create Page

**File:** `src/features/my-feature/pages/MyFeaturePage.tsx`

```typescript
import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { selectSettings } from '@/features/settings/slices/settingsSlice';
import { useGetMyFeaturesQuery, useCreateMyFeatureMutation } from '../api/myFeatureApi';
import { setSelectedId } from '../slices/myFeatureSlice';
import { MyFeatureCard } from '../components/MyFeatureCard';

export function MyFeaturePage() {
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector(selectSettings);
  const isDark = theme === 'dark' || theme === 'luxury';

  const { data: features, isLoading } = useGetMyFeaturesQuery();
  const [createFeature] = useCreateMyFeatureMutation();

  const handleSelect = (id: string) => {
    dispatch(setSelectedId(id));
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4 p-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className={cn(
          'text-3xl font-bold mb-2',
          isDark ? 'text-white' : 'text-slate-900'
        )}>
          My Features
        </h1>
        <p className="text-on-surface-variant">
          Manage your features here
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features?.map(feature => (
          <MyFeatureCard
            key={feature.id}
            feature={feature}
            onSelect={() => handleSelect(feature.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

#### Step 8: Add Route

**File:** `src/routes/index.tsx`

```typescript
import { MyFeaturePage } from '@/features/my-feature/pages/MyFeaturePage';

const routes = [
  // ... existing routes
  {
    path: '/my-feature',
    element: <MyFeaturePage />,
  },
];
```

---

## 📦 Component Patterns

### 1. Container/Presenter Pattern

```typescript
// Container (Smart Component) - handles logic
function ProductListContainer() {
  const { data, isLoading } = useGetProductsQuery();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <ProductListPresenter
      products={data ?? []}
      isLoading={isLoading}
      selectedId={selectedId}
      onSelect={setSelectedId}
    />
  );
}

// Presenter (Dumb Component) - only renders
interface ProductListPresenterProps {
  products: Product[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function ProductListPresenter({ products, isLoading, selectedId, onSelect }: ProductListPresenterProps) {
  if (isLoading) return <Skeleton />;

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          isSelected={product.id === selectedId}
          onSelect={() => onSelect(product.id)}
        />
      ))}
    </div>
  );
}
```

### 2. Compound Components

```typescript
// Card compound component
export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('glass p-6 rounded-xl', className)}>
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 pb-4 border-b border-outline">{children}</div>;
};

Card.Body = function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="flex-1">{children}</div>;
};

Card.Footer = function CardFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 pt-4 border-t border-outline">{children}</div>;
};

// Usage
<Card>
  <Card.Header>
    <h2>Title</h2>
  </Card.Header>
  <Card.Body>
    <p>Content</p>
  </Card.Body>
  <Card.Footer>
    <button>Action</button>
  </Card.Footer>
</Card>
```

### 3. Render Props Pattern

```typescript
interface DataFetcherProps<T> {
  queryFn: () => UseQueryResult<T>;
  children: (data: T, refetch: () => void) => React.ReactNode;
  loadingFallback?: React.ReactNode;
}

function DataFetcher<T>({ queryFn, children, loadingFallback }: DataFetcherProps<T>) {
  const { data, isLoading, refetch } = queryFn();

  if (isLoading) return <>{loadingFallback ?? <Skeleton />}</>;
  if (!data) return null;

  return <>{children(data, refetch)}</>;
}

// Usage
<DataFetcher
  queryFn={useGetProductsQuery}
  loadingFallback={<div>Loading products...</div>}
>
  {(products, refetch) => (
    <div>
      <button onClick={refetch}>Refresh</button>
      {products.map(p => <div key={p.id}>{p.name}</div>)}
    </div>
  )}
</DataFetcher>
```

---

## 📘 TypeScript Guidelines

### Type Definition Best Practices

```typescript
// ✅ GOOD: Use interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ GOOD: Use type for unions, intersections, primitives
type Status = 'pending' | 'active' | 'inactive';
type UserWithRole = User & { role: string };

// ✅ GOOD: Export types from feature folders
export type { User, UserWithRole };

// ✅ GOOD: Use readonly for immutable data
interface Config {
  readonly apiUrl: string;
  readonly timeout: number;
}

// ✅ GOOD: Use optional properties
interface CreateUserRequest {
  name: string;
  email: string;
  phone?: string;  // optional
}

// ❌ BAD: Don't use any
const data: any = fetchData();  // Avoid!

// ✅ GOOD: Use unknown and type guards
const data: unknown = fetchData();
if (isUser(data)) {
  // data is User here
  console.log(data.name);
}

function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj
  );
}
```

### Generic Components

```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <div>
      {items.map(item => (
        <div key={keyExtractor(item)}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

// Usage
<List
  items={products}
  keyExtractor={(p) => p.id}
  renderItem={(p) => <ProductCard product={p} />}
/>
```

---

## 🌍 Internationalization (i18n)

### Structure

```
src/
├── config/
│   └── i18n.config.ts        # i18n setup
└── features/
    └── [feature]/
        └── locales/
            ├── ar/
            │   └── [feature].json
            └── en/
                └── [feature].json
```

### Usage

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('featureName');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description', { name: 'John' })}</p>
      <span>{t('count', { count: 5 })}</span>
    </div>
  );
}
```

### Translation Files

**File:** `src/features/pos/locales/en/pos.json`
```json
{
  "title": "Point of Sale",
  "addToCart": "Add to Cart",
  "total": "Total: {{amount}}",
  "itemCount": "{{count}} item",
  "itemCount_plural": "{{count}} items"
}
```

---

## ⚡ Performance Optimization

### 1. Memoization

```typescript
import { useMemo, useCallback } from 'react';

function ExpensiveComponent({ items }: { items: Item[] }) {
  // Memoize expensive calculations
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price, 0);
  }, [items]);

  // Memoize callbacks
  const handleClick = useCallback((id: string) => {
    console.log('Clicked:', id);
  }, []);

  return <div>Total: {total}</div>;
}
```

### 2. React.memo

```typescript
import { memo } from 'react';

// Prevent re-renders if props haven't changed
export const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  return (
    <div className="glass p-4 rounded-xl">
      <h3>{product.name}</h3>
      <p>{product.price}</p>
    </div>
  );
});
```

### 3. Code Splitting

```typescript
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<div className="skeleton h-64" />}>
      <HeavyChart />
    </Suspense>
  );
}
```

### 4. RTK Query Optimization

```typescript
// Use selective queries
const { data } = useGetProductsQuery(undefined, {
  selectFromResult: ({ data }) => ({
    data: data?.filter(p => p.isActive),
  }),
});

// Skip queries conditionally
const { data } = useGetProductByIdQuery(productId, {
  skip: !productId,
});

// Polling with pollingInterval
const { data } = useGetOrdersQuery(undefined, {
  pollingInterval: 30000, // 30 seconds
});
```

---

## 🧪 Testing Strategy

### Unit Tests (Components)

```typescript
import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  it('renders product name', () => {
    const product = { id: '1', name: 'Test Product', price: 100 };
    render(<ProductCard product={product} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });
});
```

### Redux Tests (Slices)

```typescript
import cartReducer, { addItem, removeItem } from './cartSlice';

describe('cartSlice', () => {
  it('should add item to cart', () => {
    const initialState = { items: [] };
    const item = { id: '1', name: 'Product', price: 100 };

    const newState = cartReducer(initialState, addItem(item));
    expect(newState.items).toHaveLength(1);
    expect(newState.items[0]).toEqual(item);
  });
});
```

---

## ⚠️ Common Pitfalls

### 1. Not Using Typed Hooks
```typescript
// ❌ BAD
import { useSelector, useDispatch } from 'react-redux';

// ✅ GOOD
import { useAppSelector, useAppDispatch } from '@/app/hooks';
```

### 2. Mutating State
```typescript
// ❌ BAD
state.items.push(newItem);  // Outside reducer

// ✅ GOOD - Inside slice reducer (Immer handles immutability)
reducers: {
  addItem: (state, action) => {
    state.items.push(action.payload);  // OK in Redux Toolkit
  }
}
```

### 3. Not Handling Loading States
```typescript
// ❌ BAD
const { data } = useGetProductsQuery();
return <div>{data.map(...)}</div>;  // Crashes if data is undefined

// ✅ GOOD
const { data, isLoading } = useGetProductsQuery();
if (isLoading) return <Skeleton />;
if (!data) return null;
return <div>{data.map(...)}</div>;
```

### 4. Hardcoding Colors
```typescript
// ❌ BAD
<div className="bg-blue-500 text-white">

// ✅ GOOD
<div className="bg-primary text-on-primary">
```

### 5. Not Invalidating Cache
```typescript
// ❌ BAD - Cache won't update after mutation
createProduct: builder.mutation<Product, CreateProductRequest>({
  query: (body) => ({ url: '/products', method: 'POST', body }),
  // Missing: invalidatesTags
});

// ✅ GOOD
createProduct: builder.mutation<Product, CreateProductRequest>({
  query: (body) => ({ url: '/products', method: 'POST', body }),
  invalidatesTags: [{ type: 'Product', id: 'LIST' }],
});
```

---

## 📚 Additional Resources

- **Redux Toolkit Docs**: https://redux-toolkit.js.org
- **RTK Query Docs**: https://redux-toolkit.js.org/rtk-query/overview
- **React TypeScript Cheatsheet**: https://react-typescript-cheatsheet.netlify.app
- **TailwindCSS Docs**: https://tailwindcss.com/docs
- **Framer Motion Docs**: https://www.framer.com/motion

---

## 🤝 Contributing

When contributing to this project:

1. Follow the feature-based architecture
2. Use TypeScript strictly (no `any` types)
3. Test all themes (light, dark, luxury)
4. Add loading and error states
5. Use Redux DevTools to debug state
6. Write meaningful commit messages
7. Update this guide when adding new patterns

---

**Happy Coding! 🚀**
