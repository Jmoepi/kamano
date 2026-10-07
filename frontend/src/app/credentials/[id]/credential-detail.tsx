"use client";

import { useState } from "react";
import { Ban, Copy, Download, ShieldCheck } from "lucide-react";
import { StatusBadge, TierBadge } from "@/components/trust";
import { Button, Loading, Notice, Panel } from "@/components/ui";
import { api, type CredentialRecord, type CredentialStatusValue, type CredentialVerifyResponse } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { TIERS, documentTypeLabel } from "@/lib/trust";
import { useApi } from "@/lib/use-api";

type Loaded = { record: CredentialRecord; status: CredentialStatusValue };

export function CredentialDetail({ id }: { id: string }) {
  const { data, error, loading, reload, setData } = useApi<Loaded>(async () => {
    const [record, status] = await Promise.all([api.getCredential(id), api.credentialStatus(id)]);
    return { record, status: status.status };
  });

  const [check, setCheck] = useState<CredentialVerifyResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (loading) return <Loading label="Loading credential" />;
  if (error || !data)
    return (
      <div className="space-y-4">
        <Notice tone="error" title="This credential could not be loaded">{error ?? "Not found."}</Notice>
        <Button variant="outline" onClick={reload} nudge="none">Try again</Button>
      </div>
    );

  const { record, status } = data;
  const vc = record.credential;
  const s = vc.credentialSubject;
  const pretty = JSON.stringify(vc, null, 2);

  async function runCheck() {
    setChecking(true);
    setActionError(null);
    try {
      setCheck(await api.verifyCredential(vc));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Check failed.");
    } finally {
      setChecking(false);
    }
  }

  async function revoke() {
    setRevoking(true);
    setActionError(null);
    try {
      const res = await api.revokeCredential(id);
      setData({ record, status: res.status });
      setConfirmRevoke(false);
      setCheck(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Revocation failed.");
    } finally {
      setRevoking(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(pretty);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionError("Copy failed. Select the JSON below and copy it manually.");
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([pretty], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `kamano-credential-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-8">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={status} />
            <TierBadge tier={s.assuranceTier} />
          </div>
          <h2 className="mt-10 text-4xl font-medium tracking-tight sm:text-5xl">{s.entityName}</h2>
          <p className="mt-3 text-lg text-white/65">{documentTypeLabel(s.documentType)}</p>

          <dl className="mt-10 grid gap-6 border-t border-white/15 pt-6 sm:grid-cols-2">
            <Detail label="Registration number" value={s.registrationNumber || "—"} />
            <Detail label="Trust score" value={`${s.trustScore} / 100`} />
            <Detail label="Valid from" value={formatDate(vc.validFrom)} />
            <Detail label="Valid until" value={formatDate(vc.validUntil)} />
            <Detail label="Issuer" value={vc.issuer} mono />
            <Detail label="Signature" value={vc.proof?.type ?? "Unsigned"} mono />
          </dl>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button onClick={runCheck} loading={checking} icon={ShieldCheck} nudge="none">
              {checking ? "Checking" : "Verify signature"}
            </Button>
            <Button variant="outline" onClick={copy} icon={Copy} nudge="none">
              {copied ? "Copied" : "Copy JSON"}
            </Button>
            <Button variant="outline" onClick={download} icon={Download} nudge="none">
              Download
            </Button>
          </div>
          <p aria-live="polite" className="sr-only">{copied ? "Credential JSON copied" : ""}</p>
        </Panel>

        <div className="rounded-md bg-cream p-6 text-black sm:p-8 lg:col-span-4">
          <p className="text-sm text-black/60">Assurance carried</p>
          <p className="mt-5 text-7xl font-medium leading-none tracking-tight" aria-hidden="true">{s.assuranceTier}</p>
          <h3 className="mt-4 text-2xl font-medium tracking-tight">
            <span className="sr-only">Tier {s.assuranceTier}: </span>
            {TIERS[s.assuranceTier].label}
          </h3>
          <p className="mt-3 leading-relaxed text-black/70">{TIERS[s.assuranceTier].description}</p>
        </div>
      </div>

      {actionError && <Notice tone="error">{actionError}</Notice>}

      {check && (
        <Notice tone={check.valid ? "success" : "error"} title={check.valid ? "Signature valid and credential active" : "This credential does not pass"}>
          {check.reasons.length > 0 ? (
            <ul className="list-disc pl-5">
              {check.reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
          ) : (
            "The signature matches Kamano’s public key, and the credential is within its validity period."
          )}
        </Notice>
      )}

      <details className="group rounded-md border border-white/15 p-6 sm:p-8">
        <summary className="cursor-pointer list-none text-lg font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember">
          <span className="group-open:hidden">Show credential JSON</span>
          <span className="hidden group-open:inline">Hide credential JSON</span>
        </summary>
        <pre className="mt-6 max-h-[32rem] overflow-auto rounded-md bg-black/40 p-4 font-mono text-xs leading-relaxed text-white/80">
          {pretty}
        </pre>
      </details>

      {status === "ACTIVE" && (
        <section aria-labelledby="revoke-heading" className="rounded-md border border-red-400/30 p-6 sm:p-8">
          <h2 id="revoke-heading" className="text-2xl font-medium tracking-tight">Revoke this credential</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-white/65">
            Revocation is permanent. Every future check will fail, wherever the credential has been shared.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {confirmRevoke ? (
              <>
                <Button variant="danger" onClick={revoke} loading={revoking} icon={Ban} nudge="none">
                  {revoking ? "Revoking" : "Yes, revoke permanently"}
                </Button>
                <Button variant="outline" onClick={() => setConfirmRevoke(false)} nudge="none" disabled={revoking}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="danger" onClick={() => setConfirmRevoke(true)} icon={Ban} nudge="none">
                Revoke credential
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-white/55">{label}</dt>
      <dd className={`mt-2 break-all ${mono ? "font-mono text-xs" : "text-sm"} text-white/85`}>{value}</dd>
    </div>
  );
}
