import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { initializeTransactionalContext } from 'typeorm-transactional';
import {
  createTestDataSource,
  resetTestDatabase,
  truncateAllTables,
  closeTestDataSource,
  getTableCount,
} from './test-db';
import { DataSource } from 'typeorm';

/**
 * Enhanced E2E Test Helper
 *
 * Provides comprehensive setup/teardown for backend E2E tests including:
 * - Test database management
 * - Test data seeding
 * - NestJS app lifecycle
 * - HTTP request helpers
 */
export class E2ETestHelper {
  private app: INestApplication | null = null;
  private dataSource: DataSource | null = null;
  private testData: any = null;

  /**
   * One-time setup before all tests
   * Creates test database connection and runs migrations
   */
  async setupOnce(): Promise<void> {
    try {
      // Initialize transactional context for TypeORM
      initializeTransactionalContext();

      // Create test database connection
      this.dataSource = await createTestDataSource();

      // Reset database (drop and recreate schema)
      await resetTestDatabase(this.dataSource);

      console.log('[E2ESetup] One-time setup complete');
    } catch (error) {
      console.error('[E2ESetup] One-time setup failed:', error);
      throw error;
    }
  }

  /**
   * Setup before each test
   * Truncates tables and seeds fresh test data
   */
  async setupEach(): Promise<void> {
    try {
      if (!this.dataSource) {
        throw new Error('[E2ESetup] DataSource not initialized. Call setupOnce() first.');
      }

      // Clean all tables
      await truncateAllTables(this.dataSource);

      // Seed fresh test data
      this.testData = await this.seedTestData();

      // Create NestJS application
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(DataSource)
        .useValue(this.dataSource)
        .compile();

      this.app = moduleFixture.createNestApplication();

      // Set up global validation pipe
      this.app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        })
      );

      // Initialize the app
      await this.app.init();

      console.log('[E2ESetup] Per-test setup complete');
    } catch (error) {
      console.error('[E2ESetup] Per-test setup failed:', error);
      throw error;
    }
  }

  /**
   * Teardown after each test
   * Closes the NestJS application
   */
  async teardownEach(): Promise<void> {
    try {
      if (this.app) {
        await this.app.close();
        this.app = null;
      }
      console.log('[E2ESetup] Per-test teardown complete');
    } catch (error) {
      console.error('[E2ESetup] Per-test teardown failed:', error);
      throw error;
    }
  }

  /**
   * One-time teardown after all tests
   * Closes database connection
   */
  async teardownOnce(): Promise<void> {
    try {
      if (this.dataSource) {
        await closeTestDataSource(this.dataSource);
        this.dataSource = null;
      }
      console.log('[E2ESetup] One-time teardown complete');
    } catch (error) {
      console.error('[E2ESetup] One-time teardown failed:', error);
      throw error;
    }
  }

  /**
   * Seed test data for E2E tests
   * Creates minimal test data: org, store, users, products, tables
   */
  private async seedTestData(): Promise<any> {
    if (!this.dataSource) {
      throw new Error('DataSource not initialized');
    }

    // We'll use the existing seed data services by making HTTP requests
    // This ensures the seed logic is tested as well
    const app = this.getApp();

    try {
      // Trigger seed data via HTTP endpoint
      const seedResponse = await request(app.getHttpServer())
        .post('/api/v1/seed/comprehensive')
        .expect(201);

      const seededData = seedResponse.body.data;

      // Extract key IDs for easy access in tests
      const testData = {
        org: this.extractFirst(seededData?.organizations),
        store: this.extractFirst(seededData?.stores),
        warehouse: this.extractFirst(seededData?.warehouses),
        users: {},
        products: [],
        tables: [],
        categories: [],
      };

      // Get users by role
      if (seededData?.users) {
        for (const user of seededData.users) {
          if (user.role === 'CASHIER') {
            testData.users.cashier = user;
          } else if (user.role === 'MANAGER') {
            testData.users.manager = user;
          } else if (user.role === 'ADMIN') {
            testData.users.admin = user;
          }
        }
      }

      // Get products
      if (seededData?.products) {
        testData.products = seededData.products;
      }

      // Get tables
      if (seededData?.tables) {
        testData.tables = seededData.tables;
      }

      // Get categories
      if (seededData?.categories) {
        testData.categories = seededData.categories;
      }

      console.log('[E2ESetup] Test data seeded:', {
        org: testData.org?.id,
        store: testData.store?.id,
        warehouse: testData.warehouse?.id,
        users: Object.keys(testData.users),
        products: testData.products.length,
        tables: testData.tables.length,
      });

      return testData;
    } catch (error) {
      console.error('[E2ESetup] Failed to seed test data:', error);
      throw error;
    }
  }

  /**
   * Extract first item from array or return undefined
   */
  private extractFirst(data: any[] | undefined): any {
    return Array.isArray(data) && data.length > 0 ? data[0] : undefined;
  }

  /**
   * Get the NestJS application instance
   */
  getApp(): INestApplication {
    if (!this.app) {
      throw new Error('[E2ESetup] App not initialized. Call setupEach() first.');
    }
    return this.app;
  }

  /**
   * Get the HTTP server for making requests
   */
  getHttpServer(): any {
    return this.getApp().getHttpServer();
  }

  /**
   * Get the seeded test data
   */
  getTestData(): any {
    if (!this.testData) {
      throw new Error('[E2ESetup] Test data not available. Call setupEach() first.');
    }
    return this.testData;
  }

  /**
   * Make an authenticated request (if auth is implemented)
   */
  async authenticatedRequest(method: string, path: string, data?: any, token?: string): Promise<request.Test> {
    const req = request(this.getHttpServer())[method.toLowerCase()](path);

    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }

    if (data) {
      req.send(data);
    }

    return req;
  }

  /**
   * Helper to create a register session
   */
  async createSession(userId?: string, openingBalance = '500.000'): Promise<string> {
    const testData = this.getTestData();
    const userIdToUse = userId || testData.users.cashier?.id;

    const response = await request(this.getHttpServer())
      .post('/api/v1/cash/sessions/open')
      .send({
        deviceId: 'test-device-e2e',
        userId: userIdToUse,
        storeId: testData.store?.id,
        openingBalance,
      })
      .expect(201);

    return response.body.data.id;
  }

  /**
   * Helper to create a sales order
   */
  async createOrder(sessionId: string, items: any[], payments?: any[]): Promise<string> {
    const testData = this.getTestData();

    const orderData: any = {
      registerSessionId: sessionId,
      warehouseId: testData.warehouse?.id,
      items,
    };

    if (payments) {
      orderData.payments = payments;
    }

    const response = await request(this.getHttpServer())
      .post('/api/v1/sales/orders')
      .send(orderData)
      .expect(201);

    return response.body.data.id;
  }

  /**
   * Helper to get a product from seeded data
   */
  getProduct(productNameOrIndex: string | number = 0): any {
    const products = this.getTestData().products;

    if (typeof productNameOrIndex === 'number') {
      return products[productNameOrIndex] || products[0];
    }

    return products.find((p: any) =>
      p.name === productNameOrIndex || p.nameAr === productNameOrIndex
    ) || products[0];
  }

  /**
   * Helper to get a user by role
   */
  getUser(role: 'CASHIER' | 'MANAGER' | 'ADMIN'): any {
    return this.getTestData().users[role.toLowerCase()];
  }

  /**
   * Helper to get a table
   */
  getTable(tableNumberOrIndex: string | number = 1): any {
    const tables = this.getTestData().tables;

    if (typeof tableNumberOrIndex === 'number') {
      return tables[tableNumberOrIndex] || tables[0];
    }

    return tables.find((t: any) => t.tableNumber == tableNumberOrIndex) || tables[0];
  }
}

/**
 * Singleton instance for use in tests
 */
let helperInstance: E2ETestHelper | null = null;

export function getE2ETestHelper(): E2ETestHelper {
  if (!helperInstance) {
    helperInstance = new E2ETestHelper();
  }
  return helperInstance;
}

/**
 * Reset the singleton instance (useful between test suites)
 */
export function resetE2ETestHelper(): void {
  helperInstance = null;
}
