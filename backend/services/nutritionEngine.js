const PROTOCOLS = {
  high: {
    label: 'ALTO',
    range: '67-100%',
    calories: 3880,
    protein: 224,
    carbs: 538,
    fat: 74,
    color: 'green',
  },
  medium: {
    label: 'MEDIO',
    range: '33-66%',
    calories: 3400,
    protein: 210,
    carbs: 430,
    fat: 68,
    color: 'yellow',
  },
  low: {
    label: 'BAJO',
    range: '0-32%',
    calories: 2800,
    protein: 220,
    carbs: 310,
    fat: 65,
    color: 'red',
  },
};

function getProtocol(recoveryScore) {
  if (recoveryScore >= 67) return PROTOCOLS.high;
  if (recoveryScore >= 33) return PROTOCOLS.medium;
  return PROTOCOLS.low;
}

function getTrainingType(date) {
  const day = new Date(date).getDay(); // 0=Sun,1=Mon,...,6=Sat
  if ([1, 3, 5].includes(day)) return 'double';  // Mon, Wed, Fri
  if ([2, 4].includes(day)) return 'single';      // Tue, Thu
  return 'rest';
}

// Meal plans keyed by training type. Macros are for HIGH protocol;
// they get scaled by protocol multipliers at runtime.
const MEAL_PLANS = {
  double: [
    {
      key: 'breakfast',
      time: '06:30',
      label: 'Desayuno principal',
      calories: 750,
      protein: 35,
      carbs: 105,
      fat: 20,
      description: 'Avena 100g + leche 250ml + banana + 4 claras revueltas + mermelada 20g',
    },
    {
      key: 'pre_gym',
      time: '08:45',
      label: 'Pre-gimnasio',
      calories: 200,
      protein: 5,
      carbs: 45,
      fat: 2,
      description: 'Banana grande + 1 tostada con miel',
    },
    {
      key: 'post_gym',
      time: '10:15',
      label: 'Ventana post-gym (CRÍTICA)',
      calories: 320,
      protein: 30,
      carbs: 50,
      fat: 2,
      description: 'Whey 30g (agua) + plátano + 50g arroz',
      critical: true,
    },
    {
      key: 'post_morning_tennis',
      time: '12:15',
      label: 'Post-tenis mañana',
      calories: 200,
      protein: 15,
      carbs: 30,
      fat: 3,
      description: 'Yogur griego 150g + 30g granola + miel',
    },
    {
      key: 'lunch',
      time: '12:30',
      label: 'Almuerzo de recarga',
      calories: 780,
      protein: 50,
      carbs: 100,
      fat: 18,
      description: 'Arroz 150g + pechuga 200g + batata 100g + aceite de oliva',
    },
    {
      key: 'pre_afternoon',
      time: '14:30',
      label: 'Pre-tenis tarde',
      calories: 250,
      protein: 8,
      carbs: 45,
      fat: 5,
      description: 'Tostadas 2u + mantequilla de maní 20g + banana',
    },
    {
      key: 'post_final',
      time: '17:45',
      label: 'Post-entreno final',
      calories: 300,
      protein: 30,
      carbs: 40,
      fat: 3,
      description: 'Whey 30g + arroz 80g o 2 dátiles',
      critical: true,
    },
    {
      key: 'dinner',
      time: '19:30',
      label: 'Cena de recuperación',
      calories: 750,
      protein: 55,
      carbs: 85,
      fat: 20,
      description: 'Salmón 180g + quinoa 120g + brócoli + batata 80g',
    },
    {
      key: 'snack_night',
      time: '21:30',
      label: 'Colación nocturna',
      calories: 350,
      protein: 30,
      carbs: 45,
      fat: 8,
      description: 'Yogur griego 200g + avena 40g + miel 15g',
    },
  ],
  single: [
    {
      key: 'breakfast',
      time: '06:30',
      label: 'Desayuno principal',
      calories: 650,
      protein: 30,
      carbs: 90,
      fat: 18,
      description: 'Avena 80g + leche 200ml + huevo revuelto 2u + frutas',
    },
    {
      key: 'pre_tennis',
      time: '10:00',
      label: 'Pre-tenis',
      calories: 200,
      protein: 5,
      carbs: 40,
      fat: 2,
      description: 'Banana + isotónico 500ml',
    },
    {
      key: 'post_tennis',
      time: '12:15',
      label: 'Post-tenis',
      calories: 350,
      protein: 30,
      carbs: 45,
      fat: 5,
      description: 'Whey 30g + arroz 80g + fruta',
      critical: true,
    },
    {
      key: 'lunch',
      time: '13:00',
      label: 'Almuerzo',
      calories: 700,
      protein: 45,
      carbs: 85,
      fat: 16,
      description: 'Pasta 130g + atún 160g + ensalada + aceite',
    },
    {
      key: 'snack',
      time: '16:30',
      label: 'Merienda',
      calories: 300,
      protein: 20,
      carbs: 40,
      fat: 6,
      description: 'Yogur griego + granola + fruta',
    },
    {
      key: 'dinner',
      time: '19:30',
      label: 'Cena',
      calories: 650,
      protein: 45,
      carbs: 70,
      fat: 18,
      description: 'Pollo 180g + arroz 100g + verduras salteadas',
    },
    {
      key: 'snack_night',
      time: '21:30',
      label: 'Colación nocturna',
      calories: 300,
      protein: 25,
      carbs: 35,
      fat: 6,
      description: 'Yogur griego 200g + avena 30g',
    },
  ],
  rest: [
    {
      key: 'breakfast',
      time: '08:00',
      label: 'Desayuno',
      calories: 550,
      protein: 30,
      carbs: 65,
      fat: 16,
      description: 'Avena 70g + leche + huevos revueltos 2u + fruta',
    },
    {
      key: 'snack_am',
      time: '11:00',
      label: 'Media mañana',
      calories: 250,
      protein: 15,
      carbs: 30,
      fat: 7,
      description: 'Yogur griego 150g + fruta + nueces 20g',
    },
    {
      key: 'lunch',
      time: '13:00',
      label: 'Almuerzo',
      calories: 650,
      protein: 45,
      carbs: 70,
      fat: 18,
      description: 'Arroz 100g + pollo 180g + ensalada + aceite',
    },
    {
      key: 'snack',
      time: '16:30',
      label: 'Merienda',
      calories: 250,
      protein: 20,
      carbs: 25,
      fat: 8,
      description: 'Yogur griego + fruta + almendras',
    },
    {
      key: 'dinner',
      time: '19:30',
      label: 'Cena',
      calories: 600,
      protein: 40,
      carbs: 60,
      fat: 18,
      description: 'Pescado 160g + batata 120g + verduras',
    },
    {
      key: 'snack_night',
      time: '21:30',
      label: 'Colación nocturna',
      calories: 250,
      protein: 20,
      carbs: 25,
      fat: 6,
      description: 'Yogur griego 150g + semillas de chía',
    },
  ],
};

// Scale meal macros based on protocol multipliers vs HIGH baseline
const PROTOCOL_SCALES = { high: 1.0, medium: 0.876, low: 0.722 };

function scaleMeals(meals, protocolKey) {
  const scale = PROTOCOL_SCALES[protocolKey] ?? 1.0;
  return meals.map((m) => ({
    ...m,
    calories: Math.round(m.calories * scale),
    protein: Math.round(m.protein * scale),
    carbs: Math.round(m.carbs * scale),
    fat: Math.round(m.fat * scale),
  }));
}

function getCurrentMealBlock(meals, nowHHMM) {
  const toMinutes = (t) => {
    const [h, min] = t.split(':').map(Number);
    return h * 60 + min;
  };
  const nowMin = toMinutes(nowHHMM);
  let current = null;
  let next = null;

  for (let i = 0; i < meals.length; i++) {
    const mealMin = toMinutes(meals[i].time);
    if (mealMin <= nowMin) {
      current = meals[i];
    } else if (!next) {
      next = meals[i];
    }
  }
  return { current, next };
}

function generateAlerts(whoopData) {
  const alerts = [];
  const { recovery_score, hrv, hrv_baseline, strain, deep_sleep_minutes } = whoopData;

  if (recovery_score !== null && recovery_score < 33) {
    alerts.push({
      level: 'critical',
      message: 'Día de recuperación — activar protocolo bajo en calorías y carbohidratos.',
    });
  }
  if (hrv && hrv_baseline && hrv < hrv_baseline * 0.8) {
    alerts.push({
      level: 'warning',
      message: 'Sistema nervioso fatigado — reducir CHO intra-entrenamiento.',
    });
  }
  const hour = new Date().getHours();
  if (strain && strain > 18 && hour < 15) {
    alerts.push({
      level: 'warning',
      message: 'Carga alta temprana — adelantar ventana post-entreno.',
    });
  }
  if (deep_sleep_minutes !== null && deep_sleep_minutes < 60) {
    alerts.push({
      level: 'info',
      message: 'Sueño profundo insuficiente — aumentar colación nocturna a 40g proteína.',
    });
  }
  return alerts;
}

module.exports = {
  getProtocol,
  getTrainingType,
  MEAL_PLANS,
  scaleMeals,
  getCurrentMealBlock,
  generateAlerts,
  PROTOCOLS,
};
