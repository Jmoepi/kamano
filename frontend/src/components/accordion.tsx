"use client";

import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";

export type AccordionItem = { title: string; body: string; meta?: string };

/** Numbered steps on dark; exactly one step is always open. */
export function ProcessAccordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState(0);
  const base = useId();

  return (
    <div>
      {items.map((item, i) => {
        const isOpen = open === i;
        const buttonId = `${base}-button-${i}`;
        const panelId = `${base}-panel-${i}`;
        const Icon = isOpen ? Minus : Plus;
        return (
          <div key={item.title} className={`border-t border-white/20 ${i === items.length - 1 ? "border-b" : ""}`}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(i)}
                className="grid w-full grid-cols-[3rem_1fr_auto] items-start gap-3 py-8 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ember sm:grid-cols-[4rem_1fr_auto] sm:gap-5"
              >
                <span className={`pt-2 text-sm ${isOpen ? "text-ember" : "text-white/55"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-2xl font-medium tracking-tight sm:text-3xl">{item.title}</span>
                <Icon aria-hidden="true" strokeWidth={1.5} className="mt-2 h-5 w-5" />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="animate-fade-down pb-8 pl-[3.75rem] pr-8 sm:pl-[5.25rem] sm:pr-10"
            >
              <p className="max-w-xl text-lg leading-relaxed text-white/65">{item.body}</p>
              {item.meta && <p className="mt-5 text-sm text-white/55">{item.meta}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Questions on a light (paper) section; at most one open at a time. */
export function FaqAccordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const base = useId();

  return (
    <div className="divide-y divide-black/20 border-y border-black/20">
      {items.map((item, i) => {
        const isOpen = open === i;
        const buttonId = `${base}-button-${i}`;
        const panelId = `${base}-panel-${i}`;
        const Icon = isOpen ? Minus : Plus;
        return (
          <div key={item.title}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex min-h-20 w-full items-center justify-between gap-5 py-4 text-left text-lg font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black"
              >
                {item.title}
                <Icon aria-hidden="true" strokeWidth={1.5} className="h-5 w-5 shrink-0" />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="animate-fade-down pb-6 pr-10 text-base leading-relaxed text-black/70"
            >
              {item.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
