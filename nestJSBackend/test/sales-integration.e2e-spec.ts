import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { initializeTransactionalContext } from 'typeorm-transactional';
import * as request from 'supertest';

describe('Sales Order Integration Tests (e2e)', () => {
    let app: INestApplication;
    let sessionId: string;
    let userId: string;
    let storeId: string;
    let warehouseId: string;
    let productId: string;
    let tableId: string;

    beforeAll(async () => {
        // Initialize transactional context
        initializeTransactionalContext();

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Query seeded data to get real IDs
        await loadSeededData();
    });

    afterAll(async () => {
        await app.close();
    });

    /**
     * Helper function to load seeded data IDs
     */
    async function loadSeededData() {
        // Get first user
        const usersResponse = await request(app.getHttpServer())
            .get('/api/v1/users')
            .expect(200);
        userId = usersResponse.body.data[0]?.id || usersResponse.body.items[0]?.id;

        // Get first store
        const storesResponse = await request(app.getHttpServer())
            .get('/api/v1/stores')
            .expect(200);
        storeId = storesResponse.body.data[0]?.id || storesResponse.body.items[0]?.id;

        // Get first warehouse
        const warehousesResponse = await request(app.getHttpServer())
            .get('/api/v1/warehouses')
            .expect(200);
        warehouseId = warehousesResponse.body.data[0]?.id || warehousesResponse.body.items[0]?.id;

        // Get first product
        const productsResponse = await request(app.getHttpServer())
            .get('/api/v1/products')
            .expect(200);
        productId = productsResponse.body.data[0]?.id || productsResponse.body.items[0]?.id;

        // Get first table
        const tablesResponse = await request(app.getHttpServer())
            .get('/api/v1/tables')
            .expect(200);
        tableId = tablesResponse.body.data[0]?.id || tablesResponse.body.items[0]?.id;

        console.log('Loaded seeded data:', {
            userId,
            storeId,
            warehouseId,
            productId,
            tableId,
        });
    }

    describe('Test 1: Register Session Workflow', () => {
        it('should open a register session', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/v1/cash/sessions/open')
                .send({
                    deviceId: userId, // Use userId as deviceId for simplicity
                    userId: userId,
                    storeId: storeId,
                    openingBalance: '500.000',
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.isOpen).toBe(true);
            expect(response.body.data.openingBalance).toBe('500.000');

            sessionId = response.body.data.id;
        });

        it('should get register session details', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/v1/cash/sessions/${sessionId}`)
                .expect(200);

            expect(response.body.data.id).toBe(sessionId);
            expect(response.body.data.isOpen).toBe(true);
        });

        it('should close register session', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/v1/cash/sessions/${sessionId}/close`)
                .send({
                    actualBalance: '500.000',
                    notes: 'Integration test session closed',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isOpen).toBe(false);
        });
    });

    describe('Test 2: Sales Order Creation', () => {
        let testSessionId: string;

        beforeAll(async () => {
            // Open a new session for sales tests
            const sessionResponse = await request(app.getHttpServer())
                .post('/api/v1/cash/sessions/open')
                .send({
                    deviceId: userId,
                    userId: userId,
                    storeId: storeId,
                    openingBalance: '1000.000',
                });

            testSessionId = sessionResponse.body.data.id;
        });

        it('should create a sales order', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/v1/sales/orders')
                .send({
                    registerSessionId: testSessionId,
                    warehouseId: warehouseId,
                    items: [
                        {
                            productId: productId,
                            quantity: '1.000',
                            unitPrice: '50.000',
                        },
                    ],
                    payments: [
                        {
                            method: 'CASH',
                            amount: '50.000',
                        },
                    ],
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('orderNumber');
            expect(response.body.data.status).toBeDefined();
        });

        afterAll(async () => {
            // Close the test session
            await request(app.getHttpServer())
                .post(`/api/v1/cash/sessions/${testSessionId}/close`)
                .send({
                    actualBalance: '1050.000',
                });
        });
    });

    describe('Test 3: Table Management', () => {
        it('should get all tables', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/tables')
                .expect(200);

            expect(response.body.data || response.body.items).toBeDefined();
            expect(Array.isArray(response.body.data || response.body.items)).toBe(true);
        });

        it('should get table by id', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/v1/tables/${tableId}`)
                .expect(200);

            expect(response.body.data.id).toBe(tableId);
            expect(response.body.data.status).toBeDefined();
        });
    });

    describe('Test 4: Error Handling', () => {
        it('should return 400 when creating order without valid session', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/v1/sales/orders')
                .send({
                    registerSessionId: '00000000-0000-0000-0000-000000000000',
                    warehouseId: warehouseId,
                    items: [
                        {
                            productId: productId,
                            quantity: '1.000',
                            unitPrice: '35.000',
                        },
                    ],
                    payments: [{ method: 'CASH', amount: '35.000' }],
                })
                .expect(400);

            // Should have error code related to session
            expect(response.body.error).toBeDefined();
        });
    });

    describe('Test 5: Kitchen Module', () => {
        it('should get all kitchen stations', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/kitchen/stations')
                .expect(200);

            expect(response.body.data || response.body.items).toBeDefined();
        });
    });
});
