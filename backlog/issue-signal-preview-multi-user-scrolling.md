# Issue: Multi-user signal preview (Surge / Sam) — 10 cards per user

## Metadata
- Type: feature
- Priority: high
- Effort: medium
- Release target: 25 Mar (see `release acceptance criteria/Refined AC for 25 Mar`)
- Status: backlog

## TL;DR
Expand the single-signal preview into a multi-signal preview with two user perspectives (`Surge`, `Sam`). For each user, the reviewer scrolls through **10** signal cards that match the refined AC categories. Prefer **pipeline-generated** `out/processed-signals.json` as source of truth; use **fixtures** only for UI work or until the pipeline emits full payloads.

**Per user (10 cards):**
| Count | Category | Notes |
|------:|----------|--------|
| 3 | Requested — sufficient data | Overview, expanded, switch cards |
| 3 | Recommended — sufficient data | Expanded includes **why recommended** |
| 3 | Recommended — insufficient data | Expanded: why, what’s missing, **tips to source data** |
| 1 | Requested — insufficient data | Same expanded pattern as other insufficient cards |

**Totals:** 10 cards per user, **20** cards if both users are in scope for one review session.

## Current State
- `/preview/signal` renders one static card from one fixture file.
- API route `/api/preview/signal` returns one payload from `fixtures/samples/signal-card-user-preview.json`.
- No concept of user perspective (`Surge` vs `Sam`).
- No scrolling through multiple signals or category tags.

## Expected Outcome
In the signal preview view:
1. Reviewer selects user perspective: `Surge` or `Sam`.
2. For the selected user, reviewer scrolls through **10** signals in a stable order (e.g. requested-sufficient block, then recommended-sufficient, then recommended-insufficient, then requested-insufficient — exact order TBD in implementation but must be consistent and QC-testable).
3. Signals are grouped/tagged so the reviewer can distinguish all **four** categories above.
4. Card layout stays wireframe/content-first (no polished design requirement).
5. Data loads from generated artifacts when available (`out/processed-signals.json` + `out/agent-signals.json`); fixtures remain a **fallback** for development.

## Scope Details
- **Requested** vs **recommended** matches product language; **sufficient** vs **insufficient** drives which schema/fields the card uses (`SignalOverview` / processed vs insufficient-data contract — align with `schemas/` and `src/types/contracts.ts`).
- Keep existing wireframe fields where applicable; insufficient cards add the extra narrative fields required by AC.
- Simple UX: toggle + scroll/list; no pagination required for 10 cards.

## Acceptance Criteria
- User toggle exists in `/preview/signal` with values `Surge` and `Sam`.
- Exactly **10** cards render for the selected user when data is complete.
- Card mix matches: 3 requested sufficient, 3 recommended sufficient, 3 recommended insufficient, 1 requested insufficient (per user).
- Reviewer can move through all cards for the selected user via scrolling (or equivalent).
- No unnecessary contract break to shared signal fields; extend types for insufficient/recommended rationale as needed.

## Relevant Files (starting points)
- `apps/qc-ui/pages/preview/signal.vue` — perspective selector + multi-card rendering/scroll
- `apps/qc-ui/server/api/preview/signal.get.ts` — multi-user collection from artifacts or fixture
- `fixtures/samples/` — multi-user dataset shape for fallback dev only
- `implementation plans/MVD_ARCHITECTURE_AND_DATA_FLOW.md` — how artifacts feed the UI

## Risks / Notes
- Fixture shape change will require updating API + page together.
- Keep category tags stable in JSON (`requested` | `recommended` × `sufficient` | `insufficient` or explicit enum) so QC can assert counts.
- If card volume grows later, consider virtualization; not required for 10 cards.
