# Explainer: optional `npm` sanity checks (`review:gates`, `review:v11`, `qc`)

**Audience:** product owners and anyone running UAT who sees these commands in [`docs/testing/mvd-v1-1-uat.md`](../testing/mvd-v1-1-uat.md) and wants to know what they *do*.

## What “optional sanity” means

After you run the **pipeline** (`npm run pipeline …`), the repo can write files under `out/` (signal cards, org context, strategy catalogue, etc.). The three commands below are **automated checks** that answer:

- “Do the **numbers and card rules** still match what we locked in?” (`qc`)
- “Do the **signal cards** for Surge/Sam pass our **quality gates**?” (`review:gates`)
- “Do the **v1.1 artefacts** (KPI spec, org merge, 12+6 strategy output) look structurally correct?” (`review:v11`)

They are **optional** in the sense that *manual UAT in the browser* can still happen without them — but **CI** runs them (see `npm run ci` in `package.json`), so passing them is how you match the same bar as automation.

**When to run them:** after `out/` exists (typically right after a successful `npm run pipeline`).

---

## The three commands (at a glance)

| Command | One-line purpose | Main output file |
|--------|------------------|-------------------|
| `npm run review:gates` | Card-level **trust** rules on `out/processed-signals.json` | `out/review-gates.json` |
| `npm run review:v11` | **MVD v1.1 shape** checks (org context + strategy catalogue + KPI spec on disk) | `out/review-gates-v11.json` |
| `npm run qc` | **Golden replay**, **JSON Schema**, **insufficient-data** rules | `out/qc-report.json` + `out/qc-report.html` |

If any command exits with a non-zero status, treat it as **failed** until the report explains why.

---

## `npm run review:gates` — signal card quality gates

**What it does:** reads `out/processed-signals.json` and runs scripted checks such as:

- Non-leads KPI cards should not **reuse the same numeric value** as the leads KPI (avoids “everything looks like 53”).
- **Surge vs Sam** should differ enough in KPI IDs or narrative text (so decks are not clones).
- **Recommended** cards need a real **recommendation rationale**; **insufficient-data** cards need enough **missing fields** and **sourcing tips**.
- If a card shows a **benchmark** line, it should include a **URL** and a **caveat** (so comparisons are not fake precision).

**Why it matters:** catches mistakes that humans notice as “this doesn’t feel trustworthy” — in a repeatable way.

**Output:** `out/review-gates.json` with `pass: true/false` and per-gate detail.

---

## `npm run review:v11` — MVD v1.1 release gates

**What it does:** checks **files and shapes** expected for v1.1 (see implementation plan Decision 14), including:

- `data/kpi-spec/kpi-spec-v1.json` exists and **validates** against the KPI spec schema.
- `out/org-context.json` exists and looks like a valid **merged org** snapshot.
- `out/strategy-catalogue.json` exists and has the **12 KPIs**, **6 decisions**, and **3+3 sample calcs** structure the product defined.

**Why it matters:** confirms the pipeline produced the **admin/validation** artefacts (full catalogue), not only the smaller preview deck.

**Output:** `out/review-gates-v11.json`. If it fails and `processed-signals.json` is missing, the log may hint to run `npm run pipeline -- --skip-llm` first.

---

## `npm run qc` — data QC (golden replay + schema + insufficient cards)

**What it does:** runs the broader **quality-check** report:

1. **Golden replay:** replays a few KPI calculations from fixtures and compares results to **expected** numbers (catches silent math drift).
2. **JSON Schema:** validates key artefacts against schemas (so shapes don’t break consumers).
3. **Insufficient-data validation:** checks cards marked insufficient follow the rules (e.g. missing-data messaging).

**Why it matters:** this is the “data team” style check — *did the pipeline outputs stay aligned with definitions and golden examples*.

**Output:**

- `out/qc-report.json` (machine-readable)
- `out/qc-report.html` (open in a browser for a friendlier read)

The CLI also prints a JSON summary to the terminal.

---

## Suggested order (local)

1. `npm run pipeline -- --skip-llm` (or full LLM if you are judging copy — see UAT doc).
2. `npm run review:gates`
3. `npm run review:v11`
4. `npm run qc`

If step 1 fails, fix pipeline inputs or errors before trusting the later steps.

---

## How this ties to CI

`npm run ci` runs **build → validate onboarding → validate KPI spec → test → lint → pipeline (skip LLM) → review:gates → review:v11 → qc → Nuxt build**. The three “sanity” commands are the **middle** of that chain: they are the automated **definition of “green”** for data outputs, without opening a browser.

---

## Related docs

- [`docs/testing/mvd-v1-1-uat.md`](../testing/mvd-v1-1-uat.md) — manual UAT (optional for humans; these npm runs are the machine bar).
- [`docs/testing/README.md`](../testing/README.md) — testing guide and command table.
- [`docs/implementation/MVD_V1_1_ARTIFACTS.md`](../implementation/MVD_V1_1_ARTIFACTS.md) — where `out/` files come from.
