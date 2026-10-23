# E2E Test Infra: V2V Emergency Blood & Platelet Dispatch PWA

## Test Philosophy
- Opaque-box, requirement-driven testing derived strictly from `ORIGINAL_REQUEST.md` (R1-R6, AC1-AC6).
- Verification is independent of internal module implementation.
- Methodology: Systematic 4-tier testing (Category-Partition, Boundary Value Analysis, Pairwise Combinatorial, Real-World Workloads) followed by Tier 5 Adversarial Hardening.

## Feature Inventory
| # | Feature | Source | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|--------|:------:|:------:|:------:|:------:|
| 1 | Database Seed (R1, AC1) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 2 | UI Page Rendering (R2, AC2) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 3 | Adapters & DI (R3) | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 4 | Cron Watchdog & Eviction (R4, AC3) | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 5 | Short-Hash & Sidecar (R5, AC4) | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ |
| 6 | Full Build & Startup (AC6) | ORIGINAL_REQUEST §AC6 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Test Runner: Jest 29 with `ts-jest` and `@testing-library/react`.
- Environment: Node.js for engine, seed, cron, and API tests; JSDOM (`@jest-environment jsdom`) for React UI component tests.
- Invocation: `npm test` runs all unit & integration test suites.
- Pass/Fail Semantics: 0 test failures, exit code 0.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Emergency Platelet (SDP) Wave at AIIMS Trauma Centre: Intake -> Exact Compatibility -> Wave 1 Dispatch -> WhatsApp JIT -> Slot Lock -> Navigation -> Arrival Handshake PIN | F1, F2, F3, F4, F5 | High |
| 2 | En-route Donor Ghosting & Dead-Man's Switch: Active donor lease reaches 25m expiration -> Cron watchdog evicts lease -> Standby donor promoted with fresh 25m lease | F1, F3, F4 | High |
| 3 | Replacement Whole Blood Requisition with OCR upload and e-RaktKosh check: OCR extracts slip -> e-RaktKosh checks local bank -> Community wave triggers | F1, F2, F3 | Medium |
| 4 | Fulfilled Request Anti-Tout Enforcement: Request completes fulfillment -> Command center deactivates masked calls and masks phone numbers | F2, F3, F5 | Medium |
| 5 | Expired Request Lifecycle: 12-hour TTL elapses -> Short-hash URL resolves to expired status -> No further dispatch permitted | F2, F5 | Medium |

## Coverage Thresholds
- Tier 1: >=5 tests per core feature
- Tier 2: Boundary & corner cases (weight boundaries <45kg / <50kg, cooldown days 89 vs 90 and 119 vs 120, short-hash format and collision resistance)
- Tier 3: Cross-feature combinations (SDP mode lock, lease lock at N+1 tokens, eviction with and without standby)
- Tier 4: Real-world end-to-end user journeys
