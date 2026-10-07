/**
 * Typed client for the Kamano Trust API (backend/app/api/routes.py).
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Decision = "VERIFIED" | "REVIEW" | "REJECTED";
export type Tier = "A" | "B" | "C";
export type Severity = "info" | "warning" | "critical";
export type CredentialStatusValue = "ACTIVE" | "REVOKED" | "EXPIRED";

export type ForensicFinding = {
  code: string;
  severity: Severity;
  message: string;
  detail?: Record<string, unknown> | null;
};

export type VerificationResult = {
  id: string;
  document_sha256: string;
  decision: Decision;
  assurance_tier: Tier;
  risk_score: number;
  source_checked: boolean;
  findings: ForensicFinding[];
  created_at: string | null;
  expires_at?: string | null;
};

export type VerifiableCredential = {
  "@context": string[];
  id: string;
  type: string[];
  issuer: string;
  validFrom: string;
  validUntil: string;
  credentialStatus: { id: string; type: string };
  credentialSubject: {
    entityName: string;
    registrationNumber?: string | null;
    documentType: string;
    assuranceTier: Tier;
    trustScore: number;
  };
  proof?: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
  } | null;
};

export type CredentialRecord = { id: string; credential: VerifiableCredential };

export type CredentialVerifyResponse = {
  valid: boolean;
  status: CredentialStatusValue;
  reasons: string[];
};

export type DashboardStats = {
  total_verifications: number;
  total_credentials: number;
  by_assurance_tier: Partial<Record<Tier, number>>;
  by_decision: Partial<Record<Decision, number>>;
};

export type AuditEntry = {
  id: string;
  event_type: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
};

export type ListResponse<T> = { count: number; items: T[] };

export type IssueCredentialInput = {
  verification_id: string;
  subject: {
    entity_name: string;
    registration_number: string | null;
    document_type: string;
    assurance_tier: Tier;
    trust_score: number;
  };
  valid_days?: number;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, { ...init, cache: "no-store" });
  } catch {
    throw new ApiError(
      `Cannot reach the Kamano API at ${API_URL}. Check that the backend is running.`,
      0,
    );
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status}).`;
    try {
      const body: unknown = await res.json();
      if (body && typeof body === "object" && "detail" in body) {
        const d = (body as { detail: unknown }).detail;
        if (typeof d === "string") detail = d;
      }
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new ApiError(detail, res.status);
  }
  return (await res.json()) as T;
}

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const api = {
  verifyDocument(file: File) {
    const form = new FormData();
    form.append("file", file);
    return request<VerificationResult>("/verify/document", { method: "POST", body: form });
  },
  getVerification: (id: string) =>
    request<VerificationResult>(`/verification/${encodeURIComponent(id)}`),
  listVerifications: () => request<ListResponse<VerificationResult>>("/verifications"),

  issueCredential: (input: IssueCredentialInput) =>
    request<CredentialRecord>("/credential/issue", json(input)),
  getCredential: (id: string) =>
    request<CredentialRecord>(`/credential/${encodeURIComponent(id)}`),
  listCredentials: () => request<ListResponse<CredentialRecord>>("/credentials"),
  credentialStatus: (id: string) =>
    request<{ id: string; status: CredentialStatusValue }>(
      `/credentials/status/${encodeURIComponent(id)}`,
    ),
  revokeCredential: (id: string) =>
    request<{ id: string; status: CredentialStatusValue }>(
      `/credential/${encodeURIComponent(id)}/revoke`,
      { method: "POST" },
    ),
  verifyCredential: (credential: unknown) =>
    request<CredentialVerifyResponse>("/credential/verify", json({ credential })),

  dashboardStats: () => request<DashboardStats>("/dashboard/stats"),
  auditLog: () => request<ListResponse<AuditEntry>>("/audit/log"),
};
