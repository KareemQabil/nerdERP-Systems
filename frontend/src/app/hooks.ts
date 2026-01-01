/**
 * Typed Redux Hooks
 * Pre-typed versions of useDispatch and useSelector for use throughout the app
 */

import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * Typed useDispatch hook
 * Use this instead of plain `useDispatch` for proper typing
 *
 * @example
 * const dispatch = useAppDispatch();
 * dispatch(login(user));
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed useSelector hook
 * Use this instead of plain `useSelector` for proper typing
 *
 * @example
 * const user = useAppSelector(selectCurrentUser);
 * const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn);
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Custom hook to get dispatch
 * Useful when you need both dispatch and selector in same component
 *
 * @example
 * const { dispatch, select } = useAppStore();
 * const user = select(selectCurrentUser);
 * dispatch(login(user));
 */
export function useAppStore() {
    const dispatch = useAppDispatch();
    const select = useAppSelector;
    return { dispatch, select };
}
