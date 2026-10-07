import Link from "next/link";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  Layers,
  MapPin,
  Quote,
  ScanText,
  type LucideIcon,
} from "lucide-react";
import { FaqAccordion, ProcessAccordion } from "@/components/accordion";
import { LogoMark } from "@/components/logo";
import { Reveal } from "@/components/reveal";
import { ButtonLink, Container } from "@/components/ui";
import { TIERS } from "@/lib/trust";
import type { Tier } from "@/lib/api";

const PROOF = [
  { label: "External AI calls", value: "0" },
  { label: "Assurance tiers", value: "3" },
  { label: "Credential signatures", value: "Ed25519" },
  { label: "Data region", value: "af-south-1" },
];

const CAPABILITIES: {
  n: string;
  title: string;
  body: string;
  meta: string;
  icon: LucideIcon;
  surface: string;
  iconCls: string;
  muted: string;
}[] = [
  {
    n: "01",
    title: "Offline forensics",
    body: "Metadata, font, and file-structure checks run inside Kamano. Deterministic, so the same file always gives the same result.",
    meta: "PyMuPDF · OpenCV · No external AI",
    icon: ScanText,
    surface: "bg-ink-raised text-bone hover:border-ember/70",
    iconCls: "text-ember",
    muted: "text-white/65",
  },
  {
    n: "02",
    title: "Assurance tiers",
    body: "Every result states what it actually guarantees: tampering ruled out, seal validated, or source confirmed.",
    meta: "Tier A · Tier B · Tier C",
    icon: Layers,
    surface: "bg-cream text-black hover:border-ember",
    iconCls: "text-ember-deep",
    muted: "text-black/65",
  },
  {
    n: "03",
    title: "Reusable credentials",
    body: "Signed W3C Verifiable Credentials that any party can check independently, with revocation built in.",
    meta: "Ed25519 · W3C VC · Live status",
    icon: BadgeCheck,
    surface: "bg-lagoon text-bone hover:border-cyan-300/70",
    iconCls: "text-cyan-200",
    muted: "text-white/70",
  },
  {
    n: "04",
    title: "Sovereign by design",
    body: "The API refuses to start outside af-south-1. Raw documents are not retained; derived records keep the audit trail.",
    meta: "POPIA · FICA-aligned · Append-only audit",
    icon: MapPin,
    surface: "bg-crimson text-bone hover:border-red-200/70",
    iconCls: "text-red-100",
    muted: "text-white/75",
  },
];

const STEPS = [
  {
    title: "Upload and analyse",
    body: "A PDF is checked offline for editing software, changes after creation, font anomalies, and incremental saves.",
    meta: "Output: reason codes and a risk score",
  },
  {
    title: "State the assurance",
    body: "Each result is tagged Tier A, B, or C, so nobody mistakes “not tampered” for “confirmed valid”.",
    meta: "Output: a decision with an honest tier",
  },
  {
    title: "Issue a credential",
    body: "A verified result can be issued as an Ed25519-signed W3C credential for the entity, after a person has reviewed it.",
    meta: "Output: a portable, verifiable credential",
  },
  {
    title: "Reuse and revoke",
    body: "Holders share credentials with consent. Anyone can check the signature, expiry, and live revocation status.",
    meta: "Output: verify once, trusted many times",
  },
];

const VERTICALS = [
  { name: "Fintech KYC and CDD", stage: "Launch focus", scope: "Onboarding, FICA due diligence", when: "Now" },
  { name: "Property and rental", stage: "Roadmap", scope: "Tenant screening", when: "Next" },
  { name: "Vehicle finance", stage: "Roadmap", scope: "Income and address checks", when: "Later" },
  { name: "Legal and professional", stage: "Roadmap", scope: "Client onboarding", when: "Later" },
  { name: "Public sector", stage: "Roadmap", scope: "Supplier vetting", when: "Later" },
];

const FAQ = [
  {
    title: "Does any of my data leave South Africa?",
    body: "Document analysis runs entirely inside the Kamano service, with no calls to external AI providers. The API refuses to start unless its data region is af-south-1 (Cape Town).",
  },
  {
    title: "Does “Verified” mean the certificate is genuine?",
    body: "Not on its own. Today Kamano confirms that a document has not been tampered with (Tier C). Confirming that a certificate is real and current needs a registry check, which is Tier A and on the roadmap.",
  },
  {
    title: "What happens to the documents I upload?",
    body: "Files are analysed in memory and are not stored. Kamano keeps a SHA-256 fingerprint, the findings, and an audit entry, which is what an auditor needs.",
  },
  {
    title: "Can a credential be withdrawn?",
    body: "Yes. A credential can be revoked at any time, and every check reads its live revocation status, so a revoked credential stops passing immediately.",
  },
];

const TIER_ORDER: Tier[] = ["C", "B", "A"];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate min-h-screen overflow-hidden bg-ember-hero text-black">
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <LogoMark className="absolute -right-[12rem] top-1/2 h-[min(125vh,72rem)] w-[min(125vh,72rem)] -translate-y-1/2 text-black/[0.09]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-transparent to-black/25" />
        </div>

        <Container className="flex min-h-screen flex-col justify-end pb-8 pt-28 sm:pb-10">
          <div className="max-w-5xl">
            <p className="mb-5 animate-rise text-sm font-medium text-black/75" style={{ animationDelay: "120ms" }}>
              Digital trust infrastructure · South Africa
            </p>
            <h1
              className="max-w-5xl animate-rise text-5xl font-medium leading-[0.92] tracking-tight sm:text-7xl lg:text-8xl"
              style={{ animationDelay: "225ms" }}
            >
              Trust that holds up to an audit.
            </h1>
            <div className="mt-7 grid gap-6 border-t border-black/30 pt-6 md:grid-cols-12 md:items-end">
              <p
                className="animate-rise text-lg leading-relaxed text-black/80 md:col-span-6 lg:col-span-5"
                style={{ animationDelay: "330ms" }}
              >
                Offline document forensics, explainable reason codes, and reusable credentials for
                FICA-grade onboarding. Your data stays in South Africa.
              </p>
              <div
                className="flex animate-rise flex-col gap-3 sm:flex-row md:col-span-6 md:justify-end"
                style={{ animationDelay: "435ms" }}
              >
                <ButtonLink href="/verify" variant="dark" icon={ArrowDownRight} nudge="down-right">
                  Verify a document
                </ButtonLink>
                <ButtonLink href="/check" variant="outline-dark" nudge="none">
                  Check a credential
                </ButtonLink>
              </div>
            </div>
          </div>

          <div
            className="mt-9 flex animate-rise items-center justify-between text-xs text-black/70"
            style={{ animationDelay: "540ms" }}
          >
            <span>Kamano: Sesotho for “connection”</span>
            <a
              href="#proof"
              className="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              Scroll to discover
              <ArrowDown aria-hidden="true" strokeWidth={1.5} className="h-4 w-4" />
            </a>
          </div>
        </Container>
      </section>

      {/* Proof */}
      <section id="proof" aria-label="Kamano at a glance" className="border-b border-white/15">
        <Container className="grid gap-8 py-10 sm:grid-cols-2 md:grid-cols-4">
          {PROOF.map((p) => (
            <Reveal key={p.label}>
              <p className="text-xs text-white/55">{p.label}</p>
              <p className="mt-2 text-3xl font-medium tracking-tight">{p.value}</p>
            </Reveal>
          ))}
        </Container>
      </section>

      {/* Capabilities */}
      <section className="py-20 sm:py-28">
        <Container>
          <Reveal className="grid gap-8 border-b border-white/15 pb-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-sm text-ember">What Kamano does</p>
            </div>
            <div className="lg:col-span-8">
              <h2 className="max-w-4xl text-4xl font-medium leading-tight tracking-tight sm:text-6xl">
                One trust layer, from the first upload to the final audit.
              </h2>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            {CAPABILITIES.map(({ icon: Icon, ...c }) => (
              <Reveal key={c.n}>
                <article
                  className={`flex min-h-80 flex-col justify-between rounded-md border border-white/15 p-6 transition duration-300 hover:-translate-y-1 sm:p-8 ${c.surface}`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`text-sm ${c.muted}`}>{c.n}</span>
                    <Icon aria-hidden="true" strokeWidth={1.5} className={`h-7 w-7 ${c.iconCls}`} />
                  </div>
                  <div className="mt-16">
                    <h3 className="text-3xl font-medium tracking-tight">{c.title}</h3>
                    <p className={`mt-4 max-w-xl text-lg leading-relaxed ${c.muted}`}>{c.body}</p>
                    <p className={`mt-5 text-sm ${c.muted}`}>{c.meta}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Assurance tiers (light section) */}
      <section id="tiers" className="scroll-mt-16 bg-paper py-20 text-ink sm:py-28">
        <Container>
          <Reveal className="flex flex-col justify-between gap-7 border-b border-black/20 pb-10 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm text-black/60">What a result guarantees</p>
              <h2 className="mt-3 text-5xl font-medium tracking-tight sm:text-7xl">Assurance, stated plainly.</h2>
            </div>
            <Link
              href="/verify"
              className="group inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium underline decoration-black/30 underline-offset-8 transition hover:decoration-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black sm:self-auto"
            >
              Try it on a document
              <ArrowRight aria-hidden="true" strokeWidth={1.5} className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {TIER_ORDER.map((tier) => {
              const t = TIERS[tier];
              return (
                <Reveal key={tier}>
                  <article className="flex h-full flex-col rounded-md border border-black/15 bg-white/50 p-6 sm:p-8">
                    <div className="flex items-start justify-between">
                      <p className="text-8xl font-medium leading-none tracking-tight">{tier}</p>
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                          t.available ? "bg-ink text-bone" : "border border-black/25 text-black/70"
                        }`}
                      >
                        {t.available ? "Available now" : "Roadmap"}
                      </span>
                    </div>
                    <h3 className="mt-10 text-2xl font-medium tracking-tight">{t.label}</h3>
                    <p className="mt-3 leading-relaxed text-black/70">{t.description}</p>
                    <p className="mt-auto pt-8 text-sm text-black/60">Basis: {t.basis}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Process */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <div className="lg:sticky lg:top-28">
                <p className="text-sm text-ember">How it works</p>
                <h2 className="mt-4 text-5xl font-medium tracking-tight sm:text-6xl">
                  Verify once.
                  <br />
                  Reuse with consent.
                </h2>
                <p className="mt-6 max-w-md text-lg leading-relaxed text-white/65">
                  Every step leaves evidence. Decisions are explainable, people stay in the loop for
                  issuance, and the audit trail cannot be edited.
                </p>
                <ButtonLink href="/verify" variant="outline" icon={ArrowDownRight} className="mt-8">
                  Start with a document
                </ButtonLink>
              </div>
            </Reveal>
            <div className="lg:col-span-7">
              <ProcessAccordion items={STEPS} />
            </div>
          </div>
        </Container>
      </section>

      {/* Principle */}
      <section className="bg-ember py-20 text-black sm:py-28">
        <Container>
          <Reveal className="grid gap-10 lg:grid-cols-12">
            <Quote aria-hidden="true" strokeWidth={1.5} className="h-10 w-10 lg:col-span-2" />
            <figure className="lg:col-span-9">
              <blockquote>
                <p className="text-4xl font-medium leading-tight tracking-tight sm:text-6xl">
                  “Motho ke motho ka batho. A person is a person through other people. Trust is built the
                  same way: through connections that can be checked.”
                </p>
              </blockquote>
              <figcaption className="mt-10 border-t border-black/25 pt-5">
                <p className="text-base font-medium">Ubuntu-Botho</p>
                <p className="mt-1 text-sm text-black/70">The principle behind Kamano</p>
              </figcaption>
            </figure>
          </Reveal>
        </Container>
      </section>

      {/* Verticals index */}
      <section className="py-20 sm:py-28">
        <Container>
          <Reveal className="flex items-end justify-between border-b border-white/20 pb-6">
            <div>
              <p className="text-sm text-white/55">Who it is for</p>
              <h2 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">Built one sector at a time</h2>
            </div>
            <span className="text-lg text-white/55" aria-hidden="true">
              (0{VERTICALS.length})
            </span>
          </Reveal>
          <ul className="divide-y divide-white/15">
            {VERTICALS.map((v) => (
              <li key={v.name}>
                <Reveal className="grid min-h-16 items-center gap-2 py-4 text-sm sm:grid-cols-4">
                  <span className="font-medium">{v.name}</span>
                  <span className={v.stage === "Launch focus" ? "text-ember" : "text-white/55"}>{v.stage}</span>
                  <span className="text-white/55">{v.scope}</span>
                  <span className="text-white/55">{v.when}</span>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Entry points */}
      <section className="border-y border-white/15 py-20 sm:py-28">
        <Container>
          <Reveal className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-sm text-ember">Where to start</p>
              <h2 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">Pick the job in front of you.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
              <Link
                href="/verify"
                className="group rounded-md border border-white/15 p-6 transition hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember"
              >
                <p className="text-xs text-white/55">For compliance teams</p>
                <h3 className="mt-5 text-2xl font-medium tracking-tight">Verify a document</h3>
                <p className="mt-3 text-base leading-relaxed text-white/65">
                  Upload a PDF and get reason codes, a risk score, and an honest assurance tier.
                </p>
                <p className="mt-8 inline-flex items-center gap-2 text-sm text-white/80">
                  Open verification
                  <ArrowRight aria-hidden="true" strokeWidth={1.5} className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </p>
              </Link>
              <Link
                href="/check"
                className="group rounded-md border border-ember bg-ember p-6 text-black transition hover:bg-ember-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                <p className="text-xs text-black/70">For relying parties</p>
                <h3 className="mt-5 text-2xl font-medium tracking-tight">Check a credential</h3>
                <p className="mt-3 text-base leading-relaxed text-black/75">
                  Paste a Kamano credential to confirm its signature, expiry, and revocation status.
                </p>
                <p className="mt-8 inline-flex items-center gap-2 text-sm">
                  Open checker
                  <ArrowRight aria-hidden="true" strokeWidth={1.5} className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </p>
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-16 bg-paper py-20 text-black sm:py-28">
        <Container>
          <Reveal className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-sm text-black/60">Questions before you start</p>
              <h2 className="mt-4 text-5xl font-medium tracking-tight">A few direct answers.</h2>
            </div>
            <div className="lg:col-span-7">
              <FaqAccordion items={FAQ} />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-ember py-20 text-black sm:py-28">
        <Container>
          <Reveal>
            <p className="text-sm text-black/70">Have a document to check?</p>
            <div className="mt-5 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="max-w-5xl text-5xl font-medium leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
                See what it really tells you.
              </h2>
              <ButtonLink href="/verify" variant="dark" icon={ArrowDownRight} nudge="down-right" className="min-h-14 shrink-0 self-start px-7 text-base lg:self-auto">
                Verify a document
              </ButtonLink>
            </div>
            <div className="mt-14 flex flex-col gap-3 border-t border-black/25 pt-6 text-sm text-black/70 sm:flex-row sm:items-center sm:justify-between">
              <span>Every result comes with reason codes you can take to an auditor.</span>
              <span>Data region: af-south-1</span>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
