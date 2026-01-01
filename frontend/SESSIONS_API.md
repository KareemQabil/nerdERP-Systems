# Sessions API Documentation

> **Base URL:** `https://localhost:3000/api/v1/cash`

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

1. [Session Management Endpoints](#session-management-endpoints)
2. [Cash Handling Endpoints](#cash-handling-endpoints)
3. [Data Models](#data-models)
4. [Common Workflows](#common-workflows)

---

## Session Management Endpoints

### 1. Open Session

Open a new cash register session.

**Endpoint:** `POST /sessions/open`

**Request Body:**

```json
{
  "deviceId": "POS-001",
  "openingBalance": "500.00",
  "userId": "user_001",
  "storeId": "store_main"
}
```

**Success Response:** `201 Created`

```json
{
  "id": "sess_abc123",
  "deviceId": "POS-001",
  "userId": "user_001",
  "storeId": "store_main",
  "openingBalance": "500.00",
  "closingBalance": null,
  "expectedBalance": null,
  "discrepancy": null,
  "isOpen": true,
  "openedAt": "2025-12-30T08:00:00+03:00",
  "closedAt": null,
  "closedBy": null,
  "notes": null
}
```

**Error Response:** `409 Conflict`

```json
{
  "error": {
    "code": "SESSION_ALREADY_OPEN",
    "message": "An active session already exists for this device",
    "activeSessionId": "sess_xyz789"
  }
}
```

---

### 2. Close Session

Close an active cash register session.

**Endpoint:** `POST /sessions/:sessionId/close`

**Request Body:**

```json
{
  "closingBalance": 1250.50,
  "closedBy": "user_001",
  "notes": "All cash counted and verified"
}
```

**Success Response:** `200 OK`

```json
{
  "id": "sess_abc123",
  "deviceId": "POS-001",
  "userId": "user_001",
  "storeId": "store_main",
  "openingBalance": "500.00",
  "closingBalance": "1250.50",
  "expectedBalance": "1245.75",
  "discrepancy": "4.75",
  "isOpen": false,
  "openedAt": "2025-12-30T08:00:00+03:00",
  "closedAt": "2025-12-30T20:00:00+03:00",
  "closedBy": "user_001",
  "notes": "All cash counted and verified"
}
```

**Error Response:** `400 Bad Request`

```json
{
  "error": {
    "code": "SESSION_ALREADY_CLOSED",
    "message": "This session is already closed"
  }
}
```

---

### 3. Get Active Session

Get the currently active session for a device.

**Endpoint:** `GET /sessions/active/:deviceId`

**Success Response:** `200 OK`

```json
{
  "id": "sess_abc123",
  "deviceId": "POS-001",
  "userId": "user_001",
  "storeId": "store_main",
  "openingBalance": "500.00",
  "isOpen": true,
  "openedAt": "2025-12-30T08:00:00+03:00"
}
```

**Response when no active session:** `200 OK`

```json
null
```

---

### 4. Get Session by ID

Retrieve session details by ID.

**Endpoint:** `GET /sessions/:sessionId`

**Success Response:** `200 OK`

```json
{
  "id": "sess_abc123",
  "deviceId": "POS-001",
  "userId": "user_001",
  "storeId": "store_main",
  "openingBalance": "500.00",
  "closingBalance": "1250.50",
  "expectedBalance": "1245.75",
  "discrepancy": "4.75",
  "isOpen": false,
  "openedAt": "2025-12-30T08:00:00+03:00",
  "closedAt": "2025-12-30T20:00:00+03:00",
  "closedBy": "user_001",
  "notes": "All cash counted and verified"
}
```

---

### 5. Get Session Balance

Get calculated balance information for a session.

**Endpoint:** `GET /sessions/:sessionId/balance`

**Success Response:** `200 OK`

```json
{
  "openingBalance": "500.00",
  "cashSales": "850.00",
  "cashRefunds": "25.00",
  "dropsToSafe": "200.00",
  "pettyCash": "30.00",
  "expectedBalance": "1095.00"
}
```

**Balance Calculation:**
```
Expected Balance =
  Opening Balance
  + Cash Sales
  - Cash Refunds
  - Drops to Safe
  - Petty Cash
```

---

## Cash Handling Endpoints

### 1. Drop to Safe

Record cash drop to safe (removing cash from register).

**Endpoint:** `POST /sessions/:sessionId/drop-to-safe`

**Request Body:**

```json
{
  "amount": 200.00,
  "notes": "Midday cash drop - drawer getting full"
}
```

**Success Response:** `200 OK`

```json
{
  "message": "Cash drop recorded successfully",
  "amount": "200.00",
  "timestamp": "2025-12-30T14:00:00+03:00"
}
```

**Use Case:** When the cash drawer has too much cash and needs to be secured in the safe.

---

### 2. Record Petty Cash

Record petty cash payout from register.

**Endpoint:** `POST /sessions/:sessionId/petty-cash`

**Request Body:**

```json
{
  "amount": 30.00,
  "reason": "Purchased cleaning supplies"
}
```

**Success Response:** `200 OK`

```json
{
  "message": "Petty cash recorded successfully",
  "amount": "30.00",
  "reason": "Purchased cleaning supplies",
  "timestamp": "2025-12-30T10:30:00+03:00"
}
```

**Use Case:** When cash is used from the register for small business expenses.

---

## Data Models

### RegisterSession

```typescript
interface RegisterSession {
  id: string;
  deviceId: string;              // POS terminal/device ID
  userId: string;                // Cashier who opened session
  storeId?: string;              // Store/branch ID
  openingBalance: string;        // Starting cash amount
  closingBalance?: string;       // Ending cash amount (counted)
  expectedBalance?: string;      // Calculated expected amount
  discrepancy?: string;          // Difference (over/short)
  isOpen: boolean;               // Session status
  openedAt: string;              // ISO timestamp
  closedAt?: string;             // ISO timestamp
  closedBy?: string;             // User who closed session
  notes?: string;                // Additional notes
}
```

### SessionBalance

```typescript
interface SessionBalance {
  openingBalance: string;
  cashSales: string;             // Total cash payments received
  cashRefunds: string;           // Total cash refunds given
  dropsToSafe: string;           // Total cash dropped to safe
  pettyCash: string;             // Total petty cash paid out
  expectedBalance: string;       // Calculated expected balance
}
```

### CreateSessionDto

```typescript
interface CreateSessionDto {
  deviceId: string;              // Required
  openingBalance: string;        // Required
  userId?: string;               // Optional (from auth)
  storeId?: string;              // Optional
}
```

### CloseSessionDto

```typescript
interface CloseSessionDto {
  closingBalance: number;        // Required - actual counted cash
  closedBy?: string;             // Optional (from auth)
  notes?: string;                // Optional
}
```

### CashDropDto

```typescript
interface CashDropDto {
  amount: number;                // Required
  notes?: string;                // Optional
}
```

### PettyCashDto

```typescript
interface PettyCashDto {
  amount: number;                // Required
  reason: string;                // Required - why cash was used
}
```

---

## Common Workflows

### Workflow 1: Start of Day (Opening Session)

```javascript
// 1. Check if session already open
GET /api/v1/cash/sessions/active/POS-001

// Response: null (no active session)

// 2. Count opening cash in drawer
// 3. Open new session
POST /api/v1/cash/sessions/open
{
  "deviceId": "POS-001",
  "openingBalance": "500.00",
  "userId": "user_001",
  "storeId": "store_main"
}

// 4. Start taking orders
// (See Orders API documentation)
```

---

### Workflow 2: Mid-Day Cash Drop

```javascript
// Cash drawer is getting full with cash

// 1. Count cash to drop (e.g., 200.00)
// 2. Record cash drop
POST /api/v1/cash/sessions/{sessionId}/drop-to-safe
{
  "amount": 200.00,
  "notes": "Midday cash drop - drawer getting full"
}

// 3. Physically move cash to safe
// 4. Continue operations
```

---

### Workflow 3: Petty Cash Expense

```javascript
// Need to buy supplies with register cash

// 1. Record petty cash payout
POST /api/v1/cash/sessions/{sessionId}/petty-cash
{
  "amount": 30.00,
  "reason": "Purchased cleaning supplies"
}

// 2. Take cash from drawer
// 3. Purchase items
// 4. Attach receipt to petty cash record
```

---

### Workflow 4: End of Day (Closing Session)

```javascript
// 1. No more customers, ready to close
// 2. Get expected balance
GET /api/v1/cash/sessions/{sessionId}/balance

// Response:
{
  "openingBalance": "500.00",
  "cashSales": "850.00",
  "cashRefunds": "25.00",
  "dropsToSafe": "200.00",
  "pettyCash": "30.00",
  "expectedBalance": "1095.00"
}

// 3. Count actual cash in drawer
// Actual count: 1099.75

// 4. Close session
POST /api/v1/cash/sessions/{sessionId}/close
{
  "closingBalance": 1099.75,
  "closedBy": "user_001",
  "notes": "All cash counted and verified"
}

// Response shows discrepancy:
{
  "expectedBalance": "1095.00",
  "closingBalance": "1099.75",
  "discrepancy": "4.75"    // Over by 4.75
}

// 5. Investigate discrepancy if significant
// 6. Prepare bank deposit
```

---

### Workflow 5: Session Reconciliation Report

```javascript
// Get full session details for reconciliation
GET /api/v1/cash/sessions/{sessionId}

// Expected response includes:
{
  "id": "sess_abc123",
  "openingBalance": "500.00",
  "closingBalance": "1095.00",
  "expectedBalance": "1095.00",
  "discrepancy": "0.00",
  "openedAt": "2025-12-30T08:00:00+03:00",
  "closedAt": "2025-12-30T20:00:00+03:00",
  // ... other details
}

// Generate session reconciliation report:
// - Opening balance: 500.00
// - Cash sales: 850.00
// - Cash refunds: -25.00
// - Drops to safe: -200.00
// - Petty cash: -30.00
// - Expected balance: 1095.00
// - Actual closing balance: 1095.00
// - Discrepancy: 0.00 ✓
```

---

## Business Rules

### Session Opening Rules

1. **Only One Active Session**: A device can only have one active session at a time
2. **Opening Balance Required**: Must specify starting cash amount
3. **Device ID Required**: Must identify which POS terminal

### Session Closing Rules

1. **Must Count Cash**: Actual cash count (closingBalance) is required
2. **Discrepancy Tracking**: System calculates over/short automatically
3. **Cannot Reopen**: Once closed, session cannot be reopened
4. **Cannot Close Twice**: Attempting to close an already closed session returns error

### Cash Handling Rules

1. **Cash Drops**: Reduce expected balance in session
2. **Petty Cash**: Reduces expected balance in session
3. **Must Be in Active Session**: Cannot drop cash or record petty cash in closed session

---

## Best Practices

### Opening Session

- Count opening cash carefully
- Document any unusual starting amounts
- Verify device ID matches your terminal

### During Session

- Drop cash to safe when drawer reaches threshold (e.g., 1000 SAR)
- Record all petty cash immediately
- Keep receipts for petty cash expenses

### Closing Session

- Count cash multiple times for accuracy
- Investigate discrepancies > 10 SAR
- Document any unusual situations in notes
- Prepare bank deposit before leaving

### Discrepancy Management

- **Over (positive discrepancy)**: More cash than expected
  - Recount to verify
  - Check for unrecorded cash sales
  - Document in notes

- **Short (negative discrepancy)**: Less cash than expected
  - Recount carefully
  - Check for unrecorded cash refunds
  - Check petty cash documentation
  - Report significant shortages to management

---

## Error Scenarios

### Session Already Open

```json
{
  "error": {
    "code": "SESSION_ALREADY_OPEN",
    "message": "An active session already exists for this device",
    "activeSessionId": "sess_xyz789"
  }
}
```

**Resolution:** Close existing session first, or use existing session

### Session Not Found

```json
{
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session not found"
  }
}
```

**Resolution:** Verify session ID is correct

### Session Already Closed

```json
{
  "error": {
    "code": "SESSION_ALREADY_CLOSED",
    "message": "This session is already closed"
  }
}
```

**Resolution:** Session cannot be modified after closing

---

**Related Documentation:**
- [API Overview](./API_OVERVIEW.md)
- [Products API](./PRODUCTS_API.md)
- [Orders API](./ORDERS_API.md)
- [Customers API](./CUSTOMERS_API.md)
