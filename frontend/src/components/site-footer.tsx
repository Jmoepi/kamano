import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { API_URL } from "@/lib/api";

const link =
  "inline-flex items-center gap-2 transition-colors hover:text-ember focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember";

export function SiteFooter() {
  return (
    <footer className="bg-ink">
      <div className="mx-auto max-w-screen-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 border-b border-white/15 pb-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-medium">Kamano</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              Digital trust infrastructure for South Africa. Offline document forensics and reusable,
              verifiable credentials.
            </p>
          </div>
          <div>
            <p className="text-xs text-white/55">Product</p>
            <div className="mt-4 flex flex-col items-start gap-3 text-sm">
              <Link href="/verify" className={link}>Verify a document</Link>
              <Link href="/verifications" className={link}>Verification records</Link>
              <Link href="/credentials" className={link}>Credentials</Link>
              <Link href="/check" className={link}>Check a credential</Link>
            </div>
          </div>
          <div>
            <p className="text-xs text-white/55">Operations</p>
            <div className="mt-4 flex flex-col items-start gap-3 text-sm">
              <Link href="/dashboard" className={link}>Dashboard</Link>
              <Link href="/audit" className={link}>Audit log</Link>
              <a href={`${API_URL}/docs`} target="_blank" rel="noopener noreferrer" className={link}>
                API reference <ArrowUpRight aria-hidden="true" strokeWidth={1.5} className="h-3.5 w-3.5" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
          </div>
          <div>
            <p className="text-xs text-white/55">Principles</p>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-white/80">
              <li>Ubuntu-Botho</li>
              <li>POPIA-first</li>
              <li>Explainable decisions</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-8 pt-8">
          <div className="flex flex-col gap-3 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Kamano. All rights reserved.</p>
            <p>Data region: af-south-1 (Cape Town)</p>
          </div>
          <p aria-hidden="true" className="break-words text-6xl font-medium leading-none tracking-tight sm:text-8xl lg:text-9xl">
            Kamano
          </p>
        </div>
      </div>
    </footer>
  );
}
