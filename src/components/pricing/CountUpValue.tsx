import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export interface CountUpValueProps {
  value: number;
  format: (value: number) => string;
  /** Duração da animação em ms */
  duration?: number;
  className?: string;
}

const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

/**
 * Anima do valor anterior até o novo valor com easing ease-out.
 * Ajustes em tempo real (slider) reiniciam a animação a partir do
 * valor exibido, mantendo a sensação de "calculadora viva".
 */
export function CountUpValue({
  value,
  format,
  duration = 900,
  className,
}: CountUpValueProps) {
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const target = Number.isFinite(value) ? value : 0;
    const from = displayRef.current;
    if (Math.abs(target - from) < 0.5) {
      displayRef.current = target;
      setDisplay(target);
      return;
    }

    const start = performance.now();
    const span = Math.abs(target - from) > 200 ? duration : 260;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / span, 1);
      const next = from + (target - from) * easeOut(progress);
      displayRef.current = next;
      setDisplay(next);
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return (
    <span className={cn("tabular", className)}>{format(display)}</span>
  );
}
