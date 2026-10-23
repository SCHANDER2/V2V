# Project: V2V Emergency Blood & Platelet Dispatch PWA

## Architecture
The V2V emergency dispatch system is a Next.js 14 App Router Progressive Web Application (PWA) with Prisma ORM, designed for rapid community mobilization for blood and Single Donor Platelets (SDP).
The architecture enforces 4 core counter-loops:
- **Counter-Loop 1 (Expanding Ring Wave Batching)**: Dispatches in concentric geospatial waves (Wave 1: 0–3 km, Wave 2: 3–7 km, Wave 3: 7–15 km) with a $5 \times \text{remaining slots}$ batch limit and a 72-hour anti-spam donor cooldown.
- **Counter-Loop 2 (Atomic N+1 Token Bucket)**: Caps active donor travel slots at $N+1$ (where $N$ is units needed, $+1$ is a hot standby buffer). Excess donor responses are queued as prioritized `STANDBY`.
- **Counter-Loop 3 (Dead-Man's Switch Eviction & Watchdog)**: Leases expire after a 25-minute travel window (`leaseExpiresAt < now`). The background watchdog evicts timed-out leases (`EVICTED_TIMEOUT`) and automatically promotes the earliest `STANDBY` donor with a fresh 25-minute lease.
- **Counter-Loop 4 (Anti-Tout & Masked Communication)**: Real phone numbers are never exposed. All interactions use the `CloudTelephonyBridge` or handshake OTPs. Once a request is `FULFILLED_CLOSED` or `EXPIRED`, all communication bridges are deactivated.

Database layer: Configured with SQLite (`file:./dev.db`) for portable local execution, seed scripts, and CI/CD testing with zero daemon dependencies.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Tooling & Aliases Setup | Configure `tsconfig.json` with `@/*`, Tailwind/PostCSS, and `globals.css` | M1 | Survey (explorer_survey_1) |
| 2 | Prisma Schema & SQLite Migration | Add `bloodGroup` to `EmergencyRequest`, configure SQLite provider, generate Prisma client | M1 | Survey (explorer_survey_1, 3) |
| 3 | Core Engine Rectification | Fix duplicate prisma in `lease-manager.ts`, fix imports/types in `dispatcher.ts`, export `dispatchWave` | M1 | Survey (explorer_survey_1, spec_miner_2) |
| 4 | Database Seed Script | Deterministic seed with 52 donors across Delhi NCR/Faridabad, 3 hospitals, multi-state wave requests | M1 | ORIGINAL_REQUEST R1, AC1 |
| 5 | ERaktKoshAdapter | Typed mock adapter checking local blood bank stock availability and nearby banks | M2 | ORIGINAL_REQUEST R3 |
| 6 | WhatsAppCloudAdapter | Typed mock adapter with template dispatch, button replies, and webhook simulation | M2 | ORIGINAL_REQUEST R3 |
| 7 | CloudTelephonyBridge | Typed mock adapter for masked phone call bridging with Anti-Tout lease validation | M2 | ORIGINAL_REQUEST R3 |
| 8 | RequisitionVerifierOCR | Typed mock OCR adapter extracting patient UHID, hospital, component from slip | M2 | ORIGINAL_REQUEST R3 |
| 9 | Adapter DI Registry | Central registry (`src/lib/adapters/index.ts`) with test override capabilities | M2 | Survey (explorer_survey_3) |
| 10 | Background Cron Route | `/api/cron/lease-watchdog` route handler invoking `evictExpiredLeases` every 5m | M2 | ORIGINAL_REQUEST R4, AC3 |
| 11 | Standby Promotion Logic | Automatic promotion of earliest standby donor on lease eviction | M2 | ORIGINAL_REQUEST R4, AC3 |
| 12 | Short-Hash URL Engine | 12-character URL-safe base64 cryptographic hash generation with 12h TTL | M2 | ORIGINAL_REQUEST R5, AC4 |
| 13 | API Route Endpoints | Backend API endpoints for request creation, fetching, lease locking, arrival check-in | M2 | Survey (spec_miner_2) |
| 14 | Emergency SOS Intake Page | `/request/new` mobile form with patient details, component, blood group, mode toggle | M3 | ORIGINAL_REQUEST R2, AC2 |
| 15 | Live OCR Simulation | Simulated scan animation and auto-fill of requisition slip fields | M3 | ORIGINAL_REQUEST R2, AC2 |
| 16 | Replacement vs Exact Toggle | Interactive mode switch enforcing exact compatibility for SDP platelets | M3 | ORIGINAL_REQUEST R2, AC2 |
| 17 | e-RaktKosh Stock Preview | Live stock preview badge in intake form before launching waves | M3 | ORIGINAL_REQUEST R2, AC2 |
| 18 | Family Command Center | `/r/[short_hash]` state-dependent command center (pending, active, fulfilled, expired) | M3 | ORIGINAL_REQUEST R2, AC2 |
| 19 | Wave Radar Visualization | Animated concentric ring radar showing Wave 1 (0-3km), Wave 2 (3-7km), Wave 3 (7-15km) | M3 | ORIGINAL_REQUEST R2, AC2 |
| 20 | Active Donors & ETA Countdown | Roster of active en-route donors with 25-minute dead-man's switch countdown bar | M3 | ORIGINAL_REQUEST R2, AC2 |
| 21 | Masked Call Bridge Button | Telephony trigger connecting family and donor via virtual proxy line | M3 | ORIGINAL_REQUEST R2, AC2 |
| 22 | Handshake PIN Display | Secure 4-digit verification PIN displayed to family for counter verification | M3 | ORIGINAL_REQUEST R2, AC2 |
| 23 | Anti-Tout Deactivation | Strict hiding of call triggers and contacts when request is fulfilled or expired | M3 | ORIGINAL_REQUEST R2, AC2 |
| 24 | Sidecar Viewer Link Integration | Mandatory `sidecar://` pill link for Biomolecular Structure Viewer | M3 | ORIGINAL_REQUEST R5, AGENTS.md |
| 25 | Donor WhatsApp JIT Flow | `/donor/respond/[token]` mobile landing page with multi-step commitment flow | M3 | ORIGINAL_REQUEST R2, AC2 |
| 26 | NBTC Rapid Health Screener | 5-question health checklist with instant clinical deferral on disqualification | M3 | ORIGINAL_REQUEST R2, AC2 |
| 27 | Atomic Slot Lock Execution | Concurrency-safe slot lock invoking `attemptLease` (JIT_PASSED or STANDBY) | M3 | ORIGINAL_REQUEST R2, AC2 |
| 28 | Standby Buffer Screen | Dedicated queuing screen for standby donors with push readiness instructions | M3 | ORIGINAL_REQUEST R2, AC2 |
| 29 | Google Maps Navigation Deep Link | One-tap navigation intent to destination hospital | M3 | ORIGINAL_REQUEST R2, AC2 |
| 30 | High-Contrast V2V-PASS | Emergency digital badge with dynamic QR code, arrival button, and PIN prompt | M3 | ORIGINAL_REQUEST R2, AC2 |
| 31 | Chaos Control Dashboard | `/admin/simulator` administrative dashboard for chaos simulation and testing | M3 | ORIGINAL_REQUEST R2, AC2 |
| 32 | Wave Advancement Simulator | Manual wave dispatch trigger with radius expansion logs | M3 | ORIGINAL_REQUEST R2, AC2 |
| 33 | Donor Ghosting Simulator | Lease expiration accelerator testing dead-man's eviction and standby promotion | M3 | ORIGINAL_REQUEST R2, AC2 |
| 34 | NBTC Eligibility Lab | Interactive rule calculator testing boundary conditions (weight, gender, cooldown) | M3 | ORIGINAL_REQUEST R2, AC2 |
| 35 | Unit & E2E Testing Suite | Comprehensive test suite (seed, UI render across states, cron, short-hash TTL) | M4 & E2E | ORIGINAL_REQUEST R6, AC5 |
| 36 | Adversarial Hardening (Tier 5) | White-box stress testing, boundary fuzzing, and race condition verification | M4 | Project Pattern |
| 37 | Full System Verification | Zero build errors (`npm run build`), clean dev startup (`npm run dev`), all tests pass | M4 | ORIGINAL_REQUEST AC6 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Foundation: Schema, Seed & Engines | Features 1–4. Tooling config, SQLite schema migration, engine fixes in `lease-manager.ts` and `dispatcher.ts`, `prisma/seed.ts` (52 donors, 3 hospitals). | none | DONE |
| M2 | Adapters, Cron & Link Generation | Features 5–13. Mock adapters (`ERaktKosh`, `WhatsApp`, `Telephony`, `OCR`), DI registry, `/api/cron/lease-watchdog`, short-hash generator, API endpoints. | M1 | DONE |
| M3 | UI Pages & Sidecar Integration | Features 14–34. App Router pages: `/request/new`, `/r/[short_hash]`, `/donor/respond/[token]`, `/admin/simulator`, `sidecar://` pill link integration. | M2 | IN_PROGRESS |
| M4 | Final Milestone: E2E Pass & Hardening | Features 35–37. Pass 100% of E2E test suite (Tiers 1-4), Tier 5 adversarial hardening, verify AC1-AC6 (`npm run seed`, `npm test`, `npm run build`). | M3, TEST_READY | PLANNED |

---

## Interface Contracts

### M1 ↔ M2: Database Models & Core Engines
- `EmergencyRequest`: Fields include `id: Int`, `patientName: String`, `patientUhid: String`, `hospitalName: String`, `hospitalLat: Float`, `hospitalLng: Float`, `component: String`, `bloodGroup: String`, `requestMode: String`, `unitsNeeded: Int`, `waveState: String`, `shortHash: String`, `expiresAt: DateTime`.
- `Donor`: Fields include `id: Int`, `name: String`, `phoneNumber: String`, `latitude: Float`, `longitude: Float`, `bloodGroup: String`, `gender: String`, `weightKg: Float`, `lastWholeBlood: DateTime?`, `lastPlatelet: DateTime?`, `lastPingedAt: DateTime?`, `snoozeUntil: DateTime?`.
- `DonorLease`: Fields include `id: Int`, `requestId: Int`, `donorId: Int`, `status: String`, `leaseExpiresAt: DateTime`, `handshakePin: String?`.
- `lease-manager.ts`:
  - `attemptLease(requestId: number, donorId: number): Promise<DonorLease>`
  - `evictExpiredLeases(): Promise<{ evictedCount: number; promotedCount: number; evictedLeaseIds: number[]; promotedLeaseIds: number[] }>`
  - `maybeLockRequest(requestId: number): Promise<void>`
- `dispatcher.ts`:
  - `selectDonorsForWave(requestId: number): Promise<Donor[]>`
  - `pingDonors(requestId: number, donors: Donor[]): Promise<void>`
  - `advanceWaveOrClose(requestId: number): Promise<void>`
  - `dispatchWave(requestId: number): Promise<{ waveState: string; pingedDonorsCount: number }>`

### M2 ↔ M3: Adapters & Backend API Routes
- Adapters in `@/lib/adapters`:
  - `adapters.eraktKosh.checkStock(lat, lng, component, bloodGroup): Promise<boolean>`
  - `adapters.eraktKosh.getStockPreview(lat, lng, component, bloodGroup): Promise<ERaktKoshStockPreview>`
  - `adapters.whatsapp.sendTemplate(toPhone, templateName, components): Promise<WhatsAppSendResult>`
  - `adapters.telephony.initiateMaskedBridge(requestId, donorId, attendantPhone, donorPhone): Promise<TelephonyBridgeSession>`
  - `adapters.ocr.verifyRequisition(imageInput): Promise<OCRVerificationResult>`
- API Routes:
  - `POST /api/request/create`: Body: `EmergencyRequestInput` -> returns `{ id, shortHash, trackingUrl, expiresAt, waveState, sidecarUrl }`
  - `GET /api/request/[shortHash]`: returns `{ request, activeLeases, standbyLeases, pingCount }`
  - `POST /api/lease/lock`: Body: `{ requestId, donorId }` -> returns `{ leaseId, status, leaseExpiresAt, handshakePin }`
  - `GET /api/cron/lease-watchdog`: returns `{ success: true, timestamp, summary }`
  - `POST /api/simulator/trigger-wave`: Body: `{ requestId }`
  - `POST /api/simulator/ghost-donor`: Body: `{ leaseId }`

### M3 ↔ M4 & User: Sidecar Visualization Contract
- In all chat summaries and in `/r/[short_hash]` and `/request/new`:
  - Markdown pill link: `[Biomolecular Structure Viewer](sidecar://science/biomolecular_structure_viewer/ui.html)`

---

## Code Layout
```
src/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx
│   ├── request/
│   │   └── new/
│   │       └── page.tsx            # Emergency SOS Intake Form
│   ├── r/
│   │   └── [shortHash]/
│   │       └── page.tsx            # Family Command Center
│   ├── donor/
│   │   └── respond/
│   │       └── [token]/
│   │           └── page.tsx        # WhatsApp JIT Response & V2V-PASS
│   ├── admin/
│   │   └── simulator/
│   │       └── page.tsx            # Chaos Control Dashboard
│   └── api/
│       ├── request/
│       │   ├── create/route.ts
│       │   └── [shortHash]/route.ts
│       ├── lease/
│       │   ├── lock/route.ts
│       │   ├── arrive/route.ts
│       │   └── update-eta/route.ts
│       ├── cron/
│       │   └── lease-watchdog/route.ts
│       └── simulator/
│           ├── trigger-wave/route.ts
│           └── ghost-donor/route.ts
├── components/                     # Reusable UI widgets (Radar, Pass, Checklist)
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── shortHash.ts                # 12-char cryptographic URL generator
│   ├── adapters/                   # Integration adapters (ERaktKosh, WhatsApp, Telephony, OCR)
│   │   ├── interfaces/
│   │   ├── mocks/
│   │   └── index.ts
│   └── engines/                    # Core dispatch and matching engines
│       ├── compatibility.ts
│       ├── eligibility.ts
│       ├── lease-manager.ts
│       └── dispatcher.ts
├── types/
│   └── enums.ts                    # Enums for portable DB compatibility
└── utils/
    └── haversine.ts
prisma/
├── schema.prisma
└── seed.ts
```
