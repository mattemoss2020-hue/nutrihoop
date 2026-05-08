const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../database');
const { signToken, requireAuth } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password y name son requeridos' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (email, password_hash, name) VALUES (?,?,?)'
    ).run(email.toLowerCase().trim(), hash, name.trim());

    const token = signToken(result.lastInsertRowid);
    const user = db.prepare('SELECT id, email, name, weight_kg, created_at FROM users WHERE id=?')
      .get(result.lastInsertRowid);
    res.status(201).json({ token, user });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email y password son requeridos' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Email o contraseña incorrectos' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Email o contraseña incorrectos' });

  const token = signToken(user.id);
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, weight_kg: user.weight_kg },
  });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, weight_kg, created_at FROM users WHERE id=?')
    .get(req.userId);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const hasWhoop = !!db.prepare('SELECT id FROM tokens WHERE user_id=?').get(req.userId);
  res.json({ ...user, whoop_connected: hasWhoop });
});

router.patch('/me', requireAuth, (req, res) => {
  const { name, weight_kg } = req.body;
  if (name) db.prepare('UPDATE users SET name=? WHERE id=?').run(name.trim(), req.userId);
  if (weight_kg) db.prepare('UPDATE users SET weight_kg=? WHERE id=?').run(weight_kg, req.userId);
  const user = db.prepare('SELECT id, email, name, weight_kg FROM users WHERE id=?').get(req.userId);
  res.json(user);
});

module.exports = router;
