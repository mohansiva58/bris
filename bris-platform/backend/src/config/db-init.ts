import { pool } from './database';
import { logger } from '../utils/logger';
import bcrypt from 'bcrypt';

export async function initializeDatabase(): Promise<void> {
    try {
        logger.info('🔍 Initializing database schema...');

        // 1. Users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255),
                role VARCHAR(50) DEFAULT 'user',
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                last_login TIMESTAMPTZ,
                metadata JSONB DEFAULT '{}'::jsonb
            );
        `);

        // 2. Behavior events table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS behavior_events (
                id BIGSERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                session_id VARCHAR(255) NOT NULL,
                event_type VARCHAR(50) NOT NULL,
                event_data JSONB NOT NULL,
                timestamp TIMESTAMPTZ NOT NULL,
                device_fingerprint VARCHAR(255),
                ip_address INET,
                user_agent TEXT
            );
        `);
        // Add location column if missing
        await pool.query('ALTER TABLE behavior_events ADD COLUMN IF NOT EXISTS location JSONB');

        // 3. Risk scores table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS risk_scores (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                session_id VARCHAR(255) NOT NULL,
                risk_score FLOAT NOT NULL,
                confidence FLOAT NOT NULL,
                anomaly_type VARCHAR(100),
                features JSONB NOT NULL,
                explanation TEXT,
                timestamp TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        // Add missing columns to risk_scores
        await pool.query('ALTER TABLE risk_scores ADD COLUMN IF NOT EXISTS model_version VARCHAR(50)');
        await pool.query('ALTER TABLE risk_scores ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()');

        // 4. Alerts table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS alerts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                risk_score_id INTEGER REFERENCES risk_scores(id) ON DELETE CASCADE,
                severity VARCHAR(20) NOT NULL,
                status VARCHAR(20) DEFAULT 'open',
                title VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        // Add missing columns to alerts
        await pool.query('ALTER TABLE alerts ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id)');
        await pool.query('ALTER TABLE alerts ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ');
        await pool.query('ALTER TABLE alerts ADD COLUMN IF NOT EXISTS resolution_notes TEXT');

        logger.info('✅ Database schema verified');

        // Always ensure demo users exist with the correct hash
        const demoPassword = 'admin123';
        const demoHash = await bcrypt.hash(demoPassword, 10);

        await pool.query(`
            INSERT INTO users (email, password_hash, full_name, role, status)
            VALUES 
                ('admin@bris.io', $1, 'BRIS Admin', 'admin', 'active'),
                ('demo@bris.io', $1, 'Demo User', 'user', 'active')
            ON CONFLICT (email) 
            DO UPDATE SET password_hash = EXCLUDED.password_hash;
        `, [demoHash]);

        logger.info('✅ Demo users verified (admin123)');

    } catch (error) {
        logger.error('❌ Database initialization failed', {
            error: (error as Error).message,
            stack: (error as Error).stack
        });
    }
}
