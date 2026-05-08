const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'matteo_nutrition.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    weight_kg REAL DEFAULT 67.3,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch()),
    UNIQUE(user_id)
  );

  CREATE TABLE IF NOT EXISTS whoop_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    recovery_score REAL,
    hrv REAL,
    hrv_baseline REAL,
    strain REAL,
    calories_burned REAL,
    sleep_score REAL,
    deep_sleep_minutes REAL,
    rem_sleep_minutes REAL,
    raw_json TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    hour TEXT,
    recovery_score REAL,
    protocol TEXT,
    prompt TEXT,
    response TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS nutrition_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    meal_key TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    notes TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    age REAL,
    height_cm REAL,
    masa_adiposa_kg REAL,
    masa_adiposa_pct REAL,
    masa_muscular_kg REAL,
    masa_muscular_pct REAL,
    masa_residual_kg REAL,
    masa_osea_kg REAL,
    suma_6_pliegues_mm REAL,
    imc REAL,
    indice_cintura_cadera REAL,
    metabolismo_basal_kcal REAL,
    nivel_actividad REAL,
    gasto_total_kcal REAL,
    report_date TEXT,
    updated_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS training_schedule (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    session_type TEXT NOT NULL DEFAULT 'rest',
    morning_start TEXT,
    morning_duration_min INTEGER,
    afternoon_start TEXT,
    afternoon_duration_min INTEGER,
    PRIMARY KEY(user_id, day_of_week)
  );
`);

module.exports = db;
