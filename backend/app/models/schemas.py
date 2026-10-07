"""Pydantic schemas shared across the API.

Key design decision (see review 2.1): a verification result carries an
explicit ASSURANCE TIER, not just a risk score. The tier tells a consumer
what a "VERIFIED" decision actually guarantees:

  Tier A — confirmed against an authoritative source (SARS/CIPC/Home Affairs)
  Tier B — document self-validates via cryptographic seal / QR
  Tier C — passed forensic tamper analysis only; source NOT checked

At launch (source integrations off) the best attainable tier is B or C.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class AssuranceTier(str, Enum):
    A = "A"  # source-confirmed
    B = "B"  # document self-validates (seal/QR)
    C = "C"  # not tampered (forensics only)


class Decision(str, Enum):
    VERIFIED = "VERIFIED"
    REVIEW = "REVIEW"
    REJECTED = "REJECTED"


class ForensicFinding(BaseModel):
    """One explainable piece of evidence. Reason codes are stable identifiers
    so downstream systems can act on them without parsing prose."""

    code: str = Field(..., examples=["METADATA_PRODUCER_MISMATCH"])
    severity: str = Field(..., examples=["info", "warning", "critical"])
    message: str
    detail: dict | None = None


class VerificationResult(BaseModel):
    id: str
    document_sha256: str
    decision: Decision
    assurance_tier: AssuranceTier
    risk_score: float = Field(..., ge=0, le=100)
    findings: list[ForensicFinding]
    source_checked: bool = False
    created_at: datetime
    expires_at: datetime | None = None


class CredentialSubject(BaseModel):
    entity_name: str
    registration_number: str | None = None
    document_type: str
    assurance_tier: AssuranceTier
    trust_score: float


class ConsentRecord(BaseModel):
    """Records holder consent for a verifier to read a credential (review 2.3)."""

    holder_id: str
    verifier_id: str
    scope: list[str] = Field(default_factory=list)
    granted_at: datetime
    expires_at: datetime | None = None


class CredentialStatus(str, Enum):
    ACTIVE = "ACTIVE"
    REVOKED = "REVOKED"
    EXPIRED = "EXPIRED"


class IssueCredentialRequest(BaseModel):
    verification_id: str
    subject: CredentialSubject
    valid_days: int = 365


class VerifiableCredential(BaseModel):
    """W3C VC data model. Note the key is '@context' (not '$context')."""

    context: list[str] = Field(
        default=["https://www.w3.org/ns/credentials/v2"],
        alias="@context",
    )
    id: str
    type: list[str]
    issuer: str
    validFrom: str
    validUntil: str
    credentialStatus: dict
    credentialSubject: dict
    proof: dict | None = None

    model_config = {"populate_by_name": True}


class CredentialVerifyRequest(BaseModel):
    credential: dict


class CredentialVerifyResponse(BaseModel):
    valid: bool
    status: CredentialStatus
    reasons: list[str] = Field(default_factory=list)
