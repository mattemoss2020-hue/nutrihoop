import { useRecoveryHistory } from '../hooks/useWhoop';
import RecoveryCard from './RecoveryCard';
import MealTimeline from './MealTimeline';
import ClaudeChat from './ClaudeChat';
import AlertBanner from './AlertBanner';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

function ProtocolHeader({ protocol, trainingType }) {
  if (!protocol) return null;

  const colors = { green: 'var(--green)', yellow: 'var(--yellow)', red: 'var(--red)' };
  const mainColor = colors[protocol.color] ?? 'var(--text-muted)';
  const trainingLabels = { double: 'DOBLE TURNO', single: 'TURNO SIMPLE', rest: 'DESCANSO' };

  return (
    <div style={{
      background: `linear-gradient(135deg, ${mainColor}22, ${mainColor}08)`,
      border: `1px solid ${mainColor}66`,
      borderRadius: 'var(--radius)',
      padding: '20px 28px',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Protocolo activo hoy
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontSize: 36, fontWeight: 900, color: mainColor }}>{protocol.label}</span>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>({protocol.range})</span>
          <span style={{ fontSize: 13, background: 'var(--surface)', padding: '3px 12px', borderRadius: 20, color: 'var(--text-muted)', fontWeight: 600 }}>
            {trainingLabels[trainingType] ?? trainingType}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Calorías', value: protocol.calories, unit: 'kcal', color: 'var(--yellow)' },
          { label: 'Proteína', value: `${protocol.protein}g`, color: 'var(--blue)' },
          { label: 'Carbos', value: `${protocol.carbs}g`, color: 'var(--green)' },
          { label: 'Grasas', value: `${protocol.fat}g`, color: '#f97316' },
        ].map(({ label, value, unit, color: c }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{value}</div>
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

  const getBarColor = (score) => {
    if (score >= 67) return 'var(--green)';
    if (score >= 33) return 'var(--yellow)';
    return 'var(--red)';
  };

  const avg = chartData.length
    ? Math.round(chartData.reduce((a, b) => a + b.score, 0) / chartData.length)
    : null;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
        {payload.map((p) => (
          <div key={p.name} style={{ color: p.fill || p.stroke, fontWeight: 600 }}>
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {avg !== null && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Recovery promedio (30d)', value: avg + '%', color: getBarColor(avg) },
            { label: 'Días en verde', value: chartData.filter((d) => d.score >= 67).length, color: 'var(--green)' },
            { label: 'Días en rojo', value: chartData.filter((d) => d.score < 33).length, color: 'var(--red)' },
          ].map(({ label, value, color: c }) => (
            <div key={label} style={{ flex: 1, minWidth: 120, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: c }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16 }}>Recovery Score — 30 días</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barSize={12}>
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis domain={[0, 100]} hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="score" radius={[4, 4, 0, 0]} name="Recovery">
              {chartData.map((entry, i) => (
                <Cell key={i} fill={getBarColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16 }}>HRV — 30 días</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={chartData} barSize={10}>
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="hrv" fill="var(--blue)" radius={[4, 4, 0, 0]} name="HRV (ms)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16 }}>Strain diario — 30 días</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={chartData} barSize={10}>
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="strain" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Strain" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Dashboard({ whoopData }) {
  const { recovery, cycle, sleep, protocol, trainingType, alerts = [] } = whoopData ?? {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AlertBanner alerts={alerts} />
      <ProtocolHeader protocol={protocol} trainingType={trainingType} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <RecoveryCard recovery={recovery} cycle={cycle} sleep={sleep} />
        <ClaudeChat protocol={protocol} />
      </div>

      <MealTimeline trainingType={trainingType} protocol={protocol} />
    </div>
  );
}
