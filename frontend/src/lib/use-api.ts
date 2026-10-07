"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Minimal data-loading hook: runs `loader` on mount, exposes reload. */
export function useApi<T>(loader: () => Promise<T>) {
  const loaderRef = useRef(loader);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loaderRef.current = loader;
  });

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loaderRef.current());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}
