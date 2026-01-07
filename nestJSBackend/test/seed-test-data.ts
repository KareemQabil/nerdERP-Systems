/**
 * Manual seed data script for testing
 *
 * Usage:
 *   npm run seed:test
 *
 * This script calls the comprehensive seed endpoint to populate
 * the test database with sample data for E2E testing.
 */

import * as axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function seedTestData() {
  console.log('Seeding test data...');

  try {
    const response = await axios.default.post(
      `${API_BASE_URL}/api/v1/seed/comprehensive`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 second timeout
      }
    );

    console.log('Seed data response:', response.status);
    console.log('Seeded data:', {
      organizations: response.data.data?.organizations?.length || 0,
      stores: response.data.data?.stores?.length || 0,
      warehouses: response.data.data?.warehouses?.length || 0,
      users: response.data.data?.users?.length || 0,
      products: response.data.data?.products?.length || 0,
      categories: response.data.data?.categories?.length || 0,
      tables: response.data.data?.tables?.length || 0,
      kitchenStations: response.data.data?.kitchenStations?.length || 0,
    });

    console.log('Test data seeded successfully!');
  } catch (error: any) {
    console.error('Failed to seed test data:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

// Run the seed function
seedTestData()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed script error:', error);
    process.exit(1);
  });
