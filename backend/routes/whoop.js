const router = require('express').Router();
const db = require('../database');
const whoopService = require('../services/whoopService');
const { requireAuth } = require('../middleware/auth');
const { getProtocol, getTrainingType, generateAlerts } = require('../services/nutritionEngine');

router.get('/today', requireAuth, async (req, res) => {
  try {
    const data = await whoopService.getAllTodayData(req.userId);
    const recovery_score = data.recovery?.recovery_score ?? null;
    const protocol = getProtocol(recovery_score ?? 50);
    const trainingType = getTrainingType(new Date().toISOString());
    const alerts = generateAlerts({
      recovery_score,
      hrv: data.recovery?.hrv,
      hrv_baseline: 65,
      strain: data.cycle?.strain,
      deep_sleep_minutes: data.sleep?.deep_sleep_minutes,
    });

    if (recovery_score !== null) {
      const today = new Date().toISOString().split('T')[0];
      db.prepare(`
        INSERT OR REPLACE INTO whoop_snapshots
          (user_id, date, recovery_score, hrv, hrv_baseline, strain, calories_burned,
           sleep_score, deep_sleep_minutes, rem_sleep_minutes, raw_json)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
      `).run(req.userId, today, recovery_score, data.recovery?.hrv, 65,
        data.cycle?.strain, data.cycle?.calories_burned,
        data.sleep?.sleep_score, data.sleep?.deep_sleep_minutes,
        data.sleep?.rem_sleep_minutes, JSON.stringify(data));
    }

    res.json({ ...data, protocol, trainingType, alerts });
  } catch (err) {
    console.error('Whoop today error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', requireAuth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const history = await whoopService.getRecoveryHistory(req.userId, days);
    res.json({ history });
  } catch (err) {
    const rows = db.prepare(
      'SELECT date, recovery_score, hrv, strain FROM whoop_snapshots WHERE user_id=? ORDER BY date DESC LIMIT ?'
    ).all(req.userId, parseInt(req.query.days) || 30);
    res.json({ history: rows, cached: true });
  }
});

router.get('/cache', requireAuth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const row = db.prepare('SELECT * FROM whoop_snapshots WHERE user_id=? AND date=?').get(req.userId, today);
  if (!row) return res.json({ cached: false });
  const raw = row.raw_json ? JSON.parse(row.raw_json) : {};
  const protocol = getProtocol(row.recovery_score ?? 50);
  const trainingType = getTrainingType(new Date().toISOString());
  const alerts = generateAlerts({
    recovery_score: row.recovery_score,
    hrv: row.hrv,
    hrv_baseline: 65,
    strain: row.strain,
    deep_sleep_minutes: row.deep_sleep_minutes,
  });
  res.json({ ...raw, protocol, trainingType, alerts, cached: true });
});

module.exports = router;
