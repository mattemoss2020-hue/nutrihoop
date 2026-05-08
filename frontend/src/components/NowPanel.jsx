import { useState } from 'react';
import { useRecommendations } from '../hooks/useRecommendations';

// Hydration engine
function calcHydration({ strain, sweatLiters, sleepMinutes }) {
  const base = 2800; // ml base diaria para 67kg
  const sweatMl = Math.round((sweatLiters ?? strain * 0.18) * 1000);
  const sleepBonus = (sleepMinutes ?? 450) < 420 ? 200 : 0;
  // Total de bebida necesaria (base + reposición sudor 80%)
  const total = base + Math.round(sweatMl * 0.8) + sleepBonus;
  return { total, sweatMl, base };
}

// Estima agua consumida en un día de doble entrenamiento (realista para atleta)
function estimatedWaterSoFar(hour, strain) {
  const isHeavyDay = (strain ?? 0) > 10;
  if (hour < 7) return 0;
  if (hour < 9)  return isHeavyDay ? 500 : 300;   // desayuno + antes gym
  if (hour < 11) return isHeavyDay ? 1100 : 700;  // gym + isotónico
  if (hour < 13) return isHeavyDay ? 1800 : 1100; // tenis mañana + post
  if (hour < 15) return isHeavyDay ? 2400 : 1500; // almuerzo + siesta
  if (hour < 18) return isHeavyDay ? 3200 : 1900; // tenis tarde + intra
  if (hour < 20) return isHeavyDay ? 3700 : 2200; // post-entreno + cena
  return isHeavyDay ? 4000 : 2500;                // colación noche
}

function toMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const MEAL_WINDOWS = {
  double: [
    { time: '06:30', end: '08:00', key: 'breakfast' },
    { time: '08:45', end: '09:30', key: 'pre_gym' },
    { time: '10:00', end: '10:45', key: 'post_gym' },
    { time: '12:00', end: '13:00', key: 'lunch' },
    { time: '14:30', end: '15:10', key: 'pre_afternoon' },
    { time: '17:30', end: '18:15', key: 'post_final' },
    { time: '19:30', end: '20:30', key: 'dinner' },
    { time: '21:30', end: '22:30', key: 'snack_night' },
  ],
  single: [
    { time: '06:30', end: '08:00', key: 'breakfast' },
    { time: '09:45', end: '10:30', key: 'pre_tennis' },
    { time: '12:00', end: '13:00', key: 'post_tennis' },
    { time: '13:00', end: '14:00', key: 'lunch' },
    { time: '16:30', end: '17:30', key: 'snack' },
    { time: '19:30', end: '20:30', key: 'dinner' },
    { time: '21:30', end: '22:30', key: 'snack_night' },
  ],
  rest: [
    { time: '08:00', end: '09:30', key: 'breakfast' },
    { time: '11:00', end: '12:00', key: 'snack_am' },
    { time: '13:00', end: '14:30', key: 'lunch' },
    { time: '16:30', end: '17:30', key: 'snack' },
    { time: '19:30', end: '20:30', key: 'dinner' },
    { time: '21:30', end: '22:30', key: 'snack_night' },
  ],
};

const MEAL_ACTIONS = {
  breakfast: {
    label: 'Desayuno principal',
    icon: '🍳',
    color: '#f97316',
    items: [
      { food: 'Avena', amount: '100g', detail: '68g CHO · recarga glucógeno nocturno' },
      { food: 'Leche entera', amount: '250ml', detail: '9g proteína · hidratación' },
      { food: 'Banana', amount: '1 grande', detail: '27g CHO · potasio pre-entreno' },
      { food: 'Claras de huevo', amount: '4 unidades', detail: '14g proteína · sin grasa extra' },
      { food: 'Mermelada', amount: '20g', detail: '14g CHO de rápida absorción' },
    ],
    water: 400,
    note: 'Comé al menos 90 min antes del gimnasio para digestión completa.',
  },
  pre_gym: {
    label: 'Pre-gimnasio',
    icon: '💪',
    color: '#8b5cf6',
    items: [
      { food: 'Banana', amount: '1 grande', detail: '27g CHO · energía inmediata' },
      { food: 'Tostada con miel', amount: '1 rebanada + 15g', detail: '30g CHO · fácil digestión' },
    ],
    water: 300,
    note: 'Tomá 300ml de agua ahora. Llevá isotónico al gym.',
  },
  post_gym: {
    label: '⚡ Ventana anabólica post-gym',
    icon: '🥤',
    color: '#6366f1',
    items: [
      { food: 'Whey protein', amount: '30g en agua fría', detail: '24g proteína · absorción rápida' },
      { food: 'Arroz blanco', amount: '50g cocido', detail: '40g CHO · reposición glucógeno' },
      { food: 'Banana', amount: '1 mediana', detail: '22g CHO + potasio anti-calambres' },
    ],
    water: 500,
    note: 'CRÍTICO: tenés 30 min desde que terminó el gym. No esperes.',
    urgent: true,
  },
  pre_tennis: {
    label: 'Pre-tenis',
    icon: '🎾',
    color: '#10b981',
    items: [
      { food: 'Banana', amount: '1 grande', detail: '27g CHO · energía sin pesadez' },
      { food: 'Isotónico', amount: '500ml', detail: 'Na+ · K+ · pre-carga electrolitos' },
    ],
    water: 300,
    note: 'Empezá a hidratarte 30 min antes. Orina debe ser amarillo claro.',
  },
  post_tennis: {
    label: '⚡ Post-tenis (ventana crítica)',
    icon: '🏃',
    color: '#6366f1',
    items: [
      { food: 'Whey protein', amount: '30g', detail: '24g proteína · reparación muscular' },
      { food: 'Arroz o banana', amount: '80g / 2 unidades', detail: '55-60g CHO · reposición' },
    ],
    water: 600,
    note: 'CRÍTICO: primeros 30 min post-tenis son los más importantes del día.',
    urgent: true,
  },
  post_morning_tennis: {
    label: 'Post-tenis mañana',
    icon: '🥛',
    color: '#3b82f6',
    items: [
      { food: 'Yogur griego', amount: '150g', detail: '17g proteína · probióticos' },
      { food: 'Granola', amount: '30g', detail: '20g CHO · fibra' },
      { food: 'Miel', amount: '10g', detail: '8g CHO rápido · puente hasta almuerzo' },
    ],
    water: 300,
    note: 'Puente entre la ventana post-gym y el almuerzo. No lo saltees.',
  },
  post_final: {
    label: '⚡ Post-entreno final del día',
    icon: '🔥',
    color: '#ef4444',
    items: [
      { food: 'Whey protein', amount: '30g', detail: '24g proteína · síntesis nocturna' },
      { food: 'Arroz blanco', amount: '80g cocido', detail: '65g CHO · repone lo gastado' },
      { food: 'Dátiles (alternativa)', amount: '2 unidades', detail: '36g CHO + minerales' },
    ],
    water: 500,
    note: 'Última ventana anabólica del día. Define la recuperación de mañana.',
    urgent: true,
  },
  lunch: {
    label: 'Almuerzo de recarga',
    icon: '🍚',
    color: '#f59e0b',
    items: [
      { food: 'Arroz blanco', amount: '150g cocido', detail: '45g CHO · base energética' },
      { food: 'Pechuga de pollo', amount: '200g', detail: '46g proteína · magra' },
      { food: 'Batata', amount: '100g cocida', detail: '20g CHO · vitamina A' },
      { food: 'Aceite de oliva', amount: '1 cda (15ml)', detail: '14g grasa · omega-9' },
    ],
    water: 400,
    note: 'La comida más importante del día. Comé despacio, masticá bien.',
  },
  pre_afternoon: {
    label: 'Pre-tenis tarde',
    icon: '⚡',
    color: '#10b981',
    items: [
      { food: 'Tostadas', amount: '2 unidades', detail: '30g CHO · base sólida' },
      { food: 'Mantequilla de maní', amount: '20g', detail: '8g proteína · 5g grasa lenta' },
      { food: 'Banana', amount: '1 mediana', detail: '22g CHO · potasio' },
    ],
    water: 350,
    note: 'Comé 90 min antes. Si tenés el estómago sensible, reducí el maní.',
  },
  dinner: {
    label: 'Cena de recuperación',
    icon: '🐟',
    color: '#6366f1',
    items: [
      { food: 'Salmón', amount: '180g', detail: '38g proteína · omega-3 antiinflamatorio' },
      { food: 'Quinoa', amount: '120g cocida', detail: '22g CHO · aminoácidos completos' },
      { food: 'Brócoli', amount: '150g', detail: 'Vitamina C · antioxidantes' },
      { food: 'Batata', amount: '80g', detail: '16g CHO · slow release nocturno' },
    ],
    water: 400,
    note: 'El omega-3 del salmón es clave para la inflamación post-doble turno.',
  },
  snack: {
    label: 'Merienda',
    icon: '🫐',
    color: '#8b5cf6',
    items: [
      { food: 'Yogur griego', amount: '150g', detail: '17g proteína · probióticos' },
      { food: 'Granola', amount: '30g', detail: '20g CHO · energía sostenida' },
      { food: 'Frutas frescas', amount: '100g', detail: 'Vitaminas · antioxidantes' },
    ],
    water: 250,
    note: 'Mantiene el metabolismo activo entre las comidas principales.',
  },
  snack_am: {
    label: 'Media mañana',
    icon: '🥜',
    color: '#f97316',
    items: [
      { food: 'Yogur griego', amount: '150g', detail: '17g proteína' },
      { food: 'Fruta', amount: '1 mediana', detail: '15g CHO naturales' },
      { food: 'Nueces', amount: '20g', detail: '3g proteína · omega-3 vegetal' },
    ],
    water: 250,
    note: 'Día de descanso: foco en recuperación, no en carga calórica.',
  },
  snack_night: {
    label: 'Colación nocturna',
    icon: '🌙',
    color: '#a78bfa',
    items: [
      { food: 'Yogur griego', amount: '200g', detail: '22g proteína lenta (caseína)' },
      { food: 'Avena cruda', amount: '40g', detail: '28g CHO slow release · serotonina' },
      { food: 'Miel', amount: '15g', detail: '12g CHO · facilita el sueño' },
    ],
    water: 200,
    note: 'La caseína del yogur te alimenta durante las 6-8 horas de sueño.',
  },
};

function StatusBar({ label, value, max, color, unit, sublabel }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>
          {value.toLocaleString()}{unit} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/ {max.toLocaleString()}{unit}</span>
        </span>
      </div>
      <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
      {sublabel && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sublabel}</div>}
    </div>
  );
}

function BigStat({ label, value, unit, sub, color, icon }) {
  return (
    <div style={{
      background: 'var(--surface-2)',
      borderRadius: 'var(--radius-sm)',
      padding: '14px 16px',
      flex: 1,
      minWidth: 100,
    }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{unit}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginTop: 6 }}>{label}</div>
    </div>
  );
}

export default function NowPanel({ whoopData }) {
  const { recovery, cycle, sleep, protocol, trainingType, sweatLiters } = whoopData ?? {};
  const { recommendation, loading, getRecommendation } = useRecommendations();
  const [claudeOpen, setClaudeOpen] = useState(false);

  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const nowMin = hour * 60 + minute;
  const timeStr = `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;

  // Hydration
  const currentStrain = cycle?.strain ?? 8;
  const hydration = calcHydration({
    strain: currentStrain,
    sweatLiters: sweatLiters ?? currentStrain * 0.18,
    sleepMinutes: sleep?.total_sleep_minutes,
  });
  const waterSoFar = estimatedWaterSoFar(hour, currentStrain);
  // Remaining: cuánto falta para el total del día, distribuido en horas restantes
  const hoursLeft = Math.max(1, 23 - hour);
  const totalRemaining = Math.max(0, hydration.total - waterSoFar);
  const waterDeficit = totalRemaining;
  // Lo que tomar AHORA: no más de 500ml, proporcional a las horas restantes
  const waterNow = waterDeficit > 0 ? Math.min(Math.round(totalRemaining / hoursLeft / 100) * 100, 500) : 200;

  // Current meal window
  const windows = MEAL_WINDOWS[trainingType ?? 'double'];
  const activeWindow = windows?.find(w => nowMin >= toMin(w.time) && nowMin <= toMin(w.end));
  const nextWindow = windows?.find(w => toMin(w.time) > nowMin);
  const currentKey = activeWindow?.key ?? nextWindow?.key ?? 'lunch';
  const mealAction = MEAL_ACTIONS[currentKey] ?? MEAL_ACTIONS.lunch;
  const isActive = !!activeWindow;
  const minutesToNext = nextWindow ? toMin(nextWindow.time) - nowMin : null;

  // Calories balance
  const caloriesBurned = cycle?.calories_burned ?? 0;
  const targetCal = protocol?.calories ?? 3400;
  const caloriesBMR = 1950; // TMB estimada
  const totalNeed = targetCal;

  const handleClaudeClick = async () => {
    setClaudeOpen(true);
    if (!recommendation) await getRecommendation();
  };

  const recoveryScore = recovery?.recovery_score;
  const recoveryColor = recoveryScore >= 67 ? 'var(--green)' : recoveryScore >= 33 ? 'var(--yellow)' : 'var(--red)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ESTADO FÍSICO AHORA */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Estado físico ahora — {timeStr}
          </h2>
          {whoopData?.demo && (
            <span style={{ fontSize: 11, background: '#312e81', color: '#a5b4fc', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
              DEMO
            </span>
          )}
        </div>

        {/* Big stats row */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <BigStat icon="💚" label="Recovery" value={recoveryScore ?? '—'} unit="/ 100" color={recoveryColor} />
          <BigStat icon="🔥" label="Kcal quemadas" value={(caloriesBurned).toLocaleString()} unit="kcal hoy" color="var(--yellow)"
            sub={`de ${targetCal.toLocaleString()} objetivo`} />
          <BigStat icon="⚡" label="Strain" value={cycle?.strain?.toFixed(1) ?? '—'} unit="/ 21" color="var(--accent)"
            sub={cycle?.strain > 15 ? 'Carga alta' : cycle?.strain > 10 ? 'Moderado' : 'Bajo'} />
          <BigStat icon="💧" label="Sudor estimado" value={`${(sweatLiters ?? currentStrain * 0.18).toFixed(1)}L`} unit="perdidos" color="var(--blue)"
            sub={`~${Math.round((sweatLiters ?? currentStrain * 0.18) * 46)}mg Na+`} />
          <BigStat icon="😴" label="Sueño anoche" value={sleep?.sleep_score ?? '—'} unit="% calidad"
            color={sleep?.sleep_score >= 70 ? 'var(--green)' : 'var(--yellow)'}
            sub={`${sleep?.deep_sleep_minutes ?? '?'}min profundo`} />
        </div>

        {/* Progress bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <StatusBar
            label="Calorías quemadas"
            value={caloriesBurned}
            max={targetCal}
            color="var(--yellow)"
            unit=" kcal"
            sublabel={`Faltan ${Math.max(0, targetCal - caloriesBurned).toLocaleString()} kcal para cubrir el protocolo ${protocol?.label}`}
          />
          <StatusBar
            label="Hidratación del día"
            value={waterSoFar}
            max={hydration.total}
            color={waterDeficit > 600 ? 'var(--red)' : waterDeficit > 200 ? 'var(--yellow)' : 'var(--green)'}
            unit="ml"
            sublabel={waterDeficit > 200
              ? `Faltan ~${waterDeficit}ml para el día — tomá ${waterNow}ml ahora`
              : 'Bien hidratado · mantené el ritmo hasta dormir'}
          />
          <StatusBar
            label="HRV vs baseline"
            value={recovery?.hrv ?? 65}
            max={Math.max(recovery?.hrv_baseline ?? 65, 100)}
            color={(recovery?.hrv ?? 65) >= (recovery?.hrv_baseline ?? 65) * 0.9 ? 'var(--green)' : 'var(--yellow)'}
            unit="ms"
            sublabel={`Baseline personal: ~${recovery?.hrv_baseline ?? 65}ms · ${(recovery?.hrv ?? 65) >= (recovery?.hrv_baseline ?? 65) ? 'Sistema nervioso recuperado' : 'Ligeramente fatigado'}`}
          />
        </div>
      </div>

      {/* QUÉ HACER AHORA */}
      <div style={{
        background: mealAction.urgent ? `linear-gradient(135deg, ${mealAction.color}18, var(--surface))` : 'var(--surface)',
        border: `1px solid ${mealAction.urgent ? mealAction.color : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {mealAction.urgent && (
          <div style={{
            position: 'absolute', top: 0, right: 0,
            background: mealAction.color, color: 'white',
            fontSize: 11, fontWeight: 800, padding: '4px 14px',
            borderBottomLeftRadius: 8, letterSpacing: '0.06em',
          }}>
            VENTANA CRÍTICA
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 28 }}>{mealAction.icon}</span>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
              {isActive ? '🟢 Momento actual' : minutesToNext ? `Próximo en ${minutesToNext} min` : 'Próxima comida'}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: mealAction.color }}>{mealAction.label}</h2>
          </div>
        </div>

        {/* Context line */}
        <div style={{
          background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)',
          padding: '10px 14px', marginBottom: 18, fontSize: 13,
          color: 'var(--text-muted)', lineHeight: 1.6,
        }}>
          Quemaste <strong style={{ color: 'var(--yellow)' }}>{caloriesBurned.toLocaleString()} kcal</strong> hoy ·
          Strain <strong style={{ color: 'var(--accent)' }}>{cycle?.strain?.toFixed(1) ?? '—'}</strong> ·
          Sudaste ~<strong style={{ color: 'var(--blue)' }}>{((sweatLiters ?? (cycle?.strain ?? 8) * 0.18)).toFixed(1)}L</strong> ·
          Recovery <strong style={{ color: recoveryColor }}>{recoveryScore ?? '—'}%</strong>
          {waterDeficit > 200 && (
            <span> · <strong style={{ color: 'var(--red)' }}>⚠ Déficit hídrico {waterDeficit}ml</strong></span>
          )}
        </div>

        {/* Hydration first */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#1e3a5f', border: '1px solid var(--blue)',
          borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 14,
        }}>
          <span style={{ fontSize: 20 }}>💧</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--blue)', fontSize: 14 }}>
              Tomá {waterNow}ml de agua AHORA
            </div>
            <div style={{ fontSize: 12, color: '#93c5fd', marginTop: 2 }}>
              {waterDeficit > 200
                ? `Faltan ~${waterDeficit}ml para completar el día · tomá ${waterNow}ml ahora`
                : `Bien hidratado · sudaste ~${Math.round((sweatLiters ?? currentStrain * 0.18) * 1000)}ml hoy`}
              {currentStrain > 12 && ' · Agregá pizca de sal o isotónico (Na+ y K+)'}
            </div>
          </div>
        </div>

        {/* Food items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {mealAction.items.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '10px 14px',
              background: 'var(--surface-2)',
              borderRadius: 'var(--radius-sm)',
              borderLeft: `3px solid ${mealAction.color}`,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{item.food}</span>
                  <span style={{ fontWeight: 800, color: mealAction.color, fontSize: 14 }}>{item.amount}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div style={{
          background: `${mealAction.color}18`,
          border: `1px solid ${mealAction.color}44`,
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          fontSize: 13,
          color: 'var(--text)',
          marginBottom: 16,
        }}>
          <strong>💡 </strong>{mealAction.note}
        </div>

        {/* Claude button */}
        <button
          onClick={handleClaudeClick}
          disabled={loading}
          style={{
            width: '100%', padding: '13px 20px',
            background: loading ? 'var(--surface-2)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: 'var(--radius-sm)',
            color: 'white', fontWeight: 700, fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
          }}
        >
          {loading ? (
            <>
              <span className="spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
              Consultando a Claude...
            </>
          ) : '✨ Pedile a Claude una recomendación personalizada'}
        </button>

        {claudeOpen && recommendation && (
          <div className="fade-in" style={{
            marginTop: 14,
            background: 'var(--surface-2)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-sm)',
            padding: 16, fontSize: 14, lineHeight: 1.8,
          }}>
            <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ✨ Claude dice:
            </div>
            {recommendation}
          </div>
        )}
      </div>
    </div>
  );
}
