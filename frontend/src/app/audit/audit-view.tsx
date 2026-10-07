"use client";

import { useState } from "react";
import { Button, EmptyState, IndexHeading, Loading, Notice } from "@/components/ui";
import { api } from "@/lib/api";
import { byNewest, formatDate } from "@/lib/format";
import { useApi } from "@/lib/use-api";

export function AuditView() {
  const { data, error, loading, reload } = useApi(() => api.auditLog());
  const [filter, setFilter] = useState("all");

  if (loading) return <Loading label="Loading audit log" />;
  if (error)
    return (
      <div className="space-y-4">
        <Notice tone="error" title="The audit log could not be loaded">{error}</Notice>
        <Button variant="outline" onClick={reload} nudge="none">Try again</Button>
      </div>
    );

  const all = byNewest(data?.items ?? []);
  if (all.length === 0)
    return <EmptyState title="No events yet" description="Events are recorded as soon as documents are verified or credentials change." />;

  const types = Array.from(new Set(all.map((e) => e.event_type))).sort();
  const items = filter === "all" ? all : all.filter((e) => e.event_type === filter);

  return (
    <div>
      <IndexHeading eyebrow="Newest first" title="Events" count={items.length} />

      <fieldset className="mt-6">
        <legend className="sr-only">Filter by event type</legend>
        <div className="flex flex-wrap gap-2">
          {["all", ...types].map((t) => {
            const active = filter === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(t)}
                className={`min-h-11 rounded-md border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember ${
                  active ? "border-ember bg-ember text-black" : "border-white/20 text-white/75 hover:border-white/50 hover:text-white"
                }`}
              >
                {t === "all" ? "All events" : t}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <caption className="sr-only">Audit events</caption>
          <thead>
            <tr className="border-b border-white/15 text-xs text-white/55">
              <th scope="col" className="py-4 pr-4 font-normal">When</th>
              <th scope="col" className="py-4 pr-4 font-normal">Event</th>
              <th scope="col" className="py-4 pr-4 font-normal">Resource</th>
              <th scope="col" className="py-4 font-normal">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/15">
            {items.map((e) => (
              <tr key={e.id} className="align-top">
                <td className="whitespace-nowrap py-4 pr-4 text-white/65">{formatDate(e.created_at)}</td>
                <td className="py-4 pr-4 font-mono text-xs text-ember">{e.event_type}</td>
                <td className="py-4 pr-4">
                  <span className="text-white/80">{e.resource_type ?? "—"}</span>
                  {e.resource_id && <span className="mt-1 block break-all font-mono text-xs text-white/55">{e.resource_id}</span>}
                </td>
                <td className="py-4 font-mono text-xs text-white/65">
                  {e.metadata && Object.keys(e.metadata).length > 0
                    ? Object.entries(e.metadata).map(([k, v]) => (
                        <span key={k} className="mr-4 inline-block">
                          {k}: {String(v)}
                        </span>
                      ))
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
