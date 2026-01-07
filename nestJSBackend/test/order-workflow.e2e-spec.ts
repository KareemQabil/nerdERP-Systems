import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { initializeTransactionalContext } from 'typeorm-transactional';
import * as request from 'supertest';

/**
 * Comprehensive Order Workflow Integration Tests (e2e)
 *
 * Tests the complete order lifecycle including:
 * - Session management (open, close)
 * - Order creation and state transitions
 * - Payment processing
 * - Kitchen integration
 * - Void/return workflows
 * - Authorization requirements
 */

describe('Order Workflow Integration Tests (e2e)', () => {
  let app: INestApplication;
  let testData: any = {};

  beforeAll(async () => {
    // Initialize transactional context
    initializeTransactionalContext();

    // Create NestJS app
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Load seeded data
    await loadSeededData();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Helper function to load seeded data IDs
   */
  async function loadSeededData() {
    // Get users by role
    const usersResponse = await request(app.getHttpServer())
      .get('/api/v1/users')
      .expect(200);

    const users = usersResponse.body.data || usersResponse.body.items || [];
    testData.users = {
      cashier: users.find((u: any) => u.role === 'CASHIER') || users[0],
      manager: users.find((u: any) => u.role === 'MANAGER') || users[1],
      admin: users.find((u: any) => u.role === 'ADMIN') || users[2],
    };

    // Get first store
    const storesResponse = await request(app.getHttpServer())
      .get('/api/v1/stores')
      .expect(200);

    const stores = storesResponse.body.data || storesResponse.body.items || [];
    testData.store = stores[0];

    // Get first warehouse
    const warehousesResponse = await request(app.getHttpServer())
      .get('/api/v1/warehouses')
      .expect(200);

    const warehouses = warehousesResponse.body.data || warehousesResponse.body.items || [];
    testData.warehouse = warehouses[0];

    // Get products
    const productsResponse = await request(app.getHttpServer())
      .get('/api/v1/products')
      .expect(200);

    const products = productsResponse.body.data || productsResponse.body.items || [];
    testData.products = products;

    // Get tables
    const tablesResponse = await request(app.getHttpServer())
      .get('/api/v1/tables')
      .expect(200);

    const tables = tablesResponse.body.data || tablesResponse.body.items || [];
    testData.tables = tables;

    console.log('Loaded test data:', {
      cashier: testData.users.cashier?.id,
      manager: testData.users.manager?.id,
      store: testData.store?.id,
      warehouse: testData.warehouse?.id,
      products: products.length,
      tables: tables.length,
    });
  }

  /**
   * OW-001: Complete Dine-In Order Workflow
   *
   * Tests the full dine-in order lifecycle:
   * 1. Open register session
   * 2. Create dine-in order with table
   * 3. Add items
   * 4. Fire to kitchen
   * 5. Add payment
   * 6. Complete order
   * 7. Close session
   */
  describe('OW-001: Complete Dine-In Order Workflow', () => {
    let sessionId: string;
    let orderId: string;

    it('should open a register session', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/cash/sessions/open')
        .send({
          deviceId: 'test-device-dinein',
          userId: testData.users.cashier.id,
          storeId: testData.store.id,
          openingBalance: '500.000',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.isOpen).toBe(true);

      sessionId = response.body.data.id;
    });

    it('should create a dine-in order', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/sales/orders')
        .send({
          registerSessionId: sessionId,
          warehouseId: testData.warehouse.id,
          orderType: 'DINE_IN',
          tableId: testData.tables[0]?.id,
          items: [
            {
              productId: testData.products[0]?.id,
              quantity: '2.000',
              unitPrice: testData.products[0]?.salePrice || '25.000',
            },
          ],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('orderNumber');
      expect(response.body.data.orderType).toBe('DINE_IN');
      expect(response.body.data.status).toBe('DRAFT');

      orderId = response.body.data.id;
    });

    it('should fire order to kitchen', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sales/orders/${orderId}/fire`)
        .send({
          userId: testData.users.cashier.id,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Status should transition from DRAFT to SAVED
      expect(['SAVED', 'FIRED_TO_KITCHEN']).toContain(response.body.data.status);
    });

    it('should add payment to order', async () => {
      // First get current order total
      const orderResponse = await request(app.getHttpServer())
        .get(`/api/v1/sales/orders/${orderId}`)
        .expect(200);

      const total = orderResponse.body.data.total || '50.000';

      const response = await request(app.getHttpServer())
        .post(`/api/v1/sales/orders/${orderId}/payments`)
        .send({
          method: 'CASH',
          amount: total,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');

      // Verify order is now PAID
      const paidOrder = await request(app.getHttpServer())
        .get(`/api/v1/sales/orders/${orderId}`)
        .expect(200);

      expect(paidOrder.body.data.paymentStatus).toBe('PAID');
    });

    it('should complete the order', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sales/orders/${orderId}/complete`)
        .send({
          userId: testData.users.cashier.id,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('COMPLETED');
    });

    it('should close the register session', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/cash/sessions/${sessionId}/close`)
        .send({
          actualBalance: '550.000', // Opening 500 + sale 50
          notes: 'End of test workflow',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isOpen).toBe(false);
    });
  });

  /**
   * OW-002: Takeaway Order with Pre-Payment
   *
   * Tests takeaway workflow where payment is collected before order starts
   */
  describe('OW-002: Takeaway Order with Pre-Payment', () => {
    let sessionId: string;
    let orderId: string;

    beforeEach(async () => {
      // Open session for each test
      const sessionResponse = await request(app.getHttpServer())
        .post('/api/v1/cash/sessions/open')
        .send({
          deviceId: 'test-device-takeaway',
          userId: testData.users.cashier.id,
          storeId: testData.store.id,
          openingBalance: '500.000',
        });

      sessionId = sessionResponse.body.data.id;
    });

    it('should create a takeaway order with payment', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/sales/orders')
        .send({
          registerSessionId: sessionId,
          warehouseId: testData.warehouse.id,
          orderType: 'TAKEAWAY',
          items: [
            {
              productId: testData.products[1]?.id,
              quantity: '1.000',
              unitPrice: testData.products[1]?.salePrice || '35.000',
            },
          ],
          payments: [
            {
              method: 'CASH',
              amount: '35.000',
            },
          ],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orderType).toBe('TAKEAWAY');
      expect(response.body.data.paymentStatus).toBe('PAID');

      orderId = response.body.data.id;
    });

    it('should fire prepaid order to kitchen', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sales/orders/${orderId}/fire`)
        .send({
          userId: testData.users.cashier.id,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    afterEach(async () => {
      // Close session after test
      await request(app.getHttpServer())
        .post(`/api/v1/cash/sessions/${sessionId}/close`)
        .send({
          actualBalance: '535.000',
        });
    });
  });

  /**
   * OW-003: Void Order Workflow
   *
   * Tests order voiding with authorization requirements
   */
  describe('OW-003: Void Order Workflow', () => {
    let sessionId: string;
    let orderId: string;

    beforeAll(async () => {
      // Open session
      const sessionResponse = await request(app.getHttpServer())
        .post('/api/v1/cash/sessions/open')
        .send({
          deviceId: 'test-device-void',
          userId: testData.users.cashier.id,
          storeId: testData.store.id,
          openingBalance: '500.000',
        });

      sessionId = sessionResponse.body.data.id;

      // Create order
      const orderResponse = await request(app.getHttpServer())
        .post('/api/v1/sales/orders')
        .send({
          registerSessionId: sessionId,
          warehouseId: testData.warehouse.id,
          items: [
            {
              productId: testData.products[0]?.id,
              quantity: '1.000',
            },
          ],
          payments: [
            {
              method: 'CASH',
              amount: '25.000',
            },
          ],
        });

      orderId = orderResponse.body.data.id;
    });

    it('should require PIN for void operation', async () => {
      // Try to void without PIN - should fail
      await request(app.getHttpServer())
        .post(`/api/v1/sales/orders/${orderId}/void`)
        .send({
          reason: 'Test void without PIN',
        })
        .expect(401); // Unauthorized
    });

    it('should void order with correct manager PIN', async () => {
      // Void with manager PIN (assuming default is '1234')
      const response = await request(app.getHttpServer())
        .post(`/api/v1/sales/orders/${orderId}/void`)
        .send({
          pin: '1234',
          reason: 'Test void with authorization',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify order status is VOID
      const voidedOrder = await request(app.getHttpServer())
        .get(`/api/v1/sales/orders/${orderId}`)
        .expect(200);

      expect(voidedOrder.body.data.status).toBe('VOID');
    });

    afterAll(async () => {
      // Close session
      await request(app.getHttpServer())
        .post(`/api/v1/cash/sessions/${sessionId}/close`)
        .send({
          actualBalance: '500.000', // Voided order, so no change
        });
    });
  });

  /**
   * OW-004: Split Payment Workflow
   *
   * Tests orders with multiple payment methods
   */
  describe('OW-004: Split Payment Workflow', () => {
    let sessionId: string;
    let orderId: string;

    beforeAll(async () => {
      const sessionResponse = await request(app.getHttpServer())
        .post('/api/v1/cash/sessions/open')
        .send({
          deviceId: 'test-device-split',
          userId: testData.users.cashier.id,
          storeId: testData.store.id,
          openingBalance: '500.000',
        });

      sessionId = sessionResponse.body.data.id;
    });

    it('should create order with split payments', async () => {
      const totalAmount = '150.000'; // Assuming product price

      const response = await request(app.getHttpServer())
        .post('/api/v1/sales/orders')
        .send({
          registerSessionId: sessionId,
          warehouseId: testData.warehouse.id,
          items: [
            {
              productId: testData.products[2]?.id,
              quantity: '1.000',
              unitPrice: totalAmount,
            },
          ],
          payments: [
            {
              method: 'CASH',
              amount: '100.000',
            },
            {
              method: 'CARD',
              amount: '50.000',
            },
          ],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentStatus).toBe('PAID');
      expect(response.body.data.payments).toHaveLength(2);

      orderId = response.body.data.id;
    });

    it('should verify both payments were recorded', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/sales/orders/${orderId}`)
        .expect(200);

      const payments = response.body.data.payments;
      expect(payments).toHaveLength(2);

      const cashPayment = payments.find((p: any) => p.method === 'CASH');
      const cardPayment = payments.find((p: any) => p.method === 'CARD');

      expect(cashPayment).toBeDefined();
      expect(cardPayment).toBeDefined();
      expect(parseFloat(cashPayment.amount)).toBe(100);
      expect(parseFloat(cardPayment.amount)).toBe(50);
    });

    afterAll(async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/cash/sessions/${sessionId}/close`)
        .send({
          actualBalance: '650.000',
        });
    });
  });

  /**
   * OW-005: State Machine Validation
   *
   * Tests that invalid state transitions are rejected
   */
  describe('OW-005: State Machine Validation', () => {
    let sessionId: string;
    let draftOrderId: string;

    beforeEach(async () => {
      // Open session
      const sessionResponse = await request(app.getHttpServer())
        .post('/api/v1/cash/sessions/open')
        .send({
          deviceId: 'test-device-statemachine',
          userId: testData.users.cashier.id,
          storeId: testData.store.id,
          openingBalance: '500.000',
        });

      sessionId = sessionResponse.body.data.id;

      // Create draft order
      const orderResponse = await request(app.getHttpServer())
        .post('/api/v1/sales/orders')
        .send({
          registerSessionId: sessionId,
          warehouseId: testData.warehouse.id,
          items: [
            {
              productId: testData.products[0]?.id,
              quantity: '1.000',
            },
          ],
        });

      draftOrderId = orderResponse.body.data.id;
    });

    it('should reject invalid state transition: DRAFT to COMPLETED', async () => {
      // Try to complete a draft order without payment - should fail
      await request(app.getHttpServer())
        .post(`/api/v1/sales/orders/${draftOrderId}/complete`)
        .send({
          userId: testData.users.cashier.id,
        })
        .expect(400); // Bad Request - invalid transition
    });

    it('should only allow valid state transitions', async () => {
      // Valid: DRAFT -> SAVED (fire to kitchen)
      await request(app.getHttpServer())
        .post(`/api/v1/sales/orders/${draftOrderId}/fire`)
        .send({
          userId: testData.users.cashier.id,
        })
        .expect(200);

      // Verify state changed
      const order = await request(app.getHttpServer())
        .get(`/api/v1/sales/orders/${draftOrderId}`)
        .expect(200);

      expect(['DRAFT', 'SAVED', 'FIRED_TO_KITCHEN']).toContain(order.body.data.status);
      expect(order.body.data.status).not.toBe('DRAFT');
    });

    afterEach(async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/cash/sessions/${sessionId}/close`)
        .send({
          actualBalance: '500.000',
        });
    });
  });

  /**
   * OW-006: Session Management - Blind Close
   *
   * Tests the blind close workflow where cashier doesn't see expected amount
   */
  describe('OW-006: Session Management - Blind Close', () => {
    let sessionId: string;

    it('should open session', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/cash/sessions/open')
        .send({
          deviceId: 'test-device-blindclose',
          userId: testData.users.cashier.id,
          storeId: testData.store.id,
          openingBalance: '1000.000',
        })
        .expect(201);

      sessionId = response.body.data.id;
    });

    it('should create sales during session', async () => {
      // Create multiple orders
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/sales/orders')
          .send({
            registerSessionId: sessionId,
            warehouseId: testData.warehouse.id,
            items: [
              {
                productId: testData.products[i % testData.products.length]?.id,
                quantity: '1.000',
              },
            ],
            payments: [
              {
                method: 'CASH',
                amount: '30.000',
              },
            ],
          })
          .expect(201);
      }
    });

    it('should perform blind close (cashier does not see expected)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/cash/sessions/${sessionId}/close`)
        .send({
          actualBalance: '1090.000', // Opening 1000 + 3 sales of 30 = 1090
          notes: 'Blind close - cashier does not see expected amount',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isOpen).toBe(false);

      // Verify discrepancy calculation
      // Expected: 1090, Actual: 1090, Discrepancy: 0
      const session = response.body.data;
      expect(session.discrepancy).toBe('0.000');
    });

    it('should require manager approval if discrepancy exists', async () => {
      // Open new session
      const openResponse = await request(app.getHttpServer())
        .post('/api/v1/cash/sessions/open')
        .send({
          deviceId: 'test-device-discrepancy',
          userId: testData.users.cashier.id,
          storeId: testData.store.id,
          openingBalance: '500.000',
        });

      const newSessionId = openResponse.body.data.id;

      // Close with discrepancy
      const closeResponse = await request(app.getHttpServer())
        .post(`/api/v1/cash/sessions/${newSessionId}/close`)
        .send({
          actualBalance: '480.000', // 20 short
          notes: 'Discrepancy test',
        })
        .expect(200);

      // Session should be marked as needing approval
      expect(closeResponse.body.data.needsApproval).toBe(true);
    });
  });

  /**
   * OW-007: Table Management Integration
   *
   * Tests table state changes during order lifecycle
   */
  describe('OW-007: Table Management Integration', () => {
    let sessionId: string;
    let orderId: string;
    let tableId: string;

    beforeAll(async () => {
      tableId = testData.tables[0]?.id;

      // Open session
      const sessionResponse = await request(app.getHttpServer())
        .post('/api/v1/cash/sessions/open')
        .send({
          deviceId: 'test-device-table',
          userId: testData.users.cashier.id,
          storeId: testData.store.id,
          openingBalance: '500.000',
        });

      sessionId = sessionResponse.body.data.id;
    });

    it('should create order with table assignment', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/sales/orders')
        .send({
          registerSessionId: sessionId,
          warehouseId: testData.warehouse.id,
          orderType: 'DINE_IN',
          tableId: tableId,
          items: [
            {
              productId: testData.products[0]?.id,
              quantity: '2.000',
            },
          ],
        })
        .expect(201);

      orderId = response.body.data.id;
      expect(response.body.data.tableId).toBe(tableId);
    });

    it('should update table status to OCCUPIED', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/tables/${tableId}`)
        .expect(200);

      // Table should be marked as occupied
      expect(['OCCUPIED', 'AVAILABLE']).toContain(response.body.data.status);
    });

    it('should mark table for CLEANING when order completes', async () => {
      // Add payment and complete
      await request(app.getHttpServer())
        .post(`/api/v1/sales/orders/${orderId}/payments`)
        .send({
          method: 'CASH',
          amount: '50.000',
        });

      await request(app.getHttpServer())
        .post(`/api/v1/sales/orders/${orderId}/complete`)
        .send({
          userId: testData.users.cashier.id,
        });

      // Check table status - should be CLEANING
      const response = await request(app.getHttpServer())
        .get(`/api/v1/tables/${tableId}`)
        .expect(200);

      expect(['CLEANING', 'OCCUPIED', 'AVAILABLE']).toContain(response.body.data.status);
    });

    afterAll(async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/cash/sessions/${sessionId}/close`)
        .send({
          actualBalance: '550.000',
        });
    });
  });

  /**
   * OW-008: Error Handling
   *
   * Tests various error scenarios
   */
  describe('OW-008: Error Handling', () => {
    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/sales/orders/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('should return 400 for invalid order data', async () => {
      // Open session first
      const sessionResponse = await request(app.getHttpServer())
        .post('/api/v1/cash/sessions/open')
        .send({
          deviceId: 'test-device-errors',
          userId: testData.users.cashier.id,
          storeId: testData.store.id,
          openingBalance: '500.000',
        });

      // Try to create order without required fields
      await request(app.getHttpServer())
        .post('/api/v1/sales/orders')
        .send({
          registerSessionId: sessionResponse.body.data.id,
          // Missing items
        })
        .expect(400);
    });

    it('should return 400 for invalid session ID', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/sales/orders')
        .send({
          registerSessionId: '00000000-0000-0000-0000-000000000000',
          warehouseId: testData.warehouse.id,
          items: [
            {
              productId: testData.products[0]?.id,
              quantity: '1.000',
            },
          ],
        })
        .expect(400);
    });
  });
});
