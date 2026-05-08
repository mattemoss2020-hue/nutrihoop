import { useState } from 'react';
import { useWhoop } from './hooks/useWhoop';
import { useRecoveryHistory } from './hooks/useWhoop';
import { useAuth } from './contexts/AuthContext';
import { getDemoData } from './demoData';
import AuthScreen from './components/AuthScreen';
import OnboardingScreen from './components/OnboardingScreen';
import NowPanel from './components/NowPanel';
import MealTimeline from './components/MealTimeline';
import RecoveryCard from './components/RecoveryCard';
import AlertBanner from './components/AlertBanner';
import HydrationTracker from './components/HydrationTracker';
import MatchProtocol from './components/MatchProtocol';
import NutritionPlanTab from './components/NutritionPlanTab';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

function LoadingScreen() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div className="spin" style={{ width: 48, height: 48, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Cargando datos de Whoop...</p>
    </div>
  );
}

function ProtocolBadge({ protocol, trainingType }) {
  if (!protocol) return null;
  const colors = { green: 'var(--green)', yellow: 'var(--yellow)', red: 'var(--red)' };
  const c = colors[protocol.color] ?? 'var(--text-muted)';
  const trainingLabels = { double: 'Doble turno', single: 'Turno simple', rest: 'Descanso' };
  return (
    <div style={{
      background: `${c}14`, border: `1px solid ${c}55`,
      borderRadius: 'var(--radius)', padding: '16px 24px',
      display: 'flex', flexWrap: 'wrap', alignItems: 'center',
      justifyContent: 'space-between', gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Protocolo activo hoy · {trainingLabels[trainingType] ?? trainingType}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: c }}>{protocol.label}</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>({protocol.range})</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Calorías', value: `${protocol.calories.toLocaleString()} kcal`, color: 'var(--yellow)' },
          { label: 'Proteína', value: `${protocol.protein}g`, color: 'var(--blue)' },
          { label: 'Carbos', value: `${protocol.carbs}g`, color: 'var(--green)' },
          { label: 'Grasas', value: `${protocol.fat}g`, color: '#f97316' },
        ].map(({ label, value, color: tc }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: tc }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryTab() {
  const { history } = useRecoveryHistory(30);
  const chartData = [...history].reverse().map((h) => ({
    date: h.date?.slice(5),
    score: Math.round(h.recovery_score ?? 0),
    hrv: Math.round(h.hrv ?? 0),
    strain: h.strain ? parseFloat(h.strain.toFixed(1)) : 0,
  }));
  const getBarColor = (s) => s >= 67 ? 'var(--green)' : s >= 33 ? 'var(--yellow)' : 'var(--red)';
  const avg = chartData.length ? Math.round(chartData.reduce((a, b) => a + b.score, 0) / chartData.length) : null;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
        {payload.map((p) => (
          <div key={p.name} style={{ color: p.fill || 'var(--text)', fontWeight: 600 }}>{p.name}: {p.value}</div>
        ))}
      </div>
    );
  };

  if (!chartData.length) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
      Conectá Whoop para ver tu historial de 30 días.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {avg !== null && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {[
            { label: 'Recovery promedio', value: avg + '%', color: getBarColor(avg) },
            { label: 'Días en verde', value: chartData.filter((d) => d.score >= 67).length, color: 'var(--green)' },
            { label: 'Días en rojo', value: chartData.filter((d) => d.score < 33).length, color: 'var(--red)' },
          ].map(({ label, value, color: c }) => (
            <div key={label} style={{ flex: 1, minWidth: 110, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: c }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      )}
      {[
        { title: 'Recovery Score — 30 días', key: 'score', colored: true, h: 180 },
        { title: 'HRV — 30 días (ms)', key: 'hrv', fill: 'var(--blue)', h: 140 },
        { title: 'Strain diario', key: 'strain', fill: 'var(--accent)', h: 140 },
      ].map(({ title, key, colored, fill, h }) => (
        <div key={key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16 }}>{title}</h3>
          <ResponsiveContainer width="100%" height={h}>
            <BarChart data={chartData} barSize={10}>
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={key} radius={[4,4,0,0]} fill={fill ?? 'var(--accent)'} name={key}>
                {colored && chartData.map((e, i) => <Cell key={i} fill={getBarColor(e.score)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const { user, token, loading: authLoading, logout, authFetch } = useAuth();
  const { data: liveData, loading: whoopLoading, error, whoopConnected, lastUpdated, refetch } = useWhoop();
  const [tab, setTab] = useState('ahora');
  const [demoMode, setDemoMode] = useState(false);
  const connectWhoop = async () => {
    try {
      const res = await authFetch('/auth/whoop-url');
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } catch (e) {
      alert('Error al conectar Whoop');
    }
  };

  const onboardingKey = user ? `onboarding_done_${user.id}` : null;
  const [onboardingDone, setOnboardingDone] = useState(() => onboardingKey ? !!localStorage.getItem(onboardingKey) : true);

  if (authLoading) return <LoadingScreen />;
  if (!user) return <AuthScreen />;
  if (!onboardingDone) return (
    <OnboardingScreen onComplete={() => {
      localStorage.setItem(onboardingKey, '1');
      setOnboardingDone(true);
    }} />
  );

  const loading = whoopLoading;
  const isDemo = demoMode || (!whoopConnected && !loading);
  const whoopData = whoopConnected && liveData ? liveData : (isDemo ? getDemoData() : null);

  const tabStyle = (active) => ({
    padding: '7px 18px', borderRadius: 20, border: 'none',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? 'white' : 'var(--text-muted)',
    fontWeight: active ? 700 : 500, fontSize: 14,
    cursor: 'pointer', transition: 'all 0.2s',
  });

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60 }}>
      {/* Nav */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🎾</span>
            <span style={{ fontWeight: 800, fontSize: 16 }}>NutriHoop</span>
            {whoopData?.demo && (
              <span style={{ fontSize: 11, background: '#312e81', color: '#a5b4fc', padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>DEMO</span>
            )}
            {whoopData?.protocol && (
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                background: { green: 'var(--green-dim)', yellow: 'var(--yellow-dim)', red: 'var(--red-dim)' }[whoopData.protocol.color],
                color: { green: 'var(--green)', yellow: 'var(--yellow)', red: 'var(--red)' }[whoopData.protocol.color],
              }}>
                {whoopData.recovery?.recovery_score ?? '?'}% · {whoopData.protocol.label}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <nav style={{ display: 'flex', gap: 4 }}>
              <button style={tabStyle(tab === 'ahora')} onClick={() => setTab('ahora')}>Ahora</button>
              <button style={tabStyle(tab === 'partido')} onClick={() => setTab('partido')}>🎾 Partido</button>
              <button style={tabStyle(tab === 'hidratacion')} onClick={() => setTab('hidratacion')}>💧 Agua</button>
              <button style={tabStyle(tab === 'timeline')} onClick={() => setTab('timeline')}>Timeline</button>
              <button style={tabStyle(tab === 'plan')} onClick={() => setTab('plan')}>📋 Plan</button>
              <button style={tabStyle(tab === 'historial')} onClick={() => setTab('historial')}>Historial</button>
            </nav>
            {whoopConnected ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {lastUpdated && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lastUpdated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>}
                <button onClick={refetch} disabled={loading} title="Actualizar" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', padding: '4px 10px', fontSize: 14, cursor: 'pointer' }}>
                  <span className={loading ? 'spin' : ''} style={{ display: 'inline-block' }}>↻</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => setDemoMode(d => !d)} style={{ fontSize: 13, padding: '6px 14px', background: demoMode ? 'var(--accent-dim)' : 'var(--surface-2)', border: `1px solid ${demoMode ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 8, color: demoMode ? '#a5b4fc' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>
                  {demoMode ? '✓ Demo' : 'Ver demo'}
                </button>
                <button onClick={connectWhoop} style={{ fontSize: 13, padding: '6px 14px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontWeight: 700 }}>
                  Conectar Whoop
                </button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderLeft: '1px solid var(--border)', paddingLeft: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.name}</span>
              <button onClick={logout} title="Salir" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div style={{ background: 'var(--yellow-dim)', borderBottom: '1px solid var(--yellow)', padding: '8px 24px', textAlign: 'center', fontSize: 13, color: 'var(--yellow)' }}>
          {error} — mostrando datos cacheados
        </div>
      )}

      <main style={{ maxWidth: 1060, margin: '0 auto', padding: '24px 24px' }}>
        {!whoopData && !isDemo ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>🎾</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Hola, {user.name}!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 360, margin: '0 auto 32px', lineHeight: 1.7 }}>
              Conectá tu Whoop para ver tu protocolo de nutrición personalizado según tu recovery de hoy.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setDemoMode(true)} style={{ padding: '12px 28px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                Ver demo
              </button>
              <button onClick={connectWhoop} style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 'var(--radius)', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Conectar Whoop
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <AlertBanner alerts={whoopData?.alerts ?? []} />
            <ProtocolBadge protocol={whoopData?.protocol} trainingType={whoopData?.trainingType} />

            {tab === 'ahora' && <NowPanel whoopData={whoopData} />}
            {tab === 'partido' && <MatchProtocol whoopData={whoopData} />}
            {tab === 'hidratacion' && (
              <HydrationTracker
                dailyTarget={whoopData?.protocol?.label === 'ALTO' ? 4500 : whoopData?.protocol?.label === 'MEDIO' ? 3800 : 3200}
                strain={whoopData?.cycle?.strain ?? 8}
              />
            )}
            {tab === 'timeline' && <MealTimeline trainingType={whoopData?.trainingType} protocol={whoopData?.protocol} />}
            {tab === 'plan' && <NutritionPlanTab userWeight={whoopData?.cycle?.weight_kg} />}
            {tab === 'historial' && <HistoryTab />}
          </div>
        )}
      </main>
    </div>
  );
}
