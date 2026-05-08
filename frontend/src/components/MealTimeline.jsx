import { useState, useEffect } from 'react';

const MEAL_PLANS = {
  double: [
    { key: 'breakfast', time: '06:30', label: 'Desayuno principal', calories: 750, protein: 35, carbs: 105, fat: 20, description: 'Avena 100g + leche 250ml + banana + 4 claras revueltas + mermelada 20g' },
    { key: 'pre_gym', time: '08:45', label: 'Pre-gimnasio', calories: 200, protein: 5, carbs: 45, fat: 2, description: 'Banana grande + 1 tostada con miel' },
    { key: 'post_gym', time: '10:15', label: 'Ventana post-gym ⚡', calories: 320, protein: 30, carbs: 50, fat: 2, description: 'Whey 30g (agua) + plátano + 50g arroz', critical: true },
    { key: 'post_morning_tennis', time: '12:15', label: 'Post-tenis mañana', calories: 200, protein: 15, carbs: 30, fat: 3, description: 'Yogur griego 150g + 30g granola + miel' },
    { key: 'lunch', time: '12:30', label: 'Almuerzo de recarga', calories: 780, protein: 50, carbs: 100, fat: 18, description: 'Arroz 150g + pechuga 200g + batata 100g + aceite de oliva' },
    { key: 'pre_afternoon', time: '14:30', label: 'Pre-tenis tarde', calories: 250, protein: 8, carbs: 45, fat: 5, description: 'Tostadas 2u + mantequilla de maní 20g + banana' },
    { key: 'post_final', time: '17:45', label: 'Post-entreno final ⚡', calories: 300, protein: 30, carbs: 40, fat: 3, description: 'Whey 30g + arroz 80g o 2 dátiles', critical: true },
    { key: 'dinner', time: '19:30', label: 'Cena de recuperación', calories: 750, protein: 55, carbs: 85, fat: 20, description: 'Salmón 180g + quinoa 120g + brócoli + batata 80g' },
    { key: 'snack_night', time: '21:30', label: 'Colación nocturna', calories: 350, protein: 30, carbs: 45, fat: 8, description: 'Yogur griego 200g + avena 40g + miel 15g' },
  ],
  single: [
    { key: 'breakfast', time: '06:30', label: 'Desayuno', calories: 650, protein: 30, carbs: 90, fat: 18, description: 'Avena 80g + leche + 2 huevos revueltos + frutas' },
    { key: 'pre_tennis', time: '10:00', label: 'Pre-tenis', calories: 200, protein: 5, carbs: 40, fat: 2, description: 'Banana + isotónico 500ml' },
    { key: 'post_tennis', time: '12:15', label: 'Post-tenis ⚡', calories: 350, protein: 30, carbs: 45, fat: 5, description: 'Whey 30g + arroz 80g + fruta', critical: true },
    { key: 'lunch', time: '13:00', label: 'Almuerzo', calories: 700, protein: 45, carbs: 85, fat: 16, description: 'Pasta 130g + atún 160g + ensalada + aceite' },
    { key: 'snack', time: '16:30', label: 'Merienda', calories: 300, protein: 20, carbs: 40, fat: 6, description: 'Yogur griego + granola + fruta' },
    { key: 'dinner', time: '19:30', label: 'Cena', calories: 650, protein: 45, carbs: 70, fat: 18, description: 'Pollo 180g + arroz 100g + verduras salteadas' },
    { key: 'snack_night', time: '21:30', label: 'Colación nocturna', calories: 300, protein: 25, carbs: 35, fat: 6, description: 'Yogur griego 200g + avena 30g' },
  ],
  rest: [
    { key: 'breakfast', time: '08:00', label: 'Desayuno', calories: 550, protein: 30, carbs: 65, fat: 16, description: 'Avena 70g + leche + 2 huevos + fruta' },
    { key: 'snack_am', time: '11:00', label: 'Media mañana', calories: 250, protein: 15, carbs: 30, fat: 7, description: 'Yogur griego 150g + fruta + nueces 20g' },
    { key: 'lunch', time: '13:00', label: 'Almuerzo', calories: 650, protein: 45, carbs: 70, fat: 18, description: 'Arroz 100g + pollo 180g + ensalada + aceite' },
    { key: 'snack', time: '16:30', label: 'Merienda', calories: 250, protein: 20, carbs: 25, fat: 8, description: 'Yogur griego + fruta + almendras' },
    { key: 'dinner', time: '19:30', label: 'Cena', calories: 600, protein: 40, carbs: 60, fat: 18, description: 'Pescado 160g + batata 120g + verduras' },
    { key: 'snack_night', time: '21:30', label: 'Colación nocturna', calories: 250, protein: 20, carbs: 25, fat: 6, description: 'Yogur griego 150g + semillas de chía' },
  ],
};

const PROTOCOL_SCALES = { high: 1.0, medium: 0.876, low: 0.722 };
const protocolKey = (label) => label === 'ALTO' ? 'high' : label === 'MEDIO' ? 'medium' : 'low';

function toMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function MacroPill({ label, value, unit = 'g', color }) {
  return (
    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: color + '22', color, fontWeight: 600 }}>
      {label}: {value}{unit}
    </span>
  );
}

export default function MealTimeline({ trainingType = 'double', protocol }) {
  const [now, setNow] = useState(new Date());
  const [completedMeals, setCompletedMeals] = useState(new Set());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const scale = PROTOCOL_SCALES[protocolKey(protocol?.label ?? 'ALTO')] ?? 1.0;
  const meals = (MEAL_PLANS[trainingType] ?? MEAL_PLANS.double).map((m) => ({
    ...m,
    calories: Math.round(m.calories * scale),
    protein: Math.round(m.protein * scale),
    carbs: Math.round(m.carbs * scale),
    fat: Math.round(m.fat * scale),
  }));

  const nextMealIdx = meals.findIndex((m) => toMinutes(m.time) > nowMin);

  const toggleComplete = (key) => {
    setCompletedMeals((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const totalMacros = meals.reduce((acc, m) => ({
    calories: acc.calories + m.calories,
    protein: acc.protein + m.protein,
    carbs: acc.carbs + m.carbs,
    fat: acc.fat + m.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Timeline del Día
        </h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <MacroPill label="Kcal" value={totalMacros.calories} unit="" color="var(--yellow)" />
          <MacroPill label="P" value={totalMacros.protein} color="var(--blue)" />
          <MacroPill label="CHO" value={totalMacros.carbs} color="var(--green)" />
          <MacroPill label="G" value={totalMacros.fat} color="#f97316" />
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        {/* Vertical line */}
        <div style={{ position: 'absolute', left: 20, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {meals.map((meal, idx) => {
            const isPast = toMinutes(meal.time) < nowMin;
            const isNext = idx === nextMealIdx;
            const isDone = completedMeals.has(meal.key);

            const dotColor = isDone ? 'var(--green)' : isNext ? 'var(--accent)' : isPast ? 'var(--border)' : 'var(--surface-2)';
            const dotBorder = isNext ? 'var(--accent)' : isPast ? 'var(--border)' : 'var(--border)';
            const opacity = isPast && !isDone ? 0.5 : 1;

            return (
              <div
                key={meal.key}
                style={{
                  display: 'flex',
                  gap: 16,
                  padding: '10px 0',
                  opacity,
                  transition: 'opacity 0.2s',
                }}
              >
                {/* Dot */}
                <div style={{ position: 'relative', flexShrink: 0, width: 40, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 6 }}>
                  <button
                    onClick={() => toggleComplete(meal.key)}
                    title="Marcar como completada"
                    style={{
                      width: 18, height: 18,
                      borderRadius: '50%',
                      background: dotColor,
                      border: `2px solid ${dotBorder}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isNext ? `0 0 0 4px var(--accent)33` : 'none',
                    }}
                  />
                </div>

                {/* Content */}
                <div style={{
                  flex: 1,
                  background: isNext ? 'var(--accent-dim)' : 'transparent',
                  border: isNext ? '1px solid var(--accent)' : '1px solid transparent',
                  borderRadius: 'var(--radius-sm)',
                  padding: isNext ? '12px 16px' : '4px 0',
                  transition: 'all 0.3s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{meal.time}</span>
                      <span style={{ fontSize: 14, fontWeight: isNext ? 700 : 500 }}>
                        {meal.label}
                        {meal.critical && <span style={{ marginLeft: 6, fontSize: 11, background: '#7c3aed', color: '#e9d5ff', padding: '1px 6px', borderRadius: 10 }}>CRÍTICA</span>}
                        {isNext && <span style={{ marginLeft: 6, fontSize: 11, background: 'var(--accent)', color: 'white', padding: '1px 8px', borderRadius: 10 }}>PRÓXIMA</span>}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--yellow)' }}>{meal.calories} kcal</span>
                  </div>

                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: isNext ? 10 : 4, lineHeight: 1.4 }}>{meal.description}</p>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <MacroPill label="P" value={meal.protein} color="var(--blue)" />
                    <MacroPill label="CHO" value={meal.carbs} color="var(--green)" />
                    <MacroPill label="G" value={meal.fat} color="#f97316" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
