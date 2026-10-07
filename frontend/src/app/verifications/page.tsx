import type { Metadata } from "next";
import { ArrowDownRight } from "lucide-react";
import { ButtonLink, PageHeader, Section } from "@/components/ui";
import { VerificationList } from "./verification-list";

export const metadata: Metadata = { title: "Verification records" };

export default function VerificationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Verification records"
        title="Every document, with its evidence."
        description="Derived records only: the fingerprint, findings, decision, and assurance tier. Raw files are never stored."
      >
        <ButtonLink href="/verify" icon={ArrowDownRight} nudge="down-right">
          Verify a document
        </ButtonLink>
      </PageHeader>
      <Section>
        <VerificationList />
      </Section>
    </>
  );
}
