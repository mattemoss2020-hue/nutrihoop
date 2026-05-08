const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildNutritionPrompt({ recovery, cycle, sleep, trainingType, protocol, currentTime }) {
  const trainingLabels = { double: 'DOBLE TURNO', single: 'turno simple', rest: 'descanso' };

  return `Sos el nutricionista deportivo de Matteo Mossin, tenista de 16 años.
Datos de hoy del Whoop:
- Recovery: ${recovery?.recovery_score ?? 'no disponible'}%
- HRV: ${recovery?.hrv ?? 'no disponible'} ms (baseline personal: ~65 ms)
- Strain hasta ahora: ${cycle?.strain ?? 'no disponible'}
- Sueño anoche: ${sleep?.sleep_score ?? 'no disponible'}% (${sleep?.deep_sleep_minutes ?? '?'} min profundo, ${sleep?.rem_sleep_minutes ?? '?'} min REM)
- Calorías quemadas hoy: ${cycle?.calories_burned ?? 'no disponible'} kcal
- Hora actual: ${currentTime}
- Día de entrenamiento: ${trainingLabels[trainingType] ?? trainingType}

Protocolo activo según recovery: ${protocol.label} (${protocol.calories} kcal | P: ${protocol.protein}g | CHO: ${protocol.carbs}g | G: ${protocol.fat}g)

Dame una recomendación nutricional específica para AHORA MISMO.
Incluí: qué comer, cantidad exacta, timing, y una alerta si algo está fuera de rango.
Respondé en español, máximo 4 oraciones, directo y accionable.`;
}

async function getRecommendation(context) {
  const prompt = buildNutritionPrompt(context);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system:
      'Sos un nutricionista deportivo especializado en tenis de élite juvenil. Respondés siempre en español rioplatense, de forma concisa y con datos concretos.',
    messages: [{ role: 'user', content: prompt }],
  });

  return {
    text: message.content[0]?.text ?? '',
    prompt,
    tokens_used: message.usage?.input_tokens + message.usage?.output_tokens,
  };
}

async function getChatResponse(messages, context) {
  const systemPrompt = `Sos el nutricionista deportivo de Matteo Mossin, tenista de 16 años de alto rendimiento.
Datos actuales: Recovery ${context.recovery?.recovery_score ?? '?'}%, HRV ${context.recovery?.hrv ?? '?'} ms, Strain ${context.cycle?.strain ?? '?'}, Sueño ${context.sleep?.sleep_score ?? '?'}%.
Protocolo activo: ${context.protocol?.label} (${context.protocol?.calories} kcal).
Respondés en español rioplatense, con datos concretos y recomendaciones accionables.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: systemPrompt,
    messages,
  });

  return response.content[0]?.text ?? '';
}

module.exports = { getRecommendation, getChatResponse, buildNutritionPrompt };
