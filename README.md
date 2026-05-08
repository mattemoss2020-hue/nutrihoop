# 🎾 Matteo Nutrition — Tennis Performance App

Nutrición deportiva en tiempo real para Matteo Mossin, tenista de élite juvenil.
Conecta los datos de Whoop con Claude para generar recomendaciones nutricionales personalizadas según el recovery del día.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express |
| Frontend | React 18 + Vite |
| Base de datos | SQLite (better-sqlite3) |
| APIs externas | Whoop API v2 · Anthropic Claude API |

---

## Requisitos previos

- Node.js 18 o superior
- Una cuenta Whoop activa (con datos recientes)
- Acceso al [Whoop Developer Portal](https://developer.whoop.com)
- API key de [Anthropic Console](https://console.anthropic.com)

---

## 1. Obtener credenciales de Whoop

### Registrar una aplicación OAuth2

1. Entrá a [developer.whoop.com](https://developer.whoop.com) y logueate con tu cuenta Whoop.
2. En el menú lateral, hacé click en **"My Apps"** → **"Create App"**.
3. Completá los campos:
   - **App Name**: `Matteo Nutrition` (o cualquier nombre)
   - **Description**: uso personal
   - **Redirect URI**: `http://localhost:3000/auth/callback`
4. Seleccioná los **scopes** necesarios:
   - `read:recovery`
   - `read:cycles`
   - `read:sleep`
   - `read:workout`
   - `read:body_measurement`
   - `offline` ← importante para el refresh token
5. Guardá. Copiá el **Client ID** y el **Client Secret**.

> ⚠️ El Client Secret solo se muestra una vez. Guardalo en un lugar seguro.

---

## 2. Obtener API key de Anthropic

1. Entrá a [console.anthropic.com](https://console.anthropic.com).
2. En **API Keys** → **Create Key**.
3. Copiá la key (empieza con `sk-ant-...`).

---

## 3. Configurar variables de entorno

```bash
cd matteo-nutrition-app
cp .env.example backend/.env
```

Editá `backend/.env` con tus valores reales:

```env
WHOOP_CLIENT_ID=tu_client_id_aqui
WHOOP_CLIENT_SECRET=tu_client_secret_aqui
WHOOP_REDIRECT_URI=http://localhost:3000/auth/callback
ANTHROPIC_API_KEY=sk-ant-tu_key_aqui
PORT=3000
```

---

## 4. Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend (en otra terminal)
cd ../frontend
npm install
```

---

## 5. Correr localmente

### Terminal 1 — Backend

```bash
cd matteo-nutrition-app/backend
npm run dev
# ✅ Corriendo en http://localhost:3000
```

### Terminal 2 — Frontend

```bash
cd matteo-nutrition-app/frontend
npm run dev
# ✅ Corriendo en http://localhost:5174
```

### Abrir la app

Abrí [http://localhost:5174](http://localhost:5174) en el navegador.

---

## 6. Autenticación con Whoop

1. En la pantalla de login, hacé click en **"Conectar con Whoop"**.
2. Te redirige a la página de autorización de Whoop.
3. Loguéate con la cuenta de Matteo y aceptá los permisos.
4. El callback redirige a la app automáticamente con los tokens guardados.

> Los tokens se guardan en SQLite (`backend/matteo_nutrition.db`) y se refrescan automáticamente cada 14 minutos.

---

## Estructura del proyecto

```
matteo-nutrition-app/
├── backend/
│   ├── server.js                    # Entry point Express
│   ├── database.js                  # SQLite setup (tokens, snapshots, historial)
│   ├── routes/
│   │   ├── auth.js                  # OAuth2 Whoop flow
│   │   ├── whoop.js                 # Endpoints /api/whoop/today, /history, /cache
│   │   └── recommendations.js       # Endpoints Claude /now, /chat, /history
│   └── services/
│       ├── whoopService.js          # Lógica Whoop API v2
│       ├── claudeService.js         # Prompts y llamadas a Claude
│       └── nutritionEngine.js       # Protocolos, meal plans, alertas
├── frontend/
│   └── src/
│       ├── App.jsx                  # Layout, tabs, auth gate
│       ├── components/
│       │   ├── Dashboard.jsx        # Vista principal con header de protocolo
│       │   ├── RecoveryCard.jsx     # Ring score + gráfico 14 días
│       │   ├── MealTimeline.jsx     # Timeline con comidas ajustadas al protocolo
│       │   ├── ClaudeChat.jsx       # Chat con Claude + recomendación rápida
│       │   └── AlertBanner.jsx      # Alertas automáticas
│       └── hooks/
│           ├── useWhoop.js          # Fetch + polling cada 5 min + cache fallback
│           └── useRecommendations.js # Hook para recomendación rápida y chat
├── .env.example
└── README.md
```

---

## Protocolos nutricionales

| Recovery | Calorías | Proteína | Carbos | Grasas |
|----------|----------|----------|--------|--------|
| Alto (67–100%) | 3.880 kcal | 224g | 538g | 74g |
| Medio (33–66%) | 3.400 kcal | 210g | 430g | 68g |
| Bajo (0–32%) | 2.800 kcal | 220g | 310g | 65g |

Las comidas del timeline se escalan automáticamente según el protocolo del día.

---

## Alertas automáticas

| Condición | Alerta |
|-----------|--------|
| Recovery < 33% | Activar protocolo bajo |
| HRV < 80% del baseline | Sistema nervioso fatigado — reducir CHO intra |
| Strain > 18 antes de las 15:00 | Carga alta — adelantar post-entreno |
| Sueño profundo < 60 min | Aumentar colación nocturna a 40g proteína |

---

## Modo offline

Si la conexión a Whoop falla, la app sirve automáticamente los últimos datos guardados en SQLite con un banner indicando que son datos cacheados.

---

## Base de datos SQLite

Archivo: `backend/matteo_nutrition.db` (se crea automáticamente al primer arranque)

| Tabla | Contenido |
|-------|-----------|
| `tokens` | Access token + refresh token de Whoop |
| `whoop_snapshots` | Snapshot diario de recovery, HRV, strain, sueño |
| `recommendations` | Historial de recomendaciones de Claude |
| `nutrition_log` | Registro de comidas completadas |

---

## Scripts disponibles

```bash
# Backend
npm start       # Producción
npm run dev     # Desarrollo con nodemon

# Frontend
npm run dev     # Dev server (hot reload)
npm run build   # Build de producción
npm run preview # Preview del build
```

---

## Troubleshooting

**"No tokens stored — authenticate first"**
→ Todavía no hiciste el OAuth flow. Entrá a la app y hacé click en "Conectar con Whoop".

**"HTTP 401" en endpoints de Whoop**
→ El token expiró y el refresh falló. Hacé logout desde la app y volvé a autenticarte.

**Claude responde en inglés**
→ Verificá que `ANTHROPIC_API_KEY` esté bien configurada y que la cuenta tenga crédito disponible.

**El frontend muestra datos de caché aunque Whoop esté online**
→ Esperá que pasen 5 minutos (intervalo de polling) o presioná el botón ↻ en el header.
