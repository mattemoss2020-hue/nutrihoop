import { useRecoveryHistory } from '../hooks/useWhoop';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

function ScoreRing({ score, color }) {
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={130} height={130} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={65} cy={65} r={r} fill="none" stroke="var(--border)" strokeWidth={10} />
      <circle
        cx={65} cy={65} r={r}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
}

function StatRow({ label, value, unit, sub }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 600 }}>
        {value ?? '—'}{unit && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 3 }}>{unit}</span>}
        {sub && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>{sub}</span>}
      </span>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--green)', fontWeight: 600 }}>{payload[0].value}% recovery</div>
    </div>
  );
};

export default function RecoveryCard({ recovery, cycle, sleep }) {
  const { history } = useRecoveryHistory(14);
  const score = recovery?.recovery_score ?? null;
  const color = score >= 67 ? 'var(--green)' : score >= 33 ? 'var(--yellow)' : 'var(--red)';

  const chartData = [...history]
    .reverse()
    .slice(-14)
    .map((h) => ({ date: h.date?.slice(5), score: Math.round(h.recovery_score ?? 0) }));

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recovery Whoop</h2>
        <span style={{ fontSize: 12, color, background: color + '22', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
          {score !== null ? (score >= 67 ? 'ALTO' : score >= 33 ? 'MEDIO' : 'BAJO') : 'N/A'}
        </span>
      </div>

      {/* Score ring + stats */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ScoreRing score={score ?? 0} color={color} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 32, fontWeight: 800, color }}>{score ?? '—'}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ 100</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <StatRow label="HRV" value={recovery?.hrv ? Math.round(recovery.hrv) : null} unit="ms" sub="(base ~65)" />
          <StatRow label="FC reposo" value={recovery?.resting_hr} unit="bpm" />
          <StatRow label="Strain del día" value={cycle?.strain ? cycle.strain.toFixed(1) : null} />
          <StatRow label="Kcal quemadas" value={cycle?.calories_burned} unit="kcal" />
          <StatRow label="Sueño" value={sleep?.sleep_score} unit="%" />
        </div>
      </div>

      {/* Sleep breakdown */}
      {sleep && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Profundo', value: sleep.deep_sleep_minutes, color: '#6366f1' },
            { label: 'REM', value: sleep.rem_sleep_minutes, color: '#8b5cf6' },
            { label: 'Ligero', value: sleep.light_sleep_minutes, color: '#a78bfa' },
          ].map(({ label, value, color: c }) => (
            <div key={label} style={{ flex: 1, minWidth: 70, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{value ?? '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label} (min)</div>
            </div>
          ))}
        </div>
      )}

      {/* 14-day trend */}
      {chartData.length > 1 && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Tendencia 14 días</div>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} hide />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={67} stroke="var(--green)" strokeDasharray="3 3" strokeOpacity={0.4} />
              <ReferenceLine y={33} stroke="var(--red)" strokeDasharray="3 3" strokeOpacity={0.4} />
              <Line type="monotone" dataKey="score" stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
