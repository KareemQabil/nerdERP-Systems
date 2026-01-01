/**
 * Redux Store Configuration
 * Central store setup with RTK Query middleware and persistence
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// =============================================================================
// FEATURE SLICES
// =============================================================================

import authReducer from '@/features/auth/slices/authSlice';
import settingsReducer from '@/features/settings/slices/settingsSlice';
import uiReducer from '@/features/ui/slices/uiSlice';
import cartReducer from '@/features/pos/slices/cartSlice';
import sessionReducer from '@/features/pos/slices/sessionSlice';
import orderReducer from '@/features/pos/slices/orderSlice';
import configReducer from '@/features/pos/slices/configSlice';

// Feature reducers
const featureReducers = {
    auth: authReducer,
    settings: settingsReducer,
    ui: uiReducer,
    cart: cartReducer,
    session: sessionReducer,
    order: orderReducer,
    config: configReducer,
};

// =============================================================================
// RTK QUERY APIs
// =============================================================================

import { productsApi } from '@/features/pos/api/productsApi';
import { ordersApi } from '@/features/pos/api/ordersApi';
import { customersApi } from '@/features/customers/api/customersApi';
import { sessionsApi } from '@/features/pos/api/sessionsApi';
import { storeSettingsApi } from '@/features/settings/api/storeSettingsApi';

// Collect all API reducers
const apiReducers = {
    [productsApi.reducerPath]: productsApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [customersApi.reducerPath]: customersApi.reducer,
    [sessionsApi.reducerPath]: sessionsApi.reducer,
    [storeSettingsApi.reducerPath]: storeSettingsApi.reducer,
};

// API middlewares
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apiMiddlewares: any[] = [
    productsApi.middleware,
    ordersApi.middleware,
    customersApi.middleware,
    sessionsApi.middleware,
    storeSettingsApi.middleware,
];

// =============================================================================
// ROOT REDUCER
// =============================================================================

const rootReducer = combineReducers({
    ...featureReducers,
    ...apiReducers,
});

// =============================================================================
// PERSISTENCE CONFIG
// =============================================================================

const persistConfig = {
    key: 'nerdpos',
    version: 1,
    storage,
    // Only persist specific slices
    whitelist: [
        'auth',
        'cart',
        'settings',
        'session',
        'order',
        'config',
        // Note: RTK Query handles its own caching, no need to persist
    ],
    // Blacklist UI state (transient)
    blacklist: ['ui'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// =============================================================================
// STORE CONFIGURATION
// =============================================================================

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore redux-persist actions
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }).concat(...apiMiddlewares),
    devTools: import.meta.env.DEV,
});

// Enable refetchOnFocus/refetchOnReconnect for RTK Query
setupListeners(store.dispatch);

// =============================================================================
// PERSISTOR
// =============================================================================

export const persistor = persistStore(store);

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// =============================================================================
// STORE HELPERS
// =============================================================================

/**
 * Reset persisted state (useful for logout)
 */
export async function resetPersistedState(): Promise<void> {
    await persistor.purge();
}

/**
 * Get current state snapshot
 */
export function getState(): RootState {
    return store.getState();
}
