const router = require('express').Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Parse PDF and extract body composition fields using Claude
router.post('/parse-pdf', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
  try {
    const { text } = await pdfParse(req.file.buffer);

    const message = await claude.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Extraé los siguientes datos de este informe de composición corporal y respondé SOLO con un JSON válido, sin texto extra:

{
  "age": número o null,
  "height_cm": número o null,
  "weight_kg": número o null,
  "masa_adiposa_kg": número o null,
  "masa_adiposa_pct": número o null,
  "masa_muscular_kg": número o null,
  "masa_muscular_pct": número o null,
  "masa_residual_kg": número o null,
  "masa_osea_kg": número o null,
  "suma_6_pliegues_mm": número o null,
  "imc": número o null,
  "indice_cintura_cadera": número o null,
  "metabolismo_basal_kcal": número o null,
  "nivel_actividad": número o null,
  "gasto_total_kcal": número o null,
  "report_date": "YYYY-MM-DD" o null
}

Texto del informe:
${text}`,
      }],
    });

    const raw = message.content[0]?.text ?? '{}';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    res.json({ data: parsed });
  } catch (err) {
    console.error('PDF parse error:', err.message);
    res.status(500).json({ error: 'No se pudo leer el PDF: ' + err.message });
  }
});

// Get profile + schedule
router.get('/', requireAuth, (req, res) => {
  const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id=?').get(req.userId);
  const schedule = db.prepare('SELECT * FROM training_schedule WHERE user_id=? ORDER BY day_of_week').all(req.userId);
  res.json({ profile: profile ?? null, schedule });
});

// Save / update body composition profile
router.post('/body', requireAuth, (req, res) => {
  const {
    age, height_cm, masa_adiposa_kg, masa_adiposa_pct, masa_muscular_kg, masa_muscular_pct,
    masa_residual_kg, masa_osea_kg, suma_6_pliegues_mm, imc, indice_cintura_cadera,
    metabolismo_basal_kcal, nivel_actividad, gasto_total_kcal, report_date,
  } = req.body;

  // Also update weight in users table if provided
  if (req.body.weight_kg) {
    db.prepare('UPDATE users SET weight_kg=? WHERE id=?').run(req.body.weight_kg, req.userId);
  }

  db.prepare(`
    INSERT INTO user_profiles
      (user_id, age, height_cm, masa_adiposa_kg, masa_adiposa_pct, masa_muscular_kg, masa_muscular_pct,
       masa_residual_kg, masa_osea_kg, suma_6_pliegues_mm, imc, indice_cintura_cadera,
       metabolismo_basal_kcal, nivel_actividad, gasto_total_kcal, report_date, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, unixepoch())
    ON CONFLICT(user_id) DO UPDATE SET
      age=excluded.age, height_cm=excluded.height_cm,
      masa_adiposa_kg=excluded.masa_adiposa_kg, masa_adiposa_pct=excluded.masa_adiposa_pct,
      masa_muscular_kg=excluded.masa_muscular_kg, masa_muscular_pct=excluded.masa_muscular_pct,
      masa_residual_kg=excluded.masa_residual_kg, masa_osea_kg=excluded.masa_osea_kg,
      suma_6_pliegues_mm=excluded.suma_6_pliegues_mm, imc=excluded.imc,
      indice_cintura_cadera=excluded.indice_cintura_cadera,
      metabolismo_basal_kcal=excluded.metabolismo_basal_kcal, nivel_actividad=excluded.nivel_actividad,
      gasto_total_kcal=excluded.gasto_total_kcal, report_date=excluded.report_date,
      updated_at=unixepoch()
  `).run(
    req.userId, age, height_cm, masa_adiposa_kg, masa_adiposa_pct, masa_muscular_kg, masa_muscular_pct,
    masa_residual_kg, masa_osea_kg, suma_6_pliegues_mm, imc, indice_cintura_cadera,
    metabolismo_basal_kcal, nivel_actividad, gasto_total_kcal, report_date,
  );

  res.json({ ok: true });
});

// Save training schedule (full week replacement)
router.post('/schedule', requireAuth, (req, res) => {
  const { days } = req.body; // array of 7 objects
  if (!Array.isArray(days) || days.length !== 7) {
    return res.status(400).json({ error: 'Se requieren 7 días' });
  }

  const insert = db.prepare(`
    INSERT INTO training_schedule (user_id, day_of_week, session_type, morning_start, morning_duration_min, afternoon_start, afternoon_duration_min)
    VALUES (?,?,?,?,?,?,?)
    ON CONFLICT(user_id, day_of_week) DO UPDATE SET
      session_type=excluded.session_type,
      morning_start=excluded.morning_start, morning_duration_min=excluded.morning_duration_min,
      afternoon_start=excluded.afternoon_start, afternoon_duration_min=excluded.afternoon_duration_min
  `);

  const saveAll = db.transaction((days) => {
    for (const d of days) {
      insert.run(
        req.userId, d.day_of_week, d.session_type,
        d.morning_start || null, d.morning_duration_min || null,
        d.afternoon_start || null, d.afternoon_duration_min || null,
      );
    }
  });

  saveAll(days);
  res.json({ ok: true });
});

module.exports = router;
