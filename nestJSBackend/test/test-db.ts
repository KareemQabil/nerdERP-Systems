import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * Database configuration for E2E testing
 *
 * Uses a separate test database to ensure isolation from development data
 */

/**
 * Get test database connection options
 * Falls back to TEST_DATABASE_URL env var or defaults to a test database
 */
export function getTestDataSourceOptions(): DataSourceOptions {
  const testDbUrl = process.env.TEST_DATABASE_URL ||
                    process.env.DATABASE_URL ||
                    'postgresql://postgres:postgres@localhost:5432/nerdpos_test';

  return {
    type: 'postgres',
    url: testDbUrl,
    entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
    synchronize: true, // Auto-create schema for tests
    logging: false, // Disable SQL logging in tests for speed
    ssl: testDbUrl.includes('neon') || testDbUrl.includes('ssl') ? {
      rejectUnauthorized: false,
    } : undefined,
  };
}

/**
 * Create and initialize a test database connection
 *
 * @returns Initialized DataSource
 */
export async function createTestDataSource(): Promise<DataSource> {
  const options = getTestDataSourceOptions();
  const dataSource = new DataSource(options);

  try {
    await dataSource.initialize();
    console.log('[TestDB] Test database connection established');
    return dataSource;
  } catch (error) {
    console.error('[TestDB] Failed to connect to test database:', error);
    throw error;
  }
}

/**
 * Drop all tables and recreate schema
 *
 * WARNING: This will delete all data in the test database
 *
 * @param dataSource - TypeORM DataSource
 */
export async function resetTestDatabase(dataSource: DataSource): Promise<void> {
  try {
    // Drop all tables
    await dataSource.dropDatabase();
    console.log('[TestDB] Dropped all tables');

    // Synchronize to recreate schema
    await dataSource.synchronize();
    console.log('[TestDB] Recreated schema');
  } catch (error) {
    console.error('[TestDB] Failed to reset database:', error);
    throw error;
  }
}

/**
 * Truncate all tables in correct order (respecting foreign keys)
 *
 * This is faster than dropping/recreating the schema
 *
 * @param dataSource - TypeORM DataSource
 */
export async function truncateAllTables(dataSource: DataSource): Promise<void> {
  // Order matters - truncate child tables before parent tables
  const tablesToTruncate = [
    // Sales and payments (depend on many things)
    'payment',
    'order_state_history',
    'order_item',
    'sales_order',

    // Kitchen
    'kitchen_ticket',

    // Inventory movements
    'stock_movement',
    'stock_reservation',
    'batch_expiry',

    // Session management
    'register_handover',
    'register_session',

    // Tables and reservations
    'reservation',

    // Products and inventory
    'product_variant',
    'modifier_option',
    'modifier',
    'product',
    'product_category',

    // Organization
    'tax_definition',
    'tax_profile',
    'warehouse',
    'store',
    'organization',

    // Users and devices
    'pin_attempt',
    'device',
    'audit_log',
    'user_role',
    'user',

    // Other
    'customer',
    'kitchen_station',
    'table_zone',
    'table',
    'print_job',
    'payment_method',
  ];

  try {
    // Disable foreign key checks temporarily
    await dataSource.query('SET CONSTRAINTS ALL DEFERRED');

    // Truncate each table
    for (const table of tablesToTruncate) {
      try {
        await dataSource.query(`TRUNCATE TABLE "${table}" CASCADE`);
      } catch (error: any) {
        // Table might not exist, log and continue
        if (!error.message.includes('does not exist')) {
          console.warn(`[TestDB] Warning truncating ${table}:`, error.message);
        }
      }
    }

    console.log('[TestDB] Truncated all tables');
  } catch (error) {
    console.error('[TestDB] Failed to truncate tables:', error);
    throw error;
  }
}

/**
 * Clean up and close test database connection
 *
 * @param dataSource - TypeORM DataSource
 */
export async function closeTestDataSource(dataSource: DataSource): Promise<void> {
  try {
    await dataSource.destroy();
    console.log('[TestDB] Test database connection closed');
  } catch (error) {
    console.error('[TestDB] Failed to close database connection:', error);
    throw error;
  }
}

/**
 * Run SQL query directly
 *
 * @param dataSource - TypeORM DataSource
 * @param sql - SQL query to execute
 * @returns Query result
 */
export async function runQuery(dataSource: DataSource, sql: string): Promise<any> {
  return await dataSource.query(sql);
}

/**
 * Check if a table has any records
 *
 * @param dataSource - TypeORM DataSource
 * @param tableName - Name of the table
 * @returns True if table has records
 */
export async function tableHasRecords(
  dataSource: DataSource,
  tableName: string
): Promise<boolean> {
  try {
    const result = await dataSource.query(
      `SELECT COUNT(*) as count FROM "${tableName}"`
    );
    return parseInt(result[0]?.count || '0') > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get count of records in a table
 *
 * @param dataSource - TypeORM DataSource
 * @param tableName - Name of the table
 * @returns Number of records
 */
export async function getTableCount(
  dataSource: DataSource,
  tableName: string
): Promise<number> {
  try {
    const result = await dataSource.query(
      `SELECT COUNT(*) as count FROM "${tableName}"`
    );
    return parseInt(result[0]?.count || '0');
  } catch (error) {
    return 0;
  }
}
