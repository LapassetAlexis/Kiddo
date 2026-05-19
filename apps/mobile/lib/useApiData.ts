import { useState, useEffect, useCallback } from 'react';
import { ApiError } from './api-client';

interface ApiDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isUnauthorized: boolean;
  refresh: () => void;
}

export function useApiData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): ApiDataState<T> {
  const [data, setData]             = useState<T | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [tick, setTick]             = useState(0);

  const refresh = useCallback(() => {
    setIsUnauthorized(false);
    setTick(t => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then(d => {
        if (!cancelled) { setData(d); setLoading(false); }
      })
      .catch(e => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          // Token expiré — on signale sans naviguer (le composant décide)
          setIsUnauthorized(true);
          setLoading(false);
          return;
        }
        setError(e instanceof ApiError ? e.message : 'Erreur de connexion');
        setLoading(false);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { data, loading, error, isUnauthorized, refresh };
}
