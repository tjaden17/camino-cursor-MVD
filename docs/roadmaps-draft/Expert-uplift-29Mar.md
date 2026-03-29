# Camino — Signal Intelligence Roadmap

**Date:** 29 March 2026
**Status:** SUPERSEDED — replaced by Expert+RAG-uplift-29Mar.md
**Context:** Locumate (Surge + Sam) as first customer

---

## The mental model

Camino exists because leaders need to make decisions — and the quality and speed of those decisions depends on the quality and speed of the information they receive.

1. **Destination** — The user has a business goal, a KPI target, a hurdle to overcome.
2. **Decisions** — Along the way, there are forks in the road. Each decision moves the user closer to or further from their goal.
3. **Information** — To decide well, the user needs the right information, fast. Faster + better quality information → faster + better quality decisions.
4. **Data-based confidence** — Camino helps the user be data-based when making decisions. Not gut-feel vs. data — both, reinforced.

The product has two main outputs:
- **Signal Cards** — Per-KPI intelligence cards showing what's happening, why, and what it means.
- **Weekly Brief** — A Monday morning exec summary that connects signals to decisions.

Both outputs serve the same purpose: **get the user to a better decision, faster.**

---

## Current state: what data do we have?

### Connected data sources

| Source | File | Key columns |
|---|---|---|
| Zoho CRM Leads | `data/zoho/Zoho - CRM - Leads.csv` | Lead ID, Created Time, Is Converted, Lead Status |
| Zoho CRM Deals | `data/zoho/Zoho - CRM - Deals.csv` | Deal ID, Stage, Amount, Created Time, Closing Date, Sales Cycle Duration |
| Shifts Data | `data/custom/Shifts Data - Shifts (Non protected).csv` | Shift Date, Status, Pharmacy Name, Group, Hours Worked, Hours Expected, Locum Name, Rate |
| Zoho Desk | `data/zoho/Zoho - Desk - XLS.xlsx` | 3 sheets: **Tickets-Desk** (4,645 rows — ID, Status, Created Time, Ticket Closed Time, Priority, Channel, Category, Sub Category, Classifications, Resolution Time in Business Hours, First Response Time in Business Hours, Is First Call Resolution, Number of Reopen, Happiness Rating, SLA Violation Type, Sentiment), **Accounts-Desk** (3,135 customer accounts), **Agents-Desk** (agent roster) |
| Zoho Users | `data/zoho/Zoho-Users.csv` | Reference table — 14 team members with Role (CEO, COO, CS, Marketing, Product, Sales), Status (active/disabled). Maps agent IDs to names for ticket attribution. |

### What users asked for vs. what we can compute

**Surge (CEO):**

| Signal | Type | Can we compute it today? | What's missing? |
|---|---|---|---|
| prospects | Requested | Yes — Zoho Leads | — |
| win_rate | Requested | Yes — Zoho Deals | — |
| calls_per_week | Requested | No | Zoho CRM Activities export |
| support_issue_volume | Requested | Yes — Zoho Desk (4,645 tickets) | — |
| churn_leading_indicator | Requested | Partial (2 of 3 sources) | Still needs product telemetry |
| bug_impact | Requested | No | Bug tracker export |
| agency_usage_risk | Recommended | Possibly — Shifts Data | Needs definition of "agency" in data |
| pipeline_value | Recommended | Yes — Zoho Deals | — |
| onboarding_quality | Recommended | No | Admin CP export |
| feature_adoption_trend | Recommended | No | Product telemetry |

**Surge today: ~5 sufficient, ~5 insufficient.**

**Additionally available from Desk data (new recommended candidates for Surge):**

| Potential new KPI | Source column | Notes |
|---|---|---|
| Avg Resolution Time | Resolution Time in Business Hours (pre-computed) | Nearly free to add |
| First Response Time | First Response Time in Business Hours (pre-computed) | Nearly free to add |
| SLA Compliance Rate | SLA Violation Type | Count "Not Violated" / total |
| First Call Resolution Rate | Is First Call Resolution | Count "Yes" / total resolved |
| Ticket Reopen Rate | Number of Reopen | Tickets with reopens / total |
| Customer Sentiment Trend | Sentiment column | Track sentiment over time |
| Satisfaction Score (CSAT) | Happiness Rating | Average rating over period |
| Top Issue Categories | Category, Sub Category, Classifications | Breakdown for root cause |

These are strong recommended card candidates — Surge didn't ask for "SLA compliance rate" but as CEO of a company with 4,600+ tickets, he'd want to know if SLAs are slipping. The Desk data also has Channel (Phone/Email), Priority, and Category breakdowns — essential sub-components for root cause analysis on the support signal card.

**Sam (CSM):**

| Signal | Type | Can we compute it today? | What's missing? |
|---|---|---|---|
| shifts | Requested | Yes — Shifts Data | — |
| jobs_posted | Requested | Yes — Shifts Data | — |
| shift_utilisation | Requested | Yes — Shifts Data | — |
| job_seekers | Requested | Borderline — can count unique locums who worked, not total signed up | Admin CP locum signup data |
| signups | Requested | No | Admin CP signup report |
| adoption_by_segment | Requested | Partial — can group shifts by Group/Banner | Needs segment definition + signup data |
| inactive_pharmacy_rate | Recommended | Yes — Shifts Data | — |
| unsubscribed_pharmacy_rate | Recommended | No | Admin CP subscription status |
| prospect_opportunity_size | Recommended | Yes — Zoho Deals | — |
| avg_deal_size | Recommended | Yes — Zoho Deals | — |

**Sam today: ~6 sufficient, ~4 insufficient.**

### What decisions are users facing?

**Surge (CEO) — stated decisions from onboarding:**

| Decision | Timeframe | Signals that inform it | Signals available today |
|---|---|---|---|
| Prioritize product roadmap | Next 90 days | Bug impact, feature adoption, support categories | Support categories (Desk) — bug impact and feature adoption insufficient |
| Internal hiring vs outsourcing | Next 90 days | Support volume trend, resolution time, team capacity | Support volume + resolution time (Desk), team roster (Users) |
| Evaluate market expansion | Next 6 months | Win rate, pipeline value, inactive pharmacy rate, churn signals | Win rate + pipeline (Deals), inactive rate (Shifts), ticket trend (Desk) |

**Sam (CSM) — stated decisions from onboarding:**

| Decision | Timeframe | Signals that inform it | Signals available today |
|---|---|---|---|
| Account health actions | Ongoing | Shift utilisation, inactive pharmacy rate, support volume | All available — Shifts + Desk |
| Renewal & upsell strategy | Before renewals | Shifts completed, utilisation trend, adoption by segment | Shifts available, segment needs Admin CP |
| Meeting preparation | Before each meeting | Latest numbers on key accounts | Shifts + Deals + Desk available |

---

## Phase 0 — The Data Contract + Decision Catalogue

**Goal:** Two documents that map (a) every KPI to its data sources, formula, and status, and (b) every decision to the signals that inform it. These are the plans everything else depends on.

### Part A: KPI Data Contract

**Deliverables:**

#### Layer 1: Data Source Registry

Every data source we have or expect, with its status and what it unlocks.

| Source ID | Source name | Status | Format | KPIs it feeds |
|---|---|---|---|---|
| `src.zoho.leads` | Zoho CRM Leads | Connected | CSV | prospects, lead_conversion_rate |
| `src.zoho.deals` | Zoho CRM Deals | Connected | CSV | pipeline_value, win_rate, avg_deal_size, deal_velocity, prospect_opportunity_size |
| `src.shifts` | Shifts Data | Connected | CSV | shifts, jobs_posted, shift_utilisation, inactive_pharmacy_rate, agency_usage_risk |
| `src.zoho.desk` | Zoho Desk (Tickets + Accounts + Agents) | **Connected** | XLSX (3 sheets) | support_issue_volume, resolution_time, first_response_time, ticket_reopen_rate, sla_compliance, fcr_rate, csat, sentiment_trend, churn_leading_indicator (partial) |
| `src.zoho.users` | Zoho Users | **Connected** | CSV | Reference/join table — maps agent IDs to names and roles for ticket attribution |
| `src.zoho.activities` | Zoho CRM Activities | Expected | CSV | calls_per_week, lead_activity_score |
| `src.admin.signups` | Admin CP Signup Report | Expected | CSV | signups, job_seekers, adoption_by_segment (partial), unsubscribed_pharmacy_rate |
| `src.product.telemetry` | App Usage Tracking | Wishlist | API/CSV | feature_adoption_trend, product_adoption, churn_leading_indicator (partial) |
| `src.bugs` | Bug Tracker Export | Wishlist | CSV/API | bug_impact |

**Status definitions:**
- **Connected** — file exists in `data/` today
- **Expected** — customer uses this tool, export exists, we just haven't asked for it yet
- **Wishlist** — would need a new integration or process to obtain

#### Layer 2: KPI Definitions (with source dependencies)

For each KPI: the formula, what sources it requires, and what "sufficient data" means.

| KPI ID | Title | Requires | Formula summary | Sufficient threshold |
|---|---|---|---|---|
| `prospects` | Total Leads | `src.zoho.leads` | Count leads by period | >= 10 rows, >= 4 weeks of Created Time |
| `win_rate` | Win Rate | `src.zoho.deals` | Won / (Won + Lost) by period | >= 5 closed deals in period |
| `pipeline_value` | Pipeline Value | `src.zoho.deals` | SUM(Amount) WHERE Stage not terminal | >= 3 open deals |
| `avg_deal_size` | Avg Deal Size | `src.zoho.deals` | AVG(Amount) WHERE closed in period | >= 5 closed deals |
| `deal_velocity` | Deal Velocity | `src.zoho.deals` | AVG(Close Date - Created Date) | >= 5 closed deals with both dates |
| `calls_per_week` | Calls Per Week | `src.zoho.activities` | Count WHERE type = Call, by week | >= 4 weeks of activity data |
| `support_issue_volume` | Ticket Volume | `src.zoho.desk` | Count tickets by period | >= 4 weeks of ticket data |
| `resolution_time` | Avg Resolution Time | `src.zoho.desk` | Pre-computed "Resolution Time in Business Hours" column | >= 10 resolved tickets |
| `first_response_time` | First Response Time | `src.zoho.desk` | Pre-computed "First Response Time in Business Hours" column | >= 10 tickets with response |
| `sla_compliance` | SLA Compliance Rate | `src.zoho.desk` | Count "Not Violated" / total WHERE SLA assigned | >= 20 tickets with SLA |
| `fcr_rate` | First Call Resolution | `src.zoho.desk` | Count "Yes" / total resolved | >= 20 resolved tickets |
| `ticket_reopen_rate` | Ticket Reopen Rate | `src.zoho.desk` | Tickets with Number of Reopen > 0 / total resolved | >= 20 resolved tickets |
| `csat` | Customer Satisfaction | `src.zoho.desk` | AVG(Happiness Rating) WHERE rated | >= 10 rated tickets |
| `sentiment_trend` | Customer Sentiment | `src.zoho.desk` | Sentiment distribution by period | >= 4 weeks of ticket data |
| `shifts` | Shifts Completed | `src.shifts` | Count WHERE Status = Finished, by period | >= 20 shifts, >= 4 weeks |
| `jobs_posted` | Jobs Posted | `src.shifts` | Count by Date Created, by period | >= 20 shifts, >= 4 weeks |
| `shift_utilisation` | Shift Utilisation | `src.shifts` | SUM(Hours Worked) / SUM(Hours Expected) | >= 20 shifts with both columns |
| `inactive_pharmacy_rate` | Inactive Pharmacy Rate | `src.shifts` | Pharmacies with 0 shifts in 4 weeks / total | >= 8 weeks of data |
| `agency_usage_risk` | Agency Usage Risk | `src.shifts` | TBD — % agency-filled vs direct | Needs "agency" flag definition |
| `signups` | New Signups | `src.admin.signups` | Count by Signup Date | >= 4 weeks |
| `job_seekers` | Active Job Seekers | `src.admin.signups` | Count unique locums signed up | >= 4 weeks |
| `adoption_by_segment` | Adoption by Segment | `src.shifts` + `src.admin.signups` | Shifts grouped by segment | Both sources connected |
| `churn_leading_indicator` | Churn Risk Score | `src.zoho.desk` + `src.shifts` + `src.product.telemetry` | Composite: rising tickets + declining shifts + declining usage | 2 of 3 sources now connected; product telemetry still needed for full score |
| `feature_adoption_trend` | Feature Adoption | `src.product.telemetry` | Active users / total users by feature | >= 4 weeks of event data |
| `bug_impact` | Bug Impact | `src.bugs` | Bugs by severity weighted by affected customers | >= 2 weeks of bug data |

#### Layer 3: User-KPI Mapping

Derived from Layers 1 and 2. Shows each user's deck with current sufficient/insufficient status. (See "Current state" tables above.)

#### Unlock Table

Which data sources to ask Locumate for, in priority order:

| Priority | Data source to request | KPIs it unlocks | Users affected |
|---|---|---|---|
| ~~1~~ | ~~Zoho Desk export~~ | ~~support signals~~ | **Done — connected 29 Mar 2026** |
| 1 | Admin CP Signup Report | signups, job_seekers, adoption_by_segment (partial), unsubscribed_pharmacy_rate | Sam (3-5 signals) |
| 2 | Zoho CRM Activities | calls_per_week | Surge (1 signal) |
| 3 | Product telemetry | feature_adoption_trend, churn_leading_indicator (partial) | Surge (1-2 signals) |
| 4 | Bug tracker export | bug_impact | Surge (1 signal) |

### Part B: Decision Catalogue

The Decision Catalogue is to decisions what `kpi-spec-v1.json` is to KPIs — a curated menu of the decisions that people in a given role typically face, linked to the signals that inform them.

#### Structure

Each decision entry contains:

| Field | Description |
|---|---|
| Decision ID | Unique identifier (e.g., `dec.ceo.market_expansion`) |
| Title | "Evaluate market expansion" |
| Typical roles | CEO, Head of Sales |
| Signals that inform it | win_rate, pipeline_value, inactive_pharmacy_rate, churn_risk |
| Typical timeframe | When current market signals plateau |
| Typical business stage | Post product-market-fit, Series A+ |
| Decision type | Strategic / Operational / Tactical |

#### Starter catalogue (from Roles, Signals, Datasets research)

| Role | Decision | Signals that inform it | Timeframe |
|---|---|---|---|
| CEO | Company strategy / investment allocation | Revenue growth, margins, burn rate, pipeline coverage, retention | Quarterly / fundraise cycles |
| CEO | Market expansion | Win rate, pipeline value, inactive customer rate, churn risk | When current market plateaus |
| CEO | Hiring vs outsourcing | Support volume trend, resolution time, team capacity | When operational metrics show strain |
| CEO | Product roadmap prioritization | Bug impact, feature adoption, support category trends, NPS | Quarterly planning |
| CSM | Account health actions | NPS, usage frequency, support volume, ticket sentiment | Monthly / before renewals |
| CSM | Renewal & upsell strategy | Churn risk, satisfaction score, usage trend, inactive rate | 90 days before renewal |
| CSM | Meeting preparation | Latest account-level metrics across all signals | Before each meeting |
| CTO | Tech strategy / resourcing | System reliability, deployment frequency, incident rate, engineering velocity | Quarterly |
| CPO | Product portfolio priorities | Retention, activation, adoption, NPS, ARR impact | Quarterly planning |
| Product Manager | What to build next | Retention, engagement, adoption funnels, CSAT, support tickets | Sprint / quarterly |
| Engineering Manager | Sprint capacity planning | Velocity, cycle time, bug counts, on-call load | Per sprint |
| Sales Manager | Forecasting / pipeline management | Pipeline coverage, win rate, quota attainment, deal velocity | Monthly / quarterly |
| Marketing Manager | Campaign mix / budget allocation | CAC, ROAS, MQL volume, conversion rate | Monthly |
| Finance Manager | Budgeting / forecasting / cost control | Burn rate, runway, margins, forecast accuracy | Monthly / quarterly |

This catalogue grows over time. For each new customer, onboarding captures their specific decisions and maps them to the nearest catalogue entries.

#### How decisions are captured during onboarding

Add to the onboarding questionnaire:

1. **"What are the 2-3 most important decisions you're facing in the next 90 days?"** (free text → mapped to nearest catalogue entry)
2. **"When do you need to make them by?"** (this week / this month / this quarter / no deadline)
3. **"What information would help you decide?"** (free text → mapped to signals)
4. **"What options are you considering?"** (optional — helps AI contextualise)

#### How decisions are recommended

Just as KPIs can be "recommended" (you should also watch this), decisions can be too. Decision recommendations are triggered by **signal patterns in the data**, not just role:

| Signal pattern detected | Recommended decision | Why |
|---|---|---|
| Ticket volume rising 3+ weeks, approaching SLA threshold | "Consider support team capacity planning" | Volume trend suggests SLA breach by [date] at current rate |
| Win rate climbing but pipeline flat/declining | "Consider pipeline generation strategy" | Converting well but top of funnel isn't growing |
| Inactive pharmacy rate rising while new signups flat | "Review customer retention strategy" | Losing existing customers faster than gaining new ones |
| Deal velocity lengthening while deal size unchanged | "Review sales process efficiency" | Deals taking longer without getting bigger |
| Resolution time rising while ticket volume flat | "Review support team efficiency or tooling" | Same volume taking longer — team may be stretched or tooling may need attention |

These pattern-decision pairs are hand-curated to start (5-10 pairs for Locumate), and grow with each customer.

**Effort:** Product design exercise. No code. The KPI Data Contract takes a few hours. The Decision Catalogue starter takes another few hours. The signal-pattern-to-decision pairs take a half-day of thinking.

**Why first:** Everything else depends on these documents. The KPI contract tells you what to build. The decision catalogue tells you why it matters.

---

## Phase 1 — Signal cards with real data + analysis (ship by 4 April)

**Goal:** A small number of signal cards per user with real numbers, real provenance, and real analysis — including the "aha" moment. This is the first thing users see. It must be credible, not placeholder.

**Principle:** Analysis and synthesis are non-negotiable — they're the core value. But they can be simplified for the first ship. The LLM narrates real data it's been given; it doesn't discover or invent data.

### Step 1a — Generate candidate KPI list

The system generates a list of **all KPIs that could be computed** from the connected data sources, combined with the user's onboarding context (role, goals, stated metrics). Each candidate shows:

- KPI name and 1-sentence description
- Whether it's computable today (sufficient / insufficient / borderline)
- Suggested type (requested / recommended) based on the user's onboarding profile
- Which data source feeds it

**Full candidate pool from today's connected data:**

| KPI | Computable? | Source | 1-line description |
|---|---|---|---|
| prospects | Sufficient | Zoho Leads | Total leads created per period |
| win_rate | Sufficient | Zoho Deals | % of closed deals that were won |
| pipeline_value | Sufficient | Zoho Deals | Total value of open deals |
| avg_deal_size | Sufficient | Zoho Deals | Average value per closed deal |
| deal_velocity | Sufficient | Zoho Deals | Average days from deal creation to close |
| support_issue_volume | Sufficient | Zoho Desk | Total support tickets per period |
| resolution_time | Sufficient | Zoho Desk | Average time to resolve tickets |
| first_response_time | Sufficient | Zoho Desk | Average time to first response |
| sla_compliance | Sufficient | Zoho Desk | % of tickets meeting SLA targets |
| fcr_rate | Sufficient | Zoho Desk | % of tickets resolved on first contact |
| ticket_reopen_rate | Sufficient | Zoho Desk | % of resolved tickets that get reopened |
| csat | Sufficient | Zoho Desk | Average customer satisfaction rating |
| sentiment_trend | Sufficient | Zoho Desk | Customer sentiment distribution over time |
| shifts | Sufficient | Shifts Data | Total shifts completed per period |
| jobs_posted | Sufficient | Shifts Data | Total shifts posted per period |
| shift_utilisation | Sufficient | Shifts Data | Hours worked / hours expected |
| inactive_pharmacy_rate | Sufficient | Shifts Data | % of pharmacies with no shifts in 4 weeks |
| agency_usage_risk | Borderline | Shifts Data | Needs "agency" flag definition in data |
| calls_per_week | Insufficient | — | Needs Zoho CRM Activities export |
| signups | Insufficient | — | Needs Admin CP Signup Report |
| job_seekers | Insufficient | — | Needs Admin CP locum signup data |
| adoption_by_segment | Insufficient | — | Needs Admin CP + segment definition |
| churn_leading_indicator | Insufficient | — | Needs product telemetry (2 of 3 sources connected) |
| bug_impact | Insufficient | — | Needs bug tracker export |
| feature_adoption_trend | Insufficient | — | Needs product telemetry |

### Step 1b — Human curates and locks the list (the checkpoint)

You (or in future, the user) review the candidate list and **approve, reject, or reprioritise.** The AI does not get to decide unilaterally which KPIs make it onto the card deck.

**Suggested starting deck for Surge (CEO):**

| KPI | Type | Status | Why this one |
|---|---|---|---|
| win_rate | Requested | Sufficient | He asked for it, Deals data supports it |
| support_issue_volume | Requested | Sufficient | He asked for it, Desk data is richest source |
| prospects | Requested | Sufficient | He asked for it, Leads data supports it |
| pipeline_value | Recommended | Sufficient | Directly relevant to market expansion thinking |
| calls_per_week | Requested | Insufficient | He asked for it — good insufficient card example |

**Suggested starting deck for Sam (CSM):**

| KPI | Type | Status | Why this one |
|---|---|---|---|
| shifts | Requested | Sufficient | She asked for it, Shifts data supports it |
| shift_utilisation | Requested | Sufficient | She asked for it, Shifts data supports it |
| inactive_pharmacy_rate | Recommended | Sufficient | Directly relevant to her retention work |
| jobs_posted | Requested | Sufficient | She asked for it, Shifts data supports it |
| signups | Requested | Insufficient | She asked for it — good insufficient card example |

These are suggestions. The human checkpoint decides the final list.

### Step 2 — Compute real values per KPI (deterministic)

For each approved sufficient KPI, run the actual formula against the actual data file. No AI involved.

**Each KPI produces:**
- Current period value
- Previous period value
- Trend (up/down/flat + delta)
- Provenance (which file, which rows, which formula)

**Requirements:**
- At least 2 time periods (this week vs. last week) for a trend
- Provenance recorded per value (source file, formula, sample rows)
- Validated against the sufficiency threshold from the data contract

### Step 3 — Compute dimensional breakdowns per KPI (deterministic)

This is what makes the analysis good. For each sufficient KPI, compute 2-3 breakdowns from the source data. These become the "evidence package" fed to the LLM.

| KPI | Breakdowns to compute | Source columns |
|---|---|---|
| support_issue_volume | By Channel, by Category/Classifications, by Priority | Desk: Channel, Classifications, Priority |
| win_rate | By deal size tier, by sales cycle length | Deals: Amount Tier, Sales Cycle Duration |
| prospects | By month, by converted vs not | Leads: Created Time, Is Converted |
| pipeline_value | By stage, by deal owner | Deals: Stage, Deal Owner Name |
| shifts | By pharmacy group, by state, by status | Shifts: Group, Pharmacy State, Current Shift Status |
| shift_utilisation | By pharmacy group, by month | Shifts: Group, Shift Date, Hours Worked/Expected |
| inactive_pharmacy_rate | List of inactive pharmacies, by group | Shifts: Pharmacy Name, Group, Shift Date |
| jobs_posted | By month, by pharmacy group | Shifts: Date Created, Group |

### Step 4 — LLM writes analysis + synthesis with chain of thought

One LLM call per card. The prompt includes:
- The computed value + trend + provenance (from Step 2)
- The dimensional breakdowns (from Step 3)
- The user's onboarding profile (role, goals, pain points)

**The LLM is instructed to produce two sections, each with a conclusion AND a chain of thought:**

#### Analysis section structure

**Conclusion** (2-3 sentences — the headline the user reads first):
What's happening with this number and what's driving it.

**Chain of thought** (bullet-point walkthrough):
The data steps that led to the conclusion — breakdown by breakdown, showing which dimensions moved and which didn't. This is the "show your working" that builds trust.

#### Synthesis / "So What" section structure

**Conclusion** (2-3 sentences — what this means for the user):
Why this matters, what to watch, what it implies.

**Chain of thought** (bullet-point walkthrough):
How the conclusion connects to the user's context — which goals it affects, what thresholds to watch, what the trajectory suggests.

#### Example card — Support Issue Volume (Surge)

> **Analysis**
>
> Ticket volume reached 84 this week, up 14% from 72 last week. This is the third consecutive weekly increase, driven primarily by Phone-channel Invoice Queries.
>
> **How we got here:**
> - Broke down tickets by channel: Phone tickets up 30% (34 → 44), Email flat (38 → 40). Phone is the primary driver.
> - Broke down by category: Invoice Queries are the largest category (28 tickets, up from 19 — a 47% increase). Shift Issues and App Bugs are stable.
> - Checked resolution time: 6.2 hours average, unchanged from last week. The team is absorbing the extra volume without slowing down.
> - Checked SLA compliance: 85% not violated, consistent with last week.
>
> **Conclusion:** The volume increase is concentrated in Phone-channel Invoice Queries. The rest of the support landscape is stable.

> **So What**
>
> Your team is handling the spike — resolution time and SLA haven't slipped yet. But at +14%/week for 3 weeks, you'll cross 100 tickets/week by mid-April.
>
> **How we got here:**
> - Compared volume growth rate to team capacity: 3 consecutive weeks of increase (60 → 72 → 84). Projected to cross 100/week by mid-April at current rate.
> - Checked whether resolution time is lagging volume: not yet (6.2hrs, flat). This is the leading indicator — when resolution time follows volume up, the team is being stretched.
> - Matched against your stated priority: you flagged "customer support issues" as a key metric and "support team capacity" as an upcoming decision area.
>
> **Conclusion:** No action needed this week. Watch resolution time — if it rises above 7 hours or volume crosses 100/week, the case for expanding the support team strengthens.

**Why chain of thought matters:**
- It makes the LLM's reasoning **auditable** — if a claim doesn't match the evidence, you catch it in QA
- It builds **trust** — the user can see the working, not just the answer
- It makes the card **educational** — the user learns how to think about their data

### Step 5 — Insufficient cards (templated, no LLM)

For each insufficient KPI in the approved deck, produce a card with:
- KPI name and what it would tell the user
- What data is missing and how to provide it
- What it would unlock (other signals, decision support)

(See Phase 2 below for the full insufficient card design.)

### End state for Phase 1

**Per user: 4 sufficient cards + 1 insufficient card.**

Each sufficient card has:
- Real KPI value computed from real data
- Real trend (this period vs. last period)
- Real provenance (traceable to source file and rows)
- AI-written analysis with chain of thought: "What's driving this" + "how we got here"
- AI-written synthesis with chain of thought: "Why this matters for you" + "how we got here"

Each insufficient card has:
- What this KPI would tell you
- What data is missing and how to provide it
- What signals it would unlock

**What's simplified (deferred to Phase 4):**
- Decision-level framing ("this is relevant to your market expansion decision")
- Benchmark comparisons with citations
- Causal chain analysis to other KPIs
- These layers get added on top of the working cards later

**What's NOT simplified:**
- The analysis and synthesis are real — grounded in data breakdowns, not vague
- The chain of thought is visible — the user sees how the conclusion was reached
- The numbers are real — real formulas, real provenance, not `RULE_LEADS_ROW_COUNT`

---

## Phase 2 — Insufficient cards that drive action

**Goal:** Every KPI that can't be computed gets an insufficient card that tells the user exactly what's missing, how to fix it, and — critically — **which decision it would help them make.**

**What to build:**
- Insufficient card template: KPI name, what it would tell you, what data is missing, how to provide it, what other signals it unlocks, **which of your decisions it informs**
- Per-KPI "missing data" copy — specific to the data source and export method
- Priority ordering: cards for KPIs that are "one data source away" from being sufficient shown first; cards that inform an active decision get higher priority

**Example card for Surge — "Calls Per Week":**

> **Calls Per Week** — Data needed
>
> This signal would track your team's weekly outbound call volume and flag when activity drops below the level needed to sustain your pipeline.
>
> **Relevant to:** Your market expansion decision — call activity data would show whether your team has capacity to pursue new segments while maintaining current pipeline.
>
> **What's missing:** Zoho CRM Activities export
> **What we need:** CSV with columns: Activity Type, Date, Status, Contact/Lead ID
> **How to export:** Zoho CRM > Activities > All Activities > Export to CSV
> **What it unlocks:** This signal + contributes to Lead Activity Score

**Example card for Sam — "New Signups":**

> **New Signups** — Data needed
>
> This signal would track weekly pharmacy signups and flag when growth is slowing or accelerating.
>
> **Relevant to:** Your retention & upsell strategy — signup trends show whether your base is growing fast enough to offset inactive pharmacies.
>
> **What's missing:** Admin CP Signup Report
> **What we need:** CSV with columns: Pharmacy Name, Signup Date, Status, Segment
> **How to export:** Admin CP > Reports > Signups > Export
> **What it unlocks:** This signal + Job Seekers + Adoption by Segment + Unsubscribed Pharmacy Rate (4 signals total)

**End state:** Every card in both users' decks either shows a real number or clearly tells them what to do — and connects the gap to a decision they care about.

---

## Phase 3 — Recommended signals + recommended decisions

**Goal:** Two types of proactive intelligence:
1. **Recommended KPIs** — "You should also watch this signal because..."
2. **Recommended decisions** — "Based on your data patterns, you should be thinking about..."

### Part A: Recommended KPIs with "why you should care"

Surface KPIs the user didn't ask for but has data for, with a personalised explanation tied to their goals or decisions.

#### Causal graph (hand-curated)

A map of which KPIs influence each other, specific to Locumate's business:

```
shifts_completed ← shift_utilisation → inactive_pharmacy_rate → churn_risk
prospects → pipeline_value → win_rate → avg_deal_size
calls_per_week → lead_activity_score → lead_conversion
support_issue_volume → resolution_time → sla_compliance → churn_risk
ticket_reopen_rate → resolution_time → csat
sentiment_trend → churn_risk
first_response_time → csat → churn_risk
```

#### Signal-to-Decision links

Each recommended KPI explanation references the user's decision, not just a causal chain:

| Recommended KPI | For user | Connected to decision | Example "why" |
|---|---|---|---|
| SLA compliance | Surge | Hiring vs outsourcing | "SLA compliance is at 82% — if this drops further, it may accelerate your decision on whether to expand the support team." |
| Resolution time | Surge | Hiring vs outsourcing | "Average resolution time has increased 15% in 4 weeks. This directly informs whether your current team can sustain the load." |
| Inactive pharmacy rate | Sam | Retention & upsell | "12% of pharmacies haven't posted a shift in 6 weeks. This is a leading indicator for your renewal conversations." |
| Pipeline value | Surge | Market expansion | "Pipeline is flat at $1.24M while win rate climbs. You may be approaching the ceiling of your current market." |

**Quality bar:** The explanation must reference either a specific decision the user faces or something from their onboarding profile. Generic explanations are rejected.

### Part B: Recommended decisions

When signal patterns in the data suggest the user should be thinking about something they haven't mentioned, surface it as a recommended decision.

| Signal pattern detected | Recommended decision | Example framing |
|---|---|---|
| Ticket volume rising 3+ weeks, approaching SLA threshold | "Consider support team capacity planning" | "Ticket volume has risen from 60 to 84 in 3 weeks. At this rate, you'll cross 100/week by mid-April. Worth thinking about whether your team can sustain this." |
| Win rate climbing but pipeline flat/declining | "Consider pipeline generation strategy" | "Win rate is at 38% (up 6pts) but pipeline is flat. You're converting well but the top of funnel isn't growing — this will show up in revenue within 2-3 months." |
| Inactive pharmacy rate rising while signups flat | "Review customer retention strategy" | "You're losing active pharmacies faster than you're gaining new ones. Net active pharmacy count has declined for 2 consecutive periods." |
| Resolution time rising while ticket volume flat | "Review support efficiency or tooling" | "Same ticket volume but resolution time is up 15%. Your team may be stretched or the issue mix may have shifted toward harder problems." |

**How recommended decisions appear:** As a new section in the weekly brief (see Phase 5), or as a card-level annotation. Not a separate screen — decisions are woven into the existing surfaces.

**End state:** The product proactively tells users both "you should watch this metric" AND "you should be thinking about this decision" — grounded in their actual data, not generic advice.

---

## Phase 4 — Enhanced analysis: decision framing, benchmarks, causal chains

**Goal:** Upgrade the signal cards from Phase 1's simplified analysis to the full wireframe vision. Phase 1 cards already have real analysis + chain of thought. This phase adds three layers on top.

Phase 1 gives you: "What's happening + what's driving it + why it matters to you."
Phase 4 adds: "What it means for your specific decisions + how it compares to norms + how it connects to other signals."

### 4a — Decision-framed synthesis

Add a "Decision implication" to each card's synthesis, connecting the signal to the user's stated decisions from the Decision Catalogue.

**Example — added to Surge's Win Rate card "So What" section:**

> **For your market expansion decision:** This improvement suggests your current market still has headroom. The win rate recovery, combined with flat pipeline, indicates you're getting better at closing but may not yet be generating enough new opportunities to justify expanding into new segments.

**Requires:** Decision Catalogue from Phase 0, with signal-to-decision links from Phase 3.

### 4b — Benchmark comparisons

Add benchmark context to the synthesis: how does this number compare to norms for the user's industry, stage, and company size?

**Example — added to Surge's Win Rate card:**

> This is in the healthy range for seed-stage B2B SaaS (typical: 25-40%). Source: industry benchmarks for companies with < $5M ARR.

**Requires:** A curated benchmark table (by industry + stage), or LLM knowledge with explicit caveats and citations. Every benchmark claim must state who/what informed the norm.

### 4c — Causal chain narrative

Add cross-signal analysis: how does this signal relate to other signals in the user's deck?

**Example — on Surge's Support Issue Volume card:**

> **Relationship with other signals:** Rising ticket volume has not yet affected resolution time (6.2hrs, flat) or SLA compliance (85%, flat). Historically, resolution time tends to lag volume by 2-3 weeks. If inactive pharmacy rate (currently 12%) continues to rise alongside ticket volume, this strengthens the churn risk signal.

**Requires:** The causal graph from Phase 3 + actual computed values for each node in the chain. The LLM narrates the connections; the data proves each link.

### End state

The full signal card as shown in the wireframe — analysis with chain of thought (from Phase 1), plus decision framing, benchmarks, and causal chains (from Phase 4). Each claim backed by traceable data, framed through the user's active decisions.

**Key risk:** LLM hallucination. Every analytical claim must trace to a real number. If the AI says "leads went up because website traffic increased," the card must show the website traffic number. If you can't show the supporting data, don't make the claim.

---

## Phase 5 — Weekly Brief

**Goal:** The Monday morning email as described in the weekly brief spec. The brief connects signals to the user's active decisions.

**Sections and their dependencies:**

| Section | What it needs | Available from |
|---|---|---|
| Section 1: Headline | Cross-signal synthesis referencing the highest-priority active decision | Phase 1 + Phase 3 decisions |
| Section 2: Scorecard | KPI + Value + Trend for all signals | Phase 1 |
| Section 3: Focus Signal | Highest-urgency signal, framed by the decision it informs | Phase 1 (min), Phase 4 (ideal) |
| Section 4: Decision Pulse (new) | Status of active decisions — what the signals say about each | Phase 3 decisions |
| Section 5: Open Item | Manually flagged by exec | Operator layer (manual for now) |
| Section 6: Footer | Data freshness + next brief date | Phase 1 |

**New: Section 4 — Decision Pulse**

A brief section (2-3 lines per decision) that summarises what the signals say about each of the user's active decisions this week:

```
┌─────────────────────────────────────────────────────────┐
│  YOUR DECISIONS THIS WEEK                                │
│                                                         │
│  Market expansion?                                      │
│  Win rate recovering, pipeline flat. Current market      │
│  still has room — no urgency to expand yet.             │
│                                                         │
│  Hiring vs outsourcing?                                 │
│  Ticket volume rising, resolution time holding.          │
│  Watch for 2 more weeks — if resolution time follows    │
│  volume up, the case for hiring strengthens.            │
│                                                         │
│  [See full signal cards →]                              │
└─────────────────────────────────────────────────────────┘
```

**The brief can ship in three versions:**

**v1 (after Phase 1):** Scorecard + headline + basic focus signal. Numbers and trends, but no deep analysis or decision framing. Still useful.

**v2 (after Phase 3):** Adds the Decision Pulse section + decision-linked headline. This is where the brief becomes a decision tool, not just a report.

**v3 (after Phase 4):** Full brief with root cause and synthesis in the focus signal section. The "90 seconds to full understanding" experience.

**End state:** Surge gets a Monday morning email that tells him not just "what moved" but "what it means for the decisions you're facing this week."

---

## Phase 6 — Data expansion (ongoing)

**Goal:** As Locumate connects more data sources, insufficient KPIs become sufficient and decision support gets richer.

**Process when a new data source arrives:**
1. Locumate provides a new file (e.g., Admin CP signup report)
2. Update the Data Source Registry — mark source as "Connected"
3. Build the formula for newly-sufficient KPIs (same pattern as Phase 1)
4. Cards that were "insufficient" flip to "sufficient" with real numbers
5. Check if any active decisions now have more signals informing them — update Decision Pulse
6. Weekly brief includes the new signals

**Priority order for requesting data from Locumate:**

| Priority | Data source | Signals unlocked | Decisions it strengthens | Effort to connect |
|---|---|---|---|---|
| ~~1~~ | ~~Zoho Desk export~~ | ~~support signals~~ | — | **Done — connected 29 Mar 2026** |
| 1 | Admin CP Signup Report | 3-5 signals (mostly Sam) | Sam's retention & renewal decisions | Low — CSV export exists |
| 2 | Zoho CRM Activities | 1 signal (Surge) | Market expansion (pipeline activity data) | Low — standard Zoho export |
| 3 | Product telemetry | 1-2 signals (Surge), completes churn_leading_indicator | Product roadmap prioritization | Medium — may need integration |
| 4 | Bug tracker export | 1 signal (Surge) | Product roadmap prioritization | Medium — depends on tool |

**Scaling to new customers:**
The data contract + decision catalogue structure is reusable. For each new customer:
1. Onboarding captures what they care about (KPIs), what tools they use (data sources), and what decisions they face
2. Layer 1 — check if their tools are already in the registry; add new ones if not
3. Layer 2 — check if their KPIs already have formulas; add new ones if not
4. Decision Catalogue — check if their role's decisions are already catalogued; add new ones if not
5. Generate their deck + decision mapping automatically

Each new customer potentially adds sources, KPIs, and decision patterns that benefit all future customers.

---

## Summary

| Phase | Delivers | Depends on | User sees |
|---|---|---|---|
| **0 — Data Contract + Decision Catalogue** | The plan: KPIs mapped to data, decisions mapped to signals | Nothing | — (internal) |
| **1 — Signal cards with analysis (ship by 4 Apr)** | 4 sufficient + 1 insufficient card per user, with real data + chain-of-thought analysis + synthesis | Phase 0 | Real "aha" cards: "here's what's happening, here's how we know, here's why it matters" |
| **2 — Insufficient cards** | Actionable gap cards linked to decisions | Phase 0 | "Here's what to connect — and which decision it helps" |
| **3 — Recommended signals + decisions** | Proactive advisor: "watch this" + "think about this" | Phase 1 + causal graph + decision catalogue | "You should also watch SLA compliance because of your hiring decision" |
| **4 — Enhanced analysis** | Decision framing + benchmarks + causal chains added to existing cards | Phase 1 + Phase 3 | "What this means for your expansion decision" + benchmark context + cross-signal links |
| **5 — Weekly Brief** | Monday morning email with Decision Pulse | Phase 1 (v1), Phase 3 (v2), Phase 4 (v3) | 90-second exec summary tied to active decisions |
| **6 — Data expansion** | More signals + richer decision support over time | Locumate provides files | Insufficient → sufficient; decisions get more evidence |

**Phase 1 is the ship target for this week (w/c 31 Mar).** It includes the "aha" — real analysis with visible chain of thought — not just numbers and trends. The human-in-the-loop checkpoint ensures KPIs are right before the pipeline runs.

**Phases 0–2** are the minimum viable experience. Every card shows real data with real analysis, or tells the user exactly what to do, connected to decisions they care about.

**Phase 3** is the "wow" moment — where Camino shifts from reporting tool to decision partner. Both recommended KPIs and recommended decisions are proactive.

**Phase 4** upgrades existing cards — it doesn't replace them. Phase 1 cards are already useful; Phase 4 makes them richer.

**Phase 5 v2 (after Phase 3)** is where the weekly brief becomes the product the value prop describes: "fast, high-value information" that saves 20+ hours/month and improves decision quality.

**Phase 6 is ongoing** — each new data source from Locumate unlocks more signals and makes decision support more complete.
