/**
 * Settings Redux Slice
 * Manages application settings: language, theme, direction
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import i18n from '@/config/i18n.config';

// =============================================================================
// TYPES
// =============================================================================

export type Language = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';
export type Theme = 'light' | 'dark' | 'luxury';

export interface SettingsState {
    language: Language;
    direction: Direction;
    theme: Theme;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: SettingsState = {
    language: 'ar',
    direction: 'rtl',
    theme: 'dark',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Apply settings to DOM
 */
function applySettingsToDOM(language: Language, theme: Theme): void {
    const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

    // Update DOM attributes
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('data-theme', theme);

    // Update i18n
    i18n.changeLanguage(language);
}

// =============================================================================
// SLICE
// =============================================================================

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        /**
         * Set the application language
         */
        setLanguage: (state, action: PayloadAction<Language>) => {
            const language = action.payload;
            const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

            state.language = language;
            state.direction = direction;

            // Apply to DOM
            applySettingsToDOM(language, state.theme);
        },

        /**
         * Set the application theme
         */
        setTheme: (state, action: PayloadAction<Theme>) => {
            const theme = action.payload;
            state.theme = theme;

            // Apply to DOM
            document.documentElement.setAttribute('data-theme', theme);
        },

        /**
         * Toggle between Arabic and English
         */
        toggleLanguage: (state) => {
            const newLanguage: Language = state.language === 'ar' ? 'en' : 'ar';
            const direction: Direction = newLanguage === 'ar' ? 'rtl' : 'ltr';

            state.language = newLanguage;
            state.direction = direction;

            // Apply to DOM
            applySettingsToDOM(newLanguage, state.theme);
        },

        /**
         * Cycle through themes: light -> dark -> luxury -> light
         */
        toggleTheme: (state) => {
            const themes: Theme[] = ['light', 'dark', 'luxury'];
            const currentIndex = themes.indexOf(state.theme);
            const nextTheme = themes[(currentIndex + 1) % themes.length];

            state.theme = nextTheme;

            // Apply to DOM
            document.documentElement.setAttribute('data-theme', nextTheme);
        },

        /**
         * Initialize settings from persisted state
         * Called after store rehydration
         */
        initializeFromPersisted: (state) => {
            applySettingsToDOM(state.language, state.theme);
        },

        /**
         * Reset settings to defaults
         */
        resetSettings: (state) => {
            state.language = initialState.language;
            state.direction = initialState.direction;
            state.theme = initialState.theme;

            applySettingsToDOM(initialState.language, initialState.theme);
        },
    },
});

// =============================================================================
// ACTIONS
// =============================================================================

export const {
    setLanguage,
    setTheme,
    toggleLanguage,
    toggleTheme,
    initializeFromPersisted,
    resetSettings,
} = settingsSlice.actions;

// =============================================================================
// SELECTORS
// =============================================================================

export const selectLanguage = (state: RootState) => state.settings.language;
export const selectDirection = (state: RootState) => state.settings.direction;
export const selectTheme = (state: RootState) => state.settings.theme;
export const selectSettings = (state: RootState) => state.settings;

/**
 * Check if current language is RTL
 */
export const selectIsRTL = (state: RootState) => state.settings.direction === 'rtl';

// =============================================================================
// REDUCER
// =============================================================================

export default settingsSlice.reducer;
