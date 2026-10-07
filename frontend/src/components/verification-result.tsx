import type { ReactNode } from "react";
import type { VerificationResult } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { DECISIONS, TIERS } from "@/lib/trust";
import { DecisionBadge, SeverityTag, TierBadge } from "./trust";
import { Panel } from "./ui";

/** Full, explainable rendering of one verification result. */
export function VerificationResultView({
  result,
  actions,
  headingLevel: H = "h2",
}: {
  result: VerificationResult;
  actions?: ReactNode;
  headingLevel?: "h2" | "h3";
}) {
  const tier = TIERS[result.assurance_tier];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-8">
          <div className="flex flex-wrap items-center gap-3">
            <DecisionBadge decision={result.decision} />
            <TierBadge tier={result.assurance_tier} />
          </div>
          <p className="mt-10 text-sm text-white/55">Risk score</p>
          <p className="mt-1 text-6xl font-medium tracking-tight">
            {result.risk_score}
            <span className="text-2xl text-white/55"> / 100</span>
          </p>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/70">{DECISIONS[result.decision].summary}</p>
          {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
        </Panel>

        <div className="rounded-md bg-cream p-6 text-black sm:p-8 lg:col-span-4">
          <p className="text-sm text-black/60">What this result guarantees</p>
          <p className="mt-5 text-7xl font-medium leading-none tracking-tight" aria-hidden="true">
            {result.assurance_tier}
          </p>
          <H className="mt-4 text-2xl font-medium tracking-tight">
            <span className="sr-only">Tier {result.assurance_tier}: </span>
            {tier.label}
          </H>
          <p className="mt-3 leading-relaxed text-black/70">{tier.description}</p>
          {!result.source_checked && (
            <p className="mt-6 border-t border-black/15 pt-4 text-sm text-black/70">
              Registry checks are not enabled yet, so this confirms authenticity, not validity.
            </p>
          )}
        </div>
      </div>

      <Panel>
        <div className="flex items-end justify-between gap-6">
          <H className="text-2xl font-medium tracking-tight">Forensic findings</H>
          <span className="text-white/55">({String(result.findings.length).padStart(2, "0")})</span>
        </div>
        {result.findings.length === 0 ? (
          <p className="mt-6 text-white/65">No findings were raised for this document.</p>
        ) : (
          <ul className="mt-6 divide-y divide-white/15 border-t border-white/15">
            {result.findings.map((f, i) => (
              <li key={`${f.code}-${i}`} className="grid gap-2 py-4 sm:grid-cols-[16rem_6rem_1fr] sm:items-baseline sm:gap-6">
                <code className="break-all font-mono text-xs text-white/70">{f.code}</code>
                <SeverityTag severity={f.severity} />
                <p className="leading-relaxed text-bone">{f.message}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <dl className="grid gap-6 rounded-md border border-white/15 p-6 sm:grid-cols-3 sm:p-8">
        <div>
          <dt className="text-xs text-white/55">Document fingerprint (SHA-256)</dt>
          <dd className="mt-2 break-all font-mono text-xs text-white/80">{result.document_sha256}</dd>
        </div>
        <div>
          <dt className="text-xs text-white/55">Record ID</dt>
          <dd className="mt-2 break-all font-mono text-xs text-white/80">{result.id}</dd>
        </div>
        <div>
          <dt className="text-xs text-white/55">Analysed</dt>
          <dd className="mt-2 text-sm text-white/80">{formatDate(result.created_at)}</dd>
        </div>
      </dl>
    </div>
  );
}
