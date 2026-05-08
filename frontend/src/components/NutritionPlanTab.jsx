import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// ── Calculation engine ──────────────────────────────────────────────────────

function calcPlan(profile, weight) {
  const muscular = profile?.masa_muscular_kg ?? 0;
  const bw = weight ?? 67;
  const bmr = profile?.metabolismo_basal_kcal ?? 1743;

  return {
    double: {
      label: 'Doble turno',
      factor: 2.05,
      surplus: 300,
      get: Math.round(bmr * 2.05 + 300),
      protein:  { g: Math.round(muscular * 2.5), rate: '2,5 g/kg magra', pct: 23 },
      carbs:    { g: Math.round(bw * 8),         rate: '8 g/kg PC',      pct: 55 },
      fat:      { g: Math.round(bw * 1.1),       rate: '1,1 g/kg PC',   pct: 17 },
      water: '3,5 – 4 L',
    },
    single: {
      label: 'Turno simple',
      factor: 1.78,
      surplus: 300,
      get: Math.round(bmr * 1.78 + 300),
      protein:  { g: Math.round(muscular * 2.3), rate: '2,3 g/kg magra', pct: 24 },
      carbs:    { g: Math.round(bw * 6.5),       rate: '6,5 g/kg PC',    pct: 51 },
      fat:      { g: Math.round(bw * 1.1),       rate: '1,1 g/kg PC',   pct: 19 },
      water: '2,5 – 3 L',
    },
    rest: {
      label: 'Descanso',
      factor: 1.4,
      surplus: 0,
      get: Math.round(bmr * 1.4),
      protein:  { g: Math.round(muscular * 2.0), rate: '2,0 g/kg magra', pct: 25 },
      carbs:    { g: Math.round(bw * 4),         rate: '4 g/kg PC',      pct: 45 },
      fat:      { g: Math.round(bw * 1.1),       rate: '1,1 g/kg PC',   pct: 28 },
      water: '2 – 2,5 L',
    },
  };
}

function addMinutes(timeStr, mins) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function buildTimeline(sessionType, morningStart, afternoonStart, morningDur, afternoonDur) {
  const ms = morningStart || '09:00';
  const as = afternoonStart || '15:00';

  if (sessionType === 'double') {
    const postGym   = addMinutes(ms, morningDur || 60);
    const postGym30 = addMinutes(ms, (morningDur || 60) + 30);
    const tennis1End = addMinutes(postGym30, 90);
    const preAft    = addMinutes(as, -60);
    const aftEnd    = addMinutes(as, afternoonDur || 90);
    const physEnd   = addMinutes(aftEnd, 60);
    const postFinal = addMinutes(physEnd, 30);
    const dinner    = addMinutes(postFinal, 90);
    const snack     = addMinutes(dinner, 120);

    return [
      { time: addMinutes(ms, -150), block: 'DESAYUNO',          critical: false,
        title: 'Desayuno principal — carga pre-entreno',
        detail: 'Avena 100g + leche 300ml + 2 huevos revueltos + 1 banana + miel 15g + frutos secos 20g',
        macros: '~750 kcal | P 35g | CHO 105g | G 20g' },
      { time: addMinutes(ms, -15),  block: 'PRE-ENTRENO',        critical: false,
        title: '30-45 min antes del primer bloque',
        detail: '1 banana grande + 1 tostada con mermelada + 300ml agua con electrolitos',
        macros: '~200 kcal | CHO 45g' },
      { time: `${ms}–${postGym}`,   block: 'GIMNASIO',           critical: false,
        title: 'Bloque 1 — intra-sesión',
        detail: '500ml agua + 30g maltodextrina o 1 banana si tolerás sólido',
        macros: null },
      { time: `${postGym}–${postGym30}`, block: 'VENTANA POST-GYM', critical: true,
        title: '⚡ CRÍTICO — no saltear esta ventana',
        detail: '30g proteína whey + 50g CHO (banana + jugo de naranja) + agua',
        macros: '~320 kcal | P 30g | CHO 50g' },
      { time: `${postGym30}–${tennis1End}`, block: 'TENIS MAÑANA', critical: false,
        title: 'Bloque 2 — intra-sesión',
        detail: '600-800ml bebida deportiva (30-40g CHO/hora) + electrolitos — sorbos c/15-20 min',
        macros: null },
      { time: addMinutes(tennis1End, 0), block: 'POST-TENIS',   critical: false,
        title: 'Inmediato al terminar — primeros 20 min',
        detail: '30g whey + 1 fruta grande',
        macros: '~270 kcal | P 30g | CHO 40g' },
      { time: addMinutes(tennis1End, 30), block: 'ALMUERZO',    critical: false,
        title: 'Almuerzo de recarga — CHO rápidos para reponer glucógeno',
        detail: 'Arroz/papa 200g cocido + pollo/carne magra 180g + vegetales + aceite oliva 15ml',
        macros: '~780 kcal | P 50g | CHO 100g | G 18g' },
      { time: preAft,                block: 'PRE-TENIS TARDE',  critical: false,
        title: '60-90 min antes del bloque tarde',
        detail: '1 tostada con dulce de leche o 1 gel energético + 300ml agua',
        macros: '~150 kcal | CHO 35g' },
      { time: `${as}–${aftEnd}`,     block: 'TENIS TARDE',      critical: false,
        title: 'Bloque 3 — intra-sesión',
        detail: '600ml bebida deportiva + 1 gel si la sesión es intensa o competitiva',
        macros: null },
      { time: `${aftEnd}–${physEnd}`, block: 'FÍSICO EN CAMPO', critical: true,
        title: 'Bloque 4 — estado de fatiga acumulada',
        detail: '400ml agua + electrolitos + gel o banana si la intensidad es alta',
        macros: 'Hidratación crítica — riesgo de catabolismo' },
      { time: postFinal,             block: 'POST-ENTRENO FINAL', critical: false,
        title: 'Primeros 30 min post-sesión',
        detail: '30g whey + 40g CHO (fruta + jugo) — iniciar inmediatamente',
        macros: '~280 kcal | P 30g | CHO 40g' },
      { time: dinner,                block: 'CENA',             critical: false,
        title: 'Cena de recuperación',
        detail: 'Pasta/arroz 180g cocido + pescado/pollo 160g + vegetales + aceite oliva',
        macros: '~750 kcal | P 48g | CHO 95g | G 18g' },
      { time: snack,                 block: 'COLACIÓN NOCTURNA', critical: false,
        title: 'Síntesis proteica durante el sueño',
        detail: '200g yogur griego + 30g granola + 15g miel — caseína de liberación lenta',
        macros: '~350 kcal | P 20g | CHO 45g | G 8g' },
    ];
  }

  if (sessionType === 'single') {
    const tennis1End = addMinutes(ms, morningDur || 90);
    const postTennis = addMinutes(tennis1End, 30);
    const lunch = addMinutes(tennis1End, 60);
    const snack = addMinutes(lunch, 210);
    const dinner = addMinutes(snack, 180);
    const nightSnack = addMinutes(dinner, 90);

    return [
      { time: addMinutes(ms, -120), block: 'DESAYUNO',        critical: false,
        title: 'Carga moderada pre-sesión baja intensidad',
        detail: 'Avena 80g + leche 250ml + 2 huevos + fruta + frutos secos 15g',
        macros: '~620 kcal | P 30g | CHO 85g | G 18g' },
      { time: addMinutes(ms, -15),  block: 'PRE-ENTRENO',      critical: false,
        title: 'Sesión baja intensidad',
        detail: '1 fruta mediana + 300ml agua — sin necesidad de carga alta',
        macros: null },
      { time: `${ms}–${tennis1End}`, block: 'TENIS',           critical: false,
        title: 'Bloque 1 — intra-sesión',
        detail: '600ml bebida deportiva + electrolitos | sorbos frecuentes',
        macros: null },
      { time: postTennis,            block: 'VENTANA POST-TENIS', critical: true,
        title: 'Ventana anabólica',
        detail: '30g whey + fruta grande',
        macros: '~270 kcal | P 30g | CHO 40g' },
      { time: lunch,                 block: 'ALMUERZO',         critical: false,
        title: 'Comida principal del día',
        detail: 'Proteína magra 160g + CHO complejos 180g cocido + vegetales + grasa saludable',
        macros: '~720 kcal | P 48g | CHO 90g | G 18g' },
      { time: snack,                 block: 'MERIENDA',         critical: false,
        title: 'Soporte calórico tarde',
        detail: 'Pan integral + queso + jamón + fruta',
        macros: '~420 kcal | P 22g | CHO 55g | G 12g' },
      { time: dinner,                block: 'CENA',             critical: false,
        title: 'Recuperación y preparación para doble turno siguiente',
        detail: 'Proteína magra 150g + vegetales + CHO moderado 120g cocido + aceite oliva',
        macros: '~650 kcal | P 42g | CHO 80g | G 15g' },
      { time: nightSnack,            block: 'COLACIÓN NOCTURNA', critical: false,
        title: 'Síntesis proteica nocturna — caseína',
        detail: 'Yogur griego 200g + miel 15g',
        macros: '~220 kcal | P 18g | CHO 28g' },
    ];
  }

  // rest
  return [
    { time: '08:00', block: 'DESAYUNO',          critical: false,
      title: 'Desayuno de recuperación',
      detail: 'Avena 70g + leche 250ml + 2 huevos + fruta + frutos secos 15g',
      macros: '~550 kcal | P 28g | CHO 75g | G 16g' },
    { time: '13:00', block: 'ALMUERZO',           critical: false,
      title: 'Comida principal',
      detail: 'Proteína magra 150g + arroz/pasta 160g cocido + vegetales + aceite oliva',
      macros: '~680 kcal | P 44g | CHO 85g | G 16g' },
    { time: '17:00', block: 'MERIENDA',           critical: false,
      title: 'Soporte calórico',
      detail: 'Pan integral + queso + fruta',
      macros: '~350 kcal | P 18g | CHO 50g | G 10g' },
    { time: '20:30', block: 'CENA',               critical: false,
      title: 'Cena liviana de recuperación activa',
      detail: 'Pescado/pollo 140g + vegetales salteados + puré liviano',
      macros: '~550 kcal | P 40g | CHO 60g | G 14g' },
    { time: '22:00', block: 'COLACIÓN NOCTURNA',  critical: false,
      title: 'Síntesis proteica nocturna',
      detail: 'Yogur griego 200g + miel 10g',
      macros: '~200 kcal | P 18g | CHO 25g' },
  ];
}

// ── UI helpers ──────────────────────────────────────────────────────────────

const SUPPS = [
  { name: 'Proteína whey',       dose: '30g post cada bloque de entrenamiento. 3 tomas días doble, 2 días simple.', level: 'Alta evidencia', color: '#22c55e' },
  { name: 'Creatina monohidrato',dose: '3-5 g/día en días de entrenamiento. Sin fase de carga. Con CHO post-gym.', level: 'Alta evidencia', color: '#22c55e' },
  { name: 'Vitamina D3 + K2',    dose: '2.000-4.000 UI D3 + 100 mcg K2 MK-7 diarios. Crítico para masa ósea en pubertad.', level: 'Alta evidencia', color: '#22c55e' },
  { name: 'Omega-3 EPA/DHA',     dose: '2-3 g/día de EPA+DHA. Anti-inflamatorio, mejora recuperación entre bloques.', level: 'Recomendado', color: '#6366f1' },
  { name: 'Magnesio glicinato',  dose: '200-300 mg antes de dormir. Función muscular + calidad de sueño + calambres.', level: 'Recomendado', color: '#6366f1' },
  { name: 'Calcio',              dose: 'Si la dieta no alcanza 1.300 mg/día. Citrato de calcio con comidas.', level: 'Condicional', color: '#f59e0b' },
  { name: 'Cafeína',             dose: 'NO recomendado de forma sistemática a los 16 años. Eje hormonal en desarrollo.', level: 'No recomendado', color: '#ef4444' },
];

const HYDRATION = [
  { moment: 'Al despertar',           detail: '500ml agua inmediatamente al levantarse' },
  { moment: 'Pre-entreno (30 min)',    detail: '300-400ml agua o bebida con electrolitos' },
  { moment: 'Durante el entreno',      detail: '150-200ml cada 15-20 min — no esperar sed' },
  { moment: 'Post-entreno inmediato',  detail: '500ml por cada 0,5 kg de peso perdido' },
  { moment: 'Durante comidas',         detail: '200-300ml por comida' },
  { moment: 'Verano / canchas rápidas',detail: 'Sumar 500ml extra al total diario' },
  { moment: 'Bebida deportiva intra',  detail: '30-60g CHO/hora + sodio 400-1.000 mg/L + potasio' },
];

const TODAY_DAY = new Date().getDay(); // 0=Sunday
const DAY_IDX = TODAY_DAY === 0 ? 6 : TODAY_DAY - 1; // Mon=0 … Sun=6

function MacroBar({ label, g, kcal, pct, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontWeight: 700, color }}>{label}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{g}g · {kcal} kcal · {pct}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color = 'var(--text)' }) {
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: 15, fontWeight: 800, color: '#6366f1', borderBottom: '2px solid #6366f122', paddingBottom: 10, marginBottom: 0 }}>
      {children}
    </h2>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function NutritionPlanTab({ userWeight }) {
  const { authFetch, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/profile')
      .then(r => r.json())
      .then(d => { setProfile(d.profile); setSchedule(d.schedule ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div className="spin" style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 16px' }} />
      <p style={{ color: 'var(--text-muted)' }}>Cargando plan...</p>
    </div>
  );

  if (!profile) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
      <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Completá tu perfil primero</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
        Cargá tu informe de composición corporal en el onboarding para ver tu plan nutricional personalizado.
      </p>
    </div>
  );

  const weight = userWeight ?? profile.weight_kg ?? 67;
  const plan = calcPlan(profile, weight);

  // Today's session
  const todaySchedule = schedule.find(d => d.day_of_week === DAY_IDX);
  const todayType = todaySchedule?.session_type ?? 'single';
  const todayPlan = plan[todayType === 'match' ? 'double' : todayType] ?? plan.single;
  const todayTimeline = buildTimeline(
    todayType === 'match' ? 'double' : todayType,
    todaySchedule?.morning_start,
    todaySchedule?.afternoon_start,
    todaySchedule?.morning_duration_min,
    todaySchedule?.afternoon_duration_min,
  );

  const muscRatio = profile.masa_muscular_kg && profile.masa_osea_kg
    ? (profile.masa_muscular_kg / profile.masa_osea_kg).toFixed(2)
    : null;

  const sessionLabel = { double: 'Doble turno', single: 'Turno simple', rest: 'Descanso', match: 'Día de partido' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: 'var(--radius)', padding: '24px 28px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a5b4fc', marginBottom: 6 }}>
          Plan Nutricional Deportivo · Tenis Elite
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{user?.name}</div>
        <div style={{ color: '#a5b4fc', fontSize: 13 }}>
          {profile.age ? `${profile.age} años · ` : ''}{weight} kg · {profile.height_cm ? `${profile.height_cm} cm · ` : ''}
          {profile.report_date ? `Medición ${new Date(profile.report_date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}` : 'Datos cargados'}
        </div>
      </div>

      {/* 1. Perfil antropométrico */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionTitle>1. Perfil Antropométrico</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
          <StatCard label="Peso total" value={`${weight} kg`} color="var(--text)" />
          {profile.masa_muscular_kg && <StatCard label="Masa muscular" value={`${profile.masa_muscular_kg} kg`} sub={`${profile.masa_muscular_pct?.toFixed(1)}%`} color="#6366f1" />}
          {profile.masa_adiposa_kg && <StatCard label="Masa adiposa" value={`${profile.masa_adiposa_kg} kg`} sub={`${profile.masa_adiposa_pct?.toFixed(1)}%`} color="#f59e0b" />}
          {profile.masa_osea_kg && <StatCard label="Masa ósea" value={`${profile.masa_osea_kg} kg`} sub={`${profile.masa_osea_kg && weight ? ((profile.masa_osea_kg/weight)*100).toFixed(1) : ''}%`} color="#22c55e" />}
          {profile.suma_6_pliegues_mm && <StatCard label="Σ 6 pliegues" value={`${profile.suma_6_pliegues_mm} mm`} color="var(--blue)" />}
          {profile.imc && <StatCard label="IMC" value={profile.imc.toFixed(1)} sub="Óptimo atlético" />}
          {muscRatio && <StatCard label="Músculo / Óseo" value={muscRatio} sub="Ref: 4,3" color={parseFloat(muscRatio) >= 4.3 ? '#22c55e' : '#f59e0b'} />}
        </div>

        {/* Strength / warning */}
        {profile.masa_muscular_kg && (
          <div style={{ background: '#052e1622', border: '1px solid #22c55e44', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#4ade80', lineHeight: 1.6 }}>
            <strong>Fortaleza:</strong> Masa muscular de {profile.masa_muscular_kg} kg ({profile.masa_muscular_pct?.toFixed(1)}%) con masa adiposa de {profile.masa_adiposa_pct?.toFixed(1)}% es un perfil morfológico de élite para tenis.
          </div>
        )}
        {profile.masa_osea_kg && profile.masa_osea_kg < 8.5 && (
          <div style={{ background: '#451a0322', border: '1px solid #f59e0b44', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#fbbf24', lineHeight: 1.6 }}>
            <strong>Atención:</strong> La masa ósea requiere soporte nutricional activo: 1.300 mg calcio/día + 2.000-4.000 UI D3 + exposición solar 15-20 min/día.
          </div>
        )}
      </div>

      {/* 2. Requerimientos energéticos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionTitle>2. Requerimientos Energéticos</SectionTitle>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {[
            { label: 'Metabolismo basal (TMB)', value: `${profile.metabolismo_basal_kcal?.toFixed(0) ?? '?'} kcal/día`, highlight: false },
            { label: 'Factor días doble turno', value: '~2,05 — Gimnasio + Tenis ×2 + Físico en campo', highlight: false },
            { label: 'GET días doble turno', value: `${plan.double.get.toLocaleString()} kcal/día (incluye +300 kcal superávit)`, highlight: true },
            { label: 'Factor días turno simple', value: '~1,78 — Preventivos + Tenis', highlight: false },
            { label: 'GET días turno simple', value: `${plan.single.get.toLocaleString()} kcal/día (incluye +300 kcal superávit)`, highlight: true },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: row.highlight ? '#6366f111' : 'transparent' }}>
              <div style={{ flex: '0 0 220px', fontSize: 13, fontWeight: row.highlight ? 700 : 500, color: row.highlight ? '#a5b4fc' : 'var(--text-muted)' }}>{row.label}</div>
              <div style={{ fontSize: 13, fontWeight: row.highlight ? 700 : 400 }}>{row.value}</div>
            </div>
          ))}
        </div>

        {/* Macro cards */}
        {[
          { key: 'double', color: '#6366f1' },
          { key: 'single', color: '#22c55e' },
        ].map(({ key, color }) => {
          const p = plan[key];
          return (
            <div key={key} style={{ background: 'var(--surface)', border: `1px solid ${color}33`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color, marginBottom: 16 }}>
                Macros — {p.label} (objetivo {p.get.toLocaleString()} kcal)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <MacroBar label="Proteína" g={p.protein.g} kcal={p.protein.g * 4} pct={p.protein.pct} color="#6366f1" />
                <MacroBar label="Carbohidratos" g={p.carbs.g}   kcal={p.carbs.g * 4}   pct={p.carbs.pct}   color="#22c55e" />
                <MacroBar label="Grasas"        g={p.fat.g}     kcal={p.fat.g * 9}     pct={p.fat.pct}     color="#f59e0b" />
              </div>
              <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span>Proteína: {p.protein.rate}</span>
                <span>CHO: {p.carbs.rate}</span>
                <span>Grasas: {p.fat.rate}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Timing de hoy */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionTitle>3. Timing de Hoy</SectionTitle>
          <span style={{ fontSize: 12, background: '#6366f122', color: '#a5b4fc', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
            {sessionLabel[todayType] ?? 'Turno simple'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {todayTimeline.map((meal, i) => (
            <div key={i} style={{ display: 'flex', gap: 0 }}>
              {/* Timeline line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 16, minWidth: 12 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: meal.critical ? '#ef4444' : '#6366f1', marginTop: 18, flexShrink: 0 }} />
                {i < todayTimeline.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border)', minHeight: 16 }} />}
              </div>
              {/* Card */}
              <div style={{
                flex: 1, marginBottom: 10,
                background: meal.critical ? '#ef444411' : 'var(--surface)',
                border: `1px solid ${meal.critical ? '#ef444444' : 'var(--border)'}`,
                borderRadius: 10, padding: '12px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: meal.critical ? '#ef4444' : '#6366f1', fontVariantNumeric: 'tabular-nums' }}>{meal.time}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{meal.block}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{meal.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{meal.detail}</div>
                {meal.macros && <div style={{ marginTop: 6, fontSize: 12, color: '#a5b4fc', fontWeight: 600 }}>{meal.macros}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Hidratación */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionTitle>4. Protocolo de Hidratación</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          <StatCard label="Días doble turno" value={todayPlan.water.split('–')[0].trim() + ' L'} sub="mínimo diario" color="#6366f1" />
          <StatCard label="Días simple" value="2,5 – 3 L" sub="mínimo diario" color="#22c55e" />
          <StatCard label="Electrolitos" value="Na · K · Mg" sub="en cada bloque intenso" color="#f59e0b" />
          <StatCard label="Control" value="Orina clara" sub="amarillo pálido = OK" color="var(--text-muted)" />
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {HYDRATION.map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: '11px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ flex: '0 0 180px', fontSize: 13, fontWeight: 600, color: '#a5b4fc' }}>{h.moment}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{h.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Suplementación */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionTitle>5. Suplementación Basada en Evidencia</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SUPPS.map((s, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.dose}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: s.color + '22', color: s.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {s.level}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Prioridades clínicas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionTitle>6. Prioridades Clínicas</SectionTitle>
        {[
          { n: 1, title: 'Ventana post-gym', desc: 'Inmediato al bloque de gym — el cuerpo llega catabólico al siguiente bloque sin esta ventana. 30g whey + 50g CHO = innegociable.' },
          { n: 2, title: 'CHO altos en doble turno', desc: '8 g/kg es el mínimo para 4 bloques de trabajo. Reducir CHO por miedo a grasa destruye rendimiento y masa muscular.' },
          { n: 3, title: 'Proteger la masa ósea', desc: '1.300 mg calcio/día + 2.000-4.000 UI D3 + exposición solar 15-20 min/día. La ventana biológica se cierra en pocos años.' },
          { n: 4, title: 'Sueño como nutriente', desc: 'Colación nocturna (yogur griego) + 8-9 h de sueño = 70% de la síntesis muscular ocurre ahí. Sin sueño, no hay ganancia muscular.' },
          { n: 5, title: 'No llegar al físico en déficit', desc: 'El bloque de tarde en fatiga con glucógeno bajo = catabolismo. El gel/banana intra-tenis y el pre-entreno de tarde lo previenen.' },
          { n: 6, title: 'Monitoreo mensual', desc: 'Repetir antropometría en 4-6 semanas. Si la masa adiposa sube más de 0,5 kg revisar el superávit calórico.' },
        ].map((p) => (
          <div key={p.n} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6366f1', color: 'white', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{p.n}</div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
        Plan generado automáticamente en base al informe de composición corporal cargado. Para ajustes de suplementación y seguimiento, consultá con un nutricionista deportivo certificado.
      </div>
    </div>
  );
}
