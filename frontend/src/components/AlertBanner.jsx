export default function AlertBanner({ alerts = [] }) {
  if (!alerts.length) return null;

  const icons = { critical: '🚨', warning: '⚠️', info: 'ℹ️' };
  const colors = {
    critical: { bg: '#7f1d1d', border: '#ef4444', text: '#fca5a5' },
    warning: { bg: '#713f12', border: '#eab308', text: '#fde68a' },
    info: { bg: '#1e3a5f', border: '#3b82f6', text: '#93c5fd' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {alerts.map((alert, i) => {
        const c = colors[alert.level] ?? colors.info;
        return (
          <div
            key={i}
            className="fade-in"
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: 'var(--radius-sm)',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 14,
              color: c.text,
            }}
          >
            <span style={{ fontSize: 16 }}>{icons[alert.level]}</span>
            <span>{alert.message}</span>
          </div>
        );
      })}
    </div>
  );
}
