import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { ButtonLink, PageHeader, Section } from "@/components/ui";
import { CredentialDetail } from "./credential-detail";

export const metadata: Metadata = { title: "Credential" };

export default async function CredentialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <PageHeader
        eyebrow="Trust credential"
        title="A portable proof, with its status."
        description={<span className="break-all font-mono text-base">{id}</span>}
      >
        <ButtonLink href="/credentials" variant="outline" icon={ArrowLeft} nudge="none">
          All credentials
        </ButtonLink>
      </PageHeader>
      <Section>
        <CredentialDetail id={id} />
      </Section>
    </>
  );
}
