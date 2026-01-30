const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

async function setup() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ DATABASE_URL not found in .env');
        process.exit(1);
    }

    // Extract connection info
    const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!match) {
        console.error('❌ Invalid DATABASE_URL format');
        process.exit(1);
    }

    const [_, user, password, host, port, dbName] = match;

    console.log(`🔍 Attempting to connect to PostgreSQL at ${host}:${port}...`);

    // Connect to 'postgres' database first to create the target one
    const client = new Client({
        user,
        password,
        host,
        port,
        database: 'postgres'
    });

    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL server');

        // Check if DB exists
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);

        if (res.rowCount === 0) {
            console.log(`🏗️  Creating database "${dbName}"...`);
            await client.query(`CREATE DATABASE ${dbName}`);
            console.log(`✅ Database "${dbName}" created successfully`);
        } else {
            console.log(`✅ Database "${dbName}" already exists`);
        }

        await client.end();
        console.log('🚀 Ready to start the backend! Run "npm run dev" in the backend folder.');

    } catch (error) {
        console.error('❌ Failed to setup database');
        console.error(error.message);
        console.log('\n💡 TIPS:');
        console.log('1. Make sure PostgreSQL is installed and running.');
        console.log('2. Check if your password in .env is correct.');
        console.log('3. If you have Docker, run: "docker-compose up -d"');
        process.exit(1);
    }
}

setup();
