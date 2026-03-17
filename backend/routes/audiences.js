const express = require('express');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get all audiences with member counts
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, 
        COUNT(DISTINCT am.id) FILTER (WHERE am.status = 'active') as member_count,
        COUNT(DISTINCT am.id) as total_members
      FROM audiences a
      LEFT JOIN audience_members am ON a.id = am.audience_id
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single audience
router.get('/:id', async (req, res) => {
  try {
    const audience = await pool.query('SELECT * FROM audiences WHERE id = $1', [req.params.id]);
    if (!audience.rows.length) return res.status(404).json({ error: 'Audience not found' });

    const members = await pool.query(
      'SELECT * FROM audience_members WHERE audience_id = $1 ORDER BY subscribed_at DESC',
      [req.params.id]
    );
    res.json({ ...audience.rows[0], members: members.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create audience
router.post('/', async (req, res) => {
  const { name, description, tags, color, members } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const audience = await client.query(
      'INSERT INTO audiences (name, description, tags, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, tags || [], color || '#6366f1']
    );
    const aud = audience.rows[0];

    if (members && members.length > 0) {
      for (const m of members) {
        await client.query(
          'INSERT INTO audience_members (audience_id, email, first_name, last_name) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
          [aud.id, m.email, m.first_name || '', m.last_name || '']
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json(aud);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Update audience
router.put('/:id', async (req, res) => {
  const { name, description, tags, color } = req.body;
  try {
    const result = await pool.query(
      'UPDATE audiences SET name=$1, description=$2, tags=$3, color=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
      [name, description, tags || [], color, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete audience
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM audiences WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add members to audience
router.post('/:id/members', async (req, res) => {
  const { members } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let added = 0;
    for (const m of members) {
      const r = await client.query(
        'INSERT INTO audience_members (audience_id, email, first_name, last_name) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING id',
        [req.params.id, m.email, m.first_name || '', m.last_name || '']
      );
      if (r.rows.length) added++;
    }
    await client.query('COMMIT');
    res.json({ added, total: members.length });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Remove member
router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    await pool.query('DELETE FROM audience_members WHERE id = $1 AND audience_id = $2', [req.params.memberId, req.params.id]);
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
