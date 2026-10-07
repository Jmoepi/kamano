import type { Decision, Severity, Tier } from "./api";

/** Plain-language meaning of each assurance tier. Shown wherever a tier is. */
export const TIERS: Record<
  Tier,
  { label: string; description: string; available: boolean; basis: string }
> = {
  A: {
    label: "Source confirmed",
    description:
      "Confirmed against an authoritative registry such as SARS, CIPC, or Home Affairs.",
    basis: "Live registry check",
    available: false,
  },
  B: {
    label: "Self-validating",
    description: "The document carries a cryptographic seal or QR code that validated.",
    basis: "Seal or QR validation",
    available: false,
  },
  C: {
    label: "Not tampered",
    description:
      "Passed offline forensic analysis. The issuing source was not checked, so this confirms authenticity, not validity.",
    basis: "Offline forensic analysis",
    available: true,
  },
};

export const DECISIONS: Record<Decision, { label: string; summary: string }> = {
  VERIFIED: {
    label: "Verified",
    summary: "No forensic signals of tampering were found in this document.",
  },
  REVIEW: {
    label: "Needs review",
    summary: "Some signals need a person to look before this document is relied on.",
  },
  REJECTED: {
    label: "Rejected",
    summary: "Strong signals of editing were found. Do not rely on this document.",
  },
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
};

export const DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: "sars_tax_clearance", label: "SARS tax clearance" },
  { value: "cipc_registration", label: "CIPC company registration" },
  { value: "bbbee_certificate", label: "B-BBEE certificate or affidavit" },
  { value: "bank_confirmation", label: "Bank confirmation letter" },
  { value: "proof_of_address", label: "Proof of address" },
  { value: "other", label: "Other document" },
];

export function documentTypeLabel(value: string): string {
  return DOCUMENT_TYPES.find((d) => d.value === value)?.label ?? value;
}
