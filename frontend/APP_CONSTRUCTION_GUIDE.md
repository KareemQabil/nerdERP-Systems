# React Architecture: Master Construction Guide

**Version**: 1.0.0
**Purpose**: This document serves as the absolute source of truth for creating new applications or features using the React architecture. It is designed to be consumed by AI agents and developers to replicate the project's structure, styling, and functionality standards.

---

## 1. Technology Stack & Foundation

- **Runtime**: React 18+
- **Build Tool**: Vite (`npm create vite@latest`)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4 (or v3 with variables), CSS Modules (rarely), Radix UI (Primitives)
- **State Management**: React Context (Global), Local State (Feature-level)
- **Routing**: React Router DOM v6+ (Data API preferred or standard Routes)
- **Forms**: React Hook Form + Zod Resolver
- **Networking**: Axios (Singleton instance with interceptors)
- **I18n**: i18next + react-i18next (Feature-based resource splitting)

---

## 2. Directory Structure (Feature-First)

The application follows a **Domain-Driven Design (DDD)** inspired "Feature-First" architecture. Top-level directories are tech-oriented (`components`, `hooks`), but the bulk of the logic lives in `features/`.

```text
src/
├── assets/                 # SVGs, Images, Global static files
├── components/             # SHARED UI components only
│   ├── ui/                 # Atomic design elements (Buttons, Inputs, Cards) - Radix/Shadcn-like
│   ├── layout/             # Application shells (Sidebar, Navbar)
│   └── shared/             # Reusable composite components (e.g., AlertDisplay)
├── constants/              # Global constants (Roles, Configs)
├── contexts/               # Global Providers (Theme, Auth, Toast)
├── core/                   # Core business logic configuration
│   ├── theme/              # Design tokens, style presets (generic-styles.ts)
│   └── i18n/               # I18n initialization service
├── features/               # DOMAINS - All business logic here
│   └── [feature_name]/     # e.g., inventory, auth, pos
│       ├── components/     # Feature-scoped UI components
│       ├── contexts/       # Feature-scoped state (optional)
│       ├── hooks/          # Feature-scoped logic hooks
│       ├── locales/        # Translation files (en.ts, ar.ts)
│       ├── pages/        # Page/Route components (The View)
│       ├── services/       # API calls (Axios wrappers)
│       ├── api/            # (Optional) React Query hooks or similar
│       ├── types/          # Domain interfaces/DTOs
│       └── routes.tsx      # Route definitions for this feature
├── hooks/                  # Global utility hooks (useDebounce, useMediaQuery)
├── lib/                    # Low-level utilities (cookie.ts, date-utils.ts)
├── routes/                 # App-level routing
│   ├── AppRoutes.tsx       # Main Switch/Router
│   └── routes.tsx          # Route aggregation (optional)
├── services/               # Core infrastructure services
│   ├── api/                # axios instance setup
│   └── auth/               # auth service implementation
└── App.tsx                 # Provider Composition Root
```

---

## 3. Core Infrastructure Setup

### 3.1. Networking (Axios)

**File**: `src/services/api/axios.ts`
**Rules**:

1.  **Singleton**: Export a single `apiClient` instance.
2.  **Credentials**: `withCredentials: true` is MANDATORY for http-only cookies.
3.  **Error Handling**:
    - Intercept 2xx responses to check for logical backend errors (`{ error: ... }`).
    - Intercept 401s to trigger **Silent Refresh**.
    - Use a **Mutex/Lock** during refresh to prevent multiple refresh calls.
4.  **I18n Integration**: Map backend error codes to translation keys before throwing.

### 3.2. Authentication (Auth Context)

**File**: `src/hooks/useProvideAuth.ts` & `src/contexts/AuthProvider.tsx`
**Pattern**:

- **State**: `user` (Object | null), `loading` (boolean).
- **Initialization**:
  1.  Check for existing user in frontend cookie (fast load).
  2.  If invalid/missing, attempt `silentRefresh` API call (session check).
  3.  If both fail, user is generic/guest.
- **Methods**: `signIn`, `signOut`, `silentRefresh`.
- **Component**: `<AuthProvider>` wraps the app. `useAuth()` hook exposes the context.

### 3.3. Design System & Theming

**Philosophy**: **Semantic Variables & Atomic Components**.
We do not use global style objects (JS strings). We use **CSS Variables** for tokens and **React Components** for UI consistency.

1. **Global Styles (`src/index.css`)**:

- Use **CSS Variables** for all colors, radius, and spacing.
- Define colors semantically: `--background` (canvas), `--primary` (main actions), `--muted` (secondary text).
- **Dark Mode**: Handled entirely within `index.css` by redefining the variables under the `.dark` class.

2. **UI Primitives (`src/components/ui`)**:

- Do not repeat Tailwind strings. Encapsulate them in components.
- **Bad**: `<div className="bg-white border p-4 rounded shadow">`
- **Good**: `<Card>`
- Use `tailwind-merge` (via the `cn()` utility) to allow style overrides when necessary.

3. **Tailwind Configuration**:

- Map Tailwind config to reference the CSS variables.
- Example: `colors: { primary: 'hsl(var(--primary))' }`.

---

## 4. Feature Implementation Framework

To build a **New Feature** (e.g., "Invoices"), follow this checklist:

### Step 1: Directory Creation

Create `src/features/invoices/` with subfolders: `components`, `pages`, `services`, `types`, `locales`.

### Step 2: Types & DTOs

Define the data shape in `types/invoice.types.ts`.

```typescript
export interface Invoice { id: string; total: number; ... }
```

### Step 3: Service Layer

Create `services/invoiceService.ts`.

- Import `apiClient` from `@/services/api/axios`.
- Create async functions: `getInvoices`, `createInvoice`.
- Return typed promises.

### Step 4: Locales (I18n)

Create `locales/en.ts` and `locales/ar.ts`.

- Export a default object: `{ title: "Invoices", actions: { create: "Create" } }`.
- **Register** these in the global i18n service/resource bundle.

### Step 5: pages (Views)

Create `pages/InvoicesPage.tsx`.

- Use `<PageLayout>` components (`PageContainer`, `PageHeader`, `PageMain`).
- **Hook**: `useTranslation("invoices")`.
- **Styling**: Use `GenericStyles.card.base`, etc.

### Step 6: Routes

Create `routes.tsx` in the feature folder.

```typescript
import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const InvoicesPage = lazy(() => import("./pages/InvoicesPage"));

export const invoicesRoutes: RouteObject[] = [
  { path: "invoices", element: <InvoicesPage /> },
];
```

### Step 7: Registration

Import `invoicesRoutes` in `src/routes/AppRoutes.tsx` (or central route file) and add it to the protected route list.

---

## 5. Development Guidelines & Best Practices

### 5.1. Styling Rules

- **FORBIDDEN**: Hardcoded hex colors (e.g., `#FF0000`).
- **REQUIRED**: Semantic colors (e.g., `text-error`, `bg-surface`).
- **RTL**: Use logical properties (`ms-2` instead of `ml-2`) or ensure the UI library handles it. The design system requires native RTL support.

### 5.2. Form Handling

- **Library**: `react-hook-form`.
- **Validation**: `zod` schemas.
- **Pattern**:
  - Define schema in `schemas/`.
  - In component: `const form = useForm({ resolver: zodResolver(schema) })`.
  - Use `<Form>`, `<FormField>`, `<Input>` wrappers from `components/ui/`.
  - **Translation**: Use translation keys in Zod schema messages (e.g., `z.string().min(1, "validations.required")`).

### 5.3. Generic Components

- Always check `@/components/ui` or `@/components/shared` before building a new UI widget.
- If a component is used in **2+ features**, move it to `shared`.

### 5.4. Error Handling

- Never use `alert()`. Use `alertService.error()` or `toast()`.
- Frontend should handle specific error codes if visual feedback is needed on specific fields (via RHF `setError`).

---
