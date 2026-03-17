const express = require('express');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get all campaigns with stats
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*,
        ARRAY_AGG(DISTINCT a.id) FILTER (WHERE a.id IS NOT NULL) as audience_ids,
        ARRAY_AGG(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL) as audience_names,
        cr.total_sent, cr.delivered, cr.opens, cr.unique_opens,
        cr.clicks, cr.unique_clicks, cr.bounces, cr.unsubscribes,
        cr.delivery_date,
        CASE WHEN cr.delivered > 0 THEN ROUND((cr.clicks::NUMERIC / cr.delivered) * 100, 2) ELSE 0 END as ctr,
        CASE WHEN cr.delivered > 0 THEN ROUND((cr.opens::NUMERIC / cr.delivered) * 100, 2) ELSE 0 END as open_rate,
        CASE WHEN cr.total_sent > 0 THEN ROUND((cr.bounces::NUMERIC / cr.total_sent) * 100, 2) ELSE 0 END as bounce_rate
      FROM campaigns c
      LEFT JOIN campaign_audiences ca ON c.id = ca.campaign_id
      LEFT JOIN audiences a ON ca.audience_id = a.id
      LEFT JOIN campaign_reports cr ON c.id = cr.campaign_id
      GROUP BY c.id, cr.total_sent, cr.delivered, cr.opens, cr.unique_opens,
        cr.clicks, cr.unique_clicks, cr.bounces, cr.unsubscribes, cr.delivery_date
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single campaign
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*,
        ARRAY_AGG(DISTINCT a.id) FILTER (WHERE a.id IS NOT NULL) as audience_ids,
        ARRAY_AGG(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL) as audience_names,
        cr.*,
        CASE WHEN cr.delivered > 0 THEN ROUND((cr.clicks::NUMERIC / cr.delivered) * 100, 2) ELSE 0 END as ctr,
        CASE WHEN cr.delivered > 0 THEN ROUND((cr.opens::NUMERIC / cr.delivered) * 100, 2) ELSE 0 END as open_rate,
        CASE WHEN cr.total_sent > 0 THEN ROUND((cr.bounces::NUMERIC / cr.total_sent) * 100, 2) ELSE 0 END as bounce_rate
      FROM campaigns c
      LEFT JOIN campaign_audiences ca ON c.id = ca.campaign_id
      LEFT JOIN audiences a ON ca.audience_id = a.id
      LEFT JOIN campaign_reports cr ON c.id = cr.campaign_id
      WHERE c.id = $1
      GROUP BY c.id, cr.id
    `, [req.params.id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Campaign not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create campaign
router.post('/', async (req, res) => {
  const { name, subject, preview_text, from_name, from_email, audience_ids, status, scheduled_at } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const campaign = await client.query(
      `INSERT INTO campaigns (name, subject, preview_text, from_name, from_email, status, scheduled_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, subject, preview_text, from_name, from_email, status || 'draft', scheduled_at || null]
    );
    const c = campaign.rows[0];

    if (audience_ids && audience_ids.length > 0) {
      for (const aid of audience_ids) {
        await client.query('INSERT INTO campaign_audiences (campaign_id, audience_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [c.id, aid]);
      }
    }

    // Init report row
    await client.query('INSERT INTO campaign_reports (campaign_id) VALUES ($1) ON CONFLICT DO NOTHING', [c.id]);

    await client.query('COMMIT');
    res.status(201).json(c);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Update campaign
router.put('/:id', async (req, res) => {
  const { name, subject, preview_text, from_name, from_email, status, scheduled_at, audience_ids } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE campaigns SET name=$1, subject=$2, preview_text=$3, from_name=$4, from_email=$5,
       status=$6, scheduled_at=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [name, subject, preview_text, from_name, from_email, status, scheduled_at || null, req.params.id]
    );

    if (audience_ids !== undefined) {
      await client.query('DELETE FROM campaign_audiences WHERE campaign_id = $1', [req.params.id]);
      for (const aid of audience_ids) {
        await client.query('INSERT INTO campaign_audiences (campaign_id, audience_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, aid]);
      }
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Delete campaign
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM campaigns WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update campaign report/stats
router.put('/:id/report', async (req, res) => {
  const { total_sent, delivered, opens, unique_opens, clicks, unique_clicks, bounces, unsubscribes, spam_reports, delivery_date } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO campaign_reports (campaign_id, total_sent, delivered, opens, unique_opens, clicks, unique_clicks, bounces, unsubscribes, spam_reports, delivery_date, last_updated)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
      ON CONFLICT (campaign_id) DO UPDATE SET
        total_sent=$2, delivered=$3, opens=$4, unique_opens=$5, clicks=$6,
        unique_clicks=$7, bounces=$8, unsubscribes=$9, spam_reports=$10,
        delivery_date=$11, last_updated=NOW()
      RETURNING *
    `, [req.params.id, total_sent, delivered, opens, unique_opens, clicks, unique_clicks, bounces, unsubscribes, spam_reports || 0, delivery_date]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
