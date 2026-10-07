import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/ui";
import { CredentialChecker } from "./credential-checker";

export const metadata: Metadata = { title: "Check a credential" };

export default function CheckPage() {
  return (
    <>
      <PageHeader
        eyebrow="Credential check"
        title="Was this really issued by Kamano?"
        description="Paste a credential to confirm its signature, its validity period, and that it hasn't been revoked."
      />
      <Section>
        <CredentialChecker />
      </Section>
    </>
  );
}
