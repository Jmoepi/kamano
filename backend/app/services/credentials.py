"""W3C Verifiable Credential issuance and verification (Ed25519).

Corrections baked in from the review:
  * JSON-LD key is '@context' (section 4 / 2.2).
  * Signing is over a deterministic canonical form of the credential, and the
    SAME canonicalization is used on the verify path, so a third party running
    this library can independently verify the signature (2.2). We use JCS-style
    canonical JSON (RFC 8785 approximation via sorted keys + compact
    separators). For full JSON-LD interop you would swap in URDNA2015; the
    boundary is isolated in `_canonicalize` so that swap is a one-function
    change.
  * Credentials carry a `credentialStatus` entry pointing at a revocation
    endpoint, so a credential can be revoked after issuance (2.3).
"""

from __future__ import annotations

import base64
import json
import uuid
from datetime import datetime, timedelta, timezone

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric import ed25519

from app.core.config import settings
from app.core.security import get_private_key, get_public_key
from app.models.schemas import (
    CredentialStatus,
    CredentialSubject,
    VerifiableCredential,
)

_CONTEXT = [
    "https://www.w3.org/ns/credentials/v2",
    "https://kamano.co.za/credentials/v1",
]


def _canonicalize(payload: dict) -> bytes:
    """Deterministic byte representation used for both sign and verify.

    Isolated so it can be replaced with full RDF canonicalization (URDNA2015)
    without touching the sign/verify flow.
    """
    return json.dumps(
        payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")


class CredentialEngine:
    def __init__(self) -> None:
        self._private: ed25519.Ed25519PrivateKey = get_private_key()
        self._public: ed25519.Ed25519PublicKey = get_public_key()

    def issue(
        self, subject: CredentialSubject, valid_days: int = 365
    ) -> VerifiableCredential:
        now = datetime.now(timezone.utc)
        cred_id = f"urn:uuid:{uuid.uuid4()}"
        status_id = cred_id.split(":")[-1]

        unsigned = {
            "@context": _CONTEXT,
            "id": cred_id,
            "type": ["VerifiableCredential", "KamanoTrustCredential"],
            "issuer": settings.issuer_did,
            "validFrom": now.isoformat(),
            "validUntil": (now + timedelta(days=valid_days)).isoformat(),
            "credentialStatus": {
                "id": f"https://kamano.co.za/credentials/status/{status_id}",
                "type": "KamanoRevocationStatus",
            },
            "credentialSubject": {
                "entityName": subject.entity_name,
                "registrationNumber": subject.registration_number,
                "documentType": subject.document_type,
                "assuranceTier": subject.assurance_tier.value,
                "trustScore": subject.trust_score,
            },
        }

        signature = self._private.sign(_canonicalize(unsigned))
        unsigned["proof"] = {
            "type": "Ed25519Signature2020",
            "created": now.isoformat(),
            "verificationMethod": f"{settings.issuer_did}#key-1",
            "proofPurpose": "assertionMethod",
            "proofValue": base64.urlsafe_b64encode(signature)
            .decode("ascii")
            .rstrip("="),
        }
        return VerifiableCredential.model_validate(unsigned)

    def verify_signature(self, credential: dict) -> tuple[bool, list[str]]:
        reasons: list[str] = []
        proof = credential.get("proof")
        if not proof or "proofValue" not in proof:
            return False, ["Credential has no proof."]

        unsigned = {k: v for k, v in credential.items() if k != "proof"}
        try:
            raw = proof["proofValue"]
            padding = "=" * (-len(raw) % 4)
            signature = base64.urlsafe_b64decode(raw + padding)
            self._public.verify(signature, _canonicalize(unsigned))
        except InvalidSignature:
            return False, ["Signature does not match issuer public key."]
        except Exception as exc:  # noqa: BLE001
            return False, [f"Signature could not be checked: {exc}"]

        # Expiry
        valid_until = credential.get("validUntil")
        if valid_until:
            try:
                if datetime.fromisoformat(valid_until) < datetime.now(timezone.utc):
                    reasons.append("Credential has expired.")
                    return False, reasons
            except ValueError:
                reasons.append("Credential has an invalid validUntil date.")

        return True, reasons


def status_from(valid_until: str | None, revoked: bool) -> CredentialStatus:
    if revoked:
        return CredentialStatus.REVOKED
    if valid_until:
        try:
            if datetime.fromisoformat(valid_until) < datetime.now(timezone.utc):
                return CredentialStatus.EXPIRED
        except ValueError:
            pass
    return CredentialStatus.ACTIVE
