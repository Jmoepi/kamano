"use client";

import { useState, type FormEvent } from "react";
import { CircleCheck, CircleX, ShieldCheck } from "lucide-react";
import { StatusBadge } from "@/components/trust";
import { Button, Field, Notice, Panel } from "@/components/ui";
import { api, type CredentialVerifyResponse } from "@/lib/api";

export function CredentialChecker() {
  const [text, setText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CredentialVerifyResponse | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setResult(null);
    setError(null);

    let credential: unknown;
    try {
      credential = JSON.parse(text);
    } catch {
      setParseError("That isn't valid JSON. Paste the full credential, including the braces.");
      return;
    }
    if (!credential || typeof credential !== "object" || Array.isArray(credential)) {
      setParseError("Expected a single credential object.");
      return;
    }
    setParseError(null);

    setLoading(true);
    try {
      setResult(await api.verifyCredential(credential));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The check failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <form noValidate onSubmit={submit} className="space-y-4 lg:col-span-7">
        <Field id="credential-json" label="Credential JSON" required error={parseError}>
          <textarea
            id="credential-json"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            rows={16}
            aria-required="true"
            aria-invalid={parseError ? true : undefined}
            aria-describedby={parseError ? "credential-json-error" : undefined}
            placeholder={'{\n  "@context": ["https://www.w3.org/ns/credentials/v2", …],\n  "id": "urn:uuid:…",\n  "proof": { … }\n}'}
            className="w-full rounded-md border border-white/20 bg-ink-raised p-4 font-mono text-xs leading-relaxed text-bone placeholder:text-white/40 hover:border-white/40 focus-visible:border-ember focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember aria-[invalid=true]:border-red-400"
          />
        </Field>
        {error && <Notice tone="error" title="We couldn't complete the check">{error}</Notice>}
        <Button type="submit" loading={loading} disabled={!text.trim()} icon={ShieldCheck} nudge="none">
          {loading ? "Checking" : "Check credential"}
        </Button>
      </form>

      <div className="lg:col-span-5" aria-live="polite">
        {result ? (
          <Panel className={result.valid ? "border-emerald-400/40" : "border-red-400/40"}>
            {result.valid ? (
              <CircleCheck aria-hidden="true" strokeWidth={1.5} className="h-10 w-10 text-emerald-300" />
            ) : (
              <CircleX aria-hidden="true" strokeWidth={1.5} className="h-10 w-10 text-red-300" />
            )}
            <h2 className="mt-8 text-3xl font-medium tracking-tight">
              {result.valid ? "Genuine and active." : "Do not rely on this credential."}
            </h2>
            <div className="mt-4">
              <StatusBadge status={result.status} />
            </div>
            {result.reasons.length > 0 ? (
              <ul className="mt-6 space-y-2 border-t border-white/15 pt-6 text-white/75">
                {result.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 border-t border-white/15 pt-6 leading-relaxed text-white/75">
                The signature matches Kamano’s public key and the credential is within its validity period.
              </p>
            )}
          </Panel>
        ) : (
          <aside className="rounded-md border border-white/15 p-6 sm:p-8">
            <h2 className="text-sm text-ember">What gets checked</h2>
            <ol className="mt-6 divide-y divide-white/15 border-t border-white/15">
              {[
                ["Signature", "The Ed25519 proof matches the issuer’s public key, so nothing was edited."],
                ["Validity", "Today falls within the credential’s validFrom and validUntil dates."],
                ["Revocation", "The issuer has not withdrawn the credential since it was issued."],
              ].map(([title, body], i) => (
                <li key={title} className="grid grid-cols-[2.5rem_1fr] gap-2 py-5">
                  <span className="text-sm text-white/55">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/65">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>
    </div>
  );
}
