const router = require('express').Router();
const axios = require('axios');
const { saveTokens } = require('../services/whoopService');
const { requireAuth } = require('../middleware/auth');

const TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';

// Allow token via query param for browser redirects (OAuth initiation)
function requireAuthOrQuery(req, res, next) {
  if (req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  return requireAuth(req, res, next);
}

// User must be logged in to connect Whoop
router.get('/whoop', requireAuthOrQuery, (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.WHOOP_CLIENT_ID,
    redirect_uri: process.env.WHOOP_REDIRECT_URI,
    response_type: 'code',
    scope: 'read:recovery read:cycles read:sleep read:workout read:body_measurement offline',
    state: String(req.userId), // pass userId through OAuth state
  });
  res.redirect(`https://api.prod.whoop.com/oauth/oauth2/auth?${params}`);
});

router.get('/callback', async (req, res) => {
  const { code, error, state } = req.query;
  if (error || !code) return res.redirect('/?auth=error');

  const userId = parseInt(state, 10);
  if (!userId || isNaN(userId)) return res.redirect('/?auth=error');

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.WHOOP_CLIENT_ID,
      client_secret: process.env.WHOOP_CLIENT_SECRET,
      redirect_uri: process.env.WHOOP_REDIRECT_URI,
    });
    const { data } = await axios.post(TOKEN_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    saveTokens(userId, data);
    res.redirect('/?auth=success');
  } catch (err) {
    console.error('Auth callback error:', err.response?.data || err.message);
    res.redirect('/?auth=error');
  }
});

router.get('/whoop-status', requireAuth, (req, res) => {
  const db = require('../database');
  const tokens = db.prepare('SELECT expires_at, updated_at FROM tokens WHERE user_id=?').get(req.userId);
  if (!tokens) return res.json({ connected: false });
  const now = Math.floor(Date.now() / 1000);
  res.json({
    connected: true,
    expires_in: tokens.expires_at - now,
    updated_at: new Date(tokens.updated_at * 1000).toISOString(),
  });
});

router.post('/whoop-disconnect', requireAuth, (req, res) => {
  const db = require('../database');
  db.prepare('DELETE FROM tokens WHERE user_id=?').run(req.userId);
  res.json({ ok: true });
});

module.exports = router;
