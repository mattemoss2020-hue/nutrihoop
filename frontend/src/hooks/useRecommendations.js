import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useRecommendations() {
  const { authFetch } = useAuth();
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getRecommendation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/recommendations/now', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setRecommendation(json.recommendation);
      return json.recommendation;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { recommendation, loading, error, getRecommendation };
}

export function useChat() {
  const { authFetch } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async (text) => {
    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    setError(null);

    try {
      const res = await authFetch('/api/recommendations/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: json.reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => setMessages([]);

  return { messages, loading, error, sendMessage, clearChat };
}
