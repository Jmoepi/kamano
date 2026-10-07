import Link from "next/link";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  FileCheck2,
  Landmark,
  Quote,
  ScanText,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { FaqAccordion, ProcessAccordion } from "@/components/accordion";
import { LogoMark } from "@/components/logo";
import { Reveal } from "@/components/reveal";
import { ButtonLink, Container } from "@/components/ui";
import { TIERS } from "@/lib/trust";
import type { Tier } from "@/lib/api";

// Buyer-relevant proof points — speed, coverage, audit, residency.
const PROOF = [
  { label: "Per-document check", value: "< 3s" },
  { label: "Checks logged for audit", value: "100%" },
  { label: "Documents covered", value: "Tax · BEE · Bank · CIPC" },
  { label: "Data region", value: "af-south-1" },
];

// What Kamano forensically inspects — framed around real procurement documents.
const CHECKS: {
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
    title: "Document tampering",
    body: "Detects editing-software traces, changes after creation, font and structure anomalies — the fingerprints of a Photoshopped tax clearance or altered BEE affidavit.",
    meta: "SARS TCS · B-BBEE · bank letters",
    icon: ScanText,
    surface: "bg-ink-raised text-bone hover:border-ember/70",
    iconCls: "text-ember",
    muted: "text-white/65",
  },
  {
    n: "02",
    title: "Security seals & QR",
    body: "Validates the document's own cryptographic markers — a SARS TCS PIN or CIPC QR — so a self-validating certificate lifts the assurance it carries.",
    meta: "Seal / QR validation (Tier B)",
    icon: ShieldCheck,
    surface: "bg-cream text-black hover:border-ember",
    iconCls: "text-ember-deep",
    muted: "text-black/65",
  },
  {
    n: "03",
    title: "Reusable supplier passport",
    body: "A verified supplier gets a signed, revocable Trust Credential. Every buyer on the network re-checks it instantly — less re-vetting, faster onboarding.",
    meta: "Ed25519 · W3C · live revocation",
    icon: BadgeCheck,
    surface: "bg-lagoon text-bone hover:border-cyan-300/70",
    iconCls: "text-cyan-200",
    muted: "text-white/70",
  },
  {
    n: "04",
    title: "Audit-ready evidence",
    body: "Every check is logged append-only and exportable — the proof your team acted with care if the Auditor-General or a FICA inspector ever asks.",
    meta: "POPIA · PFMA / MFMA · append-only",
    icon: Landmark,
    surface: "bg-crimson text-bone hover:border-red-200/70",
    iconCls: "text-red-100",
    muted: "text-white/75",
  },
];

// What existing tools confirm vs. the hole they leave — the wedge, stated plainly.
const GAP_THEM = [
  "CSD confirms a supplier is registered — not that their documents are genuine",
  "ID and face checks verify a person — not a forged tax clearance or BEE affidavit",
  "Manual eyeballing is slow and misses skilled, AI-generated forgeries",
];
const GAP_US = [
  "Is this specific document authentic, or edited?",
  "Does its security seal or QR actually validate?",
  "A signed, reusable record for every supplier decision",
];

const STEPS = [
  {
    title: "Supplier uploads documents",
    body: "Through the Kamano portal, or straight from your procurement system via API, at onboarding and renewal.",
    meta: "Fits your existing vetting workflow",
  },
  {
    title: "Kamano runs the forensics",
    body: "Offline analysis of metadata, editing traces, fonts, structure, and security seals — all processed in South Africa.",
    meta: "Under three seconds, no data leaves the region",
  },
  {
    title: "You get a clear decision",
    body: "Verified, Review, or Rejected — with plain reason codes and an honest assurance tier, not a black-box score.",
    meta: "A person can act on it and defend it",
  },
  {
    title: "The evidence is kept",
    body: "Every check is logged append-only and exportable, and the supplier earns a reusable credential for next time.",
    meta: "Audit trail + verify-once reuse",
  },
];

// Procurement-forensics is the launch wedge; everything else is explicit roadmap.
const VERTICALS = [
  { name: "Supplier & vendor vetting", stage: "Launch focus", scope: "Corporate supply chain, tenders", when: "Now" },
  { name: "Public procurement / SCM", stage: "Launch focus", scope: "Municipalities, SOEs, B-BBEE", when: "Now" },
  { name: "Fintech KYC & CDD", stage: "Roadmap", scope: "FICA onboarding", when: "Next" },
  { name: "Vehicle finance & property", stage: "Roadmap", scope: "Income, address, affordability", when: "Later" },
  { name: "Legal & professional", stage: "Roadmap", scope: "Client onboarding", when: "Later" },
];

const FAQ = [
  {
    title: "How is this different from CSD or an ID check?",
    body: "CSD confirms a supplier is registered and ID checks confirm a person exists — neither looks at whether the uploaded tax clearance, BEE certificate, or bank letter has been altered. Kamano sits on top of those checks and closes exactly that gap: the authenticity of the document itself.",
  },
  {
    title: "Does “Verified” mean the certificate is genuine?",
    body: "It depends on the tier, and we always tell you which. Tier C (available now) confirms the document has not been tampered with. Tier A — live confirmation against SARS, CIPC, or Home Affairs — is on the roadmap by document type. We never let “not edited” be mistaken for “source-confirmed.”",
  },
  {
    title: "Does any of my data leave South Africa?",
    body: "No. Document analysis runs entirely inside the Kamano service with no calls to external AI providers, and the service refuses to start unless its data region is af-south-1 (Cape Town). Raw documents are not retained; we keep a fingerprint, the findings, and an audit entry.",
  },
  {
    title: "How does it fit our procurement process?",
    body: "Start with the web portal on day one, or integrate Kamano into your SAP, Sage, or procurement system so checks run automatically at supplier onboarding and renewal. Either way the result and its audit trail live in one place.",
  },
  {
    title: "What is the easiest way to see if it works?",
    body: "A paid pilot on your own suppliers: we re-screen a batch of recently approved document packs and show you what your current process let through. If we don't surface anything it should have caught, there is nothing to roll out.",
  },
];

const TIER_ORDER: Tier[] = ["C", "B", "A"];

export default function Home() {
  return (
    <>
      {/* Hero — procurement-forensics wedge, stated in the first screen */}
      <section className="relative isolate min-h-screen overflow-hidden bg-ember-hero text-black">
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <LogoMark className="absolute -right-[12rem] top-1/2 h-[min(125vh,72rem)] w-[min(125vh,72rem)] -translate-y-1/2 text-black/[0.09]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-transparent to-black/25" />
        </div>

        <Container className="flex min-h-screen flex-col justify-end pb-8 pt-28 sm:pb-10">
          <div className="max-w-5xl">
            <p className="mb-5 animate-rise text-sm font-medium text-black/75" style={{ animationDelay: "120ms" }}>
              Supplier document forensics · for procurement, finance &amp; compliance
            </p>
            <h1
              className="max-w-5xl animate-rise text-5xl font-medium leading-[0.92] tracking-tight sm:text-7xl lg:text-8xl"
              style={{ animationDelay: "225ms" }}
            >
              Know the paperwork is real before you pay.
            </h1>
            <div className="mt-7 grid gap-6 border-t border-black/30 pt-6 md:grid-cols-12 md:items-end">
              <p
                className="animate-rise text-lg leading-relaxed text-black/80 md:col-span-6 lg:col-span-5"
                style={{ animationDelay: "330ms" }}
              >
                Kamano forensically verifies supplier documents — tax clearances, B-BBEE certificates,
                bank letters, CIPC records — in seconds, with an audit trail that stands up to the
                Auditor-General and FICA. Processed in South Africa.
              </p>
              <div
                className="flex animate-rise flex-col gap-3 sm:flex-row md:col-span-6 md:justify-end"
                style={{ animationDelay: "435ms" }}
              >
                <ButtonLink href="/verify" variant="dark" icon={ArrowDownRight} nudge="down-right">
                  Verify a document
                </ButtonLink>
                <ButtonLink href="#how" variant="outline-dark" nudge="none">
                  See how it works
                </ButtonLink>
              </div>
            </div>
          </div>

          <div
            className="mt-9 flex animate-rise items-center justify-between text-xs text-black/70"
            style={{ animationDelay: "540ms" }}
          >
            <span>A 3-second check between you and a fraudulent payment</span>
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
              <p className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">{p.value}</p>
            </Reveal>
          ))}
        </Container>
      </section>

      {/* The gap — the sharpest statement of the wedge */}
      <section className="py-20 sm:py-28">
        <Container>
          <Reveal className="grid gap-8 border-b border-white/15 pb-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-sm text-ember">The gap you're exposed to</p>
            </div>
            <div className="lg:col-span-8">
              <h2 className="max-w-4xl text-4xl font-medium leading-tight tracking-tight sm:text-6xl">
                Your checks confirm a supplier exists. Not that their documents are real.
              </h2>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            <Reveal>
              <article className="flex h-full flex-col rounded-md border border-white/15 bg-ink-raised p-6 sm:p-8">
                <h3 className="text-2xl font-medium tracking-tight">What your current tools confirm</h3>
                <ul className="mt-6 space-y-3">
                  {GAP_THEM.map((item) => (
                    <li key={item} className="flex gap-3 text-lg leading-relaxed text-white/65">
                      <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-sm bg-white/30" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-sm text-white/45">All useful. None of them look at the document itself.</p>
              </article>
            </Reveal>
            <Reveal>
              <article className="flex h-full flex-col rounded-md border border-ember bg-ember p-6 text-black sm:p-8">
                <h3 className="text-2xl font-medium tracking-tight">What Kamano adds on top</h3>
                <ul className="mt-6 space-y-3">
                  {GAP_US.map((item) => (
                    <li key={item} className="flex gap-3 text-lg leading-relaxed text-black/80">
                      <FileCheck2 aria-hidden="true" strokeWidth={1.75} className="mt-1 h-5 w-5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-sm text-black/70">
                  Kamano complements CSD and your KYC — it doesn&rsquo;t replace them.
                </p>
              </article>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* What we check */}
      <section className="border-t border-white/15 py-20 sm:py-28">
        <Container>
          <Reveal className="grid gap-8 border-b border-white/15 pb-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-sm text-ember">What Kamano checks</p>
            </div>
            <div className="lg:col-span-8">
              <h2 className="max-w-4xl text-4xl font-medium leading-tight tracking-tight sm:text-6xl">
                Forensics on the documents fraud actually hides in.
              </h2>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            {CHECKS.map(({ icon: Icon, ...c }) => (
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
      <section id="how" className="scroll-mt-16 py-20 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <div className="lg:sticky lg:top-28">
                <p className="text-sm text-ember">How it works</p>
                <h2 className="mt-4 text-5xl font-medium tracking-tight sm:text-6xl">
                  Sits on top of
                  <br />
                  how you vet today.
                </h2>
                <p className="mt-6 max-w-md text-lg leading-relaxed text-white/65">
                  No rip-and-replace. Kamano slots into supplier onboarding and renewal, leaves
                  evidence at every step, and keeps a person in the loop for the call that matters.
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

      {/* Where we focus */}
      <section className="py-20 sm:py-28">
        <Container>
          <Reveal className="flex items-end justify-between border-b border-white/20 pb-6">
            <div>
              <p className="text-sm text-white/55">Where we focus</p>
              <h2 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">Procurement first. On purpose.</h2>
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
          <Reveal>
            <p className="mt-8 max-w-2xl text-white/55">
              We win one lane completely before we widen. Supplier and procurement document forensics
              is a gap the identity players ignore — so that is where Kamano goes deep first.
            </p>
          </Reveal>
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
                <p className="text-xs text-white/55">For procurement &amp; compliance teams</p>
                <h3 className="mt-5 text-2xl font-medium tracking-tight">Verify a supplier document</h3>
                <p className="mt-3 text-base leading-relaxed text-white/65">
                  Upload a tax clearance, BEE certificate, or bank letter and get reason codes, a risk
                  score, and an honest assurance tier.
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
                <p className="text-xs text-black/70">For buyers checking a supplier</p>
                <h3 className="mt-5 text-2xl font-medium tracking-tight">Check a credential</h3>
                <p className="mt-3 text-base leading-relaxed text-black/75">
                  Paste a supplier&rsquo;s Kamano credential to confirm its signature, validity, and live
                  revocation status.
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

      {/* CTA — pilot offer */}
      <section className="bg-ember py-20 text-black sm:py-28">
        <Container>
          <Reveal>
            <p className="text-sm text-black/70">The easiest way to see it</p>
            <div className="mt-5 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="max-w-5xl text-5xl font-medium leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
                Run a pilot on your own suppliers.
              </h2>
              <ButtonLink href="/verify" variant="dark" icon={ArrowDownRight} nudge="down-right" className="min-h-14 shrink-0 self-start px-7 text-base lg:self-auto">
                Verify a document
              </ButtonLink>
            </div>
            <div className="mt-14 flex flex-col gap-3 border-t border-black/25 pt-6 text-sm text-black/70 sm:flex-row sm:items-center sm:justify-between">
              <span>We re-screen a batch of your approved documents and show you what got through.</span>
              <span>Data region: af-south-1</span>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
