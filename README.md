# NeighborPeace V3

NeighborPeace is a GenLayer-native neighborhood mediation protocol. Residents join
with a real GEN bond, submit two-sided public evidence, receive a semantic AI jury
ruling, use one authenticated appeal, and finalize an on-chain settlement.

## Why GenLayer

Residential noise, litter, parking, pet, smoke/odor, property damage, safety access,
and common-area disputes depend on context, attribution, evidence quality, and
proportionality. A deterministic contract cannot inspect public web evidence and
make that subjective judgment fairly. NeighborPeace uses GenLayer web access, LLM
reasoning, and comparative validator consensus for the core ruling.

## V3 value flow

- `register_unit` is payable and requires at least 20 GEN.
- `deposit_bond` is payable and credits the caller's registered unit.
- A guilty ruling sets a fixed GEN fine by severity: 5, 10, or 15 GEN.
- `finalize_report` debits the accused unit's real bond exactly once.
- 80% is emitted to the reporting neighbor and 20% to the treasury for standard
  fine tiers.
- Contract state exposes balance, bonded value, compensation, and treasury totals.

GEN values are stored and sent in wei (`1 GEN = 10^18 wei`). External payout
messages execute when the parent transaction finalizes and should be inspected as
triggered transactions in Explorer.

## Authorization and lifecycle

1. The connected wallet becomes the unit owner; no owner address is accepted as an
   input parameter.
2. Only that owner can add to its bond or file a report as that unit.
3. Only the accused unit can submit or waive counter-evidence. The reporter cannot
   close the response stage before its 24-hour deadline; after expiry the reporter
   can advance an unanswered case so it cannot be blocked indefinitely.
4. The first jury reads complaint and response evidence.
5. Either authenticated party may use the single appeal.
6. The initial ruling remains unfinalized for a 24-hour appeal window.
7. A `NEEDS_EVIDENCE` case permits at most two authenticated evidence replacements.
8. The appeal jury rereads the complete original record plus new appeal evidence.
9. Finalization is idempotent and emits real GEN transfers only for a guilty ruling.

## Consensus

AI rulings use `gl.eq_principle.prompt_comparative`. Verdict and severity must match
exactly because they control settlement; reason wording may differ when grounded in
compatible evidence. Unreadable or malformed evidence becomes `NEEDS_EVIDENCE`.

## Repository

```text
contracts/   Intelligent Contract
frontend/    Next.js application using genlayer-js
tests/       Contract structure and security regression checks
docs/        Contract review notes
plans/       Rebuild plan
```

## Local verification

```bash
python -m unittest discover -s tests -v
cd frontend
npm install
npm run lint
npm run build
npm run dev -- -p 3050
```

Open `http://localhost:3050`.

## Deployment

NeighborPeace V3 is deployed on GenLayer Studio / Studionet:

```text
0x8666B90d8cc661e15b4d978C0cF9602bA6575b6C
```

The frontend uses `genlayer-js` for live contract reads, payable writes, accepted
receipt execution verification, and post-write state synchronization. The contract
verification page also accepts a browser-local contract address override so a
reviewer can test another Studionet deployment without rebuilding the application.

The contract source now supports eight residential policy categories. This source
revision requires a new Studio deployment before those additional categories are
enabled on-chain.
