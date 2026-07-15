# NeighborPeace V3 Review Status

Review date: 2026-07-15

## Resolved architecture findings

- Unit ownership comes from `gl.message.sender_address` and every party action is
  authorized against the stored owner.
- Unit bonds are real payable GEN custody rather than mock USDC counters.
- A final guilty ruling emits real GEN compensation and treasury transfers exactly
  once.
- Complaint, response, and appeal evidence are stored separately and reread by the
  appropriate jury.
- Subjective rulings use `prompt_comparative`; free-form reasons are not compared
  byte-for-byte.
- Web failures become `NEEDS_EVIDENCE`, and malformed AI output cannot settle a case.
- Duplicate incident references use a direct tracking map rather than an unbounded
  scan through all historical reports.
- The UI contains no fabricated production records and reads state through
  `genlayer-js`.

## 2026-07-15 reviewer follow-up

The review requested two additional changes:

1. Reviewers must be able to point the frontend at their own Studionet deployment.
   The contract verification page now persists a validated browser-local address
   override. All reads, writes, Explorer links, lists, and action pages resolve this
   runtime address before falling back to the production environment value.
2. The policy scope must cover more than noise and litter. Contract and frontend now
   support noise, litter, parking/access obstruction, pet nuisance, smoke/odor
   intrusion, shared-property damage, safety obstruction, and common-area misuse.
   Each category supplies domain-specific evidence guidance to the AI jury.

Transaction polling now waits for `ACCEPTED` and verifies
`txExecutionResultName == FINISHED_WITH_RETURN`, avoiding a UI timeout while still
rejecting on-chain business errors.

## Deployment requirement

The expanded policy taxonomy changes contract code and therefore requires a fresh
Studio deployment. After deployment, update every environment and README address,
verify `get_contract_state`, execute the full report lifecycle, and confirm the
resulting activity in Explorer before resubmission.
