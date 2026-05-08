import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const SESSION_TYPES = [
  { value: 'double', label: 'Doble turno', color: '#6366f1', emoji: '⚡' },
  { value: 'single', label: 'Turno simple', color: '#22c55e', emoji: '🎾' },
  { value: 'match',  label: 'Partido',      color: '#f59e0b', emoji: '🏆' },
  { value: 'rest',   label: 'Descanso',     color: '#64748b', emoji: '😴' },
];

const defaultBody = {
  weight_kg: '', height_cm: '', age: '',
  masa_muscular_kg: '', masa_muscular_pct: '',
  masa_adiposa_kg: '', masa_adiposa_pct: '',
  masa_osea_kg: '', masa_residual_kg: '',
  suma_6_pliegues_mm: '', imc: '', indice_cintura_cadera: '',
  metabolismo_basal_kcal: '', nivel_actividad: '', gasto_total_kcal: '',
  report_date: '',
};

const defaultSchedule = DAYS.map((_, i) => ({
  day_of_week: i,
  session_type: i < 5 ? 'single' : 'rest',
  morning_start: i < 5 ? '09:00' : '',
  morning_duration_min: i < 5 ? 90 : '',
  afternoon_start: '',
  afternoon_duration_min: '',
}));

function Field({ label, value, onChange, type = 'number', placeholder, unit }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          step="any"
          style={{
            flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text)', padding: '9px 12px',
            fontSize: 14, fontFamily: 'inherit', outline: 'none', minWidth: 0,
          }}
        />
        {unit && <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{unit}</span>}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
        {title}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

export default function OnboardingScreen({ onComplete }) {
  const { authFetch } = useAuth();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState(null); // 'pdf' | 'manual'
  const [body, setBody] = useState(defaultBody);
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const setBodyField = (k, v) => setBody(b => ({ ...b, [k]: v }));

  const handlePdf = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadMsg('Leyendo PDF...');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await authFetch('/api/profile/parse-pdf', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const d = json.data ?? {};
      setBody(prev => ({
        ...prev,
        weight_kg:            d.weight_kg            ?? prev.weight_kg,
        height_cm:            d.height_cm            ?? prev.height_cm,
        age:                  d.age                  ?? prev.age,
        masa_muscular_kg:     d.masa_muscular_kg     ?? prev.masa_muscular_kg,
        masa_muscular_pct:    d.masa_muscular_pct    ?? prev.masa_muscular_pct,
        masa_adiposa_kg:      d.masa_adiposa_kg      ?? prev.masa_adiposa_kg,
        masa_adiposa_pct:     d.masa_adiposa_pct     ?? prev.masa_adiposa_pct,
        masa_osea_kg:         d.masa_osea_kg         ?? prev.masa_osea_kg,
        masa_residual_kg:     d.masa_residual_kg     ?? prev.masa_residual_kg,
        suma_6_pliegues_mm:   d.suma_6_pliegues_mm   ?? prev.suma_6_pliegues_mm,
        imc:                  d.imc                  ?? prev.imc,
        indice_cintura_cadera:d.indice_cintura_cadera?? prev.indice_cintura_cadera,
        metabolismo_basal_kcal: d.metabolismo_basal_kcal ?? prev.metabolismo_basal_kcal,
        nivel_actividad:      d.nivel_actividad      ?? prev.nivel_actividad,
        gasto_total_kcal:     d.gasto_total_kcal     ?? prev.gasto_total_kcal,
        report_date:          d.report_date          ?? prev.report_date,
      }));
      setUploadMsg('✓ PDF leído — revisá los datos y corregí si hace falta');
      setMode('manual');
    } catch (err) {
      setUploadMsg('Error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const saveBody = async () => {
    setSaving(true);
    try {
      const payload = {};
      for (const [k, v] of Object.entries(body)) {
        payload[k] = v === '' ? null : (k === 'report_date' ? v : parseFloat(v));
      }
      payload.report_date = body.report_date || null;
      const res = await authFetch('/api/profile/body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setStep(2);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveSchedule = async () => {
    setSaving(true);
    try {
      const res = await authFetch('/api/profile/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: schedule }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      onComplete();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const setDay = (i, key, val) => {
    setSchedule(s => s.map((d, idx) => idx === i ? { ...d, [key]: val } : d));
  };

  const sessionColor = (type) => SESSION_TYPES.find(s => s.value === type)?.color ?? '#64748b';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🎾</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Configurar tu perfil</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Paso {step} de 2 — {step === 1 ? 'Composición corporal' : 'Horario de entrenamiento'}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 680, height: 4, background: 'var(--surface-2)', borderRadius: 2, marginBottom: 32 }}>
        <div style={{ height: '100%', width: step === 1 ? '50%' : '100%', background: 'var(--accent)', borderRadius: 2, transition: 'width 0.4s' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 680 }}>

        {/* ── STEP 1: Body composition ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Mode picker */}
            {!mode && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { id: 'pdf', emoji: '📄', title: 'Subir informe', sub: 'Subí el PDF de tu nutricionista y lo leemos automáticamente' },
                  { id: 'manual', emoji: '✏️', title: 'Completar manualmente', sub: 'Ingresá los datos vos mismo campo por campo' },
                ].map(({ id, emoji, title, sub }) => (
                  <button key={id} onClick={() => id === 'pdf' ? fileRef.current?.click() : setMode('manual')}
                    style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)', padding: '28px 20px', textAlign: 'center',
                      cursor: 'pointer', transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ fontSize: 36, marginBottom: 12 }}>{emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{sub}</div>
                  </button>
                ))}
                <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }}
                  onChange={e => handlePdf(e.target.files?.[0])} />
              </div>
            )}

            {/* Upload status */}
            {uploading && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div className="spin" style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 16px' }} />
                <p style={{ color: 'var(--text-muted)' }}>Leyendo PDF con IA...</p>
              </div>
            )}

            {uploadMsg && (
              <div style={{ background: uploadMsg.startsWith('✓') ? 'var(--green-dim)' : 'var(--red-dim)', border: `1px solid ${uploadMsg.startsWith('✓') ? 'var(--green)' : 'var(--red)'}`, borderRadius: 10, padding: '10px 16px', fontSize: 13, color: uploadMsg.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>
                {uploadMsg}
              </div>
            )}

            {/* Form */}
            {mode === 'manual' && !uploading && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
                <Section title="Datos básicos">
                  <Field label="Peso" value={body.weight_kg} onChange={v => setBodyField('weight_kg', v)} unit="kg" placeholder="67.3" />
                  <Field label="Talla" value={body.height_cm} onChange={v => setBodyField('height_cm', v)} unit="cm" placeholder="173" />
                  <Field label="Edad" value={body.age} onChange={v => setBodyField('age', v)} unit="años" placeholder="16" />
                  <Field label="IMC" value={body.imc} onChange={v => setBodyField('imc', v)} unit="kg/m²" placeholder="22.5" />
                </Section>

                <Section title="Composición corporal (5 masas)">
                  <Field label="Masa muscular" value={body.masa_muscular_kg} onChange={v => setBodyField('masa_muscular_kg', v)} unit="kg" placeholder="34.9" />
                  <Field label="Masa muscular %" value={body.masa_muscular_pct} onChange={v => setBodyField('masa_muscular_pct', v)} unit="%" placeholder="51.9" />
                  <Field label="Masa adiposa" value={body.masa_adiposa_kg} onChange={v => setBodyField('masa_adiposa_kg', v)} unit="kg" placeholder="12.6" />
                  <Field label="Masa adiposa %" value={body.masa_adiposa_pct} onChange={v => setBodyField('masa_adiposa_pct', v)} unit="%" placeholder="18.7" />
                  <Field label="Masa ósea" value={body.masa_osea_kg} onChange={v => setBodyField('masa_osea_kg', v)} unit="kg" placeholder="8.1" />
                  <Field label="Masa residual" value={body.masa_residual_kg} onChange={v => setBodyField('masa_residual_kg', v)} unit="kg" placeholder="7.9" />
                </Section>

                <Section title="Pliegues e índices">
                  <Field label="Suma 6 pliegues" value={body.suma_6_pliegues_mm} onChange={v => setBodyField('suma_6_pliegues_mm', v)} unit="mm" placeholder="36" />
                  <Field label="Índice cintura/cadera" value={body.indice_cintura_cadera} onChange={v => setBodyField('indice_cintura_cadera', v)} placeholder="0.95" />
                </Section>

                <Section title="Gasto energético">
                  <Field label="Metabolismo basal" value={body.metabolismo_basal_kcal} onChange={v => setBodyField('metabolismo_basal_kcal', v)} unit="kcal" placeholder="1743" />
                  <Field label="Factor actividad" value={body.nivel_actividad} onChange={v => setBodyField('nivel_actividad', v)} placeholder="1.7" />
                  <Field label="Gasto total estimado" value={body.gasto_total_kcal} onChange={v => setBodyField('gasto_total_kcal', v)} unit="kcal" placeholder="2964" />
                </Section>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Fecha del informe</label>
                  <input type="date" value={body.report_date} onChange={e => setBodyField('report_date', e.target.value)}
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '9px 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 180 }} />
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
              {mode ? (
                <>
                  <button onClick={() => { setMode(null); setUploadMsg(''); }}
                    style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)', padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>
                    ← Volver
                  </button>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setStep(2)}
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)', padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>
                      Saltar por ahora
                    </button>
                    <button onClick={saveBody} disabled={saving || uploading}
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 10, color: 'white', padding: '10px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                      {saving ? 'Guardando...' : 'Guardar y continuar →'}
                    </button>
                  </div>
                </>
              ) : (
                <button onClick={() => setStep(2)} style={{ marginLeft: 'auto', background: 'none', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)', padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>
                  Saltar por ahora →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2: Training schedule ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
              Configurá tu semana típica. Podés editarlo después desde tu perfil.
            </p>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {SESSION_TYPES.map(t => (
                <div key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color }} />
                  {t.emoji} {t.label}
                </div>
              ))}
            </div>

            {/* Week grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {schedule.map((day, i) => {
                const type = SESSION_TYPES.find(s => s.value === day.session_type);
                const isActive = day.session_type !== 'rest';
                const isDouble = day.session_type === 'double';

                return (
                  <div key={i} style={{
                    background: 'var(--surface)', border: `1px solid ${isActive ? type.color + '44' : 'var(--border)'}`,
                    borderRadius: 12, padding: '14px 16px',
                    transition: 'border-color 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      {/* Day name */}
                      <div style={{ width: 80, fontWeight: 700, fontSize: 14 }}>{DAYS[i]}</div>

                      {/* Session type buttons */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {SESSION_TYPES.map(t => (
                          <button key={t.value} onClick={() => setDay(i, 'session_type', t.value)}
                            style={{
                              padding: '5px 12px', borderRadius: 20, border: `1px solid ${day.session_type === t.value ? t.color : 'var(--border)'}`,
                              background: day.session_type === t.value ? t.color + '22' : 'transparent',
                              color: day.session_type === t.value ? t.color : 'var(--text-muted)',
                              fontSize: 12, fontWeight: day.session_type === t.value ? 700 : 400,
                              cursor: 'pointer', transition: 'all 0.15s',
                            }}>
                            {t.emoji} {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time inputs */}
                    {isActive && (
                      <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap', paddingLeft: 92 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>{isDouble ? 'Mañana — inicio' : 'Inicio'}</label>
                          <input type="time" value={day.morning_start || ''} onChange={e => setDay(i, 'morning_start', e.target.value)}
                            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Duración (min)</label>
                          <input type="number" value={day.morning_duration_min || ''} onChange={e => setDay(i, 'morning_duration_min', e.target.value)}
                            placeholder="90" min="30" max="300" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 80 }} />
                        </div>

                        {isDouble && (
                          <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tarde — inicio</label>
                              <input type="time" value={day.afternoon_start || ''} onChange={e => setDay(i, 'afternoon_start', e.target.value)}
                                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Duración (min)</label>
                              <input type="number" value={day.afternoon_duration_min || ''} onChange={e => setDay(i, 'afternoon_duration_min', e.target.value)}
                                placeholder="90" min="30" max="300" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 80 }} />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
              <button onClick={() => setStep(1)}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)', padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>
                ← Atrás
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onComplete}
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)', padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>
                  Saltar por ahora
                </button>
                <button onClick={saveSchedule} disabled={saving}
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 10, color: 'white', padding: '10px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Guardando...' : 'Guardar y entrar →'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
