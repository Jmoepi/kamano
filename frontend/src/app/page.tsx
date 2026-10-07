"use client";

import { useState } from "react";
import { verifyDocument, type VerificationResult } from "@/lib/api";

const TIER_LABEL: Record<string, string> = {
  A: "Tier A — confirmed against an authoritative source",
  B: "Tier B — document self-validates (seal / QR)",
  C: "Tier C — not tampered (forensic analysis only)",
};

const DECISION_STYLE: Record<string, string> = {
  VERIFIED: "bg-emerald-100 text-emerald-800",
  REVIEW: "bg-amber-100 text-amber-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function Home() {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await verifyDocument(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Document Trust Verification
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Upload a PDF for offline forensic analysis. No data leaves the
          region. Each result carries an{" "}
          <strong>assurance tier</strong> so you know exactly what a
          &ldquo;verified&rdquo; result guarantees.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <label className="block text-sm font-medium text-slate-700">
          Upload PDF
          <input
            type="file"
            accept="application/pdf"
            onChange={onFile}
            className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-kamano file:px-4 file:py-2 file:text-white hover:file:bg-kamano-dark"
          />
        </label>
        {loading && <p className="mt-4 text-slate-500">Analyzing…</p>}
        {error && <p className="mt-4 text-red-600">{error}</p>}
      </section>

      {result && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                DECISION_STYLE[result.decision]
              }`}
            >
              {result.decision}
            </span>
            <span className="text-sm text-slate-600">
              Risk score: {result.risk_score}
            </span>
          </div>

          <div className="rounded-lg bg-slate-50 p-4 text-sm">
            <div className="font-semibold text-slate-800">
              {TIER_LABEL[result.assurance_tier]}
            </div>
            {!result.source_checked && (
              <p className="mt-1 text-slate-500">
                Source-of-truth integrations are off, so this result confirms
                authenticity (not tampered), not validity (a real, current
                certificate).
              </p>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-700">
              Forensic findings
            </h2>
            <ul className="space-y-2">
              {result.findings.map((f) => (
                <li
                  key={f.code}
                  className="rounded-md border border-slate-100 bg-slate-50 p-3 text-sm"
                >
                  <span className="font-mono text-xs text-slate-500">
                    {f.code}
                  </span>{" "}
                  <span
                    className={
                      f.severity === "critical"
                        ? "text-red-600"
                        : f.severity === "warning"
                        ? "text-amber-600"
                        : "text-slate-500"
                    }
                  >
                    ({f.severity})
                  </span>
                  <p className="mt-1 text-slate-700">{f.message}</p>
                </li>
              ))}
            </ul>
          </div>

          <p className="font-mono text-xs text-slate-400">
            SHA-256: {result.document_sha256}
          </p>
        </section>
      )}
    </div>
  );
}
