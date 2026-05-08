import { useState, useRef, useEffect } from 'react';
import { useRecommendations, useChat } from '../hooks/useRecommendations';

function QuickRec({ protocol }) {
  const { recommendation, loading, error, getRecommendation } = useRecommendations();

  return (
    <div style={{ marginBottom: 20 }}>
      <button
        onClick={getRecommendation}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px 20px',
          background: loading ? 'var(--surface-2)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          color: 'white',
          fontWeight: 700,
          fontSize: 15,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'opacity 0.2s',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <>
            <span className="spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
            Consultando a Claude...
          </>
        ) : (
          <>✨ Consultá a Claude ahora</>
        )}
      </button>

      {error && (
        <p style={{ marginTop: 8, fontSize: 13, color: 'var(--red)' }}>{error}</p>
      )}

      {recommendation && (
        <div
          className="fade-in"
          style={{
            marginTop: 12,
            background: 'var(--surface-2)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-sm)',
            padding: 16,
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--text)',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Claude — Protocolo {protocol?.label}
          </div>
          {recommendation}
        </div>
      )}
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div
      className="fade-in"
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 10,
        alignItems: 'flex-end',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: isUser ? 'var(--blue)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {isUser ? 'M' : '✨'}
      </div>
      <div
        style={{
          maxWidth: '78%',
          background: isUser ? 'var(--blue-dim)' : 'var(--surface-2)',
          border: `1px solid ${isUser ? 'var(--blue)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

export default function ClaudeChat({ protocol }) {
  const { messages, loading, sendMessage, clearChat } = useChat();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    sendMessage(text);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Consultá a Claude
        </h2>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Limpiar chat
          </button>
        )}
      </div>

      <QuickRec protocol={protocol} />

      {/* Chat messages */}
      {messages.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 320, overflowY: 'auto', padding: '4px 0' }}>
          {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', flexShrink: 0 }} />
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                <span className="spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Preguntale algo a Claude sobre tu nutrición de hoy..."
          rows={2}
          style={{
            flex: 1,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text)',
            padding: '10px 14px',
            fontSize: 14,
            resize: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.5,
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          style={{
            padding: '0 18px',
            background: input.trim() ? 'var(--accent)' : 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'white',
            fontSize: 18,
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s',
          }}
        >
          ↑
        </button>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -8 }}>Enter para enviar · Shift+Enter para nueva línea</p>
    </div>
  );
}
