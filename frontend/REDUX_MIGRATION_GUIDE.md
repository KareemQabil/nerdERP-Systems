# Redux Migration Guide - nerdERP Frontend

## 📋 Migration Status Overview

This document tracks the ongoing migration from Zustand to Redux Toolkit in the nerdERP frontend application.

### ✅ Completed (Phase 1-6)

#### Infrastructure & Setup
- ✅ Redux store configuration (`src/app/store.ts`)
- ✅ Typed Redux hooks (`src/app/hooks.ts`)
- ✅ Redux persist configuration
- ✅ Feature-based architecture restructure
- ✅ Translation system migration (feature-based locales)

#### Redux Slices Created
- ✅ `src/features/settings/slices/settingsSlice.ts` - Theme, language, preferences
- ✅ `src/features/pos/slices/cartSlice.ts` - Shopping cart state
- ✅ `src/features/pos/slices/sessionSlice.ts` - POS session management

#### RTK Query APIs Created
- ✅ `src/features/pos/api/productsApi.ts` - Products, categories, modifiers
- ✅ `src/features/pos/api/ordersApi.ts` - Orders, payments, kitchen operations
- ✅ `src/features/customers/api/customersApi.ts` - Customer management, loyalty

#### Components Migrated to Redux

**Layout:**
- ✅ `src/components/layout/MainLayout.tsx`
- ✅ `src/components/layout/MainNavigation.tsx`

**POS Core:**
- ✅ `src/features/pos/pages/POSPage.tsx`
- ✅ `src/features/pos/components/CartPanel.tsx`
- ✅ `src/features/pos/components/POSActionBar.tsx`
- ✅ `src/features/pos/components/ModifierModal.tsx`
- ✅ `src/features/pos/components/CheckoutModal.tsx`
- ✅ `src/features/pos/components/DiscountModal.tsx`
- ✅ `src/features/pos/components/VoidItemButton.tsx`
- ✅ `src/features/pos/components/TableSelector.tsx`

**Settings:**
- ✅ `src/features/settings/pages/SettingsPage.tsx`
- ✅ `src/features/settings/components/sections/DisplaySection.tsx`
- ✅ `src/features/settings/components/SettingsCard.tsx`
- ✅ `src/features/settings/components/FeatureToggle.tsx`

---

## 🚧 Remaining Work (Phase 7+)

### POS Components Still Using Zustand

The following components still import from Zustand stores and need migration:

1. **`src/features/pos/components/HeldOrdersModal.tsx`**
   - Uses: `useSettingsStore` (theme, language)
   - Likely uses: `useCartStore` or `useOrderStore`

2. **`src/features/pos/components/SplitPaymentPanel.tsx`**
   - Uses: `useSettingsStore` (theme, language)
   - Likely manages payment state

3. **`src/features/pos/components/OrderNotesModal.tsx`**
   - Uses: `useSettingsStore` (theme, language)
   - May interact with cart/order state

4. **`src/features/pos/components/ManagerPinModal.tsx`**
   - Uses: `useSettingsStore` (theme, language)
   - Authentication/authorization logic

5. **`src/features/pos/components/KitchenStatusBadge.tsx`**
   - Uses: `useSettingsStore` (theme, language)
   - Display component only

6. **`src/features/pos/components/DemoModeBanner.tsx`**
   - Uses: `useSettingsStore` (theme)
   - Display component only

7. **`src/features/pos/components/CustomerSearchModal.tsx`**
   - Uses: `useSettingsStore` (theme, language)
   - May need RTK Query for customer search

8. **`src/features/pos/components/CheckoutBlockers.tsx`**
   - Uses: `useSettingsStore` (theme)
   - Validation logic component

9. **`src/features/pos/components/skeletons.tsx`**
   - Uses: `useSettingsStore` (theme)
   - Loading state components

### Settings Sections Still Using Zustand

10. **`src/features/settings/components/sections/GeneralSection.tsx`**
    - Uses: `useSettingsStore`, `useConfigStore`
    - Store/business settings

11. **`src/features/settings/components/sections/POSSection.tsx`**
    - Uses: `useSettingsStore`, `useConfigStore`
    - POS-specific configuration

12. **`src/features/settings/components/sections/SecuritySection.tsx`**
    - Uses: `useSettingsStore`, `useConfigStore`
    - Security and permission settings

### Additional Zustand Stores to Migrate

These stores are still in use and need Redux equivalents:

- **`src/stores/config.store.ts`** - Feature flags, POS config
  - Needs: Redux slice for config/feature flags
  - Components using it: DisplaySection, POSSection, GeneralSection

- **`src/stores/order.store.ts`** - Order management
  - May need: RTK Query for orders (partially done) + Redux slice for UI state
  - Has TypeScript errors to fix

---

## 🎯 Migration Prompt for Next Agent

```
Continue the Zustand to Redux migration for the nerdERP frontend application.

CONTEXT:
- Phase 1-6 completed: Redux infrastructure, core slices, RTK Query APIs, and major POS/Settings components migrated
- Remaining: 12 components + 2 Zustand stores still using old state management
- See REDUX_MIGRATION_GUIDE.md for full details

YOUR TASKS:

1. **Migrate remaining POS components** (9 components in src/features/pos/components/):
   - HeldOrdersModal, SplitPaymentPanel, OrderNotesModal
   - ManagerPinModal, KitchenStatusBadge, DemoModeBanner
   - CustomerSearchModal, CheckoutBlockers, skeletons.tsx

2. **Migrate remaining Settings sections** (3 components):
   - GeneralSection, POSSection, SecuritySection

3. **Create Redux slice for config/feature flags**:
   - Migrate `src/stores/config.store.ts` to Redux slice
   - Update components using `useConfigStore`

4. **Handle order store**:
   - Review `src/stores/order.store.ts`
   - Determine if RTK Query ordersApi covers needs or create Redux slice for UI state
   - Fix existing TypeScript errors

5. **Clean up**:
   - Remove unused Zustand stores once migration complete
   - Fix any remaining TypeScript errors
   - Run build to verify success

MIGRATION PATTERN:
Follow the established pattern in migrated components:

// OLD (Zustand)
import { useSettingsStore } from '@/stores/settings.store';
const { theme, setTheme } = useSettingsStore();

// NEW (Redux)
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectTheme, setTheme } from '@/features/settings/slices/settingsSlice';
const dispatch = useAppDispatch();
const theme = useAppSelector(selectTheme);
dispatch(setTheme('dark'));

REFERENCE:
- Completed examples: POSPage.tsx, CartPanel.tsx, DisplaySection.tsx
- Redux slices: settingsSlice.ts, cartSlice.ts, sessionSlice.ts
- RTK Query: productsApi.ts, ordersApi.ts, customersApi.ts

START: Begin with the simplest components (skeletons, banners, badges) then progress to complex modals.
```

---

## 📖 Detailed Migration Steps

### Step 1: Identify Zustand Usage

Search for Zustand imports in the component:
```typescript
import { useSettingsStore } from '@/stores/settings.store';
import { useCartStore } from '@/stores/cart.store';
import { useConfigStore } from '@/stores/config.store';
```

### Step 2: Replace with Redux Imports

**For Settings (theme, language):**
```typescript
// Remove
import { useSettingsStore } from '@/stores/settings.store';

// Add
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  selectTheme,
  selectLanguage,
  setTheme,
  setLanguage,
  toggleLanguage
} from '@/features/settings/slices/settingsSlice';
```

**For Cart:**
```typescript
// Remove
import { useCartStore } from '@/stores/cart.store';

// Add
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  selectCartItems,
  selectActiveItems,
  selectItemCount,
  selectSubtotal,
  selectTotal,
  type CartItem,
  type ProductInfo
} from '@/features/pos/slices/cartSlice';
```

**For Config/Features:**
```typescript
// Remove
import { useConfigStore } from '@/stores/config.store';

// TODO: Add when config slice is created
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  selectPOSConfig,
  selectFeatureFlags,
  setPOSConfig,
  toggleFeature
} from '@/features/settings/slices/configSlice'; // To be created
```

### Step 3: Update Component Hooks

**OLD Pattern:**
```typescript
export function MyComponent() {
  const { theme, setTheme, language } = useSettingsStore();
  const { addItem, cartItems } = useCartStore();

  // ...
}
```

**NEW Pattern:**
```typescript
export function MyComponent() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const language = useAppSelector(selectLanguage);
  const cartItems = useAppSelector(selectCartItems);

  // ...
}
```

### Step 4: Update Action Calls

**OLD:**
```typescript
setTheme('dark');
addItem(product);
```

**NEW:**
```typescript
dispatch(setTheme('dark'));
dispatch(addItem({ product }));
```

### Step 5: Handle Action Payload Differences

The Redux actions may have different payload shapes than Zustand methods:

**Cart addItem:**
```typescript
// OLD (Zustand)
addItem(product, quantity, modifiers, instructions);

// NEW (Redux)
dispatch(addItem({
  product,
  quantity,
  modifiers,
  instructions
}));
```

**Cart updateQuantity:**
```typescript
// OLD (Zustand)
updateQuantity(itemId, newQty);

// NEW (Redux)
dispatch(updateQuantity({
  cartItemId: itemId,
  quantity: newQty
}));
```

### Step 6: Fix TypeScript Errors

After migration, fix any TypeScript errors:

**Unused variables:**
```typescript
// If a helper function is no longer needed, prefix with underscore
const _getStatusMessage = () => { /* ... */ };
```

**Import paths:**
```typescript
// Update CartItem import from Zustand to Redux
// OLD
import type { CartItem } from '@/stores/cart.store';

// NEW
import type { CartItem } from '@/features/pos/slices/cartSlice';
```

### Step 7: Test the Component

1. Run `npm run build` to check for TypeScript errors
2. Verify component renders correctly
3. Test all user interactions
4. Check Redux DevTools to verify state updates

---

## 🔧 Creating New Redux Slices

If you need to create a new slice (e.g., for config/feature flags):

### Template: Config Slice

```typescript
// src/features/settings/slices/configSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';

// =============================================================================
// TYPES
// =============================================================================

export interface FeatureFlags {
  allowSplitPayment: boolean;
  requireManagerForDiscount: boolean;
  enableKitchenDisplay: boolean;
  enableCustomerLoyalty: boolean;
  enableTableManagement: boolean;
  showProductImages: boolean;
  allowNegativeStock: boolean;
}

export interface POSConfig {
  taxRate: number;
  defaultPaymentMethod: 'CASH' | 'CARD' | 'MADA';
  receiptFooterText: string;
  autoOpenCashDrawer: boolean;
  printReceiptAutomatically: boolean;
  confirmBeforeVoid: boolean;
  compactCartMode: boolean;
  showStockLevels: boolean;
  lowStockThreshold: number;
  sessionTimeout: number; // minutes
}

interface ConfigState {
  featureFlags: FeatureFlags;
  posConfig: POSConfig;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: ConfigState = {
  featureFlags: {
    allowSplitPayment: true,
    requireManagerForDiscount: true,
    enableKitchenDisplay: true,
    enableCustomerLoyalty: true,
    enableTableManagement: true,
    showProductImages: true,
    allowNegativeStock: false,
  },
  posConfig: {
    taxRate: 15,
    defaultPaymentMethod: 'CASH',
    receiptFooterText: 'Thank you for your business!',
    autoOpenCashDrawer: true,
    printReceiptAutomatically: false,
    confirmBeforeVoid: true,
    compactCartMode: false,
    showStockLevels: true,
    lowStockThreshold: 10,
    sessionTimeout: 480, // 8 hours
  },
};

// =============================================================================
// SLICE
// =============================================================================

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    toggleFeature: (state, action: PayloadAction<keyof FeatureFlags>) => {
      state.featureFlags[action.payload] = !state.featureFlags[action.payload];
    },

    setFeatureFlag: (
      state,
      action: PayloadAction<{ flag: keyof FeatureFlags; enabled: boolean }>
    ) => {
      state.featureFlags[action.payload.flag] = action.payload.enabled;
    },

    setPOSConfig: (state, action: PayloadAction<Partial<POSConfig>>) => {
      state.posConfig = { ...state.posConfig, ...action.payload };
    },

    resetPOSConfig: (state) => {
      state.posConfig = initialState.posConfig;
    },

    resetFeatureFlags: (state) => {
      state.featureFlags = initialState.featureFlags;
    },
  },
});

// =============================================================================
// ACTIONS
// =============================================================================

export const {
  toggleFeature,
  setFeatureFlag,
  setPOSConfig,
  resetPOSConfig,
  resetFeatureFlags,
} = configSlice.actions;

// =============================================================================
// SELECTORS
// =============================================================================

export const selectFeatureFlags = (state: RootState) => state.config.featureFlags;
export const selectPOSConfig = (state: RootState) => state.config.posConfig;

export const selectFeatureFlag = (flag: keyof FeatureFlags) => (state: RootState) =>
  state.config.featureFlags[flag];

// =============================================================================
// REDUCER
// =============================================================================

export default configSlice.reducer;
```

### Add to Store

```typescript
// src/app/store.ts
import configReducer from '@/features/settings/slices/configSlice';

const rootReducer = combineReducers({
  settings: settingsReducer,
  cart: cartReducer,
  session: sessionReducer,
  config: configReducer, // Add this
  // ... other reducers
});
```

---

## ⚠️ Common Pitfalls

### 1. Action Payload Shape
**Problem:** Zustand methods often take multiple parameters, Redux actions take one payload object.

**Solution:**
```typescript
// Zustand
addItem(product, qty, mods);

// Redux - wrap in object
dispatch(addItem({ product, quantity: qty, modifiers: mods }));
```

### 2. Selector vs Direct Access
**Problem:** Trying to destructure from useAppSelector.

**Solution:**
```typescript
// ❌ Wrong
const { theme, language } = useAppSelector(selectSettings);

// ✅ Correct
const theme = useAppSelector(selectTheme);
const language = useAppSelector(selectLanguage);
```

### 3. Missing Dispatch
**Problem:** Calling action creators directly.

**Solution:**
```typescript
// ❌ Wrong
setTheme('dark');

// ✅ Correct
dispatch(setTheme('dark'));
```

### 4. Import Paths
**Problem:** Importing types from old Zustand stores.

**Solution:**
```typescript
// ❌ Wrong
import type { CartItem } from '@/stores/cart.store';

// ✅ Correct
import type { CartItem } from '@/features/pos/slices/cartSlice';
```

---

## 🧪 Testing Checklist

After migrating each component:

- [ ] TypeScript build passes (`npm run build`)
- [ ] Component renders without errors
- [ ] All user interactions work (clicks, inputs, etc.)
- [ ] Redux state updates correctly (check DevTools)
- [ ] Theme switching works
- [ ] Language switching works (if applicable)
- [ ] Cart operations work (if applicable)
- [ ] No console errors or warnings
- [ ] Persisted state loads correctly on refresh

---

## 📊 Progress Tracking

| Category | Total | Completed | Remaining | Progress |
|----------|-------|-----------|-----------|----------|
| Infrastructure | 1 | 1 | 0 | 100% |
| Redux Slices | 4 | 3 | 1 | 75% |
| RTK Query APIs | 5 | 3 | 2 | 60% |
| Layout Components | 2 | 2 | 0 | 100% |
| POS Components | 17 | 8 | 9 | 47% |
| Settings Components | 7 | 4 | 3 | 57% |
| **TOTAL** | **36** | **21** | **15** | **58%** |

---

## 🎓 Reference Examples

### Example 1: Simple Display Component (No State Changes)

**Component: KitchenStatusBadge**

```typescript
// Before
import { useSettingsStore } from '@/stores/settings.store';

export function KitchenStatusBadge({ status }) {
  const { theme } = useSettingsStore();
  // ... render logic
}

// After
import { useAppSelector } from '@/app/hooks';
import { selectTheme } from '@/features/settings/slices/settingsSlice';

export function KitchenStatusBadge({ status }) {
  const theme = useAppSelector(selectTheme);
  // ... render logic
}
```

### Example 2: Modal with State Updates

**Component: CustomerSearchModal**

```typescript
// Before
import { useSettingsStore } from '@/stores/settings.store';

export function CustomerSearchModal({ onSelect }) {
  const { theme, language } = useSettingsStore();
  // ... search logic
}

// After
import { useAppSelector } from '@/app/hooks';
import { selectTheme, selectLanguage } from '@/features/settings/slices/settingsSlice';

export function CustomerSearchModal({ onSelect }) {
  const theme = useAppSelector(selectTheme);
  const language = useAppSelector(selectLanguage);

  // Optionally use RTK Query for customer search
  // const { data: customers, isLoading } = useSearchCustomersQuery(searchQuery);

  // ... search logic
}
```

### Example 3: Settings Section with Actions

**Component: POSSection**

```typescript
// Before
import { useSettingsStore } from '@/stores/settings.store';
import { useConfigStore } from '@/stores/config.store';

export function POSSection() {
  const { theme } = useSettingsStore();
  const { posConfig, setPOSConfig } = useConfigStore();

  return (
    <FeatureToggle
      enabled={posConfig.autoOpenCashDrawer}
      onChange={(v) => setPOSConfig({ autoOpenCashDrawer: v })}
    />
  );
}

// After
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectTheme } from '@/features/settings/slices/settingsSlice';
import { selectPOSConfig, setPOSConfig } from '@/features/settings/slices/configSlice';

export function POSSection() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const posConfig = useAppSelector(selectPOSConfig);

  return (
    <FeatureToggle
      enabled={posConfig.autoOpenCashDrawer}
      onChange={(v) => dispatch(setPOSConfig({ autoOpenCashDrawer: v }))}
    />
  );
}
```

---

## 🚀 Getting Started

To continue the migration:

1. **Read this guide** thoroughly
2. **Start with simple components** (skeletons.tsx, DemoModeBanner, KitchenStatusBadge)
3. **Use the migration pattern** consistently
4. **Run build frequently** to catch errors early
5. **Test each component** after migration
6. **Update this document** as you complete items

Good luck! 🎉

---

## 📝 Notes

- All Zustand and Redux state will coexist during migration
- No need to rush - incremental migration is fine
- Focus on correctness over speed
- Use TypeScript to guide you - it will catch most issues
- Redux DevTools is your friend for debugging state

---

**Last Updated:** 2025-12-29
**Status:** 58% Complete (Phase 6/~10)
**Next Priority:** Remaining POS components (9 files)
