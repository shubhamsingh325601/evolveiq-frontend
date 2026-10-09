import { useEffect, useRef, useState } from 'react';

/**
 * The rendered width of an element, kept current as it resizes. Charts draw
 * in real pixels with it so their text never scales with the container.
 * Until the first measurement (and in test DOMs, which have no layout) the
 * fallback stands in.
 */
export function useElementWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const next = Math.round(element.getBoundingClientRect().width);
      if (next > 0) setWidth(next);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}
