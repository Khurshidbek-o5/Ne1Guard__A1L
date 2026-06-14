import { useEffect, useRef, useState } from "react";

export default function LiveCounter({ value, duration = 600, format, className }) {
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const [display, setDisplay] = useState(safeValue);
  const prevRef = useRef(safeValue);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = prevRef.current;
    const end = safeValue;
    if (start === end) return;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(end);
        prevRef.current = end;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [safeValue, duration]);

  const formatted = format ? format(display) : Math.round(display).toLocaleString();
  return <span className={className}>{formatted}</span>;
}