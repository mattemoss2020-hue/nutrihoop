import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const POLL_INTERVAL = 5 * 60 * 1000;

export function useWhoop() {
  const { authFetch, user } = useAuth();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [whoopConnected, setWhoopConnected] = useState(false);
  const [lastUpdated, setLastUpdated]       = useState(null);

  const fetchData = useCallback(async (useCache = false) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = useCache ? '/api/whoop/cache' : '/api/whoop/today';
      const res = await authFetch(endpoint);
      if (res.status === 401) { setLoading(false); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setWhoopConnected(true);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
      if (!useCache) {
        try {
          const res = await authFetch('/api/whoop/cache');
          if (res.ok) { const json = await res.json(); setData(json); setLastUpdated(new Date()); }
        } catch { /* no cache */ }
      }
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  // Check Whoop connection status
  const checkWhoop = useCallback(async () => {
    try {
      const res = await authFetch('/auth/whoop-status');
      if (res.ok) {
        const json = await res.json();
        setWhoopConnected(json.connected);
        return json.connected;
      }
    } catch { /* ignore */ }
    return false;
  }, [authFetch]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    checkWhoop().then(connected => {
      if (connected) fetchData();
      else setLoading(false);
    });
  }, [user]); // eslint-disable-line

  useEffect(() => {
    if (!whoopConnected) return;
    const id = setInterval(() => fetchData(), POLL_INTERVAL);
    return () => clearInterval(id);
  }, [whoopConnected, fetchData]);

  return { data, loading, error, whoopConnected, lastUpdated, refetch: () => fetchData() };
}

export function useRecoveryHistory(days = 30) {
  const { authFetch } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`/api/whoop/history?days=${days}`)
      .then(r => r.json())
      .then(d => setHistory(d.history ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]); // eslint-disable-line

  return { history, loading };
}
