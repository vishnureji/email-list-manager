const express = require('express');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Weekly report - campaigns grouped by audience for a given week
router.get('/weekly', async (req, res) => {
  const { week_start, audience_id } = req.query;
  try {
    let query = `
      SELECT 
        c.id as campaign_id,
        c.name as campaign_name,
        c.subject,
        c.status,
        a.id as audience_id,
        a.name as audience_name,
        a.color as audience_color,
        cr.total_sent,
        cr.delivered,
        cr.opens,
        cr.unique_opens,
        cr.clicks,
        cr.unique_clicks,
        cr.bounces,
        cr.unsubscribes,
        cr.delivery_date,
        CASE WHEN cr.delivered > 0 THEN ROUND((cr.clicks::NUMERIC / cr.delivered) * 100, 2) ELSE 0 END as ctr,
        CASE WHEN cr.delivered > 0 THEN ROUND((cr.opens::NUMERIC / cr.delivered) * 100, 2) ELSE 0 END as open_rate,
        CASE WHEN cr.total_sent > 0 THEN ROUND((cr.bounces::NUMERIC / cr.total_sent) * 100, 2) ELSE 0 END as bounce_rate
      FROM campaigns c
      JOIN campaign_audiences ca ON c.id = ca.campaign_id
      JOIN audiences a ON ca.audience_id = a.id
      LEFT JOIN campaign_reports cr ON c.id = cr.campaign_id
      WHERE 1=1
    `;
    const params = [];

    if (week_start) {
      params.push(week_start);
      query += ` AND cr.delivery_date >= $${params.length}`;
      params.push(new Date(new Date(week_start).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString());
      query += ` AND cr.delivery_date < $${params.length}`;
    }

    if (audience_id) {
      params.push(audience_id);
      query += ` AND a.id = $${params.length}`;
    }

    query += ' ORDER BY cr.delivery_date DESC NULLS LAST, c.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Campaign comparison
router.get('/compare', async (req, res) => {
  const { campaign_ids } = req.query;
  if (!campaign_ids) return res.status(400).json({ error: 'campaign_ids required' });

  const ids = campaign_ids.split(',');
  try {
    const result = await pool.query(`
      SELECT 
        c.id, c.name, c.subject, c.status, c.sent_at,
        ARRAY_AGG(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL) as audience_names,
        cr.total_sent, cr.delivered, cr.opens, cr.unique_opens,
        cr.clicks, cr.unique_clicks, cr.bounces, cr.unsubscribes,
        cr.delivery_date,
        CASE WHEN cr.delivered > 0 THEN ROUND((cr.clicks::NUMERIC / cr.delivered) * 100, 2) ELSE 0 END as ctr,
        CASE WHEN cr.delivered > 0 THEN ROUND((cr.opens::NUMERIC / cr.delivered) * 100, 2) ELSE 0 END as open_rate,
        CASE WHEN cr.total_sent > 0 THEN ROUND((cr.bounces::NUMERIC / cr.total_sent) * 100, 2) ELSE 0 END as bounce_rate,
        CASE WHEN cr.delivered > 0 THEN ROUND((cr.unsubscribes::NUMERIC / cr.delivered) * 100, 2) ELSE 0 END as unsub_rate
      FROM campaigns c
      LEFT JOIN campaign_audiences ca ON c.id = ca.campaign_id
      LEFT JOIN audiences a ON ca.audience_id = a.id
      LEFT JOIN campaign_reports cr ON c.id = cr.campaign_id
      WHERE c.id = ANY($1::uuid[])
      GROUP BY c.id, cr.id
      ORDER BY cr.delivery_date DESC NULLS LAST
    `, [ids]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Overall dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const [campaigns, audiences, stats, recentCampaigns] = await Promise.all([
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='sent') as sent FROM campaigns"),
      pool.query('SELECT COUNT(*) as total FROM audiences'),
      pool.query(`
        SELECT 
          SUM(total_sent) as total_sent,
          SUM(delivered) as total_delivered,
          SUM(opens) as total_opens,
          SUM(clicks) as total_clicks,
          SUM(bounces) as total_bounces,
          SUM(unsubscribes) as total_unsubscribes,
          CASE WHEN SUM(delivered) > 0 THEN ROUND((SUM(clicks)::NUMERIC / SUM(delivered)) * 100, 2) ELSE 0 END as avg_ctr,
          CASE WHEN SUM(delivered) > 0 THEN ROUND((SUM(opens)::NUMERIC / SUM(delivered)) * 100, 2) ELSE 0 END as avg_open_rate
        FROM campaign_reports
      `),
      pool.query(`
        SELECT c.name, c.status, cr.total_sent, cr.delivered, cr.opens, cr.clicks, cr.bounces,
          CASE WHEN cr.delivered > 0 THEN ROUND((cr.clicks::NUMERIC / cr.delivered) * 100, 2) ELSE 0 END as ctr,
          cr.delivery_date
        FROM campaigns c
        LEFT JOIN campaign_reports cr ON c.id = cr.campaign_id
        ORDER BY c.created_at DESC LIMIT 5
      `)
    ]);

    res.json({
      campaigns: campaigns.rows[0],
      audiences: audiences.rows[0],
      stats: stats.rows[0],
      recent_campaigns: recentCampaigns.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
