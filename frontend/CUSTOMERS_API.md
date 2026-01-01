# Customers API Documentation

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

1. [Customer CRUD Endpoints](#customer-crud-endpoints)
2. [Customer Search Endpoints](#customer-search-endpoints)
3. [Order History Endpoints](#order-history-endpoints)
4. [Loyalty Program Endpoints](#loyalty-program-endpoints)
5. [Store Credit Endpoints](#store-credit-endpoints)
6. [Data Models](#data-models)
7. [Common Workflows](#common-workflows)

---

## Customer CRUD Endpoints

### 1. Get All Customers

Retrieve paginated list of customers.

**Endpoint:** `GET /customers`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20) |
| `search` | string | No | Search by name or phone |
| `loyaltyTier` | LoyaltyTier | No | Filter by loyalty tier |
| `hasStoreCredit` | boolean | No | Filter customers with credit |

**Success Response:** `200 OK`

```json
{
  "items": [
    {
      "id": "cust_123abc",
      "name": "أحمد محمد علي",
      "nameAr": "أحمد محمد علي",
      "phone": "+966501234567",
      "email": "ahmed@example.com",
      "address": "الرياض، حي النخيل، شارع الملك فهد",
      "loyaltyTier": "GOLD",
      "loyaltyPoints": 1250,
      "totalSpent": "5420.50",
      "totalOrders": 42,
      "storeCredit": "25.00",
      "notes": "VIP customer, prefers dine-in",
      "tags": ["VIP", "Regular"],
      "createdAt": "2024-01-15T10:00:00Z",
      "lastVisitAt": "2025-12-29T18:30:00Z"
    },
    {
      "id": "cust_456def",
      "name": "Sarah Ahmed",
      "nameAr": "سارة أحمد",
      "phone": "+966509876543",
      "email": "sarah@example.com",
      "loyaltyTier": "SILVER",
      "loyaltyPoints": 580,
      "totalSpent": "2340.00",
      "totalOrders": 18,
      "storeCredit": "0.00",
      "createdAt": "2024-06-20T14:00:00Z",
      "lastVisitAt": "2025-12-28T12:15:00Z"
    }
  ],
  "total": 523,
  "page": 1,
  "limit": 20,
  "totalPages": 27
}
```

---

### 2. Get Customer by ID

Retrieve single customer details.

**Endpoint:** `GET /customers/:id`

**Success Response:** `200 OK`

```json
{
  "id": "cust_123abc",
  "name": "أحمد محمد علي",
  "nameAr": "أحمد محمد علي",
  "phone": "+966501234567",
  "email": "ahmed@example.com",
  "address": "الرياض، حي النخيل، شارع الملك فهد",
  "loyaltyTier": "GOLD",
  "loyaltyPoints": 1250,
  "totalSpent": "5420.50",
  "totalOrders": 42,
  "storeCredit": "25.00",
  "notes": "VIP customer, prefers dine-in",
  "tags": ["VIP", "Regular"],
  "createdAt": "2024-01-15T10:00:00Z",
  "lastVisitAt": "2025-12-29T18:30:00Z"
}
```

---

### 3. Get Customer by Phone

Retrieve customer by phone number (for quick lookup at POS).

**Endpoint:** `GET /customers/phone/:phone`

**Example:** `GET /customers/phone/+966501234567`

**Success Response:** `200 OK`

```json
{
  "id": "cust_123abc",
  "name": "أحمد محمد علي",
  "phone": "+966501234567",
  "loyaltyPoints": 1250,
  "storeCredit": "25.00",
  "loyaltyTier": "GOLD"
}
```

**Response when not found:** `200 OK`

```json
null
```

---

### 4. Create Customer

Create a new customer profile.

**Endpoint:** `POST /customers`

**Request Body:**

```json
{
  "name": "فاطمة حسن",
  "nameAr": "فاطمة حسن",
  "phone": "+966555123456",
  "email": "fatima@example.com",
  "address": "جدة، حي الزهراء",
  "notes": "Allergic to nuts"
}
```

**Success Response:** `201 Created`

```json
{
  "id": "cust_new789",
  "name": "فاطمة حسن",
  "nameAr": "فاطمة حسن",
  "phone": "+966555123456",
  "email": "fatima@example.com",
  "address": "جدة، حي الزهراء",
  "loyaltyTier": "BRONZE",
  "loyaltyPoints": 0,
  "totalSpent": "0.00",
  "totalOrders": 0,
  "storeCredit": "0.00",
  "notes": "Allergic to nuts",
  "tags": [],
  "createdAt": "2025-12-30T14:30:00Z",
  "lastVisitAt": null
}
```

---

### 5. Quick Create Customer

Create customer with minimal information (name and phone only).

**Endpoint:** `POST /customers`

**Request Body:**

```json
{
  "name": "خالد العتيبي",
  "phone": "+966502345678"
}
```

**Success Response:** `201 Created`

```json
{
  "id": "cust_quick456",
  "name": "خالد العتيبي",
  "phone": "+966502345678",
  "loyaltyPoints": 0,
  "storeCredit": "0.00",
  "createdAt": "2025-12-30T14:30:00Z"
}
```

**Use Case:** Quick customer registration at POS during checkout.

---

### 6. Update Customer

Update customer information.

**Endpoint:** `PATCH /customers/:id`

**Request Body:**

```json
{
  "email": "newemail@example.com",
  "address": "الرياض، حي العليا الجديد",
  "tags": ["VIP", "Regular", "Delivery-Preferred"]
}
```

**Success Response:** `200 OK`

```json
{
  "id": "cust_123abc",
  "name": "أحمد محمد علي",
  "email": "newemail@example.com",
  "address": "الرياض، حي العليا الجديد",
  "tags": ["VIP", "Regular", "Delivery-Preferred"],
  "updatedAt": "2025-12-30T14:35:00Z"
}
```

---

### 7. Delete Customer

Soft delete a customer.

**Endpoint:** `DELETE /customers/:id`

**Success Response:** `204 No Content`

---

## Customer Search Endpoints

### 1. Search Customers

Search customers by name or phone (for POS autocomplete).

**Endpoint:** `GET /customers?search={query}&limit=20`

**Example:** `GET /customers?search=ahmed&limit=20`

**Success Response:** `200 OK`

```json
[
  {
    "id": "cust_123abc",
    "name": "أحمد محمد علي",
    "phone": "+966501234567",
    "loyaltyPoints": 1250,
    "storeCredit": "25.00"
  },
  {
    "id": "cust_789xyz",
    "name": "Ahmed Ali",
    "phone": "+966507654321",
    "loyaltyPoints": 340,
    "storeCredit": "0.00"
  }
]
```

---

## Order History Endpoints

### 1. Get Customer Orders

Retrieve customer's order history.

**Endpoint:** `GET /customers/:customerId/orders`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number |
| `limit` | number | No | Items per page |

**Success Response:** `200 OK`

```json
{
  "items": [
    {
      "id": "ord_abc123",
      "orderNumber": "ORD-2025-001234",
      "total": "125.50",
      "status": "COMPLETED",
      "createdAt": "2025-12-29T18:30:00Z"
    },
    {
      "id": "ord_def456",
      "orderNumber": "ORD-2025-001189",
      "total": "87.00",
      "status": "COMPLETED",
      "createdAt": "2025-12-25T14:20:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

## Loyalty Program Endpoints

### 1. Get Loyalty Summary

Get customer's loyalty program summary and recent transactions.

**Endpoint:** `GET /customers/:customerId/loyalty`

**Success Response:** `200 OK`

```json
{
  "tier": "GOLD",
  "currentPoints": 1250,
  "lifetimePoints": 5420,
  "pointsToNextTier": 250,
  "tierProgress": 83.3,
  "recentTransactions": [
    {
      "id": "ltx_001",
      "type": "EARN",
      "points": 54,
      "reason": "Order #ORD-2025-001234",
      "orderId": "ord_abc123",
      "createdAt": "2025-12-29T18:30:00Z"
    },
    {
      "id": "ltx_002",
      "type": "REDEEM",
      "points": -500,
      "reason": "Redeemed for discount",
      "orderId": "ord_xyz789",
      "createdAt": "2025-12-20T15:00:00Z"
    }
  ]
}
```

**Loyalty Tiers:**
- **BRONZE**: 0-499 points
- **SILVER**: 500-999 points
- **GOLD**: 1000-1499 points
- **PLATINUM**: 1500+ points

---

### 2. Award Loyalty Points

Award points to a customer (manual or automated).

**Endpoint:** `POST /customers/:customerId/loyalty/award`

**Request Body:**

```json
{
  "points": 100,
  "reason": "Birthday bonus"
}
```

**Success Response:** `200 OK`

```json
{
  "id": "cust_123abc",
  "name": "أحمد محمد علي",
  "loyaltyPoints": 1350,
  "loyaltyTier": "GOLD",
  "pointsAdded": 100
}
```

**Use Cases:**
- Birthday bonuses
- Promotional campaigns
- Manual adjustments
- Compensation

---

### 3. Redeem Loyalty Points

Redeem customer loyalty points for discount.

**Endpoint:** `POST /customers/:customerId/loyalty/redeem`

**Request Body:**

```json
{
  "points": 500
}
```

**Success Response:** `200 OK`

```json
{
  "id": "cust_123abc",
  "name": "أحمد محمد علي",
  "loyaltyPoints": 750,
  "loyaltyTier": "SILVER",
  "pointsRedeemed": 500,
  "discountValue": "50.00"
}
```

**Redemption Rate:** Typically 10 points = 1 SAR discount

**Error Response:** `400 Bad Request`

```json
{
  "error": {
    "code": "INSUFFICIENT_POINTS",
    "message": "Customer has only 300 points, cannot redeem 500 points"
  }
}
```

---

## Store Credit Endpoints

### 1. Add Store Credit

Add store credit to customer account.

**Endpoint:** `POST /customers/:customerId/credit/add`

**Request Body:**

```json
{
  "amount": "50.00",
  "reason": "Refund for order #ORD-2025-001200"
}
```

**Success Response:** `200 OK`

```json
{
  "id": "cust_123abc",
  "name": "أحمد محمد علي",
  "storeCredit": "75.00",
  "creditAdded": "50.00"
}
```

**Use Cases:**
- Refunds
- Compensation for complaints
- Promotional credits
- Gift credits

---

### 2. Use Store Credit

Use customer's store credit for payment.

**Endpoint:** `POST /customers/:customerId/credit/use`

**Request Body:**

```json
{
  "amount": "25.00",
  "orderId": "ord_abc123"
}
```

**Success Response:** `200 OK`

```json
{
  "id": "cust_123abc",
  "name": "أحمد محمد علي",
  "storeCredit": "50.00",
  "creditUsed": "25.00",
  "remainingCredit": "50.00"
}
```

**Error Response:** `400 Bad Request`

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDIT",
    "message": "Customer has only 10.00 SAR credit, cannot use 25.00 SAR"
  }
}
```

---

### 3. Get Credit History

Retrieve customer's store credit transaction history.

**Endpoint:** `GET /customers/:customerId/credit/history`

**Success Response:** `200 OK`

```json
[
  {
    "id": "ctx_001",
    "type": "ADD",
    "amount": "50.00",
    "reason": "Refund for order #ORD-2025-001200",
    "orderId": "ord_xyz123",
    "createdAt": "2025-12-28T10:00:00Z"
  },
  {
    "id": "ctx_002",
    "type": "USE",
    "amount": "-25.00",
    "reason": "Used in order #ORD-2025-001234",
    "orderId": "ord_abc123",
    "createdAt": "2025-12-29T18:30:00Z"
  },
  {
    "id": "ctx_003",
    "type": "REFUND",
    "amount": "15.00",
    "reason": "Partial refund - cancelled delivery",
    "orderId": "ord_def456",
    "createdAt": "2025-12-26T16:20:00Z"
  }
]
```

**Transaction Types:**
- **ADD**: Credit added to account
- **USE**: Credit used for payment
- **EXPIRE**: Credit expired (if applicable)
- **REFUND**: Credit from refund

---

## Data Models

### Customer

```typescript
interface Customer {
  id: string;
  name: string;
  nameAr?: string;
  phone: string;                 // Required, unique
  email?: string;
  address?: string;

  // Loyalty
  loyaltyTier?: LoyaltyTier;
  loyaltyPoints: number;
  totalSpent: string;            // Lifetime spending
  totalOrders: number;           // Lifetime order count

  // Credit
  storeCredit: string;           // Available store credit

  // Metadata
  notes?: string;
  tags?: string[];               // Custom tags
  createdAt: string;
  lastVisitAt?: string;
}
```

### LoyaltyTier

```typescript
type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
```

### LoyaltySummary

```typescript
interface LoyaltySummary {
  tier: LoyaltyTier;
  currentPoints: number;
  lifetimePoints: number;
  pointsToNextTier?: number;
  tierProgress: number;          // Percentage to next tier
  recentTransactions: LoyaltyTransaction[];
}
```

### LoyaltyTransaction

```typescript
interface LoyaltyTransaction {
  id: string;
  type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST';
  points: number;                // Positive for earn, negative for redeem
  reason: string;
  orderId?: string;
  createdAt: string;
}
```

### CreditTransaction

```typescript
interface CreditTransaction {
  id: string;
  type: 'ADD' | 'USE' | 'EXPIRE' | 'REFUND';
  amount: string;
  reason: string;
  orderId?: string;
  createdAt: string;
}
```

### CustomerOrder

```typescript
interface CustomerOrder {
  id: string;
  orderNumber: string;
  total: string;
  status: string;
  createdAt: string;
}
```

---

## Common Workflows

### Workflow 1: Customer Lookup at POS

```javascript
// Customer provides phone number
// 1. Search customer by phone
GET /api/v1/customers/phone/+966501234567

// If found:
{
  "id": "cust_123abc",
  "name": "أحمد محمد علي",
  "phone": "+966501234567",
  "loyaltyPoints": 1250,
  "storeCredit": "25.00",
  "loyaltyTier": "GOLD"
}

// If not found (null response):
// 2. Offer to create new customer
POST /api/v1/customers
{
  "name": "New Customer Name",
  "phone": "+966501234567"
}
```

---

### Workflow 2: Loyalty Points Redemption

```javascript
// 1. Customer wants to use loyalty points
// Get loyalty summary
GET /api/v1/customers/{customerId}/loyalty

// Response shows 1250 points available

// 2. Calculate discount (500 points = 50 SAR)
// 3. Redeem points
POST /api/v1/customers/{customerId}/loyalty/redeem
{
  "points": 500
}

// 4. Apply 50 SAR discount to order
POST /api/v1/sales/orders/{orderId}/discount
{
  "type": "FIXED",
  "value": "50.00",
  "reason": "Loyalty points redemption - 500 points"
}
```

---

### Workflow 3: Store Credit from Refund

```javascript
// Customer returns item, gets store credit

// 1. Process refund order
POST /api/v1/sales/orders/{orderId}/refund
{
  "amount": "75.50",
  "reason": "Product quality issue",
  "authorizedBy": "manager_001"
}

// 2. Add store credit to customer
POST /api/v1/customers/{customerId}/credit/add
{
  "amount": "75.50",
  "reason": "Refund for order #ORD-2025-001200"
}

// Customer now has 75.50 SAR store credit
```

---

### Workflow 4: Using Store Credit for Payment

```javascript
// Customer wants to use store credit at checkout
// Order total: 125.00 SAR
// Customer credit: 50.00 SAR

// 1. Use maximum available credit
POST /api/v1/customers/{customerId}/credit/use
{
  "amount": "50.00",
  "orderId": "ord_abc123"
}

// 2. Customer pays remaining amount (75.00) with card
POST /api/v1/sales/orders/{orderId}/payments
{
  "method": "STORE_CREDIT",
  "amount": "50.00",
  "reference": "Store Credit"
}

POST /api/v1/sales/orders/{orderId}/payments
{
  "method": "CARD",
  "amount": "75.00",
  "reference": "****1234"
}
```

---

### Workflow 5: Automatic Loyalty Points on Purchase

```javascript
// After order completion, award loyalty points

// Order total: 125.00 SAR
// Points rate: 1 point per 1 SAR spent

// Award points automatically
POST /api/v1/customers/{customerId}/loyalty/award
{
  "points": 125,
  "reason": "Order #ORD-2025-001234"
}

// Customer's points: 1250 → 1375
// Check if tier upgraded (GOLD → PLATINUM at 1500)
```

---

## Business Rules

### Customer Creation

- **Phone Number Required**: Unique identifier
- **Name Required**: Minimum 2 characters
- **Email Optional**: If provided, must be valid format
- **Auto-assign Bronze Tier**: New customers start at BRONZE

### Loyalty Points

- **Earning Rate**: Typically 1 point per 1 SAR spent
- **Redemption Rate**: Typically 10 points = 1 SAR discount
- **Points Never Expire**: Unless business policy changes
- **Cannot Go Negative**: Cannot redeem more than available

### Store Credit

- **No Expiry**: Store credit never expires
- **Cannot Go Negative**: Cannot use more than available
- **Transferable**: Can be used for any future purchase
- **Refund Method**: Preferred for refunds over cash

### Tiers

- **BRONZE**: 0-499 points
- **SILVER**: 500-999 points (5% discount)
- **GOLD**: 1000-1499 points (10% discount)
- **PLATINUM**: 1500+ points (15% discount)

---

## Integration with Orders

### Add Customer to Order

```javascript
// During order creation or update
POST /api/v1/sales/orders
{
  "orderType": "DINE_IN",
  "customerId": "cust_123abc",
  "items": [...]
}
```

### Customer Benefits on Order

- **Loyalty Discount**: Applied automatically based on tier
- **Store Credit**: Can be used as payment method
- **Points Earning**: Automatic after order completion

---

**Related Documentation:**
- [API Overview](./API_OVERVIEW.md)
- [Products API](./PRODUCTS_API.md)
- [Orders API](./ORDERS_API.md)
- [Sessions API](./SESSIONS_API.md)
