const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table (admin)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Audiences table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audiences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        tags TEXT[],
        color VARCHAR(7) DEFAULT '#6366f1',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Audience members
    await client.query(`
      CREATE TABLE IF NOT EXISTS audience_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        audience_id UUID REFERENCES audiences(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active',
        subscribed_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(audience_id, email)
      )
    `);

    // Campaigns table
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        preview_text TEXT,
        from_name VARCHAR(255),
        from_email VARCHAR(255),
        status VARCHAR(20) DEFAULT 'draft',
        scheduled_at TIMESTAMPTZ,
        sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Campaign audiences (many-to-many)
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaign_audiences (
        campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
        audience_id UUID REFERENCES audiences(id) ON DELETE CASCADE,
        PRIMARY KEY (campaign_id, audience_id)
      )
    `);

    // Campaign stats / reports
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaign_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE UNIQUE,
        total_sent INTEGER DEFAULT 0,
        delivered INTEGER DEFAULT 0,
        opens INTEGER DEFAULT 0,
        unique_opens INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        unique_clicks INTEGER DEFAULT 0,
        bounces INTEGER DEFAULT 0,
        unsubscribes INTEGER DEFAULT 0,
        spam_reports INTEGER DEFAULT 0,
        delivery_date TIMESTAMPTZ,
        last_updated TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Weekly report snapshots
    await client.query(`
      CREATE TABLE IF NOT EXISTS weekly_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        week_start DATE NOT NULL,
        week_end DATE NOT NULL,
        audience_id UUID REFERENCES audiences(id) ON DELETE CASCADE,
        campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
        total_sent INTEGER DEFAULT 0,
        delivered INTEGER DEFAULT 0,
        opens INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        bounces INTEGER DEFAULT 0,
        unsubscribes INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(week_start, audience_id, campaign_id)
      )
    `);

    await client.query('COMMIT');

    // Seed admin user if not exists
    const bcrypt = require('bcryptjs');
    const existing = await pool.query("SELECT id FROM users WHERE username = 'admin'");
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash('admin', 12);
      await pool.query(
        "INSERT INTO users (username, password_hash, role) VALUES ('admin', $1, 'admin')",
        [hash]
      );
      console.log('✅ Admin user seeded (username: admin, password: admin)');
    }

    console.log('✅ Database initialized successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ DB init error:', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, initDB };
