import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function Field({ label, type, value, onChange, placeholder, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'name'}
        style={{
          background: 'var(--surface-2)',
          border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text)',
          padding: '13px 16px',
          fontSize: 16,
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
      />
      {error && <span style={{ fontSize: 12, color: 'var(--red)' }}>{error}</span>}
    </div>
  );
}

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode]     = useState('login'); // 'login' | 'register'
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [pass, setPass]     = useState('');
  const [err, setErr]       = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, pass);
      } else {
        if (!name.trim()) { setErr('Ingresá tu nombre'); setLoading(false); return; }
        await register(email, pass, name);
      }
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🎾</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>NutriHoop</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Nutrición deportiva en tiempo real
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 28,
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: 4, marginBottom: 24 }}>
          {[['login', 'Iniciar sesión'], ['register', 'Registrarse']].map(([m, l]) => (
            <button key={m} onClick={() => { setMode(m); setErr(''); }} style={{
              flex: 1, padding: '9px 0',
              background: mode === m ? 'var(--accent)' : 'transparent',
              border: 'none', borderRadius: 6,
              color: mode === m ? 'white' : 'var(--text-muted)',
              fontWeight: mode === m ? 700 : 400,
              fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
            }}>{l}</button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <Field label="Nombre" type="text" value={name} onChange={setName} placeholder="Matteo" />
          )}
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="matteo@ejemplo.com" />
          <Field label="Contraseña" type="password" value={pass} onChange={setPass} placeholder="Mínimo 6 caracteres" />

          {err && (
            <div style={{
              background: 'var(--red-dim)', border: '1px solid var(--red)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              fontSize: 13, color: '#fca5a5',
            }}>
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !pass}
            style={{
              padding: '14px 0',
              background: loading || !email || !pass
                ? 'var(--surface-2)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: 'var(--radius-sm)',
              color: 'white', fontWeight: 800, fontSize: 16,
              cursor: loading || !email || !pass ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'opacity 0.2s',
              marginTop: 4,
            }}
          >
            {loading ? (
              <>
                <span className="spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                {mode === 'login' ? 'Entrando...' : 'Creando cuenta...'}
              </>
            ) : mode === 'login' ? 'Entrar →' : 'Crear cuenta →'}
          </button>
        </form>
      </div>

      <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 300 }}>
        Después de entrar conectás tu cuenta de Whoop para ver tus datos en tiempo real.
      </p>
    </div>
  );
}
