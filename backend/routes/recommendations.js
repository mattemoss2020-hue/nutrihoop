const router = require('express').Router();
const db = require('../database');
const claudeService = require('../services/claudeService');
const whoopService = require('../services/whoopService');
const { requireAuth } = require('../middleware/auth');
const { getProtocol, getTrainingType } = require('../services/nutritionEngine');

async function buildContext(userId) {
  let data;
  try {
    data = await whoopService.getAllTodayData(userId);
  } catch {
    const today = new Date().toISOString().split('T')[0];
    const row = db.prepare('SELECT * FROM whoop_snapshots WHERE user_id=? AND date=?').get(userId, today);
    data = row ? {
      recovery: { recovery_score: row.recovery_score, hrv: row.hrv },
      cycle: { strain: row.strain, calories_burned: row.calories_burned },
      sleep: { sleep_score: row.sleep_score, deep_sleep_minutes: row.deep_sleep_minutes, rem_sleep_minutes: row.rem_sleep_minutes },
    } : { recovery: null, cycle: null, sleep: null };
  }
  const recovery_score = data.recovery?.recovery_score ?? 50;
  const protocol = getProtocol(recovery_score);
  const trainingType = getTrainingType(new Date().toISOString());
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  return { ...data, protocol, trainingType, currentTime, recovery_score };
}

router.post('/now', requireAuth, async (req, res) => {
  try {
    const context = await buildContext(req.userId);
    const result = await claudeService.getRecommendation(context);
    const today = new Date().toISOString().split('T')[0];
    db.prepare(
      'INSERT INTO recommendations (user_id, date, hour, recovery_score, protocol, prompt, response) VALUES (?,?,?,?,?,?,?)'
    ).run(req.userId, today, context.currentTime, context.recovery_score, context.protocol.label, result.prompt, result.text);
    res.json({ recommendation: result.text, context: { protocol: context.protocol, trainingType: context.trainingType } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/chat', requireAuth, async (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: 'messages required' });
  try {
    const context = await buildContext(req.userId);
    const reply = await claudeService.getChatResponse(messages, context);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
