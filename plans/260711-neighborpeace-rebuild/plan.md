# NeighborPeace Rebuild Plan

## Product direction

NeighborPeace becomes a complete, evidence-based neighborhood mediation protocol,
not a single-screen form demo. The experience should feel calm, civic, and impartial:
soft mineral white surfaces, deep evergreen text, muted sage, a small amber warning
accent, and restrained coral only for violations. Avoid neon dashboards and dense
card walls.

## Success criteria

- Contract V2 completes the full dispute lifecycle on GenLayer Studio.
- Studio Explorer contains successful calls for every write function.
- Production UI contains no fabricated residents, reports, verdicts, or balances.
- Each major write workflow has its own route and focused instructions.
- Every transaction shows wallet, contract, network, pending consensus, finalized,
  and error states.
- A new user can understand and complete the flow without external instructions.
- Desktop and mobile use one browser scrollbar with no nested scroll containers.
- Sections reveal on scroll with restrained motion and respect reduced-motion settings.

## Information architecture

| Route | Contract responsibility | User purpose |
| --- | --- | --- |
| `/` | Read aggregate state | Understand NeighborPeace and the five-step process |
| `/community` | `get_member_count`, `get_member` | Browse verified units and bond health |
| `/join` | `register_unit` | Register the connected wallet's unit |
| `/bond` | `deposit_bond` | Add to the current user's community bond ledger |
| `/reports` | `get_report_count`, `get_report` | Browse real reports and filter by lifecycle state |
| `/reports/new` | `file_report` | File one guided incident report |
| `/reports/[id]` | Report/evidence/ruling views | Follow the complete case timeline |
| `/reports/[id]/respond` | `submit_response` | Let the accused submit counter-evidence |
| `/reports/[id]/review` | `evaluate_report` | Trigger AI review when the case is ready |
| `/reports/[id]/appeal` | `appeal_report`, `evaluate_appeal` | Submit and review one appeal |
| `/reports/[id]/finalize` | `finalize_report` | Apply an eligible settlement exactly once |
| `/activity` | Read state and transaction links | Show verifiable contract use and Explorer evidence |
| `/how-it-works` | No writes | Explain evidence rules, consensus, statuses, and fees |

## Frontend system

### Shared shell

- Header: logo, Community, Reports, How it works, wallet control.
- Persistent contract strip: Studionet badge, shortened contract address, Sync button,
  last successful sync, Explorer link.
- Mobile navigation uses a menu; no horizontal clipping.
- Footer repeats the contract address and links to documentation and Explorer.

### Page composition

- One clear page title, one primary action, and one supporting action per route.
- Forms use progressive steps, evidence previews, eligibility checks, and a final
  transaction review rather than generic stacked input cards.
- Case pages use a vertical civic-case timeline: filed, response, jury review, appeal,
  settlement.
- Empty states explain the next useful action without inventing example records.
- Pending AI consensus gets a dedicated state with transaction hash and Explorer link.

### Motion

- Page entry: 180-260 ms opacity/translate reveal.
- Scroll sections: IntersectionObserver or Motion `whileInView`, once per section.
- Timeline progress animates only after state is loaded.
- Buttons use small color/elevation transitions; no continuous decorative movement.
- `prefers-reduced-motion` disables non-essential movement.

## Data architecture

- Move GenLayer access to a typed service with one method per contract function.
- Route browser reads through a Next.js API endpoint if direct Studionet RPC is blocked
  by CORS; wallet writes remain client-side through `genlayer-js`.
- Add parsers for member/report JSON and reject malformed responses.
- Use a shared transaction state model: idle, wallet_required, signing, submitted,
  consensus, finalized, failed.
- Never fall back to mock data in production.

## Delivery phases

### Phase 1: Contract V2 and tests

- Add ownership, two-sided evidence, appeal, finalization, policy and replay guards.
- Replace `strict_eq` with `prompt_comparative` for subjective rulings.
- Add robust AI parsing and web failure handling.
- Add static and lifecycle-focused tests.
- Verify syntax and GenLayer schema locally.

Exit gate: all local contract tests pass and every public function has a documented
state transition and error code.

### Phase 2: Frontend foundation

- Create route groups, shared shell, design tokens, typed GenLayer client and API reads.
- Implement wallet, contract status, sync, Explorer links and global transaction UI.
- Remove all mock residents, reports and demo mutation branches.

Exit gate: production build passes and the old contract can be read without displaying
fabricated data.

### Phase 3: Function pages

- Build Join, Bond, New Report, Response, Review, Appeal and Finalize pages.
- Build Reports list, Case detail timeline, Community and Activity pages.
- Add contextual instructions and preflight validation to every workflow.

Exit gate: each contract function is reachable through one focused page and all error
codes have a user-facing message.

### Phase 4: Visual refinement and accessibility

- Add scroll reveals, responsive layout, keyboard focus, contrast and reduced motion.
- Verify desktop and mobile screenshots and ensure there is only one page scrollbar.
- Test long addresses, reasons, evidence URLs and empty states for overflow.

Exit gate: visual review passes at desktop and mobile sizes with no overlap or nested
scrolling.

### Phase 5: Studio proof and resubmission evidence

- Deploy Contract V2 only after local approval.
- Run one complete two-party dispute through Studio.
- Record transaction hashes for registration, report, response, review, appeal or
  finalization.
- Put the new address in all env templates and redeploy the frontend only after user
  approval.
- Update README with setup, architecture, contract methods, live flow, Explorer links
  and a short demo script.

Exit gate: live UI reads the V2 contract, writes finalize successfully, and Explorer
shows the same state transitions.

## First implementation slice

1. Rewrite the contract to V2 storage/state machine without changing the frontend.
2. Add contract tests and local verification commands.
3. Present the V2 contract for Studio deployment.
4. After receiving the new address, build and connect the multi-page frontend.

This order avoids designing pages around a contract interface that must immediately
change again.
