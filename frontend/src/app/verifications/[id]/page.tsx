import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { ButtonLink, PageHeader, Section } from "@/components/ui";
import { VerificationDetail } from "./verification-detail";

export const metadata: Metadata = { title: "Verification record" };

export default async function VerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <PageHeader
        eyebrow="Verification record"
        title="The evidence behind one decision."
        description={<span className="break-all font-mono text-base">{id}</span>}
      >
        <ButtonLink href="/verifications" variant="outline" icon={ArrowLeft} nudge="none">
          All records
        </ButtonLink>
      </PageHeader>
      <Section>
        <VerificationDetail id={id} />
      </Section>
    </>
  );
}
