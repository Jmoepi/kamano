"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DecisionBadge, TierBadge } from "@/components/trust";
import { Button, ButtonLink, EmptyState, IndexHeading, Loading, Notice, Panel, Stat } from "@/components/ui";
import { api, type DashboardStats, type VerificationResult } from "@/lib/api";
import { byNewest, formatDate, shortId } from "@/lib/format";
import { DECISIONS, TIERS } from "@/lib/trust";
import { useApi } from "@/lib/use-api";

type Loaded = { stats: DashboardStats; recent: VerificationResult[] };

export function DashboardView() {
  const { data, error, loading, reload } = useApi<Loaded>(async () => {
    const [stats, list] = await Promise.all([api.dashboardStats(), api.listVerifications()]);
    return { stats, recent: byNewest(list.items).slice(0, 5) };
  });

  if (loading) return <Loading label="Loading overview" />;
  if (error || !data)
    return (
      <div className="space-y-4">
        <Notice tone="error" title="The overview could not be loaded">{error}</Notice>
        <Button variant="outline" onClick={reload} nudge="none">Try again</Button>
      </div>
    );

  const { stats, recent } = data;
  if (stats.total_verifications === 0)
    return (
      <EmptyState
        title="Nothing to report yet"
        description="Activity appears here once the first document has been verified."
        action={<ButtonLink href="/verify">Verify a document</ButtonLink>}
      />
    );

  const verified = stats.by_decision.VERIFIED ?? 0;
  const tierC = stats.by_assurance_tier.C ?? 0;

  return (
    <div className="space-y-16">
      <div className="grid gap-8 border-b border-white/15 pb-10 sm:grid-cols-2 md:grid-cols-4">
        <Stat label="Verifications" value={stats.total_verifications} />
        <Stat label="Verified" value={`${Math.round((verified / stats.total_verifications) * 100)}%`} />
        <Stat label="Credentials issued" value={stats.total_credentials} />
        <Stat label="At Tier C only" value={`${Math.round((tierC / stats.total_verifications) * 100)}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Breakdown
          title="By decision"
          rows={(["VERIFIED", "REVIEW", "REJECTED"] as const).map((d) => ({
            label: DECISIONS[d].label,
            value: stats.by_decision[d] ?? 0,
            bar: d === "VERIFIED" ? "bg-emerald-400" : d === "REVIEW" ? "bg-amber-300" : "bg-red-400",
          }))}
        />
        <Breakdown
          title="By assurance tier"
          rows={(["A", "B", "C"] as const).map((t) => ({
            label: `Tier ${t} · ${TIERS[t].label}`,
            value: stats.by_assurance_tier[t] ?? 0,
            bar: "bg-ember",
          }))}
        />
      </div>

      <div>
        <IndexHeading eyebrow="Latest activity" title="Recent verifications" count={recent.length} />
        <ul className="divide-y divide-white/15">
          {recent.map((v) => (
            <li key={v.id}>
              <Link
                href={`/verifications/${v.id}`}
                className="group grid min-h-16 items-center gap-3 py-4 text-sm transition-colors hover:text-ember focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ember sm:grid-cols-4"
              >
                <span className="font-mono font-medium">{shortId(v.id)}</span>
                <span><DecisionBadge decision={v.decision} /></span>
                <span><TierBadge tier={v.assurance_tier} /></span>
                <span className="flex items-center justify-between text-white/65 group-hover:text-ember/80">
                  {formatDate(v.created_at)}
                  <ArrowUpRight aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: { label: string; value: number; bar: string }[] }) {
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  return (
    <Panel>
      <h2 className="text-2xl font-medium tracking-tight">{title}</h2>
      <ul className="mt-8 space-y-6">
        {rows.map((r) => {
          const pct = total ? Math.round((r.value / total) * 100) : 0;
          return (
            <li key={r.label}>
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span>{r.label}</span>
                <span className="text-white/65">
                  {r.value} · {pct}%
                </span>
              </div>
              <div aria-hidden="true" className="mt-2 h-2 rounded-full bg-white/10">
                <div className={`h-2 rounded-full ${r.bar}`} style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
