const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type ForensicFinding = {
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
};

export type VerificationResult = {
  id: string;
  document_sha256: string;
  decision: "VERIFIED" | "REVIEW" | "REJECTED";
  assurance_tier: "A" | "B" | "C";
  risk_score: number;
  source_checked: boolean;
  findings: ForensicFinding[];
};

export async function verifyDocument(file: File): Promise<VerificationResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API}/api/v1/verify/document`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Verification failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}
