import { Client } from 'pg';

async function testConnection() {
    const client = new Client({
        connectionString: 'postgresql://neondb_owner:npg_RiGVCugYd3L0@ep-sweet-grass-agi829mp-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log(' Connected successfully!');

        const result = await client.query('SELECT version()');
        console.log('📊 PostgreSQL version:', result.rows[0].version);

        await client.end();
        console.log('👋 Connection closed');
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();
