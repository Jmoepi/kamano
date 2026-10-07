"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TierBadge } from "@/components/trust";
import { Button, ButtonLink, EmptyState, IndexHeading, Loading, Notice } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { documentTypeLabel } from "@/lib/trust";
import { useApi } from "@/lib/use-api";

export function CredentialList() {
  const { data, error, loading, reload } = useApi(() => api.listCredentials());

  if (loading) return <Loading label="Loading credentials" />;
  if (error)
    return (
      <div className="space-y-4">
        <Notice tone="error" title="Credentials could not be loaded">{error}</Notice>
        <Button variant="outline" onClick={reload} nudge="none">Try again</Button>
      </div>
    );

  const items = [...(data?.items ?? [])].sort(
    (a, b) => new Date(b.credential.validFrom).getTime() - new Date(a.credential.validFrom).getTime(),
  );

  if (items.length === 0)
    return (
      <EmptyState
        title="No credentials issued yet"
        description="Credentials are issued from a verification record. Verify a document, then choose “Issue a credential” on its record."
        action={<ButtonLink href="/verifications">Go to records</ButtonLink>}
      />
    );

  return (
    <div>
      <IndexHeading eyebrow="Most recent first" title="Issued credentials" count={items.length} />
      <ul className="divide-y divide-white/15">
        {items.map(({ id, credential }) => {
          const s = credential.credentialSubject;
          return (
            <li key={id}>
              <Link
                href={`/credentials/${id}`}
                className="group grid min-h-16 items-center gap-3 py-5 text-sm transition-colors hover:text-ember focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ember sm:grid-cols-4"
              >
                <span className="text-base font-medium">{s.entityName}</span>
                <span className="text-white/65 group-hover:text-ember/80">{documentTypeLabel(s.documentType)}</span>
                <span><TierBadge tier={s.assuranceTier} /></span>
                <span className="flex items-center justify-between text-white/65 group-hover:text-ember/80">
                  Valid until {formatDate(credential.validUntil)}
                  <ArrowUpRight aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
