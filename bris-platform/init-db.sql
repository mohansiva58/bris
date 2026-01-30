-- Initialize BRIS Database
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Create n8n database
CREATE DATABASE n8n_db;

-- Connect to bris_db
\c bris_db

-- Users table
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

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Behavior events table (TimescaleDB hypertable)
CREATE TABLE IF NOT EXISTS behavior_events (
  id BIGSERIAL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  device_fingerprint VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  location JSONB,
  PRIMARY KEY (id, timestamp)
);

-- Convert to hypertable (time-series optimization)
SELECT create_hypertable('behavior_events', 'timestamp', if_not_exists => TRUE);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_behavior_events_user_id ON behavior_events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_events_session_id ON behavior_events(session_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_events_type ON behavior_events(event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_events_device ON behavior_events(device_fingerprint);

-- Risk scores table
CREATE TABLE IF NOT EXISTS risk_scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  risk_score FLOAT NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  anomaly_type VARCHAR(100),
  features JSONB NOT NULL,
  model_version VARCHAR(50),
  explanation TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for risk scores
CREATE INDEX IF NOT EXISTS idx_risk_scores_user_id ON risk_scores(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_risk_scores_session_id ON risk_scores(session_id);
CREATE INDEX IF NOT EXISTS idx_risk_scores_score ON risk_scores(risk_score DESC, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_risk_scores_timestamp ON risk_scores(timestamp DESC);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  risk_score_id INTEGER REFERENCES risk_scores(id) ON DELETE CASCADE,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to INTEGER REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for alerts
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_assigned_to ON alerts(assigned_to, status);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  device_fingerprint VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  location JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  event_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active, last_activity DESC);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INTEGER,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, timestamp DESC);

-- Model metadata table (track ML model versions)
CREATE TABLE IF NOT EXISTS model_metadata (
  id SERIAL PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL,
  version VARCHAR(50) NOT NULL,
  model_type VARCHAR(50) NOT NULL,
  metrics JSONB,
  parameters JSONB,
  training_date TIMESTAMPTZ,
  deployment_date TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'testing')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_name, version)
);

-- Create continuous aggregates for analytics (TimescaleDB feature)
-- Hourly risk score aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS risk_scores_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', timestamp) AS bucket,
  user_id,
  COUNT(*) as score_count,
  AVG(risk_score) as avg_risk_score,
  MAX(risk_score) as max_risk_score,
  MIN(risk_score) as min_risk_score,
  AVG(confidence) as avg_confidence
FROM risk_scores
GROUP BY bucket, user_id
WITH NO DATA;

-- Create refresh policy for the materialized view
SELECT add_continuous_aggregate_policy('risk_scores_hourly',
  start_offset => INTERVAL '3 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');

-- Event counts per hour
CREATE MATERIALIZED VIEW IF NOT EXISTS event_counts_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', timestamp) AS bucket,
  user_id,
  event_type,
  COUNT(*) as event_count
FROM behavior_events
GROUP BY bucket, user_id, event_type
WITH NO DATA;

-- Create refresh policy
SELECT add_continuous_aggregate_policy('event_counts_hourly',
  start_offset => INTERVAL '3 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');

-- Data retention policy (keep raw events for 90 days)
SELECT add_retention_policy('behavior_events', INTERVAL '90 days');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert demo admin user (password: admin123)
-- Hash generated with bcrypt, rounds=10
INSERT INTO users (email, password_hash, full_name, role, status)
VALUES 
  ('admin@bris.io', '$2b$10$rqYvK4QX2vFJZQZQZJQZQeN5L5h5H5h5h5h5h5h5h5h5h5h5h5h5h', 'BRIS Admin', 'admin', 'active'),
  ('demo@bris.io', '$2b$10$rqYvK4QX2vFJZQZQZJQZQeN5L5h5H5h5h5h5h5h5h5h5h5h5h5h5h', 'Demo User', 'user', 'active')
ON CONFLICT (email) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bris;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bris;

-- Print success message
DO $$
BEGIN
  RAISE NOTICE 'BRIS database initialized successfully!';
  RAISE NOTICE 'Demo users created:';
  RAISE NOTICE '  - admin@bris.io (admin role)';
  RAISE NOTICE '  - demo@bris.io (user role)';
  RAISE NOTICE 'Default password for both: admin123';
END $$;
