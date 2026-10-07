"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Fades content up as it scrolls into view.
 * Progressive enhancement: content renders visible, and is only hidden once
 * JS confirms it sits below the fold. Respects prefers-reduced-motion.
 */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "armed" | "in">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    setState("armed");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState("in");
          observer.disconnect();
        }
      },
      { threshold: 0.18 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const motion = state === "armed" ? "reveal-armed" : state === "in" ? "reveal-in" : "";
  return (
    <div ref={ref} className={`${className} ${motion}`}>
      {children}
    </div>
  );
}
