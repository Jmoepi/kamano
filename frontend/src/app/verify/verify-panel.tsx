"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, BadgeCheck, FileText, RotateCcw, ScanText, Upload } from "lucide-react";
import { Button, ButtonLink, Notice } from "@/components/ui";
import { VerificationResultView } from "@/components/verification-result";
import { api, type VerificationResult } from "@/lib/api";
import { formatBytes } from "@/lib/format";

const MAX_BYTES = 20 * 1024 * 1024;

const CHECKS = [
  { title: "Producer software", body: "Flags image and PDF editors on documents that should be system-generated." },
  { title: "Change history", body: "Detects modification after creation and incremental saves." },
  { title: "Font consistency", body: "Unusual font diversity can mean text was overlaid." },
  { title: "Security imagery", body: "Notes whether seals or images are present to validate." },
];

export function VerifyPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  function choose(candidate: File | undefined) {
    if (!candidate) return;
    const isPdf = candidate.type === "application/pdf" || candidate.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Only PDF files are supported.");
      return;
    }
    if (candidate.size === 0) {
      setError("That file is empty.");
      return;
    }
    if (candidate.size > MAX_BYTES) {
      setError(`That file is ${formatBytes(candidate.size)}. The limit is 20 MB.`);
      return;
    }
    setError(null);
    setResult(null);
    setFile(candidate);
  }

  async function analyse() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await api.verifyDocument(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-12">
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <label
            htmlFor="document"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              choose(e.dataTransfer.files[0]);
            }}
            className={`flex min-h-80 cursor-pointer flex-col justify-between rounded-md border border-dashed p-6 transition duration-300 focus-within:ring-2 focus-within:ring-ember sm:p-8 ${
              dragging ? "border-ember bg-ember/10" : "border-white/25 bg-ink-raised hover:-translate-y-1 hover:border-ember/70"
            }`}
          >
            <input
              id="document"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              aria-describedby="document-hint"
              onChange={(e) => {
                choose(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <div className="flex items-start justify-between">
              <span className="text-sm text-white/55">PDF</span>
              {file ? (
                <FileText aria-hidden="true" strokeWidth={1.5} className="h-7 w-7 text-ember" />
              ) : (
                <Upload aria-hidden="true" strokeWidth={1.5} className="h-7 w-7 text-ember" />
              )}
            </div>
            <div className="mt-16">
              <p className="break-all text-3xl font-medium tracking-tight">{file ? file.name : "Drop a PDF here"}</p>
              <p id="document-hint" className="mt-3 text-lg text-white/65">
                {file ? `${formatBytes(file.size)} · ready to analyse` : "or click to choose a file. PDF only, up to 20 MB."}
              </p>
            </div>
          </label>

          {error && <Notice tone="error" title="We couldn't analyse that file">{error}</Notice>}

          <div className="flex flex-wrap gap-3">
            <Button onClick={analyse} disabled={!file} loading={loading} icon={ScanText} nudge="none">
              {loading ? "Analysing" : "Analyse document"}
            </Button>
            {(file || result) && (
              <Button variant="outline" onClick={reset} icon={RotateCcw} nudge="none" disabled={loading}>
                Start over
              </Button>
            )}
          </div>
          <p aria-live="polite" className="sr-only">
            {loading ? "Analysing document" : result ? "Analysis complete" : ""}
          </p>
        </div>

        <aside aria-labelledby="checks-heading" className="rounded-md border border-white/15 p-6 sm:p-8 lg:col-span-5">
          <h2 id="checks-heading" className="text-sm text-ember">What Kamano checks</h2>
          <ol className="mt-6 divide-y divide-white/15 border-t border-white/15">
            {CHECKS.map((c, i) => (
              <li key={c.title} className="grid grid-cols-[2.5rem_1fr] gap-2 py-5">
                <span className="text-sm text-white/55">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/65">{c.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      {result && (
        <div ref={resultRef} tabIndex={-1} aria-label="Verification result" className="space-y-6 focus:outline-none">
          <div className="flex items-end justify-between border-b border-white/20 pb-6">
            <div>
              <p className="text-sm text-white/55">Result</p>
              <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">Here&rsquo;s what we found.</h2>
            </div>
          </div>
          <VerificationResultView
            result={result}
            headingLevel="h3"
            actions={
              <>
                <ButtonLink href={`/verifications/${result.id}`} variant="outline" icon={ArrowRight} nudge="right">
                  Open full record
                </ButtonLink>
                {result.decision !== "REJECTED" && (
                  <ButtonLink href={`/verifications/${result.id}#issue`} icon={BadgeCheck} nudge="none">
                    Issue a credential
                  </ButtonLink>
                )}
              </>
            }
          />
        </div>
      )}
    </div>
  );
}
