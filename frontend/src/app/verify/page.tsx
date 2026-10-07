import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/ui";
import { VerifyPanel } from "./verify-panel";

export const metadata: Metadata = { title: "Verify a document" };

export default function VerifyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Document verification"
        title="Upload a PDF. Get evidence, not a guess."
        description="Kamano analyses the file offline and explains every signal it finds. Nothing is sent to an external AI provider, and the file itself is not stored."
      />
      <Section>
        <VerifyPanel />
      </Section>
    </>
  );
}
