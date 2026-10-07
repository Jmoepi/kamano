"""Offline, deterministic document forensic engine.

Design decisions (see Kamano_Strategic_Technical_Review.md 1 & 2.1):
  * NO external AI API calls — all analysis is local, so no data leaves the
    region. Sovereignty is an architectural property here.
  * DETERMINISTIC — the same bytes always produce the same findings and score,
    so a decision can be defended in an audit.
  * EXPLAINABLE — every signal is a stable reason code with a human message.

This engine establishes AUTHENTICITY (has the file been tampered with?). It
does NOT establish VALIDITY (is this a real, current certificate?) — that
requires a live source check and is what separates assurance Tier C from A.
"""

from __future__ import annotations

import hashlib
import re

import fitz  # PyMuPDF

from app.models.schemas import (
    AssuranceTier,
    Decision,
    ForensicFinding,
)

# Software fingerprints commonly associated with manual editing of documents
# that are supposed to be system-generated. Presence is a signal, not proof.
_EDITING_SOFTWARE = re.compile(
    r"(photoshop|gimp|illustrator|inkscape|pdf\s*editor|foxit\s*phantom|"
    r"nitro|pdfescape|ilovepdf|sejda|smallpdf)",
    re.IGNORECASE,
)

# Software we'd expect for legitimately generated government/financial PDFs.
_GENERATOR_SOFTWARE = re.compile(
    r"(itext|reportlab|jasper|crystal\s*reports|wkhtmltopdf|pdfbox|"
    r"microsoft|word|excel|acrobat\s*distiller|fpdf)",
    re.IGNORECASE,
)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


class ForensicEngine:
    """Analyzes a PDF byte buffer and returns explainable findings."""

    def analyze(self, pdf_bytes: bytes) -> tuple[list[ForensicFinding], float]:
        findings: list[ForensicFinding] = []

        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        except Exception as exc:  # noqa: BLE001
            findings.append(
                ForensicFinding(
                    code="FILE_UNREADABLE",
                    severity="critical",
                    message="The file could not be parsed as a valid PDF.",
                    detail={"error": str(exc)},
                )
            )
            return findings, 100.0

        findings.extend(self._check_metadata(doc))
        findings.extend(self._check_fonts(doc))
        findings.extend(self._check_structure(doc))
        findings.extend(self._check_embedded_qr_hint(doc))

        doc.close()
        score = self._score(findings)
        return findings, score

    # --- individual deterministic checks -------------------------------------

    def _check_metadata(self, doc: fitz.Document) -> list[ForensicFinding]:
        out: list[ForensicFinding] = []
        meta = doc.metadata or {}
        producer = (meta.get("producer") or "") + " " + (meta.get("creator") or "")

        if _EDITING_SOFTWARE.search(producer):
            out.append(
                ForensicFinding(
                    code="METADATA_EDITING_SOFTWARE",
                    severity="critical",
                    message=(
                        "Document metadata shows image/PDF editing software, "
                        "which is unusual for a system-generated certificate."
                    ),
                    detail={"producer": producer.strip()},
                )
            )
        elif producer.strip() and not _GENERATOR_SOFTWARE.search(producer):
            out.append(
                ForensicFinding(
                    code="METADATA_UNRECOGNISED_PRODUCER",
                    severity="warning",
                    message="Producer software is not a recognised generator.",
                    detail={"producer": producer.strip()},
                )
            )

        # Creation vs modification date mismatch
        created = meta.get("creationDate") or ""
        modified = meta.get("modDate") or ""
        if created and modified and created != modified:
            out.append(
                ForensicFinding(
                    code="METADATA_MODIFIED_AFTER_CREATION",
                    severity="warning",
                    message="The document was modified after it was created.",
                    detail={"created": created, "modified": modified},
                )
            )
        return out

    def _check_fonts(self, doc: fitz.Document) -> list[ForensicFinding]:
        """Font inconsistency across a document is a classic sign of text that
        was overlaid or edited after the original was produced."""
        out: list[ForensicFinding] = []
        font_names: set[str] = set()
        for page in doc:
            for font in page.get_fonts(full=True):
                # font tuple: (xref, ext, type, basefont, name, encoding, ...)
                basefont = font[3] if len(font) > 3 else ""
                if basefont:
                    # strip subset prefix like "ABCDEF+Arial"
                    font_names.add(re.sub(r"^[A-Z]{6}\+", "", basefont))

        if len(font_names) > 6:
            out.append(
                ForensicFinding(
                    code="FONT_HIGH_DIVERSITY",
                    severity="warning",
                    message=(
                        "Unusually high number of distinct fonts, which can "
                        "indicate text was added by a different tool."
                    ),
                    detail={"font_count": len(font_names), "fonts": sorted(font_names)},
                )
            )
        return out

    def _check_structure(self, doc: fitz.Document) -> list[ForensicFinding]:
        out: list[ForensicFinding] = []
        # Incremental updates: multiple %%EOF markers suggest the file was
        # saved/appended after original creation.
        try:
            raw = doc.tobytes()
            eof_count = raw.count(b"%%EOF")
            if eof_count > 1:
                out.append(
                    ForensicFinding(
                        code="STRUCTURE_INCREMENTAL_UPDATE",
                        severity="warning",
                        message=(
                            "The PDF contains incremental updates (saved more "
                            "than once), consistent with post-creation edits."
                        ),
                        detail={"eof_markers": eof_count},
                    )
                )
        except Exception:  # noqa: BLE001, S110
            pass
        return out

    def _check_embedded_qr_hint(self, doc: fitz.Document) -> list[ForensicFinding]:
        """Flag whether the document carries an image that could be a security
        QR/seal. Actual cryptographic QR validation (which would lift this to
        Tier B) is a follow-up; here we only note its presence/absence."""
        out: list[ForensicFinding] = []
        has_images = any(page.get_images() for page in doc)
        if not has_images:
            out.append(
                ForensicFinding(
                    code="NO_SECURITY_IMAGERY",
                    severity="info",
                    message="No embedded images/seals detected to validate.",
                )
            )
        return out

    # --- scoring --------------------------------------------------------------

    @staticmethod
    def _score(findings: list[ForensicFinding]) -> float:
        """Deterministic additive risk score. Transparent by design: the same
        findings always yield the same number."""
        weights = {"critical": 60.0, "warning": 20.0, "info": 0.0}
        score = sum(weights.get(f.severity, 0.0) for f in findings)
        return float(min(100.0, score))


def decide(score: float, source_checked: bool) -> tuple[Decision, AssuranceTier]:
    """Map a risk score + whether a source was checked onto a decision and the
    honest assurance tier (review 2.1)."""
    if score >= 60:
        decision = Decision.REJECTED
    elif score >= 20:
        decision = Decision.REVIEW
    else:
        decision = Decision.VERIFIED

    # Without a live source check the best we can truthfully claim is Tier C.
    tier = AssuranceTier.A if source_checked else AssuranceTier.C
    return decision, tier
