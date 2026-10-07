import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/ui";
import { AuditView } from "./audit-view";

export const metadata: Metadata = { title: "Audit log" };

export default function AuditPage() {
  return (
    <>
      <PageHeader
        eyebrow="POPIA audit trail"
        title="Every action, on the record."
        description="An append-only log of verifications, issuance, revocations, and consent. Entries cannot be edited or deleted."
      />
      <Section>
        <AuditView />
      </Section>
    </>
  );
}
