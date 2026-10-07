import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ButtonLink, PageHeader, Section } from "@/components/ui";
import { DashboardView } from "./dashboard-view";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Trust activity at a glance."
        description="Decisions and assurance tiers across every verification, plus the credentials issued from them."
      >
        <ButtonLink href="/audit" variant="outline" icon={ArrowRight} nudge="right">
          Open audit log
        </ButtonLink>
      </PageHeader>
      <Section>
        <DashboardView />
      </Section>
    </>
  );
}
