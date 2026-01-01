# Quick Start Prompt for Next Agent

Copy and paste this prompt to continue the Redux migration:

---

## Prompt

Continue the Zustand to Redux migration for the nerdERP frontend application.

**CONTEXT:**
- Phase 1-6 completed: Redux infrastructure, core slices, RTK Query APIs, and major POS/Settings components migrated
- 58% complete overall
- Remaining: 15 items (12 components + 2 Zustand stores + 1 new slice to create)
- Full details in `REDUX_MIGRATION_GUIDE.md`

**YOUR TASKS:**

1. **Migrate 9 remaining POS components** in `src/features/pos/components/`:
   - `HeldOrdersModal.tsx`
   - `SplitPaymentPanel.tsx`
   - `OrderNotesModal.tsx`
   - `ManagerPinModal.tsx`
   - `KitchenStatusBadge.tsx`
   - `DemoModeBanner.tsx`
   - `CustomerSearchModal.tsx`
   - `CheckoutBlockers.tsx`
   - `skeletons.tsx`

2. **Migrate 3 remaining Settings sections**:
   - `src/features/settings/components/sections/GeneralSection.tsx`
   - `src/features/settings/components/sections/POSSection.tsx`
   - `src/features/settings/components/sections/SecuritySection.tsx`

3. **Create Redux slice for config/feature flags**:
   - Create `src/features/settings/slices/configSlice.ts`
   - Migrate logic from `src/stores/config.store.ts`
   - Update store.ts to include new slice
   - Update components using `useConfigStore`
   - Template provided in `REDUX_MIGRATION_GUIDE.md` section "Creating New Redux Slices"

4. **Handle order store**:
   - Review `src/stores/order.store.ts`
   - Check if RTK Query `ordersApi.ts` covers all needs
   - Create Redux slice for UI state if needed
   - Fix TypeScript errors in order.store.ts

5. **Clean up and verify**:
   - Run `npm run build` frequently
   - Fix TypeScript errors as they appear
   - Remove unused Zustand stores once fully migrated
   - Verify all components work correctly

**MIGRATION PATTERN:**

```typescript
// OLD (Zustand)
import { useSettingsStore } from '@/stores/settings.store';
const { theme, setTheme } = useSettingsStore();
setTheme('dark');

// NEW (Redux)
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectTheme, setTheme } from '@/features/settings/slices/settingsSlice';
const dispatch = useAppDispatch();
const theme = useAppSelector(selectTheme);
dispatch(setTheme('dark'));
```

**REFERENCES:**
- Completed examples: `POSPage.tsx`, `CartPanel.tsx`, `DisplaySection.tsx`
- Redux slices: `settingsSlice.ts`, `cartSlice.ts`, `sessionSlice.ts`
- RTK Query: `productsApi.ts`, `ordersApi.ts`, `customersApi.ts`
- Full guide: `REDUX_MIGRATION_GUIDE.md`

**START:** Begin with simplest components (skeletons, banners, badges) then progress to complex modals.

**IMPORTANT:**
- Follow the established pattern strictly
- Test each component after migration
- Run `npm run build` to verify TypeScript errors
- Update `REDUX_MIGRATION_GUIDE.md` progress tracking table when completing items

---

## Expected Outcome

After completion:
- ✅ All 12 remaining components migrated to Redux
- ✅ Config slice created and integrated
- ✅ All Zustand stores removed or documented for future removal
- ✅ Build passes with only pre-existing auth module errors
- ✅ 100% Redux migration complete
