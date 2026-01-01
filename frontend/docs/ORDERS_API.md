# Orders API Documentation

> **Base URL:** `https://localhost:3000/api/v1/sales`

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

1. [Order CRUD Endpoints](#order-crud-endpoints)
2. [Order Item Operations](#order-item-operations)
3. [Payment Operations](#payment-operations)
4. [Order Status Operations](#order-status-operations)
5. [Discount Operations](#discount-operations)
6. [Hold/Recall Operations](#holdrecall-operations)
7. [Refund Operations](#refund-operations)
8. [Kitchen Operations](#kitchen-operations)
9. [Data Models](#data-models)

---

## Order CRUD Endpoints

### 1. Get All Orders

Retrieve paginated list of orders with filters.

**Endpoint:** `GET /orders`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20) |
| `status` | OrderStatus | No | Filter by order status |
| `paymentStatus` | PaymentStatus | No | Filter by payment status |
| `orderType` | OrderType | No | Filter by order type |
| `fromDate` | string | No | ISO date (e.g., "2025-12-01") |
| `toDate` | string | No | ISO date |
| `order` | string | No | Sort order (ASC/DESC) |

**Success Response:** `200 OK`

```json
{
  "items": [
    {
      "id": "ord_abc123",
      "orderNumber": "ORD-2025-001234",
      "orderType": "DINE_IN",
      "status": "COMPLETED",
      "paymentStatus": "PAID",
      "customerId": "cust_456",
      "customerName": "أحمد محمد",
      "tableId": "tbl_12",
      "tableName": "Table 12",
      "items": [],
      "subtotal": "125.00",
      "discountTotal": "12.50",
      "taxTotal": "16.88",
      "total": "129.38",
      "payments": [],
      "amountPaid": "129.38",
      "amountDue": "0.00",
      "discount": null,
      "notes": null,
      "registerSessionId": "sess_789",
      "createdBy": "user_001",
      "createdAt": "2025-12-30T14:30:00Z",
      "completedAt": "2025-12-30T15:00:00Z",
      "invoiceHash": "abc123hash",
      "zatcaQrCode": "base64encodedqr..."
    }
  ],
  "total": 1250,
  "page": 1,
  "limit": 20,
  "totalPages": 63
}
```

---

### 2. Get Today's Orders

Retrieve all orders from today.

**Endpoint:** `GET /orders?fromDate={today}&limit=100&order=DESC`

**Success Response:** `200 OK`

```json
[
  {
    "id": "ord_abc123",
    "orderNumber": "ORD-2025-001234",
    "orderType": "TAKEAWAY",
    "status": "COMPLETED",
    "paymentStatus": "PAID",
    "customerId": null,
    "customerName": null,
    "items": [
      {
        "id": "item_001",
        "orderId": "ord_abc123",
        "productId": "prod_789",
        "productName": "Chicken Shawarma",
        "productNameAr": "شاورما دجاج",
        "quantity": "2.00",
        "unitPrice": "25.00",
        "lineTotal": "50.00",
        "modifiers": [],
        "notes": null,
        "kitchenStatus": "SERVED"
      }
    ],
    "subtotal": "50.00",
    "discountTotal": "0.00",
    "taxTotal": "7.50",
    "total": "57.50",
    "payments": [
      {
        "id": "pay_001",
        "orderId": "ord_abc123",
        "method": "CASH",
        "amount": "60.00",
        "reference": null,
        "processedAt": "2025-12-30T14:35:00Z"
      }
    ],
    "amountPaid": "60.00",
    "amountDue": "0.00",
    "createdAt": "2025-12-30T14:30:00Z",
    "completedAt": "2025-12-30T14:35:00Z"
  }
]
```

---

### 3. Get Order by ID

Retrieve single order details.

**Endpoint:** `GET /orders/:id`

**Success Response:** `200 OK`

```json
{
  "id": "ord_abc123",
  "orderNumber": "ORD-2025-001234",
  "orderType": "DINE_IN",
  "status": "PLACED",
  "paymentStatus": "UNPAID",
  "customerId": null,
  "customerName": null,
  "tableId": "tbl_05",
  "tableName": "Table 5",
  "items": [
    {
      "id": "item_001",
      "orderId": "ord_abc123",
      "productId": "prod_789",
      "productName": "Beef Burger",
      "productNameAr": "برجر لحم",
      "quantity": "1.00",
      "unitPrice": "40.00",
      "lineTotal": "40.00",
      "modifiers": [
        {
          "id": "mod_001",
          "modifierId": "mod_large",
          "modifierName": "Large",
          "modifierNameAr": "كبير",
          "price": "5.00",
          "quantity": 1
        }
      ],
      "notes": "No onions",
      "kitchenStatus": "PREPARING"
    }
  ],
  "subtotal": "40.00",
  "discountTotal": "0.00",
  "taxTotal": "6.00",
  "total": "46.00",
  "payments": [],
  "amountPaid": "0.00",
  "amountDue": "46.00",
  "discount": null,
  "notes": "Table 5 - Window seat",
  "registerSessionId": "sess_789",
  "createdBy": "user_001",
  "createdAt": "2025-12-30T14:30:00Z",
  "completedAt": null
}
```

---

### 4. Get Order with Full Details

Retrieve order with all related data (items, payments, customer).

**Endpoint:** `GET /orders/:id?include=items,payments,customer`

**Success Response:** `200 OK`

```json
{
  "id": "ord_abc123",
  "orderNumber": "ORD-2025-001234",
  "orderType": "DELIVERY",
  "status": "READY",
  "paymentStatus": "PAID",
  "customer": {
    "id": "cust_456",
    "name": "سارة أحمد",
    "phone": "+966501234567",
    "email": "sara@example.com"
  },
  "items": [
    {
      "id": "item_001",
      "productName": "Pizza Margherita",
      "productNameAr": "بيتزا مارغريتا",
      "quantity": "1.00",
      "unitPrice": "45.00",
      "lineTotal": "45.00",
      "kitchenStatus": "READY"
    }
  ],
  "payments": [
    {
      "id": "pay_001",
      "method": "CARD",
      "amount": "57.25",
      "reference": "****1234",
      "processedAt": "2025-12-30T14:35:00Z"
    }
  ],
  "subtotal": "45.00",
  "taxTotal": "6.75",
  "total": "51.75",
  "amountPaid": "57.25",
  "amountDue": "0.00"
}
```

---

### 5. Create Order

Create a new order.

**Endpoint:** `POST /orders`

**Request Body:**

```json
{
  "orderType": "TAKEAWAY",
  "customerId": null,
  "tableId": null,
  "items": [
    {
      "productId": "prod_789",
      "quantity": "2.00",
      "modifiers": [
        {
          "modifierId": "mod_large",
          "quantity": 1
        }
      ],
      "notes": "Extra sauce"
    },
    {
      "productId": "prod_123",
      "quantity": "1.00",
      "modifiers": [],
      "notes": null
    }
  ],
  "notes": "Customer waiting at counter",
  "discount": null
}
```

**Success Response:** `201 Created`

```json
{
  "id": "ord_new123",
  "orderNumber": "ORD-2025-001235",
  "orderType": "TAKEAWAY",
  "status": "DRAFT",
  "paymentStatus": "UNPAID",
  "customerId": null,
  "customerName": null,
  "tableId": null,
  "tableName": null,
  "items": [
    {
      "id": "item_001",
      "orderId": "ord_new123",
      "productId": "prod_789",
      "productName": "Chicken Shawarma",
      "productNameAr": "شاورما دجاج",
      "quantity": "2.00",
      "unitPrice": "30.00",
      "lineTotal": "60.00",
      "modifiers": [
        {
          "id": "mod_001",
          "modifierId": "mod_large",
          "modifierName": "Large",
          "modifierNameAr": "كبير",
          "price": "5.00",
          "quantity": 1
        }
      ],
      "notes": "Extra sauce",
      "kitchenStatus": "PENDING"
    }
  ],
  "subtotal": "80.00",
  "discountTotal": "0.00",
  "taxTotal": "12.00",
  "total": "92.00",
  "payments": [],
  "amountPaid": "0.00",
  "amountDue": "92.00",
  "discount": null,
  "notes": "Customer waiting at counter",
  "createdBy": "user_001",
  "createdAt": "2025-12-30T14:30:00Z"
}
```

---

### 6. Update Order

Update order details (type, customer, table, notes, discount).

**Endpoint:** `PATCH /orders/:id`

**Request Body:**

```json
{
  "orderType": "DINE_IN",
  "tableId": "tbl_08",
  "notes": "Customer moved to table 8"
}
```

**Success Response:** `200 OK`

```json
{
  "id": "ord_abc123",
  "orderNumber": "ORD-2025-001234",
  "orderType": "DINE_IN",
  "tableId": "tbl_08",
  "tableName": "Table 8",
  "notes": "Customer moved to table 8",
  "updatedAt": "2025-12-30T14:35:00Z"
}
```

---

### 7. Delete Order

Soft delete an order (only for DRAFT orders).

**Endpoint:** `DELETE /orders/:id`

**Success Response:** `204 No Content`

**Error Response:** `400 Bad Request`

```json
{
  "error": {
    "code": "INVALID_ORDER_STATUS",
    "message": "Cannot delete orders that are not in DRAFT status"
  }
}
```

---

## Order Item Operations

### 1. Add Item to Order

Add a new item to an existing order.

**Endpoint:** `POST /orders/:orderId/items`

**Request Body:**

```json
{
  "productId": "prod_456",
  "quantity": "1.00",
  "modifiers": [
    {
      "modifierId": "mod_cheese",
      "quantity": 1
    }
  ],
  "notes": "Well done"
}
```

**Success Response:** `200 OK`

```json
{
  "id": "ord_abc123",
  "orderNumber": "ORD-2025-001234",
  "items": [
    {
      "id": "item_002",
      "orderId": "ord_abc123",
      "productId": "prod_456",
      "productName": "Grilled Chicken",
      "productNameAr": "دجاج مشوي",
      "quantity": "1.00",
      "unitPrice": "35.00",
      "lineTotal": "35.00",
      "modifiers": [
        {
          "id": "mod_001",
          "modifierId": "mod_cheese",
          "modifierName": "Extra Cheese",
          "modifierNameAr": "جبن إضافي",
          "price": "3.00",
          "quantity": 1
        }
      ],
      "notes": "Well done",
      "kitchenStatus": "PENDING"
    }
  ],
  "subtotal": "75.00",
  "total": "86.25"
}
```

---

### 2. Update Order Item

Update item quantity.

**Endpoint:** `PATCH /orders/:orderId/items/:itemId`

**Request Body:**

```json
{
  "quantity": "3.00"
}
```

**Success Response:** `200 OK`

```json
{
  "id": "ord_abc123",
  "items": [
    {
      "id": "item_001",
      "quantity": "3.00",
      "unitPrice": "25.00",
      "lineTotal": "75.00"
    }
  ],
  "subtotal": "75.00",
  "total": "86.25"
}
```

---

### 3. Remove Order Item

Remove an item from order.

**Endpoint:** `DELETE /orders/:orderId/items/:itemId`

**Request Body (Optional):**

```json
{
  "reason": "Customer changed mind"
}
```

**Success Response:** `200 OK`

```json
{
  "id": "ord_abc123",
  "items": [],
  "subtotal": "0.00",
  "total": "0.00"
}
```

---

### 4. Void Order Item

Void an item (requires manager authorization).

**Endpoint:** `POST /orders/:orderId/items/:itemId/void`

**Request Body:**

```json
{
  "reason": "Quality issue - burnt",
  "authorizedBy": "manager_001"
}
```

**Success Response:** `200 OK`

```json
{
  "id": "ord_abc123",
  "items": [
    {
      "id": "item_001",
      "productName": "Beef Burger",
      "isVoided": true,
      "voidReason": "Quality issue - burnt",
      "voidAuthorizedBy": "manager_001",
      "voidedAt": "2025-12-30T14:40:00Z",
      "lineTotal": "0.00"
    }
  ],
  "subtotal": "0.00",
  "total": "0.00"
}
```

---

## Payment Operations

### 1. Add Payment

Add a payment to an order.

**Endpoint:** `POST /orders/:orderId/payments`

**Request Body:**

```json
{
  "method": "CASH",
  "amount": "100.00",
  "reference": null
}
```

**Success Response:** `200 OK`

```json
{
  "id": "ord_abc123",
  "payments": [
    {
      "id": "pay_001",
      "orderId": "ord_abc123",
      "method": "CASH",
      "amount": "100.00",
      "reference": null,
      "processedAt": "2025-12-30T14:35:00Z"
    }
  ],
  "amountPaid": "100.00",
  "amountDue": "0.00",
  "paymentStatus": "PAID"
}
```

**Example - Card Payment:**

```json
{
  "method": "CARD",
  "amount": "92.00",
  "reference": "****4532"
}
```

**Example - Split Payment:**

```json
// First payment
{
  "method": "CASH",
  "amount": "50.00"
}

// Second payment
{
  "method": "CARD",
  "amount": "42.00",
  "reference": "****1234"
}
```

---

### 2. Remove Payment

Remove a payment from order (before completion).

**Endpoint:** `DELETE /orders/:orderId/payments/:paymentId`

**Success Response:** `200 OK`

```json
{
  "id": "ord_abc123",
  "payments": [],
  "amountPaid": "0.00",
  "amountDue": "92.00",
  "paymentStatus": "UNPAID"
}
```

---

## Order Status Operations

### 1. Complete Order

Finalize order and generate invoice/receipt.

**Endpoint:** `POST /orders/:orderId/complete`

**Success Response:** `200 OK`

```json
{
  "id": "ord_abc123",
  "orderNumber": "ORD-2025-001234",
  "status": "COMPLETED",
  "paymentStatus": "PAID",
  "completedAt": "2025-12-30T14:40:00Z",
  "invoiceHash": "abc123hash",
  "previousHash": "xyz789hash",
  "zatcaQrCode": "base64encodedqrcode..."
}
```

**Error Response:** `400 Bad Request`

```json
{
  "error": {
    "code": "PAYMENT_INCOMPLETE",
    "message": "Order cannot be completed. Outstanding balance: 50.00 SAR"
  }
}
```

---

### 2. Cancel Order

Cancel an order with reason.

**Endpoint:** `POST /orders/:orderId/cancel`

**Request Body:**

```json
{
  "reason": "Customer requested cancellation"
}
```

**Success Response:** `200 OK`

```json
{
  "id": "ord_abc123",
  "status": "CANCELLED",
  "cancelledAt": "2025-12-30T14:40:00Z",
  "cancellationReason": "Customer requested cancellation"
}
```

---

### 3. Void Order

Void an order (requires manager authorization).

**Endpoint:** `POST /orders/:orderId/void`

**Request Body:**

```json
{
  "reason": "Duplicate order entry",
  "authorizedBy": "manager_001"
}
```

**Success Response:** `200 OK`

```json
{
  "id": "ord_abc123",
  "status": "VOIDED",
  "voidedAt": "2025-12-30T14:40:00Z",
  "voidReason": "Duplicate order entry",
  "voidAuthorizedBy": "manager_001"
}
```

---

## Discount Operations

### 1. Apply Discount

Apply discount to entire order.

**Endpoint:** `POST /orders/:orderId/discount`

**Request Body - Percentage Discount:**

```json
{
  "type": "PERCENT",
  "value": "10",
  "reason": "Happy hour discount",
  "authorizedBy": null
}
```

**Request Body - Fixed Amount Discount:**

```json
{
  "type": "FIXED",
  "value": "20.00",
  "reason": "Manager comp",
  "authorizedBy": "manager_001"
}
```

**Success Response:** `200 OK`

```json
{
  "id": "ord_abc123",
  "discount": {
    "type": "PERCENT",
    "value": "10",
    "reason": "Happy hour discount",
    "authorizedBy": null
  },
  "subtotal": "100.00",
  "discountTotal": "10.00",
  "taxTotal": "13.50",
  "total": "103.50"
}
```

---

### 2. Remove Discount

Remove discount from order.

**Endpoint:** `DELETE /orders/:orderId/discount`

**Success Response:** `200 OK`

```json
{
  "id": "ord_abc123",
  "discount": null,
  "subtotal": "100.00",
  "discountTotal": "0.00",
  "taxTotal": "15.00",
  "total": "115.00"
}
```

---

## Hold/Recall Operations

### 1. Hold Order

Park/hold an order for later.

**Endpoint:** `POST /orders/:orderId/hold`

**Request Body (Optional):**

```json
{
  "note": "Customer stepped out to get wallet"
}
```

**Success Response:** `200 OK`

```json
{
  "id": "ord_abc123",
  "status": "HELD",
  "heldAt": "2025-12-30T14:40:00Z",
  "holdNote": "Customer stepped out to get wallet"
}
```

---

### 2. Get Held Orders

Retrieve all held/parked orders.

**Endpoint:** `GET /orders?status=DRAFT&limit=50`

**Success Response:** `200 OK`

```json
[
  {
    "id": "ord_held001",
    "orderNumber": "ORD-2025-001230",
    "status": "DRAFT",
    "orderType": "TAKEAWAY",
    "items": [
      {
        "productName": "Chicken Shawarma",
        "quantity": "2.00"
      }
    ],
    "total": "57.50",
    "createdAt": "2025-12-30T13:30:00Z",
    "notes": "Customer will return in 10 minutes"
  }
]
```

---

### 3. Recall Order

Recall/resume a held order.

**Endpoint:** `POST /orders/:orderId/recall`

**Success Response:** `200 OK`

```json
{
  "id": "ord_abc123",
  "status": "DRAFT",
  "recalledAt": "2025-12-30T14:45:00Z"
}
```

---

## Refund Operations

### 1. Process Refund

Process full or partial refund for a completed order.

**Endpoint:** `POST /orders/:orderId/refund`

**Request Body:**

```json
{
  "amount": "57.50",
  "reason": "Customer complaint - food quality",
  "authorizedBy": "manager_001"
}
```

**Success Response:** `200 OK`

```json
{
  "id": "ord_abc123",
  "orderNumber": "ORD-2025-001234",
  "paymentStatus": "REFUNDED",
  "refund": {
    "amount": "57.50",
    "reason": "Customer complaint - food quality",
    "authorizedBy": "manager_001",
    "processedAt": "2025-12-30T15:00:00Z"
  }
}
```

---

## Kitchen Operations

### 1. Fire Items to Kitchen

Send items to kitchen for preparation.

**Endpoint:** `POST /orders/:orderId/fire`

**Request Body - Fire All Items:**

```json
{}
```

**Request Body - Fire Specific Items:**

```json
{
  "itemIds": ["item_001", "item_003"]
}
```

**Success Response:** `200 OK`

```json
{
  "id": "ord_abc123",
  "items": [
    {
      "id": "item_001",
      "productName": "Beef Burger",
      "kitchenStatus": "FIRED",
      "firedAt": "2025-12-30T14:35:00Z"
    }
  ]
}
```

---

### 2. Update Kitchen Status

Update kitchen status for a specific item.

**Endpoint:** `PATCH /orders/:orderId/items/:itemId/kitchen-status`

**Request Body:**

```json
{
  "status": "PREPARING"
}
```

**Possible Status Values:**
- `PENDING` - Not yet sent to kitchen
- `FIRED` - Sent to kitchen
- `PREPARING` - Kitchen acknowledged, cooking
- `READY` - Ready to serve/pickup
- `SERVED` - Delivered to customer

**Success Response:** `200 OK`

```json
{
  "id": "ord_abc123",
  "items": [
    {
      "id": "item_001",
      "productName": "Beef Burger",
      "kitchenStatus": "PREPARING",
      "firedAt": "2025-12-30T14:35:00Z"
    }
  ]
}
```

---

## Data Models

### Order

```typescript
interface Order {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;

  // Customer & Location
  customerId?: string;
  customerName?: string;
  tableId?: string;
  tableName?: string;

  // Items
  items: OrderItem[];

  // Totals
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  total: string;

  // Payments
  payments: Payment[];
  amountPaid: string;
  amountDue: string;

  // Discount
  discount?: OrderDiscount;

  // Notes
  notes?: string;

  // Metadata
  registerSessionId?: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;

  // ZATCA (Saudi Tax Invoice)
  invoiceHash?: string;
  previousHash?: string;
  zatcaQrCode?: string;
}
```

### OrderItem

```typescript
interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productNameAr?: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  modifiers?: OrderItemModifier[];
  notes?: string;
  kitchenStatus?: KitchenStatus;
}
```

### OrderItemModifier

```typescript
interface OrderItemModifier {
  id: string;
  modifierId: string;
  modifierName: string;
  modifierNameAr?: string;
  price: string;
  quantity: number;
}
```

### Payment

```typescript
interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: string;
  reference?: string;
  processedAt: string;
}
```

### OrderDiscount

```typescript
interface OrderDiscount {
  type: 'PERCENT' | 'FIXED';
  value: string;
  reason?: string;
  authorizedBy?: string;
}
```

---

## Common Workflows

### Workflow 1: Dine-In Order (Full Lifecycle)

```javascript
// 1. Create order
POST /api/v1/sales/orders
{
  "orderType": "DINE_IN",
  "tableId": "tbl_05",
  "items": [...]
}

// 2. Items auto-fire to kitchen (DINE_IN setting)
// Kitchen updates status
PATCH /api/v1/sales/orders/{orderId}/items/{itemId}/kitchen-status
{ "status": "PREPARING" }

// 3. Food is ready
PATCH /api/v1/sales/orders/{orderId}/items/{itemId}/kitchen-status
{ "status": "READY" }

// 4. Customer requests bill, add payment
POST /api/v1/sales/orders/{orderId}/payments
{ "method": "CARD", "amount": "125.00" }

// 5. Complete order
POST /api/v1/sales/orders/{orderId}/complete
```

### Workflow 2: Takeaway Order (Quick Service)

```javascript
// 1. Create order
POST /api/v1/sales/orders
{
  "orderType": "TAKEAWAY",
  "items": [...]
}

// 2. Add payment immediately
POST /api/v1/sales/orders/{orderId}/payments
{ "method": "CASH", "amount": "60.00" }

// 3. Fire to kitchen after payment
POST /api/v1/sales/orders/{orderId}/fire

// 4. Complete order
POST /api/v1/sales/orders/{orderId}/complete
```

### Workflow 3: Hold and Recall

```javascript
// 1. Customer needs to step out
POST /api/v1/sales/orders/{orderId}/hold
{ "note": "Customer getting wallet" }

// 2. View all held orders
GET /api/v1/sales/orders?status=DRAFT&limit=50

// 3. Customer returns, recall order
POST /api/v1/sales/orders/{orderId}/recall

// 4. Continue with payment
POST /api/v1/sales/orders/{orderId}/payments
```

---

**Related Documentation:**
- [API Overview](./API_OVERVIEW.md)
- [Products API](./PRODUCTS_API.md)
- [Sessions API](./SESSIONS_API.md)
- [Customers API](./CUSTOMERS_API.md)
