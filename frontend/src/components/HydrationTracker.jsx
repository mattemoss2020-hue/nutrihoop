import { useState, useEffect } from 'react';

const STORAGE_KEY = () => `hydration_${new Date().toISOString().split('T')[0]}`;

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY()));
    if (!raw) return { ml: 0, log: [] };
    // migrate old format { water, electrolytes } → { ml, log }
    if (raw.water !== undefined) return { ml: raw.water ?? 0, log: raw.electrolytes ?? [] };
    return { ml: raw.ml ?? 0, log: Array.isArray(raw.log) ? raw.log : [] };
  } catch { return { ml: 0, log: [] }; }
}

const ELECTROLYTES = [
  { key: 'iso',   label: 'Isotónico',  icon: '🟡', ml: 500, na: 460, k: 120 },
  { key: 'sal',   label: 'Sal',        icon: '🧂', ml: 0,   na: 200, k: 0   },
  { key: 'tab',   label: 'Pastilla',   icon: '💊', ml: 0,   na: 300, k: 150 },
  { key: 'coco',  label: 'Agua coco',  icon: '🥥', ml: 330, na: 105, k: 600 },
];

export default function HydrationTracker({ dailyTarget = 4000, strain = 8 }) {
  const [state, setState] = useState(load);

  useEffect(() => { localStorage.setItem(STORAGE_KEY(), JSON.stringify(state)); }, [state]);

  const add = (ml) => setState(s => ({ ...s, ml: s.ml + ml }));

  const addElectrolyte = (opt) => setState(s => ({
    ml: s.ml + opt.ml,
    log: [...s.log, { ...opt, time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) }],
  }));

  const removeLog = (i) => setState(s => ({
    ml: Math.max(0, s.ml - (s.log[i].ml ?? 0)),
    log: s.log.filter((_, idx) => idx !== i),
  }));

  const pct = Math.min(100, Math.round((state.ml / dailyTarget) * 100));
  const remaining = Math.max(0, dailyTarget - state.ml);
  const color = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)';

  const totalNa = state.log.reduce((s, e) => s + (e.na ?? 0), 0);
  const totalK  = state.log.reduce((s, e) => s + (e.k  ?? 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Main card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>

        {/* Big number */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 56, fontWeight: 900, color, lineHeight: 1 }}>
            {state.ml >= 1000 ? `${(state.ml / 1000).toFixed(2)}L` : `${state.ml}ml`}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
            de {(dailyTarget / 1000).toFixed(1)}L · faltan{' '}
            <strong style={{ color }}>
              {remaining >= 1000 ? `${(remaining / 1000).toFixed(1)}L` : `${remaining}ml`}
            </strong>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 5, transition: 'width 0.4s ease' }} />
        </div>

        {/* Quick add */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[150, 250, 500, 750].map(ml => (
            <button key={ml} onClick={() => add(ml)} style={{
              flex: 1, padding: '12px 0',
              background: 'var(--blue-dim)', border: '1px solid var(--blue)',
              borderRadius: 'var(--radius-sm)', color: 'var(--blue)',
              fontWeight: 700, fontSize: 15, cursor: 'pointer',
            }}>
              +{ml < 1000 ? `${ml}` : '1k'}
            </button>
          ))}
        </div>

        {/* Electrolytes */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ELECTROLYTES.map(opt => (
            <button key={opt.key} onClick={() => addElectrolyte(opt)} style={{
              padding: '8px 14px', background: 'var(--surface-2)',
              border: '1px solid var(--border)', borderRadius: 20,
              color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {opt.icon} {opt.label}
              {opt.ml > 0 && <span style={{ color: 'var(--blue)', fontSize: 11 }}>+{opt.ml}ml</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Electrolyte totals (only if something logged) */}
      {state.log.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
            <div style={{ flex: 1, textAlign: 'center', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '10px 0' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#f97316' }}>{totalNa}<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>mg</span></div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Na+ · obj 2.500mg</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '10px 0' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#a78bfa' }}>{totalK}<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>mg</span></div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>K+ · obj 4.000mg</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {state.log.map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                <span>{e.icon} {e.label}</span>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span>{e.time}</span>
                  <button onClick={() => removeLog(i)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context note */}
      <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 0' }}>
        {strain > 14 ? '⚡ Doble turno — cada hora de tenis suma ~700ml de pérdida'
          : strain > 8 ? '🟡 Entrenamiento moderado — tomá 200ml cada 30 min'
          : '✅ Día liviano — 2.5–3L es suficiente'}
      </div>
    </div>
  );
}
