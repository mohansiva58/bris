const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres123@localhost:5432/bris' });
async function check() {
    try {
        const res = await pool.query('SELECT NOW() as now, COUNT(*) as total FROM behavior_events');
        const recent = await pool.query('SELECT timestamp FROM behavior_events ORDER BY timestamp DESC LIMIT 1');
        console.log('DB_NOW:', res.rows[0].now);
        console.log('TOTAL_EVENTS:', res.rows[0].total);
        if (recent.rows.length > 0) console.log('LATEST_EVENT:', recent.rows[0].timestamp);

        const active = await pool.query("SELECT COUNT(DISTINCT user_id) FROM behavior_events WHERE timestamp > NOW() - INTERVAL '30 minutes'");
        console.log('ACTIVE_30M:', active.rows[0].count);

        const today = await pool.query("SELECT COUNT(*) FROM behavior_events WHERE timestamp::date = CURRENT_DATE");
        console.log('EVENTS_TODAY:', today.rows[0].count);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
