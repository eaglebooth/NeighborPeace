# NeighborPeace Contract Review

Review date: 2026-07-11

Deployed contract: `0x4Cba8D6F4c8Af141F8AaE273d174dE24e189cF34` on GenLayer Studio.

## Current deployment evidence

The Studio Explorer shows one successful constructor transaction and no calls to
`register_unit`, `deposit_bond`, `file_report`, or `evaluate_report`. The current
deployment therefore proves that the contract can be deployed, but it does not prove
that its user lifecycle works.

## Findings

### Critical: consensus compares free-form text byte-for-byte

`evaluate_report` wraps a JSON result containing `reason` in
`gl.eq_principle.strict_eq`. Validators can agree on `GUILTY` while phrasing the
reason differently, which can prevent consensus. Replace this with
`gl.eq_principle.prompt_comparative` and a principle that compares the verdict,
evidence attribution, rule threshold, confidence band, and settlement outcome while
ignoring harmless wording differences.

### Critical: production UI presents mock state as contract state

The frontend initializes three residents and two reports even though the deployed
contract has zero calls. Mock actions also mutate local state when no contract is
configured. Production must use empty/loading/error states and only show records read
from the deployed contract. Demo fixtures may exist only behind an explicit local
development flag.

### High: identity and authorization are not enforced

`register_unit` accepts an arbitrary `owner_address`; `file_report` accepts any
`reporter_id`; `deposit_bond` accepts any `member_id`. The contract never verifies
that `gl.message.sender_address` owns the affected member record. A caller can file a
report for another resident or alter another resident's bond ledger.

### High: the escrow is an accounting simulation

`initial_deposit`, bond top-ups, fines, compensation, and treasury amounts are only
storage values. No asset is locked or transferred. Until a supported asset-transfer
flow is implemented, product copy must call this a community bond ledger rather than
USDC escrow. The contract must not imply real payouts that do not occur.

### High: one-sided adjudication

The accused resident cannot submit a response, counter-evidence, or appeal. The AI
evaluates one URL and immediately mutates balances. A fair dispute product needs an
evidence window, accused response, adjudication, appeal, and final settlement stages.

### High: web-fetch failure is treated as evidence

When the URL cannot be fetched, the error text is sent to the model. The result may be
`NOT_GUILTY`, which looks like a substantive verdict. Fetch failure must produce a
deterministic `NEEDS_EVIDENCE` or `WEB_ERROR` state without settling the report.

### Medium: AI output is not validated before storage writes

Verdict labels, confidence range, missing JSON keys, malformed JSON, and oversized
reason text are not safely normalized. The revised contract must whitelist decisions,
clamp confidence to 0-100, truncate reasons, and avoid state mutation when parsing
fails.

### Medium: fixed fines ignore policy and severity

Every guilty report uses a fixed fine of 50 regardless of violation type, severity,
repeat offences, or available bond. Add an explicit policy table and store the policy
version used for every ruling.

### Medium: no duplicate or replay protection

The same evidence URL may be submitted repeatedly against the same target. Add an
evidence fingerprint/reference guard and prevent repeated settlement of the same
incident.

### Medium: insufficient tests

The repository has no contract tests. Add AST/schema checks plus lifecycle tests for
registration, authorization, filing, response, evaluation, appeal, settlement,
malformed AI output, dead URLs, duplicate evidence, insufficient bond, and double
settlement.

## Required Contract V2 lifecycle

1. `register_unit(unit_name)` derives the owner from `gl.message.sender_address`.
2. `deposit_bond(member_id, amount)` checks ownership and updates a clearly labelled
   bond ledger.
3. `file_report(reporter_id, target_id, type, evidence_url, incident_ref)` checks
   ownership, uniqueness, and creates `AWAITING_RESPONSE`.
4. `submit_response(report_id, response_url)` is restricted to the accused owner and
   changes the report to `READY_FOR_REVIEW`.
5. `close_response_window(report_id)` allows review without a response through an
   explicit path.
6. `evaluate_report(report_id)` reads both sides, uses comparative semantic consensus,
   and stores a proposed ruling without moving balances.
7. `appeal_report(report_id, appeal_url)` opens one appeal and records new evidence.
8. `evaluate_appeal(report_id)` uses a separate comparative principle.
9. `finalize_report(report_id)` applies the fine and compensation exactly once.
10. Read methods expose summaries, evidence, ruling, appeal, policy, and settlement.

Any contract change requires a new Studio deployment and a new frontend contract
address. The current deployed address cannot be patched in place.
