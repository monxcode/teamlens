"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface UsePollingOptions {
  interval?: number; // in milliseconds
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export function usePolling<T>(
  fetcher: () => Promise<T>,
  options: UsePollingOptions = {}
) {
  const { interval = 30000, enabled = true, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep fetcher ref up to date
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const fetchData = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Fetch failed");
      setError(error);
      onError?.(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  // Set up polling
  useEffect(() => {
    if (!enabled || interval <= 0) return;

    intervalRef.current = setInterval(() => {
      fetchData();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, fetchData]);

  // Manual refresh
  const refresh = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
}

// Hook for auth-aware polling (includes token in headers)
export function useAuthenticatedPolling<T>(
  url: string,
  options: UsePollingOptions = {}
) {
  const { interval = 30000, enabled = true, onError } = options;

  const fetcher = useCallback(async (): Promise<T> => {
    const token = localStorage.getItem("pulse_token");
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
  }, [url]);

  return usePolling(fetcher, { interval, enabled, onError });
}
