"""Generate test PDFs for Kamano forensic validation.

Creates a legitimate and a 'tampered' variant so you can see the forensic
engine's reason codes change. Uses PyMuPDF (already a backend dependency) so
no extra install is required.

    python generate_test_pdfs.py
"""

from __future__ import annotations

from pathlib import Path

import fitz  # PyMuPDF

BASE = Path(__file__).parent


def _write(path: Path, title: str, lines: list[str], producer: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    doc = fitz.open()
    page = doc.new_page()
    y = 72
    page.insert_text((72, y), title, fontsize=16)
    y += 30
    for line in lines:
        page.insert_text((72, y), line, fontsize=11)
        y += 20
    doc.set_metadata({"producer": producer, "creator": producer, "title": title})
    doc.save(str(path))
    doc.close()
    print(f"wrote {path.relative_to(BASE)}  (producer={producer})")


def main() -> None:
    _write(
        BASE / "legitimate" / "sars_tax_clearance_valid.pdf",
        "SARS Tax Clearance Certificate",
        [
            "Entity: Example Trading (Pty) Ltd",
            "Registration: 2026/123456/07",
            "Tax Status: Compliant",
            "PIN: 1234567890ABCDEF",
        ],
        producer="reportlab",
    )
    _write(
        BASE / "legitimate" / "cipc_registration_valid.pdf",
        "CIPC Company Registration",
        [
            "Company: Example Trading (Pty) Ltd",
            "Registration: 2026/123456/07",
            "Status: In Business",
        ],
        producer="iText",
    )
    # Tampered: metadata shows image-editing software -> triggers a critical finding.
    _write(
        BASE / "tampered" / "sars_tax_clearance_tampered.pdf",
        "SARS Tax Clearance Certificate",
        [
            "Entity: Example Trading (Pty) Ltd",
            "Registration: 2026/999999/07",
            "Tax Status: Compliant",
        ],
        producer="Adobe Photoshop 25.0",
    )
    _write(
        BASE / "tampered" / "cipc_registration_tampered.pdf",
        "CIPC Company Registration",
        [
            "Company: Example Trading (Pty) Ltd",
            "Registration: 2026/123456/07",
            "Status: In Business",
        ],
        producer="GIMP 2.10",
    )
    print("\nDone. Try: POST /api/v1/verify/document with each file.")


if __name__ == "__main__":
    main()
