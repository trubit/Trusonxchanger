import { useEffect, useMemo, useState } from "react";

const DEFAULT_INTERVAL_MS = 6000;

export const useBlogs = (posts, options = {}) => {
  const { intervalMs = DEFAULT_INTERVAL_MS } = options;
  const list = Array.isArray(posts) ? posts : [];
  const [activeIndex, setActiveIndexState] = useState(0);

  useEffect(() => {
    if (list.length <= 1) return undefined;
    const interval = window.setInterval(() => {
      setActiveIndexState((prev) => (prev + 1) % list.length);
    }, intervalMs);
    return () => window.clearInterval(interval);
  }, [intervalMs, list.length]);

  const normalizedActiveIndex = useMemo(() => {
    if (list.length === 0) return 0;
    return activeIndex % list.length;
  }, [activeIndex, list.length]);

  const setActiveIndex = (next) => {
    if (list.length === 0) {
      setActiveIndexState(0);
      return;
    }
    const parsed = Number(next);
    if (!Number.isFinite(parsed)) return;
    const safeValue = Math.max(0, Math.floor(parsed) % list.length);
    setActiveIndexState(safeValue);
  };

  return { activeIndex: normalizedActiveIndex, setActiveIndex };
};

