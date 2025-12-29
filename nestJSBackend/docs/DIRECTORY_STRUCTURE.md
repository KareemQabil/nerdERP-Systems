# Directory Structure Guide

**Version:** 2.0  
**Last Updated:** 2025-12-28

---

## Backend Structure

```
nestJSBackend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   │
│   ├── common/                    # Shared infrastructure
│   │   ├── entities/
│   │   │   └── abstract.entity.ts # Base entity with soft delete
│   │   ├── services/
│   │   │   └── generic.service.ts # Base service with CRUD + pagination
│   │   ├── dto/
│   │   │   ├── api-response.dto.ts      # Standard response wrapper
│   │   │   ├── pagination.dto.ts        # Pagination DTOs
│   │   │   └── index.ts                 # DTO exports
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts  # Response formatting
│   │   └── transformers/
│   │       └── decimal.transformer.ts   # Decimal ↔ string conversion
│   │
│   └── modules/                   # Feature modules
│       ├── products/
│       │   ├── controllers/
│       │   │   └── products.controller.ts
│       │   ├── services/
│       │   │   └── products.service.ts
│       │   ├── entities/
│       │   │   ├── product.entity.ts
│       │   │   ├── category.entity.ts
│       │   │   └── modifier.entity.ts
│       │   ├── dto/
│       │   │   ├── create-product.dto.ts
│       │   │   ├── update-product.dto.ts
│       │   │   ├── product-query.dto.ts
│       │   │   └── product-response.dto.ts
│       │   ├── types/
│       │   │   └── product.types.ts
│       │   └── products.module.ts
│       │
│       ├── sales/
│       │   ├── controllers/
│       │   │   └── sales.controller.ts
│       │   ├── services/
│       │   │   └── sales.service.ts
│       │   ├── entities/
│       │   │   ├── sales-order.entity.ts
│       │   │   ├── order-item.entity.ts
│       │   │   └── payment.entity.ts
│       │   ├── dto/
│       │   │   ├── create-order.dto.ts
│       │   │   └── order-response.dto.ts
│       │   ├── types/
│       │   │   └── order.types.ts
│       │   └── sales.module.ts
│       │
│       └── inventory/
│           ├── controllers/
│           │   └── inventory.controller.ts
│           ├── services/
│           │   └── inventory.service.ts
│           ├── entities/
│           │   ├── inventory-batch.entity.ts
│           │   ├── stock-move.entity.ts
│           │   └── stock-reservation.entity.ts
│           ├── dto/
│           │   ├── stock-operation.dto.ts
│           │   └── reserve-stock.dto.ts
│           └── inventory.module.ts
│
├── docs/                          # Documentation
│   ├── API_STANDARDS.md
│   ├── TRANSACTION_PATTERNS.md
│   └── DIRECTORY_STRUCTURE.md
│
└── test/                          # E2E tests
    └── app.e2e-spec.ts
```

---

## Frontend Structure

```
frontend/
├── src/
│   ├── main.tsx                   # Application entry point
│   ├── App.tsx                    # Root component
│   │
│   ├── shared/                    # Shared infrastructure
│   │   ├── components/
│   │   │   ├── ui/                # Shadcn/UI components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   └── modal.tsx
│   │   │   └── common/            # Shared business components
│   │   │       ├── ErrorBoundary.tsx
│   │   │       └── LoadingSpinner.tsx
│   │   ├── hooks/                 # Shared hooks
│   │   │   ├── useDebounce.ts
│   │   │   └── useLocalStorage.ts
│   │   ├── lib/                   # Utilities
│   │   │   ├── api-client.ts      # Axios instance
│   │   │   ├── decimal.ts         # Decimal.js utilities
│   │   │   └── cn.ts              # Class name utility
│   │   ├── types/                 # Shared types
│   │   │   └── common.types.ts
│   │   └── constants/             # App constants
│   │       └── config.ts
│   │
│   ├── stores/                    # Global Zustand stores
│   │   ├── cart.store.ts          # Cart state
│   │   ├── session.store.ts       # Session state
│   │   └── auth.store.ts          # Auth state
│   │
│   └── modules/                   # Feature modules
│       ├── products/
│       │   ├── api/
│       │   │   └── products.api.ts         # API layer
│       │   ├── components/
│       │   │   ├── ProductCard.tsx
│       │   │   └── ProductForm.tsx
│       │   ├── hooks/
│       │   │   └── useProducts.ts          # TanStack Query hooks
│       │   ├── types/
│       │   │   └── product.types.ts        # Type definitions
│       │   └── index.ts                    # Module exports
│       │
│       ├── sales/
│       │   ├── api/
│       │   │   └── orders.api.ts
│       │   ├── components/
│       │   │   ├── checkout/
│       │   │   │   ├── CheckoutModal.tsx
│       │   │   │   └── CheckoutModal.css
│       │   │   └── cart/
│       │   │       └── CartItem.tsx
│       │   ├── hooks/
│       │   │   └── useOrders.ts
│       │   ├── store/
│       │   │   └── checkout.store.ts
│       │   ├── types/
│       │   │   └── order.types.ts
│       │   └── index.ts
│       │
│       └── pos/
│           ├── layouts/
│           │   ├── POSLayout.tsx
│           │   └── POSLayout.css
│           ├── sections/
│           │   ├── ProductSection.tsx
│           │   ├── CartSection.tsx
│           │   └── ActionSection.tsx
│           ├── pages/
│           │   └── POSPage.tsx
│           └── index.ts
│
├── public/                        # Static assets
└── index.html                     # HTML template
```

---

## Module Structure Rules

### Backend Module

**Required Files:**
1. `{module}.module.ts` - Module definition
2. `controllers/{module}.controller.ts` - HTTP endpoints
3. `services/{module}.service.ts` - Business logic
4. `entities/{entity}.entity.ts` - Database entities
5. `dto/create-{entity}.dto.ts` - Create DTO
6. `dto/update-{entity}.dto.ts` - Update DTO

**Optional Files:**
- `dto/{entity}-query.dto.ts` - Query parameters
- `dto/{entity}-response.dto.ts` - Response structure
- `types/{module}.types.ts` - Type definitions
- `guards/{module}.guard.ts` - Custom guards
- `pipes/{module}.pipe.ts` - Custom pipes

---

### Frontend Module

**Required Files:**
1. `api/{module}.api.ts` - API layer
2. `types/{module}.types.ts` - Type definitions
3. `hooks/use{Module}.ts` - TanStack Query hooks
4. `index.ts` - Module exports

**Optional Files:**
- `components/` - Module-specific components
- `store/{module}.store.ts` - Module-specific Zustand store
- `utils/{module}.utils.ts` - Module utilities

---

## Naming Conventions

### Backend

| Type | Convention | Example |
|------|------------|---------|
| Entity | PascalCase | `Product`, `SalesOrder` |
| DTO | PascalCase + Suffix | `CreateProductDto`, `ProductResponseDto` |
| Service | PascalCase + Suffix | `ProductsService` |
| Controller | PascalCase + Suffix | `ProductsController` |
| Module | PascalCase + Suffix | `ProductsModule` |
| Interface | PascalCase | `ProductInfo` |
| Type | PascalCase | `OrderStatus` |
| Enum | PascalCase | `PaymentMethod` |

### Frontend

| Type | Convention | Example |
|------|------------|---------|
| Component | PascalCase | `ProductCard`, `CheckoutModal` |
| Hook | camelCase + `use` prefix | `useProducts`, `useCart` |
| Store | camelCase + `.store` | `cart.store.ts`, `session.store.ts` |
| API | camelCase + `.api` | `products.api.ts`, `orders.api.ts` |
| Type | PascalCase | `Product`, `CartItem` |
| Interface | PascalCase | `ProductQueryParams` |
| Constant | SCREAMING_SNAKE_CASE | `API_BASE_URL`, `TAX_RATE` |

---

## Import Paths

### Backend

```typescript
// Common
import { AbstractEntity } from '@/common/entities/abstract.entity';
import { GenericService } from '@/common/services/generic.service';
import { ApiResponseDto } from '@/common/dto';

// Module
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
```

### Frontend

```typescript
// Shared
import { apiClient } from '@/lib/api-client';
import { DecimalUtil } from '@/lib/decimal';
import { Button } from '@/shared/components/ui/button';

// Module
import { useProducts } from '@/modules/products';
import { productsApi } from '@/modules/products/api/products.api';
import type { Product } from '@/modules/products/types/product.types';

// Store
import { useCartStore } from '@/stores/cart.store';
```

---

## File Organization Best Practices

### 1. Co-locate Related Files

```
products/
├── components/
│   ├── ProductCard.tsx
│   ├── ProductCard.test.tsx    # Test next to component
│   └── ProductCard.css         # Styles next to component
```

### 2. Group by Feature, Not by Type

**❌ Bad:**
```
components/
├── ProductCard.tsx
├── OrderList.tsx
└── CartItem.tsx
```

**✅ Good:**
```
modules/
├── products/
│   └── components/
│       └── ProductCard.tsx
├── sales/
│   └── components/
│       └── OrderList.tsx
└── pos/
    └── sections/
        └── CartSection.tsx
```

### 3. Use Index Files for Clean Exports

```typescript
// modules/products/index.ts
export * from './types/product.types';
export * from './hooks/useProducts';
export { productsApi } from './api/products.api';

// Usage
import { Product, useProducts, productsApi } from '@/modules/products';
```

### 4. Separate Concerns

- **API Layer:** HTTP calls only
- **Hooks:** TanStack Query integration
- **Components:** UI rendering
- **Stores:** Global state
- **Types:** Type definitions

---

## Documentation Location

| Document | Location |
|----------|----------|
| API Standards | `nestJSBackend/docs/API_STANDARDS.md` |
| Transaction Patterns | `nestJSBackend/docs/TRANSACTION_PATTERNS.md` |
| Directory Structure | `nestJSBackend/docs/DIRECTORY_STRUCTURE.md` |
| Frontend Architecture | `frontend/docs/ARCHITECTURE.md` |
| Deployment Guide | `docs/DEPLOYMENT.md` |
| Contributing Guide | `CONTRIBUTING.md` |

---

**Last Updated:** 2025-12-28  
**Maintained By:** NerdPOS Development Team
