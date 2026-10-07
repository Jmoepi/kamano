import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/ui";
import { CredentialList } from "./credential-list";

export const metadata: Metadata = { title: "Credentials" };

export default function CredentialsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Trust credentials"
        title="Verified once. Trusted many times."
        description="Ed25519-signed W3C Verifiable Credentials issued from verification records. Each one carries its assurance tier and a live revocation status."
      />
      <Section>
        <CredentialList />
      </Section>
    </>
  );
}
