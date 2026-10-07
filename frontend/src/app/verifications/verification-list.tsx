"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DecisionBadge, TierBadge } from "@/components/trust";
import { Button, ButtonLink, EmptyState, IndexHeading, Loading, Notice } from "@/components/ui";
import { api } from "@/lib/api";
import { byNewest, formatDate, shortId } from "@/lib/format";
import { useApi } from "@/lib/use-api";

export function VerificationList() {
  const { data, error, loading, reload } = useApi(() => api.listVerifications());

  if (loading) return <Loading label="Loading records" />;
  if (error)
    return (
      <div className="space-y-4">
        <Notice tone="error" title="Records could not be loaded">{error}</Notice>
        <Button variant="outline" onClick={reload} nudge="none">Try again</Button>
      </div>
    );

  const items = byNewest(data?.items ?? []);
  if (items.length === 0)
    return (
      <EmptyState
        title="No verifications yet"
        description="Upload a PDF to create the first record. It will appear here with its findings and assurance tier."
        action={<ButtonLink href="/verify">Verify a document</ButtonLink>}
      />
    );

  return (
    <div>
      <IndexHeading eyebrow="Most recent first" title="All records" count={items.length} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <caption className="sr-only">Verification records</caption>
          <thead>
            <tr className="border-b border-white/15 text-xs text-white/55">
              <th scope="col" className="py-4 pr-4 font-normal">Record</th>
              <th scope="col" className="py-4 pr-4 font-normal">Decision</th>
              <th scope="col" className="py-4 pr-4 font-normal">Assurance</th>
              <th scope="col" className="py-4 pr-4 font-normal">Risk</th>
              <th scope="col" className="py-4 font-normal">Analysed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/15">
            {items.map((v) => (
              <tr key={v.id} className="group transition-colors hover:bg-white/[0.03]">
                <td className="py-4 pr-4">
                  <Link
                    href={`/verifications/${v.id}`}
                    className="inline-flex min-h-11 items-center gap-2 font-mono font-medium transition-colors group-hover:text-ember focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember"
                  >
                    {shortId(v.id)}
                    <ArrowUpRight aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
                    <span className="sr-only">Open record</span>
                  </Link>
                </td>
                <td className="py-4 pr-4"><DecisionBadge decision={v.decision} /></td>
                <td className="py-4 pr-4"><TierBadge tier={v.assurance_tier} /></td>
                <td className="py-4 pr-4 text-white/80">{v.risk_score}</td>
                <td className="py-4 text-white/65">{formatDate(v.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
