# Kamano

> **Digital Trust Infrastructure for South Africa**

Kamano verifies documents with **offline** forensic analysis, explains every
decision with stable reason codes, and issues **reusable Ed25519 W3C
credentials**. Built for data sovereignty: analysis runs locally and the data
layer targets AWS **af-south-1** (Cape Town).

**Kamano** (Sesotho: *connection / relationship*) — building digital trust
through connections between people, businesses, and institutions.

> **Status:** early scaffold. This repository contains a **working backend
> skeleton** (verification + credential issuance/verification/revocation) and a
> minimal frontend. Sections marked _Roadmap_ are **not built yet** — see
> [Build status](#build-status).

---

## What's actually built today

- ✅ **Offline forensic engine** (PyMuPDF + OpenCV + Pillow) — deterministic,
  explainable, no external AI API calls. Detects editing-software metadata,
  modified-after-creation, font-diversity anomalies, incremental-update
  structure, and missing security imagery.
- ✅ **Assurance tiers (A / B / C)** on every verification result, so a
  consumer knows what a "VERIFIED" actually guarantees (see
  [Honesty about assurance](#honesty-about-assurance)).
- ✅ **Ed25519 W3C Verifiable Credentials** — correct `@context`, deterministic
  canonical signing, independent signature verification, a public credential
  **status/revocation** endpoint, and a **consent** record endpoint.
- ✅ **POPIA data-residency guard** — the API refuses to start unless the data
  region is African.
- ✅ **Append-only audit trail** (immutable via DB trigger in the SQL schema).
- ✅ Runs **without a database** (in-memory store) for local demos.
- ✅ Passing smoke + API tests.

### Build status

| Area | State |
|---|---|
| Offline forensic verification | ✅ Working |
| Assurance tiers A/B/C | ✅ Working |
| Ed25519 W3C credential issue / verify / revoke / consent | ✅ Working |
| Data-residency startup guard | ✅ Working |
| PostgreSQL schema + RLS scaffold | ✅ SQL written (RLS policies commented until tenant model lands) |
| Next.js upload UI | ✅ Minimal working page |
| SARS / CIPC / Home Affairs source checks | ⛔ Roadmap (feature-flagged off; keeps results at Tier C) |
| Cryptographic QR / seal validation (→ Tier B) | ⛔ Roadmap |
| AuthN/Z, multi-tenant RLS enforcement | ⛔ Roadmap |
| Docker/compose prod topology, CI/CD, K8s | ⛔ Not included |
| SDKs, mobile wallet, SLA, status page | ⛔ Not built — do not represent as available |

---

## The problem

South Africa loses heavily to document fraud and redundant verification:
forged tax clearances, BEE certificates, and company registrations in
procurement; the same documents re-submitted to many agencies; fraud losses
across fintech, property, and vehicle finance; and offshore data processing
that creates POPIA and sovereignty risk.

## The approach

- **AI-free forensic engine** — explainable, reproducible fraud signals rather
  than a black-box model.
- **Reusable credentials** — verify once, issue a signed W3C credential, reuse
  with holder consent.
- **Sovereign by design** — analysis is offline; the data layer lives in
  af-south-1.

### Launch focus: fintech KYC / CDD

Kamano launches on **one vertical — fintech KYC** — the clearest FICA driver
with the fastest sales cycle. Property, vehicle finance, legal, and government
are deliberate _roadmap_, not launch surface.

---

## Honesty about assurance

With source-of-truth integrations off (the launch default), Kamano establishes
**authenticity** (has this file been tampered with?) but **not validity** (is
this a real, currently-valid certificate?). Every result says so via its tier:

| Tier | Meaning | Requires |
|---|---|---|
| **A** | Confirmed against an authoritative source | SARS/CIPC/Home Affairs API (roadmap) |
| **B** | Document self-validates | Valid cryptographic seal / QR (roadmap) |
| **C** | Not tampered | Offline forensic analysis (**available now**) |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Next.js 14 (upload UI, trust result view)   │
└───────────────────────┬──────────────────────┘
                        │ REST
┌───────────────────────┴──────────────────────┐
│  FastAPI modular monolith                     │
│   ingestion → forensics → credentials         │
│   + consent / revocation / audit              │
└───────┬───────────────────────┬───────────────┘
        │                       │
 ┌──────┴──────┐        ┌───────┴────────┐
 │ Forensic    │        │ Credential     │
 │ engine      │        │ engine         │
 │ PyMuPDF +   │        │ Ed25519 + W3C  │
 │ OpenCV      │        │ VC + status    │
 └─────────────┘        └────────────────┘
        │
 ┌──────┴───────────────────────────────────────┐
 │ PostgreSQL (AWS RDS af-south-1 in production) │
 │ raw files → S3 af-south-1, 30-day purge       │
 └───────────────────────────────────────────────┘
```

> **Data layer note:** earlier drafts named Supabase Cloud for af-south-1
> storage. **Supabase Cloud has no African region** (verified Oct 2026), so the
> production data layer is **AWS RDS + S3 + KMS in af-south-1** directly. The
> SQL schema is standard PostgreSQL and runs on either. See
> `../doc/Kamano_Strategic_Technical_Review.md` §3.1.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Backend | FastAPI, Python 3.11, Pydantic v2 |
| Forensics | PyMuPDF (fitz), OpenCV (headless), Pillow — offline |
| Credentials | Ed25519, W3C Verifiable Credentials, QR |
| Database | PostgreSQL 16 (AWS RDS af-south-1 in production) |
| Storage | AWS S3 (af-south-1) with 30-day lifecycle purge |

---

## Quick start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
python run.py
```

- API: http://localhost:8000
- Docs: http://localhost:8000/docs

Run the tests:

```bash
pytest -q
```

Generate sample PDFs (one clean, one with editing-software metadata):

```bash
cd sample-docs
python generate_test_pdfs.py
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

- UI: http://localhost:3000

### With Docker (local dev)

```bash
docker compose -f docker/docker-compose.dev.yml up --build
```

---

## API (v1)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/verify/document` | Upload a PDF, get forensic result + assurance tier |
| `GET` | `/api/v1/verification/{id}` | Fetch a verification |
| `GET` | `/api/v1/verifications` | List verifications |
| `POST` | `/api/v1/credential/issue` | Issue a trust credential from a verification |
| `GET` | `/api/v1/credential/{id}` | Fetch a credential |
| `POST` | `/api/v1/credential/{id}/revoke` | Revoke a credential |
| `GET` | `/api/v1/credentials/status/{id}` | Public revocation/expiry status |
| `POST` | `/api/v1/credential/consent` | Record holder consent for a verifier |
| `POST` | `/api/v1/credential/verify` | Public: verify signature + status |
| `GET` | `/api/v1/dashboard/stats` | Counts by decision + assurance tier |
| `GET` | `/api/v1/audit/log` | POPIA audit trail |
| `GET` | `/api/v1/health` | Health + data region |

---

## Compliance posture

- **POPIA** — offline processing, af-south-1 data residency (enforced at
  startup), append-only audit log, raw-document purge at 30 days.
- **FICA** — derived verification records retained 5 years (the raw document is
  purged at 30 days; only minimized/derived data is kept).
- **Explainability** — every decision is a set of stable reason codes.

> Region selection is a data-*location* control, not by itself proof of
> regulatory compliance. Treat POPIA/FICA alignment as an ongoing program with
> legal review, not a checkbox.

---

## Project structure

```
kamano/
├── backend/
│   ├── app/
│   │   ├── api/routes.py          # v1 endpoints (fintech-KYC-first)
│   │   ├── core/                  # config, Ed25519 key management
│   │   ├── models/schemas.py      # Pydantic incl. AssuranceTier
│   │   ├── services/
│   │   │   ├── forensics.py       # offline deterministic engine
│   │   │   ├── credentials.py     # W3C VC issue/verify/revoke
│   │   │   └── store.py           # in-memory store (DB swap-in point)
│   │   └── main.py                # app + data-residency guard
│   ├── tests/                     # smoke + API tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                      # Next.js 14 upload UI
├── supabase/migrations/           # PostgreSQL schema (runs on AWS RDS too)
├── sample-docs/                   # test PDF generator
├── docker/                        # local dev compose
└── README.md
```

---

## License

Proprietary. © 2026 Kamano. All rights reserved.
