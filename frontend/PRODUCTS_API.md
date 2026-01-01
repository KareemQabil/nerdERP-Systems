# Products API Documentation

> **Base URL:** `https://localhost:3000/api/v1`

---

## 📌 Response Format

**All API responses** follow the standard `{data, error}` wrapper format:

**Success (HTTP 2xx):**
```json
{
  "data": { /* response payload */ },
  "error": null
}
```

**Error (HTTP 4xx/5xx):**
```json
{
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "messageKey": "errors.key",
    "message": "Human readable message",
    "details": {}
  }
}
```

> **Note:** For brevity, examples below show only the `data` payload. See [API Overview](./API_OVERVIEW.md) for complete response format details.

---

## Table of Contents

1. [Product Endpoints](#product-endpoints)
2. [Category Endpoints](#category-endpoints)
3. [Modifier Endpoints](#modifier-endpoints)
4. [Data Models](#data-models)

---

## Product Endpoints

### 1. Get All Products

Retrieve paginated list of products.

**Endpoint:** `GET /products`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20) |
| `isActive` | boolean | No | Filter by active status |
| `categoryId` | string | No | Filter by category ID |
| `search` | string | No | Search by name, SKU, or barcode |
| `orderBy` | string | No | Sort field (default: createdAt) |
| `order` | string | No | Sort order: ASC or DESC |

**Success Response:** `200 OK`

```json
{
  "data": {
    "items": [
      {
        "id": "prod_123abc",
        "name": "Chicken Shawarma",
        "nameAr": "شاورما دجاج",
        "sku": "SHWRM-001",
        "barcode": "6281234567890",
        "description": "Grilled chicken with garlic sauce",
        "descriptionAr": "دجاج مشوي مع صلصة الثوم",
        "categoryId": "cat_456",
        "category": {
          "id": "cat_456",
          "name": "Sandwiches",
          "nameAr": "سندويشات"
        },
        "salePrice": "25.00",
        "costPrice": "12.50",
        "taxable": true,
        "taxRate": "15.00",
        "imageUrl": "https://cdn.example.com/products/shawarma.jpg",
        "isActive": true,
        "isPrepared": true,
        "trackInventory": false,
        "stockQuantity": null,
        "lowStockThreshold": null,
        "modifierGroups": []
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  },
  "error": null
}
```

---

### 2. Get Products for POS

Retrieve active products optimized for POS display (limit 100).

**Endpoint:** `GET /products`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `isActive` | boolean | No | Always true for POS |
| `categoryId` | string | No | Filter by category |
| `search` | string | No | Search products |
| `limit` | number | No | Max 100 for POS |

**Success Response:** `200 OK`

```json
[
  {
    "id": "prod_789xyz",
    "name": "Beef Burger",
    "nameAr": "برجر لحم",
    "sku": "BRGR-002",
    "salePrice": "35.00",
    "imageUrl": "https://cdn.example.com/products/burger.jpg",
    "isActive": true,
    "isPrepared": true,
    "trackInventory": false,
    "modifierGroups": [
      {
        "id": "mg_001",
        "name": "Size",
        "nameAr": "الحجم",
        "selectionType": "SINGLE",
        "isRequired": true,
        "minSelections": 1,
        "maxSelections": 1,
        "modifiers": [
          {
            "id": "mod_001",
            "groupId": "mg_001",
            "name": "Regular",
            "nameAr": "عادي",
            "price": "0.00",
            "isDefault": true,
            "isActive": true,
            "sortOrder": 1
          },
          {
            "id": "mod_002",
            "groupId": "mg_001",
            "name": "Large",
            "nameAr": "كبير",
            "price": "5.00",
            "isDefault": false,
            "isActive": true,
            "sortOrder": 2
          }
        ]
      }
    ]
  }
]
```

---

### 3. Get Product by ID

Retrieve single product details.

**Endpoint:** `GET /products/:id`

**Success Response:** `200 OK`

```json
{
  "id": "prod_123abc",
  "name": "Chicken Shawarma",
  "nameAr": "شاورما دجاج",
  "sku": "SHWRM-001",
  "barcode": "6281234567890",
  "description": "Grilled chicken with garlic sauce",
  "descriptionAr": "دجاج مشوي مع صلصة الثوم",
  "categoryId": "cat_456",
  "salePrice": "25.00",
  "costPrice": "12.50",
  "taxable": true,
  "taxRate": "15.00",
  "imageUrl": "https://cdn.example.com/products/shawarma.jpg",
  "isActive": true,
  "isPrepared": true,
  "trackInventory": false,
  "modifierGroups": []
}
```

**Error Response:** `404 Not Found`

```json
{
  "data": null,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "messageKey": "errors.product.notFound",
    "message": "Product not found",
    "details": {}
  }
}
```

---

### 4. Get Product with Modifiers

Retrieve product with full modifier groups.

**Endpoint:** `GET /products/:id?include=modifierGroups`

**Success Response:** `200 OK`

```json
{
  "id": "prod_789xyz",
  "name": "Beef Burger",
  "nameAr": "برجر لحم",
  "sku": "BRGR-002",
  "salePrice": "35.00",
  "modifierGroups": [
    {
      "id": "mg_001",
      "name": "Size",
      "nameAr": "الحجم",
      "description": "Choose your size",
      "selectionType": "SINGLE",
      "isRequired": true,
      "minSelections": 1,
      "maxSelections": 1,
      "modifiers": [
        {
          "id": "mod_001",
          "groupId": "mg_001",
          "name": "Regular",
          "nameAr": "عادي",
          "price": "0.00",
          "isDefault": true,
          "isActive": true,
          "sortOrder": 1
        },
        {
          "id": "mod_002",
          "groupId": "mg_001",
          "name": "Large",
          "nameAr": "كبير",
          "price": "5.00",
          "isDefault": false,
          "isActive": true,
          "sortOrder": 2
        }
      ]
    },
    {
      "id": "mg_002",
      "name": "Extras",
      "nameAr": "إضافات",
      "selectionType": "MULTIPLE",
      "isRequired": false,
      "minSelections": 0,
      "maxSelections": 5,
      "modifiers": [
        {
          "id": "mod_003",
          "groupId": "mg_002",
          "name": "Extra Cheese",
          "nameAr": "جبن إضافي",
          "price": "3.00",
          "isDefault": false,
          "isActive": true,
          "sortOrder": 1
        },
        {
          "id": "mod_004",
          "groupId": "mg_002",
          "name": "Bacon",
          "nameAr": "بيكون",
          "price": "5.00",
          "isDefault": false,
          "isActive": true,
          "sortOrder": 2
        }
      ]
    }
  ]
}
```

---

### 5. Get Product by Barcode

Retrieve product by scanning barcode.

**Endpoint:** `GET /products/barcode/:barcode`

**Success Response:** `200 OK`

```json
{
  "id": "prod_123abc",
  "name": "Chicken Shawarma",
  "nameAr": "شاورما دجاج",
  "sku": "SHWRM-001",
  "barcode": "6281234567890",
  "salePrice": "25.00",
  "isActive": true,
  "isPrepared": true,
  "trackInventory": false
}
```

**Response when not found:** `200 OK`

```json
null
```

---

### 6. Search Products

Search products by name, SKU, or barcode.

**Endpoint:** `GET /products?search={query}&limit=20&isActive=true`

**Success Response:** `200 OK`

```json
[
  {
    "id": "prod_123abc",
    "name": "Chicken Shawarma",
    "nameAr": "شاورما دجاج",
    "sku": "SHWRM-001",
    "salePrice": "25.00",
    "imageUrl": "https://cdn.example.com/products/shawarma.jpg",
    "isActive": true
  },
  {
    "id": "prod_456def",
    "name": "Chicken Burger",
    "nameAr": "برجر دجاج",
    "sku": "BRGR-001",
    "salePrice": "30.00",
    "imageUrl": "https://cdn.example.com/products/chicken-burger.jpg",
    "isActive": true
  }
]
```

---

### 7. Check Product Stock

Check available stock for a product in a warehouse.

**Endpoint:** `GET /products/:productId/stock?warehouseId={warehouseId}`

**Success Response:** `200 OK`

```json
{
  "available": "45.00",
  "reserved": "12.00"
}
```

---

### 8. Create Product

Create a new product.

**Endpoint:** `POST /products`

**Request Body:**

```json
{
  "name": "Falafel Wrap",
  "nameAr": "لفة فلافل",
  "sku": "FLFL-001",
  "barcode": "6281234567891",
  "description": "Crispy falafel with tahini sauce",
  "descriptionAr": "فلافل مقرمشة مع صلصة الطحينة",
  "categoryId": "cat_456",
  "salePrice": "18.00",
  "costPrice": "8.00",
  "taxable": true,
  "taxRate": "15.00",
  "imageUrl": "https://cdn.example.com/products/falafel.jpg",
  "isActive": true,
  "isPrepared": true,
  "trackInventory": false
}
```

**Success Response:** `201 Created`

```json
{
  "id": "prod_999new",
  "name": "Falafel Wrap",
  "nameAr": "لفة فلافل",
  "sku": "FLFL-001",
  "barcode": "6281234567891",
  "description": "Crispy falafel with tahini sauce",
  "descriptionAr": "فلافل مقرمشة مع صلصة الطحينة",
  "categoryId": "cat_456",
  "salePrice": "18.00",
  "costPrice": "8.00",
  "taxable": true,
  "taxRate": "15.00",
  "imageUrl": "https://cdn.example.com/products/falafel.jpg",
  "isActive": true,
  "isPrepared": true,
  "trackInventory": false,
  "modifierGroups": []
}
```

---

### 9. Update Product

Update existing product.

**Endpoint:** `PATCH /products/:id`

**Request Body:**

```json
{
  "salePrice": "20.00",
  "isActive": false
}
```

**Success Response:** `200 OK`

```json
{
  "id": "prod_123abc",
  "name": "Chicken Shawarma",
  "nameAr": "شاورما دجاج",
  "sku": "SHWRM-001",
  "salePrice": "20.00",
  "isActive": false,
  "isPrepared": true,
  "trackInventory": false
}
```

---

### 10. Delete Product

Soft delete a product.

**Endpoint:** `DELETE /products/:id`

**Success Response:** `204 No Content`

---

## Category Endpoints

### 1. Get All Categories

Retrieve all categories.

**Endpoint:** `GET /categories`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `isActive` | boolean | No | Filter active categories |

**Success Response:** `200 OK`

```json
[
  {
    "id": "cat_001",
    "name": "Sandwiches",
    "nameAr": "سندويشات",
    "description": "All types of sandwiches",
    "descriptionAr": "جميع أنواع السندويشات",
    "parentId": null,
    "imageUrl": "https://cdn.example.com/categories/sandwiches.jpg",
    "sortOrder": 1,
    "isActive": true,
    "productCount": 25
  },
  {
    "id": "cat_002",
    "name": "Beverages",
    "nameAr": "مشروبات",
    "description": "Drinks and beverages",
    "descriptionAr": "المشروبات",
    "parentId": null,
    "imageUrl": "https://cdn.example.com/categories/beverages.jpg",
    "sortOrder": 2,
    "isActive": true,
    "productCount": 15
  }
]
```

---

### 2. Get Active Categories

Retrieve only active categories for POS.

**Endpoint:** `GET /categories?isActive=true`

**Success Response:** `200 OK`

```json
[
  {
    "id": "cat_001",
    "name": "Sandwiches",
    "nameAr": "سندويشات",
    "sortOrder": 1,
    "isActive": true,
    "productCount": 25
  }
]
```

---

### 3. Get Category Tree

Retrieve categories in hierarchical tree structure.

**Endpoint:** `GET /categories/tree`

**Success Response:** `200 OK`

```json
[
  {
    "id": "cat_001",
    "name": "Food",
    "nameAr": "طعام",
    "parentId": null,
    "children": [
      {
        "id": "cat_002",
        "name": "Sandwiches",
        "nameAr": "سندويشات",
        "parentId": "cat_001",
        "children": []
      },
      {
        "id": "cat_003",
        "name": "Main Dishes",
        "nameAr": "أطباق رئيسية",
        "parentId": "cat_001",
        "children": []
      }
    ]
  }
]
```

---

### 4. Get Category by ID

Retrieve single category.

**Endpoint:** `GET /categories/:id`

**Success Response:** `200 OK`

```json
{
  "id": "cat_001",
  "name": "Sandwiches",
  "nameAr": "سندويشات",
  "description": "All types of sandwiches",
  "descriptionAr": "جميع أنواع السندويشات",
  "parentId": null,
  "imageUrl": "https://cdn.example.com/categories/sandwiches.jpg",
  "sortOrder": 1,
  "isActive": true,
  "productCount": 25
}
```

---

## Modifier Endpoints

### 1. Get Modifier Groups for Product

Retrieve all modifier groups associated with a product.

**Endpoint:** `GET /products/:productId/modifier-groups`

**Success Response:** `200 OK`

```json
[
  {
    "id": "mg_001",
    "name": "Size",
    "nameAr": "الحجم",
    "description": "Choose your size",
    "selectionType": "SINGLE",
    "isRequired": true,
    "minSelections": 1,
    "maxSelections": 1,
    "modifiers": [
      {
        "id": "mod_001",
        "groupId": "mg_001",
        "name": "Regular",
        "nameAr": "عادي",
        "price": "0.00",
        "isDefault": true,
        "isActive": true,
        "sortOrder": 1
      },
      {
        "id": "mod_002",
        "groupId": "mg_001",
        "name": "Large",
        "nameAr": "كبير",
        "price": "5.00",
        "isDefault": false,
        "isActive": true,
        "sortOrder": 2
      }
    ]
  }
]
```

---

### 2. Get All Modifier Groups

Retrieve all modifier groups in the system.

**Endpoint:** `GET /modifiers?limit=100`

**Success Response:** `200 OK`

```json
[
  {
    "id": "mg_001",
    "name": "Size",
    "nameAr": "الحجم",
    "description": "Choose your size",
    "selectionType": "SINGLE",
    "isRequired": true,
    "minSelections": 1,
    "maxSelections": 1,
    "modifiers": [
      {
        "id": "mod_001",
        "groupId": "mg_001",
        "name": "Regular",
        "nameAr": "عادي",
        "price": "0.00",
        "isDefault": true,
        "isActive": true,
        "sortOrder": 1
      }
    ]
  }
]
```

---

## Data Models

### Product

```typescript
interface Product {
  id: string;
  name: string;
  nameAr?: string;
  sku: string;
  barcode?: string;
  description?: string;
  descriptionAr?: string;
  categoryId?: string;
  category?: Category;
  salePrice: string;          // Decimal as string
  costPrice?: string;         // Decimal as string
  taxable: boolean;
  taxRate?: string;           // Percentage as string (e.g., "15.00")
  imageUrl?: string;
  isActive: boolean;
  isPrepared: boolean;        // Requires kitchen preparation
  trackInventory: boolean;
  stockQuantity?: string;     // Decimal as string
  lowStockThreshold?: number;
  modifierGroups?: ModifierGroup[];
}
```

### Category

```typescript
interface Category {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  parentId?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
}
```

### ModifierGroup

```typescript
interface ModifierGroup {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  selectionType: 'SINGLE' | 'MULTIPLE';
  isRequired: boolean;
  minSelections: number;      // Minimum selections required
  maxSelections: number;      // Maximum allowed (-1 for unlimited)
  modifiers: Modifier[];
}
```

### Modifier

```typescript
interface Modifier {
  id: string;
  groupId: string;
  name: string;
  nameAr?: string;
  price: string;              // Price adjustment (decimal as string)
  isDefault: boolean;         // Pre-selected by default
  isActive: boolean;
  sortOrder: number;
}
```

### StockInfo

```typescript
interface StockInfo {
  available: string;          // Available quantity
  reserved: string;           // Reserved quantity
}
```

---

## Usage Examples

### Example 1: POS Product Selection

```javascript
// 1. Get all active categories
GET /api/v1/categories?isActive=true

// 2. Get products for selected category
GET /api/v1/products?isActive=true&categoryId=cat_001&limit=100

// 3. Get product with modifiers when customer selects
GET /api/v1/products/prod_789xyz?include=modifierGroups
```

### Example 2: Barcode Scanning

```javascript
// Scan barcode and get product
GET /api/v1/products/barcode/6281234567890
```

### Example 3: Product Search

```javascript
// Search as customer types
GET /api/v1/products?search=burger&isActive=true&limit=20
```

---

**Related Documentation:**
- [API Overview](./API_OVERVIEW.md)
- [Orders API](./ORDERS_API.md)
- [Sessions API](./SESSIONS_API.md)
- [Customers API](./CUSTOMERS_API.md)
