// Datos demo realistas basados en el perfil de Matteo
// Se usan cuando no hay conexión Whoop para mostrar la app en acción

export function getDemoData() {
  const now = new Date();
  const hour = now.getHours();

  // Simula strain progresivo según la hora del día
  const strain = hour < 10 ? 4.2 : hour < 12 ? 9.8 : hour < 15 ? 11.4 : hour < 18 ? 16.7 : 17.2;
  const caloriesBurned = Math.round(strain * 110 + 400); // aprox kcal quemadas
  const sweatLiters = parseFloat((strain * 0.18).toFixed(1)); // litros sudados estimados

  return {
    demo: true,
    recovery: {
      recovery_score: 74,
      hrv: 71,
      hrv_baseline: 65,
      resting_hr: 48,
      spo2: 98,
    },
    cycle: {
      strain,
      calories_burned: caloriesBurned,
      average_hr: 112,
      max_hr: 181,
    },
    sleep: {
      sleep_score: 82,
      total_sleep_minutes: 468,
      deep_sleep_minutes: 78,
      rem_sleep_minutes: 94,
      light_sleep_minutes: 214,
      awake_minutes: 22,
      respiratory_rate: 14.2,
    },
    workouts: hour > 9 ? [
      { sport_id: 73, strain: 7.4, calories: 680, average_hr: 138, max_hr: 181, start: '09:00', end: '10:00' },
    ] : [],
    sweatLiters,
    protocol: {
      label: 'ALTO',
      range: '67-100%',
      calories: 3880,
      protein: 224,
      carbs: 538,
      fat: 74,
      color: 'green',
    },
    trainingType: (() => {
      const d = now.getDay();
      if ([1,3,5].includes(d)) return 'double';
      if ([2,4].includes(d)) return 'single';
      return 'rest';
    })(),
    alerts: [
      hour > 17 && strain > 15 ? {
        level: 'warning',
        message: 'Strain alto acumulado — ventana post-entreno crítica, no la saltees.',
      } : null,
    ].filter(Boolean),
  };
}
