import { useState, useEffect } from 'react';

const MATCH_KEY = () => `match_${new Date().toISOString().split('T')[0]}`;

const SURFACES = [
  { key: 'clay',   label: 'Arcilla',  icon: '🧱', sweat: 700 },
  { key: 'hard',   label: 'Cemento',  icon: '⬜', sweat: 580 },
  { key: 'grass',  label: 'Césped',   icon: '🟩', sweat: 500 },
  { key: 'indoor', label: 'Indoor',   icon: '🏟️', sweat: 450 },
];

function toMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function addMin(t, mins) {
  const total = toMin(t) + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`;
}

// ─── PRE steps ───────────────────────────────────────────────
function buildPreSteps(matchTime, recovery, strain, sleepScore) {
  const steps = [];
  const add = (offset, emoji, title, what) =>
    steps.push({ time: addMin(matchTime, offset), emoji, title, what });

  add(-120, '🍚', 'Última comida sólida', 'Arroz 120g + pollo 160g + batata. Sin mucha fibra.');
  add(-75,  '💧', 'Hidratación activa',   '500ml isotónico. Orina amarillo pálido = bien.');
  add(-45,  '🍌', 'Carbos rápidos',       'Banana + 30ml miel o gel energético (~45g CHO).');
  add(-20,  '⚡', 'Listo para entrar',
    sleepScore < 70
      ? 'Dátil o gomita + 200ml agua. Sueño regular: considerá ½ café.'
      : 'Dátil o gomita + 200ml agua. Calentá hombros y core.');
  add(0, '🎾', 'ARRANQUE',
    recovery >= 67 ? '2 botellas listas. Recovery alto: podés ir a tope desde el primer game.'
    : recovery >= 33 ? '2 botellas listas. Recovery medio: primeros 3 games conservador.'
    : '2 botellas listas. Recovery bajo: primer set defensivo, gestioná energía.');

  return steps;
}

// ─── DURANTE blocks ──────────────────────────────────────────
function buildDuranteBlocks(sweatPer30) {
  return [
    { range: 'Min 0 – 30',    color: '#10b981', drink: `~${sweatPer30}ml isotónico`,        eat: 'Nada todavía' },
    { range: 'Cambio de set', color: '#f59e0b', drink: '250ml isotónico',                    eat: 'Banana ½ o gel', highlight: true },
    { range: 'Min 30 – 60',   color: '#3b82f6', drink: `150ml cada cambio impar`,            eat: '1 dátil cada 45 min' },
    { range: 'Cambio de set', color: '#f59e0b', drink: '250ml isotónico',                    eat: 'Banana ½ o gel', highlight: true },
    { range: 'Min 60 – 90',   color: '#8b5cf6', drink: `200ml cada cambio`,                  eat: 'Gel si lo tenés' },
    { range: '3er set / TB',  color: '#ef4444', drink: '300ml en el break',                  eat: 'Banana + gel cafeína', highlight: true },
  ];
}

// ─── POST steps ──────────────────────────────────────────────
function buildPostSteps(caloriesBurned, matchType) {
  return [
    { time: '0 – 10 min',  emoji: '💧', title: 'Hidratate',        what: '500–600ml isotónico. Seguí moviéndote.' },
    { time: '10 – 30 min', emoji: '🥤', title: 'Ventana anabólica', what: 'Whey 30g + banana o 50g arroz. No esperes.' },
    { time: '30 – 60 min', emoji: '💦', title: 'Seguí bebiendo',    what: 'Objetivo: 150% de lo perdido. Isotónico o agua + sal.' },
    { time: '1 – 2 h',     emoji: '🍽️', title: 'Comida completa',   what: 'Salmón o pollo 180g + arroz 150g + batata + brócoli.' },
    { time: 'Antes de dormir', emoji: '🌙', title: 'Colación',
      what: matchType === 'torneo'
        ? 'Yogur griego 250g + avena 40g + miel. 40g proteína para torneo.'
        : 'Yogur griego 200g + avena 30g.' },
  ];
}

// ─── Sub-components ──────────────────────────────────────────

function PreStep({ step, isPast }) {
  return (
    <div style={{
      display: 'flex', gap: 14, alignItems: 'flex-start',
      opacity: isPast ? 0.45 : 1,
    }}>
      <div style={{ flexShrink: 0, width: 48, textAlign: 'right', paddingTop: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {step.time}
        </span>
      </div>
      <div style={{ width: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, flexShrink: 0 }}>
        <div style={{ fontSize: 18 }}>{step.emoji}</div>
        <div style={{ flex: 1, width: 2, background: 'var(--border)', minHeight: 24, marginTop: 4 }} />
      </div>
      <div style={{ flex: 1, paddingBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{step.title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{step.what}</div>
      </div>
    </div>
  );
}

function DuranteBlock({ b }) {
  return (
    <div style={{
      background: b.highlight ? `${b.color}18` : 'var(--surface-2)',
      border: `1px solid ${b.highlight ? b.color : 'var(--border)'}`,
      borderRadius: 'var(--radius-sm)',
      padding: '12px 16px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: b.color, minWidth: 110 }}>{b.range}</span>
      <div style={{ flex: 1, display: 'flex', flex: 1, flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 13, color: 'var(--blue)' }}>💧 {b.drink}</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>🍌 {b.eat}</span>
      </div>
    </div>
  );
}

function PostStep({ step }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ fontSize: 22, flexShrink: 0, width: 28, textAlign: 'center' }}>{step.emoji}</div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {step.time}
        </div>
        <div style={{ fontWeight: 700, fontSize: 14, marginTop: 1, marginBottom: 2 }}>{step.title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{step.what}</div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────

export default function MatchProtocol({ whoopData }) {
  const recovery    = whoopData?.recovery?.recovery_score ?? 74;
  const strain      = whoopData?.cycle?.strain            ?? 8;
  const sleepScore  = whoopData?.sleep?.sleep_score       ?? 80;
  const calBurned   = whoopData?.cycle?.calories_burned   ?? 800;

  const [config, setConfig]     = useState(() => {
    try { return JSON.parse(localStorage.getItem(MATCH_KEY())); } catch { return null; }
  });
  const [form, setForm]         = useState({ time: '15:00', surface: 'clay', type: 'torneo' });
  const [phase, setPhase]       = useState('pre');

  useEffect(() => {
    if (config) localStorage.setItem(MATCH_KEY(), JSON.stringify(config));
  }, [config]);

  const clear = () => { localStorage.removeItem(MATCH_KEY()); setConfig(null); };

  // ── Form ──
  if (!config) {
    const sf = (key) => ({
      flex: 1, minWidth: 80, padding: '10px 0',
      background: form.surface === key ? 'var(--accent-dim)' : 'var(--surface-2)',
      border: `1px solid ${form.surface === key ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-sm)',
      color: form.surface === key ? '#a5b4fc' : 'var(--text-muted)',
      fontWeight: form.surface === key ? 700 : 400,
      fontSize: 13, cursor: 'pointer',
    });
    const tf = (key) => ({
      flex: 1, padding: '10px 0',
      background: form.type === key ? 'var(--accent-dim)' : 'var(--surface-2)',
      border: `1px solid ${form.type === key ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-sm)',
      color: form.type === key ? '#a5b4fc' : 'var(--text-muted)',
      fontWeight: form.type === key ? 700 : 400,
      fontSize: 13, cursor: 'pointer',
    });

    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>🎾 Tengo partido hoy</h2>

        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Hora de inicio</div>
          <input type="time" value={form.time}
            onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
            style={{ width: '100%', padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 18, fontFamily: 'inherit', fontWeight: 700 }}
          />
        </div>

        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Superficie</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {SURFACES.map(s => (
              <button key={s.key} onClick={() => setForm(f => ({ ...f, surface: s.key }))} style={sf(s.key)}>
                {s.icon}<br />{s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Tipo</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['torneo','🏆 Torneo'],['entrenamiento','🎯 Entren.'],['amistoso','🤝 Amistoso']].map(([k,l]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, type: k }))} style={tf(k)}>{l}</button>
            ))}
          </div>
        </div>

        <button onClick={() => setConfig(form)} style={{ padding: '14px 0', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
          Generar protocolo →
        </button>
      </div>
    );
  }

  // ── Protocol view ──
  const sf         = SURFACES.find(s => s.key === config.surface) ?? SURFACES[0];
  const nowMin     = (() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); })();
  const matchMin   = toMin(config.time);
  const minLeft    = matchMin - nowMin;
  const preSteps   = buildPreSteps(config.time, recovery, strain, sleepScore);
  const durante    = buildDuranteBlocks(sf.sweat);
  const post       = buildPostSteps(calBurned, config.type);

  const autoPhase  = minLeft > 20 ? 'pre' : minLeft > -30 ? 'durante' : 'post';

  const tabBtn = (key, label) => (
    <button onClick={() => setPhase(key)} style={{
      flex: 1, padding: '11px 0',
      background: phase === key ? 'var(--accent)' : 'var(--surface-2)',
      border: `1px solid ${phase === key ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-sm)', cursor: 'pointer',
      color: phase === key ? 'white' : 'var(--text-muted)',
      fontWeight: phase === key ? 700 : 400, fontSize: 14,
      position: 'relative',
    }}>
      {label}
      {autoPhase === key && (
        <span style={{ position: 'absolute', top: 6, right: 8, width: 7, height: 7, borderRadius: '50%', background: 'var(--green)' }} />
      )}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Header */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
            {sf.icon} {sf.label} · {config.type === 'torneo' ? '🏆 Torneo' : config.type === 'entrenamiento' ? '🎯 Entren.' : '🤝 Amistoso'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>
            {config.time}
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 10 }}>
              {minLeft > 60 ? `en ${Math.round(minLeft / 60)}h ${minLeft % 60}min`
                : minLeft > 0 ? `en ${minLeft} min`
                : minLeft > -30 ? '🟢 En juego'
                : 'Finalizado'}
            </span>
          </div>
        </div>
        <button onClick={clear} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
          Cambiar
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {tabBtn('pre',     '⏱ Antes')}
        {tabBtn('durante', '🎾 Durante')}
        {tabBtn('post',    '🔄 Después')}
      </div>

      {/* PRE */}
      {phase === 'pre' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Recovery <strong style={{ color: recovery >= 67 ? 'var(--green)' : 'var(--yellow)' }}>{recovery}%</strong> ·
            Strain <strong>{strain.toFixed ? strain.toFixed(1) : strain}</strong> ·
            Sueño <strong>{sleepScore}%</strong>
          </div>
          {preSteps.map((s, i) => (
            <PreStep key={i} step={s} isPast={toMin(s.time) < nowMin && s.emoji !== '🎾'} />
          ))}
        </div>
      )}

      {/* DURANTE */}
      {phase === 'durante' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
            Leé esto antes de entrar. Pérdida estimada en {sf.label}: <strong style={{ color: 'var(--blue)' }}>~{sf.sweat}ml / 30 min</strong>
          </p>
          {durante.map((b, i) => <DuranteBlock key={i} b={b} />)}
          <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: '#a5b4fc', marginTop: 4 }}>
            Regla simple: cada cambio de lado → 2 sips. Cada cambio de set → banana + 250ml.
          </div>
        </div>
      )}

      {/* POST */}
      {phase === 'post' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Independiente del resultado — la recuperación define el próximo partido.
          </p>
          {post.map((s, i) => <PostStep key={i} step={s} />)}
        </div>
      )}
    </div>
  );
}
