const axios = require('axios');
const db = require('../database');

const WHOOP_BASE = 'https://api.prod.whoop.com/developer';
const TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';

function getStoredTokens(userId) {
  return db.prepare('SELECT * FROM tokens WHERE user_id=?').get(userId);
}

function saveTokens(userId, { access_token, refresh_token, expires_in }) {
  const expires_at = Math.floor(Date.now() / 1000) + expires_in;
  const existing = db.prepare('SELECT id FROM tokens WHERE user_id=?').get(userId);
  if (existing) {
    db.prepare(
      'UPDATE tokens SET access_token=?, refresh_token=?, expires_at=?, updated_at=unixepoch() WHERE user_id=?'
    ).run(access_token, refresh_token, expires_at, userId);
  } else {
    db.prepare(
      'INSERT INTO tokens (user_id, access_token, refresh_token, expires_at) VALUES (?,?,?,?)'
    ).run(userId, access_token, refresh_token, expires_at);
  }
}

async function refreshAccessToken(userId) {
  const tokens = getStoredTokens(userId);
  if (!tokens) throw new Error('No tokens stored — authenticate first');

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokens.refresh_token,
    client_id: process.env.WHOOP_CLIENT_ID,
    client_secret: process.env.WHOOP_CLIENT_SECRET,
  });
  const { data } = await axios.post(TOKEN_URL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  saveTokens(userId, data);
  return data.access_token;
}

async function getValidAccessToken(userId) {
  const tokens = getStoredTokens(userId);
  if (!tokens) throw new Error('Whoop no conectado');
  const now = Math.floor(Date.now() / 1000);
  if (tokens.expires_at - now < 120) return refreshAccessToken(userId);
  return tokens.access_token;
}

async function whoopGet(userId, path) {
  const token = await getValidAccessToken(userId);
  const { data } = await axios.get(`${WHOOP_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

async function getTodayRecovery(userId) {
  const data = await whoopGet(userId, '/v1/recovery?limit=1');
  const rec = data.records?.[0];
  if (!rec) return null;
  return {
    recovery_score: rec.score?.recovery_score ?? null,
    hrv: rec.score?.hrv_rmssd_milli ?? null,
    hrv_baseline: rec.score?.user_calibrating ? null : rec.score?.hrv_rmssd_milli,
    resting_hr: rec.score?.resting_heart_rate ?? null,
    spo2: rec.score?.spo2_percentage ?? null,
    cycle_id: rec.cycle_id,
  };
}

async function getTodayCycle(userId) {
  const data = await whoopGet(userId, '/v1/cycle?limit=1');
  const cycle = data.records?.[0];
  if (!cycle) return null;
  return {
    strain: cycle.score?.strain ?? null,
    kilojoule: cycle.score?.kilojoule ?? null,
    calories_burned: cycle.score?.kilojoule ? Math.round(cycle.score.kilojoule / 4.184) : null,
    average_hr: cycle.score?.average_heart_rate ?? null,
    max_hr: cycle.score?.max_heart_rate ?? null,
  };
}

async function getTodaySleep(userId) {
  const data = await whoopGet(userId, '/v1/sleep?limit=1');
  const sleep = data.records?.[0];
  if (!sleep) return null;
  const stages = sleep.score?.stage_summary ?? {};
  return {
    sleep_score: sleep.score?.sleep_performance_percentage ?? null,
    total_sleep_minutes: Math.round((stages.total_in_bed_time_milli ?? 0) / 60000),
    deep_sleep_minutes: Math.round((stages.slow_wave_sleep_duration_milli ?? 0) / 60000),
    rem_sleep_minutes: Math.round((stages.rem_sleep_duration_milli ?? 0) / 60000),
    light_sleep_minutes: Math.round((stages.light_sleep_duration_milli ?? 0) / 60000),
    respiratory_rate: sleep.score?.respiratory_rate ?? null,
  };
}

async function getAllTodayData(userId) {
  const [recovery, cycle, sleep] = await Promise.allSettled([
    getTodayRecovery(userId),
    getTodayCycle(userId),
    getTodaySleep(userId),
  ]);
  return {
    recovery: recovery.status === 'fulfilled' ? recovery.value : null,
    cycle: cycle.status === 'fulfilled' ? cycle.value : null,
    sleep: sleep.status === 'fulfilled' ? sleep.value : null,
    errors: [recovery, cycle, sleep].filter(r => r.status === 'rejected').map(r => r.reason?.message),
  };
}

async function getRecoveryHistory(userId, days = 30) {
  const data = await whoopGet(userId, `/v1/recovery?limit=${days}`);
  return (data.records ?? []).map(r => ({
    date: r.created_at?.split('T')[0],
    recovery_score: r.score?.recovery_score ?? null,
    hrv: r.score?.hrv_rmssd_milli ?? null,
    resting_hr: r.score?.resting_heart_rate ?? null,
  }));
}

module.exports = { saveTokens, getValidAccessToken, getAllTodayData, getRecoveryHistory };
