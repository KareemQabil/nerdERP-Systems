# NerdPOS API Documentation - Overview

> **Version:** 1.0.0
> **Base URL:** `https://localhost:3000`
> **Last Updated:** December 2025

---

## Table of Contents

1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [Common Response Format](#common-response-format)
4. [Pagination](#pagination)
5. [Common Types & Enums](#common-types--enums)
6. [Error Handling](#error-handling)
7. [API Modules](#api-modules)

---

## Introduction

NerdPOS is a comprehensive Point of Sale (POS) system API designed for retail and restaurant businesses. This API provides endpoints for:

- **Products Management** - Products, categories, modifiers, and inventory
- **Orders Management** - Order creation, payments, kitchen operations
- **Session Management** - Cash register sessions and cash handling
- **Customer Management** - Customer profiles, loyalty programs, and store credit

---

## Authentication

All API requests are automatically authenticated using **httpOnly cookies**. The backend handles authentication transparently, so no additional headers are required.

**Note:** Ensure your HTTP client is configured to accept and send cookies.

---

## Common Response Format

All API responses follow a consistent wrapper format with `data` and `error` fields.

### Success Response Structure

Every successful response (HTTP 200, 201, etc.) returns:

```json
{
  "data": { ...payload... },
  "error": null
}
```

### Error Response Structure

Every error response (HTTP 4xx, 5xx) returns:

```json
{
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "messageKey": "ERROR_KEY_STRING",
    "message": "Human readable error message",
    "details": { ...optional... }
  }
}
```

### Paginated Response

```json
{
  "data": {
    "items": [...],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "error": null
}
```

### Single Resource Response

```json
{
  "data": {
    "id": "uuid",
    "name": "Resource Name",
    ...
  },
  "error": null
}
```

### List Response (Non-Paginated)

```json
{
  "data": [
    { "id": "1", "name": "Item 1" },
    { "id": "2", "name": "Item 2" }
  ],
  "error": null
}
```

---

## Pagination

Most list endpoints support pagination via query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `limit` | number | 20 | Items per page |
| `order` | string | `ASC` | Sort order (`ASC` or `DESC`) |
| `orderBy` | string | `createdAt` | Field to sort by |

**Example:**
```
GET /api/v1/products?page=2&limit=50&order=DESC&orderBy=name
```

---

## Common Types & Enums

### Order Types

```typescript
type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'PICKUP' | 'DRIVE_THRU';
```

### Order Status

```typescript
type OrderStatus =
  | 'DRAFT'      // Items being added
  | 'PLACED'     // Order submitted
  | 'PREPARING'  // Kitchen preparing
  | 'READY'      // Ready for pickup/serving
  | 'COMPLETED'  // Paid and closed
  | 'CANCELLED'  // Cancelled by customer
  | 'VOIDED'     // Voided by manager
  | 'HELD';      // Parked for later
```

### Payment Status

```typescript
type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';
```

### Payment Methods

```typescript
type PaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'GIFT_CARD'
  | 'LOYALTY_POINTS'
  | 'STORE_CREDIT';
```

### Kitchen Status

```typescript
type KitchenStatus =
  | 'PENDING'    // Not yet sent to kitchen
  | 'FIRED'      // Sent to kitchen
  | 'PREPARING'  // Kitchen acknowledged
  | 'READY'      // Ready to serve
  | 'SERVED';    // Delivered to customer
```

### Modifier Selection Type

```typescript
type ModifierSelectionType = 'SINGLE' | 'MULTIPLE';
```

### Discount Type

```typescript
type DiscountType = 'PERCENT' | 'FIXED';
```

### Loyalty Tiers

```typescript
type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
```

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Invalid request parameters |
| `401` | Unauthorized | Authentication required |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource not found |
| `409` | Conflict | Resource conflict (e.g., duplicate) |
| `422` | Unprocessable Entity | Validation failed |
| `500` | Internal Server Error | Server error |

### Error Response Format

All errors follow the standard wrapper format with detailed error information:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "messageKey": "errors.validation.failed",
    "message": "Invalid request data",
    "details": {
      "fields": [
        {
          "field": "email",
          "message": "Invalid email format"
        }
      ]
    }
  }
}
```

### Error Fields

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Error code for programmatic handling |
| `messageKey` | string | I18n key for translated error messages |
| `message` | string | Human-readable error message (English) |
| `details` | object | Optional additional error context |

### Common Error Codes

| Code | Message Key | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | `errors.validation.failed` | Request validation failed |
| `NOT_FOUND` | `errors.notFound` | Resource not found |
| `UNAUTHORIZED` | `errors.unauthorized` | Authentication required |
| `FORBIDDEN` | `errors.forbidden` | Insufficient permissions |
| `CONFLICT` | `errors.conflict` | Resource already exists |
| `NETWORK_ERROR` | `errors.network` | Network connection failed |

---

## API Modules

- **[Products API](./PRODUCTS_API.md)** - Products, categories, modifiers, stock management
- **[Orders API](./ORDERS_API.md)** - Order management, payments, kitchen operations
- **[Sessions API](./SESSIONS_API.md)** - Cash register session management
- **[Customers API](./CUSTOMERS_API.md)** - Customer profiles, loyalty, store credit

---

## Data Formats

### Decimal Numbers

All monetary amounts and quantities are represented as **strings** to preserve precision:

```json
{
  "salePrice": "25.50",
  "quantity": "2.5",
  "total": "63.75"
}
```

### Dates & Timestamps

All dates use **ISO 8601 format**:

```json
{
  "createdAt": "2025-12-30T14:30:00Z",
  "openedAt": "2025-12-30T08:00:00+03:00"
}
```

### Bilingual Fields

Fields with Arabic translations use the `Ar` suffix:

```json
{
  "name": "Chicken Burger",
  "nameAr": "برجر دجاج",
  "description": "Grilled chicken with lettuce",
  "descriptionAr": "دجاج مشوي مع خس"
}
```

---

## Rate Limiting

Currently, there are no rate limits enforced. This may change in production.

---

## Versioning

The API uses URL versioning:

```
/api/v1/products
/api/v2/products  (future)
```

Current version: **v1**

---

## Support

For API questions or issues:
- GitHub Issues: [mini-erp-front-2/issues](https://github.com/m4hosam/mini-erp-front-2/issues)
- Documentation: See individual API module files

---

**Next Steps:**
- Review [Products API Documentation](./PRODUCTS_API.md)
- Review [Orders API Documentation](./ORDERS_API.md)
- Review [Sessions API Documentation](./SESSIONS_API.md)
- Review [Customers API Documentation](./CUSTOMERS_API.md)
