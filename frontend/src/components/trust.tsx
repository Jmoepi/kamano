import { Ban, CircleCheck, CircleX, Clock, ShieldCheck, TriangleAlert } from "lucide-react";
import type { CredentialStatusValue, Decision, Severity, Tier } from "@/lib/api";
import { DECISIONS, SEVERITY_LABEL, TIERS } from "@/lib/trust";

const BADGE = "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium";

const DECISION_STYLE: Record<Decision, { cls: string; icon: typeof CircleCheck }> = {
  VERIFIED: { cls: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200", icon: CircleCheck },
  REVIEW: { cls: "border-amber-300/40 bg-amber-300/10 text-amber-100", icon: TriangleAlert },
  REJECTED: { cls: "border-red-400/40 bg-red-400/10 text-red-200", icon: CircleX },
};

export function DecisionBadge({ decision }: { decision: Decision }) {
  const { cls, icon: Icon } = DECISION_STYLE[decision];
  return (
    <span className={`${BADGE} ${cls}`}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
      {DECISIONS[decision].label}
    </span>
  );
}

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={`${BADGE} border-white/25 bg-white/5 text-bone`} title={TIERS[tier].description}>
      <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-ember" strokeWidth={1.75} />
      Tier {tier} · {TIERS[tier].label}
    </span>
  );
}

const STATUS_STYLE: Record<CredentialStatusValue, { cls: string; icon: typeof CircleCheck; label: string }> = {
  ACTIVE: { cls: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200", icon: CircleCheck, label: "Active" },
  REVOKED: { cls: "border-red-400/40 bg-red-400/10 text-red-200", icon: Ban, label: "Revoked" },
  EXPIRED: { cls: "border-amber-300/40 bg-amber-300/10 text-amber-100", icon: Clock, label: "Expired" },
};

export function StatusBadge({ status }: { status: CredentialStatusValue }) {
  const { cls, icon: Icon, label } = STATUS_STYLE[status];
  return (
    <span className={`${BADGE} ${cls}`}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
    </span>
  );
}

const SEVERITY_STYLE: Record<Severity, string> = {
  critical: "text-red-300",
  warning: "text-amber-200",
  info: "text-white/60",
};

export function SeverityTag({ severity }: { severity: Severity }) {
  return <span className={`text-xs font-medium ${SEVERITY_STYLE[severity]}`}>{SEVERITY_LABEL[severity]}</span>;
}
