const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function fix() {
    try {
        const password = 'admin123';
        const hash = await bcrypt.hash(password, 10);

        console.log('🏗️ Fixing admin user...');

        // Ensure table exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255),
                role VARCHAR(50) DEFAULT 'user',
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // Upsert admin
        await pool.query(`
            INSERT INTO users (email, password_hash, full_name, role, status)
            VALUES ('admin@bris.io', $1, 'BRIS Admin', 'admin', 'active')
            ON CONFLICT (email) 
            DO UPDATE SET password_hash = $1, status = 'active'
        `, [hash]);

        console.log('✅ Admin user fixed! Password is: admin123');

        const res = await pool.query('SELECT email, password_hash FROM users WHERE email = $1', ['admin@bris.io']);
        const storedHash = res.rows[0].password_hash;
        const matches = await bcrypt.compare(password, storedHash);
        console.log('🧪 Verification test:', matches ? 'PASSED ✅' : 'FAILED ❌');

        process.exit(0);
    } catch (e) {
        console.error('❌ Error fixing user:', e.message);
        process.exit(1);
    }
}

fix();
