require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: ['http://localhost:5174', 'http://localhost:5173'], credentials: true }));
app.use(express.json());

// Rate limit auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/auth',      require('./routes/auth'));
app.use('/api/whoop', require('./routes/whoop'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/profile', require('./routes/profile'));

// Token auto-refresh every 14 min for all connected users
const db = require('./database');
const whoopService = require('./services/whoopService');
setInterval(async () => {
  const users = db.prepare('SELECT DISTINCT user_id FROM tokens').all();
  for (const { user_id } of users) {
    try { await whoopService.getValidAccessToken(user_id); }
    catch { /* token not yet stored or expired */ }
  }
}, 14 * 60 * 1000);

app.get('/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.listen(PORT, () => console.log(`🎾 Nutrition Backend → http://localhost:${PORT}`));
