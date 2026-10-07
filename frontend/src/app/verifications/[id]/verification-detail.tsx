"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Button, ButtonLink, Field, IndexHeading, Loading, Notice, Panel, inputClass } from "@/components/ui";
import { VerificationResultView } from "@/components/verification-result";
import { api, type CredentialRecord, type VerificationResult } from "@/lib/api";
import { DOCUMENT_TYPES } from "@/lib/trust";
import { useApi } from "@/lib/use-api";

export function VerificationDetail({ id }: { id: string }) {
  const { data, error, loading, reload } = useApi(() => api.getVerification(id));

  if (loading) return <Loading label="Loading record" />;
  if (error || !data)
    return (
      <div className="space-y-4">
        <Notice tone="error" title="This record could not be loaded">
          {error ?? "Record not found."}
        </Notice>
        <Button variant="outline" onClick={reload} nudge="none">Try again</Button>
      </div>
    );

  return (
    <div className="space-y-16">
      <VerificationResultView result={data} />
      <IssueCredential verification={data} />
    </div>
  );
}

function IssueCredential({ verification }: { verification: VerificationResult }) {
  const [entityName, setEntityName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [docType, setDocType] = useState(DOCUMENT_TYPES[0].value);
  const [reviewed, setReviewed] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<CredentialRecord | null>(null);

  const needsReview = verification.decision === "REVIEW";
  const nameError = touched && entityName.trim().length < 2 ? "Enter the entity's registered name." : null;
  const reviewError = touched && needsReview && !reviewed ? "Confirm that a person has reviewed the findings." : null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (entityName.trim().length < 2 || (needsReview && !reviewed)) return;
    setSubmitting(true);
    setError(null);
    try {
      setIssued(
        await api.issueCredential({
          verification_id: verification.id,
          subject: {
            entity_name: entityName.trim(),
            registration_number: regNumber.trim() || null,
            document_type: docType,
            assurance_tier: verification.assurance_tier,
            // Trust score is the inverse of the forensic risk score.
            trust_score: Math.max(0, 100 - verification.risk_score),
          },
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "The credential could not be issued.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="issue" aria-labelledby="issue-heading" className="scroll-mt-24">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="text-sm text-ember">Next step</p>
          <h2 id="issue-heading" className="mt-4 text-4xl font-medium tracking-tight">Issue a credential.</h2>
          <p className="mt-4 text-lg leading-relaxed text-white/65">
            Bind this result to an entity as a signed, reusable credential. It carries Tier{" "}
            {verification.assurance_tier}, so relying parties see exactly what was checked.
          </p>
        </div>

        <div className="lg:col-span-8">
          {verification.decision === "REJECTED" ? (
            <Notice tone="error" title="Credentials can't be issued for rejected documents">
              The findings show strong signs of editing. Ask for a fresh, unaltered copy and verify it again.
            </Notice>
          ) : issued ? (
            <Panel>
              <Notice tone="success" title="Credential issued">
                Signed with Ed25519 and ready to share. It can be revoked at any time.
              </Notice>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href={`/credentials/${issued.id}`} icon={ArrowRight} nudge="right">
                  Open credential
                </ButtonLink>
              </div>
            </Panel>
          ) : (
            <Panel>
              <IndexHeading as="h3" title="Credential subject" />
              <form noValidate onSubmit={submit} className="mt-8 space-y-6">
                <Field id="entity-name" label="Registered entity name" required error={nameError}>
                  <input
                    id="entity-name"
                    className={inputClass}
                    value={entityName}
                    onChange={(e) => setEntityName(e.target.value)}
                    autoComplete="organization"
                    aria-required="true"
                    aria-invalid={nameError ? true : undefined}
                    aria-describedby={nameError ? "entity-name-error" : undefined}
                    placeholder="Example Trading (Pty) Ltd"
                  />
                </Field>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field id="reg-number" label="Registration number" hint="CIPC format, e.g. 2026/123456/07">
                    <input
                      id="reg-number"
                      className={inputClass}
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      aria-describedby="reg-number-hint"
                      inputMode="numeric"
                    />
                  </Field>
                  <Field id="doc-type" label="Document type" required>
                    <select
                      id="doc-type"
                      className={inputClass}
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                    >
                      {DOCUMENT_TYPES.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                {needsReview && (
                  <div>
                    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-amber-300/40 bg-amber-300/10 p-4 text-sm leading-relaxed text-amber-50">
                      <input
                        type="checkbox"
                        checked={reviewed}
                        onChange={(e) => setReviewed(e.target.checked)}
                        aria-invalid={reviewError ? true : undefined}
                        aria-describedby={reviewError ? "review-error" : undefined}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-ember"
                      />
                      This document needs review. I have read the findings above and accept issuing a
                      credential for it.
                    </label>
                    {reviewError && <p id="review-error" className="mt-2 text-sm text-red-300">{reviewError}</p>}
                  </div>
                )}

                {error && <Notice tone="error" title="Issuance failed">{error}</Notice>}

                <Button type="submit" loading={submitting} icon={BadgeCheck} nudge="none">
                  {submitting ? "Issuing" : "Issue credential"}
                </Button>
              </form>
            </Panel>
          )}
        </div>
      </div>
    </section>
  );
}
