Universal Issue Tree Framework — Product Spec
==============================================
Date: 1 Apr 2026
Status: Draft
Author: Camino product team


1. THE PROBLEM
==============

Camino needs to auto-generate an issue/KPI tree for any customer during
onboarding. The tree must:

- Work for any digital business with datasets (not just B2B SaaS)
- Be repeatable — same structure, different data
- Be scalable — deeper branches as the business matures
- Map cleanly to KPIs that can be populated from customer data
- Flag data gaps where KPIs can't yet be measured
- Assign ownership to roles (even when one person wears multiple hats)


2. THE UNIVERSAL FRAMEWORK
===========================

Every business that wants to grow shares the same revenue math:

    Revenue = Volume × Value × Retention

Where:
- Volume  = How many customers do you have?
- Value   = How much does each customer pay?
- Retention = How long / how often do they pay?

Plus an enabling layer:
- Capacity = Can you do more of the above three?

This gives four universal branches.


2.1 Branch 1: VOLUME (Get more customers)
------------------------------------------

The question: "Are we acquiring enough customers?"

Level 2 sub-issues (universal):

  1.1 Demand generation
      How many potential customers are entering the top of the funnel?

  1.2 Demand conversion
      Of those, how many become qualified opportunities?

  1.3 Closing
      Of qualified opportunities, how many become paying customers?

These three steps exist in every business — whether you call them
leads/deals/wins (B2B), visitors/carts/purchases (e-commerce),
or applicants/matches/bookings (marketplace).


2.2 Branch 2: VALUE (Get more per customer)
--------------------------------------------

The question: "Are we maximising revenue per customer?"

Level 2 sub-issues (universal):

  2.1 Initial transaction value
      How much does a customer pay on their first purchase/deal/booking?

  2.2 Expansion / upsell
      Do customers buy more over time?

  2.3 Pricing alignment
      Is pricing matched to the value customers receive?

This applies whether the transaction is a SaaS subscription, a
marketplace commission, a project fee, or an order value.


2.3 Branch 3: RETENTION (Keep customers longer)
-------------------------------------------------

The question: "Are customers staying and getting value?"

Level 2 sub-issues (universal):

  3.1 Value delivery
      Is the product/service actually solving the customer's problem?

  3.2 Customer health
      Are customers satisfied? Are they engaged? Are they at risk?

  3.3 Churn prevention
      Can we spot warning signs early and intervene?

  3.4 Service reliability
      Is the platform/service operating without friction?

This branch exists whether you're retaining SaaS subscribers,
marketplace participants, repeat purchasers, or service clients.


2.4 Branch 4: CAPACITY (Scale the above three)
------------------------------------------------

The question: "Can we do more of Volume, Value, and Retention?"

Level 2 sub-issues (universal):

  4.1 People capacity
      Do we have enough people in the right roles? Are there
      single-person dependencies?

  4.2 Product / service capacity
      Are we building the right things? Can we deliver at scale?

  4.3 Data & decision-making capacity
      Do we have the data infrastructure to see what's working?

  4.4 Market knowledge
      Do we understand which segments, geographies, and channels
      to focus on?


3. BUSINESS-MODEL VARIATIONS
==============================

The four branches are universal. What changes per business model
is the specific KPIs and language at Level 2 and below.


3.1 B2B SaaS (e.g. Locumate deals)
------------------------------------

  Volume KPIs:
  - Leads per month
  - Lead-to-opportunity conversion rate
  - Win rate (by count and by dollar value)
  - Sales cycle length (days)

  Value KPIs:
  - Average deal size / ACV
  - Net Revenue Retention (NRR)
  - Expansion deals per account
  - ARPA (average revenue per account)

  Retention KPIs:
  - Logo churn rate
  - Revenue churn rate
  - Customer satisfaction (CSAT/NPS)
  - Product adoption / usage metrics

  Capacity KPIs:
  - Deals per sales rep
  - Pipeline coverage ratio
  - CRM field completion rate
  - Headcount per function


3.2 Marketplace (e.g. Locumate shifts)
---------------------------------------

  Volume KPIs:
  - Supply-side: active providers (locums, sellers, freelancers)
  - Demand-side: active buyers (pharmacies, customers, employers)
  - Listings/jobs/shifts posted per period
  - Match rate (posted vs filled)

  Value KPIs:
  - Average transaction value (per shift, per order, per booking)
  - Take rate / commission rate
  - Revenue per active participant

  Retention KPIs:
  - Provider retention (do locums keep coming back?)
  - Buyer retention (do pharmacies keep posting?)
  - Fill rate (unfilled = lost value + churn risk)
  - Platform satisfaction scores

  Capacity KPIs:
  - Geographic coverage (are there supply gaps by region?)
  - Provider-per-buyer ratio (concentration risk)
  - Matching efficiency (travel distance, cost)


3.3 E-commerce / DTC
----------------------

  Volume KPIs:
  - Website traffic / visitors
  - Add-to-cart rate
  - Purchase conversion rate
  - Customer acquisition cost (CAC)

  Value KPIs:
  - Average order value (AOV)
  - Items per order
  - Cross-sell / bundle attach rate

  Retention KPIs:
  - Repeat purchase rate
  - Time between purchases
  - Return rate
  - Customer lifetime value (CLV)

  Capacity KPIs:
  - Inventory availability
  - Fulfilment speed
  - Marketing spend efficiency (ROAS)


3.4 Services / Agency
----------------------

  Volume KPIs:
  - Proposals sent per month
  - Proposal win rate
  - Referral rate
  - Inbound enquiries

  Value KPIs:
  - Average project value
  - Scope creep rate (actual vs quoted)
  - Hourly rate / blended rate

  Retention KPIs:
  - Repeat client rate
  - Client satisfaction (CSAT)
  - Contract renewal rate

  Capacity KPIs:
  - Utilisation rate (billable hours / total hours)
  - Headcount vs pipeline
  - Skills coverage


4. CAMINO'S THREE LAYERS
=========================

The universal tree is the skeleton. Camino adds three layers on top
to make it useful for a specific customer.


4.1 Layer 1: KPI Mapping
--------------------------

During onboarding, Camino:
1. Asks the customer's business goal and how they measure it
2. Asks their top 3 KPIs they currently track
3. Identifies their business model (SaaS, marketplace, etc.)

Camino then maps the appropriate KPI set to each tree node.
The customer's requested KPIs slot into the tree, and Camino
recommends additional KPIs to fill gaps — just as a management
consultant would.

Example (Locumate):
- Customer says: "We track win rate, leads/month"
- Camino places win rate under Volume > Closing (1.3)
- Camino places leads/month under Volume > Demand Generation (1.1)
- Camino recommends: NRR (under Value > Expansion), fill rate
  (under Retention > Service Reliability), deals per rep
  (under Capacity > People)


4.2 Layer 2: Ownership Mapping
-------------------------------

Camino asks during onboarding: "Who in your org handles sales?
Customer success? Product?"

The tree branches are then tagged with owners. This is a mapping
layer, not baked into the tree structure — because org charts vary
wildly.

Example (Locumate):
  Branch              Owner(s)
  ------              --------
  Volume              Surge (CEO, wearing sales hat)
  Value               Surge + Sam
  Retention           Sam (CSM)
  Capacity: Product   Surge (wearing product hat)
  Capacity: People    Surge + Sam
  Capacity: Data      Shared / Camino helps here

Example (hypothetical 30-person SaaS):
  Branch              Owner(s)
  ------              --------
  Volume              VP Sales + Marketing Lead
  Value               VP Sales + Product Manager
  Retention           CS Manager + Support Lead
  Capacity: Product   CTO + Product Manager
  Capacity: People    CEO / COO
  Capacity: Data      RevOps / Data Analyst

Same tree. Different people.


4.3 Layer 3: Data Population + Gap Flagging
--------------------------------------------

Once the customer provides their data exports, Camino:

1. POPULATES — calculates KPIs where data exists
   Example: Win rate = 13 won / 32 total = 41% (from Zoho Deals)

2. FLAGS GAPS — identifies KPIs that can't be calculated
   Example: Lead Source is empty for all 52 leads, so channel
   attribution analysis is impossible

3. RECOMMENDS FIXES — explains what data the customer needs
   Example: "Populate the Lead Source field in Zoho CRM. This
   would unlock channel-attribution analysis."

Each node in the tree gets one of three statuses:

  [MEASURED]      KPI can be calculated from provided data
  [PARTIAL]       KPI can be partially calculated (e.g. some data missing)
  [DATA GAP]      KPI can't be calculated — Camino explains what's needed

This is what makes the tree actionable, not just theoretical.


5. WORKED EXAMPLE: LOCUMATE
=============================

Customer: Surge (CEO) + Sam (CSM) @ Locumate
Business: Seed-stage SaaS + marketplace, pharmacy/workforce tech
Goal: Reach next stage of growth (measured by revenue)
Data: Zoho CRM Deals (32), Zoho CRM Leads (52), Shifts (2,381)


5.1 The populated tree
-----------------------

ROOT: How does Locumate reach its next stage of growth?
Current state: $914K closed-won revenue, ~$100K real active pipeline

BRANCH 1: VOLUME — Get more customers (Owner: Surge)

  1.1 Demand generation
      KPI: Leads per month
      Value: ~3/month (52 leads total, 3 added in most recent month)
      Status: [PARTIAL]
      Gap: Lead Source is empty for all 52 leads. Can't tell which
           channels are generating leads.
      Gap: Lead Status is empty for all 52 leads. Can't build a funnel.

  1.2 Demand conversion
      KPI: Lead-to-deal conversion rate
      Value: 10% (5 of 52 converted)
      Status: [MEASURED]
      Note: No lead qualification process visible in CRM.

  1.3 Closing
      KPI: Win rate
      Value: 41% by deal count (13/32), 29% by dollar value ($914K/$3.2M)
      Status: [MEASURED]
      Note: "No Budget" is used for all 8 losses — real loss reasons
            are unclear. Every deal above $300K lost except Healthshifts.

      KPI: Sales cycle length
      Value: 22–25 days for deals under $10K. 94–235 days for $100K+.
      Status: [MEASURED]

BRANCH 2: VALUE — Get more per customer (Owner: Surge + Sam)

  2.1 Initial deal value
      KPI: Average deal size
      Value: $76K headline, $32K excluding top 2 deals.
             Most recent win: $1.2K (smallest ever, trend is down).
      Status: [PARTIAL]
      Gap: 4 won deals have no Amount recorded. Revenue is understated.

  2.2 Expansion revenue
      KPI: Expansion deals per account
      Value: 1 visible expansion (Wesfarmers: $120K base → $19.5K add-on
             at 80% probability).
      Status: [MEASURED]
      Note: This is the proven expansion playbook. Can it be replicated
            across other won accounts?

      KPI: Net Revenue Retention (NRR)
      Value: Cannot calculate — no recurring revenue / renewal data
             in current CRM export.
      Status: [DATA GAP]
      Gap: Need subscription renewal dates and amounts to calculate NRR.

  2.3 Pricing alignment
      KPI: Willingness to pay by segment
      Value: Cannot calculate — no pricing tier or discount data.
      Status: [DATA GAP]
      Note: Data does show a deal-size sweet spot of $10K–$230K.
            Deals above $300K almost always fail, suggesting pricing
            or product-market mismatch at the top end.

BRANCH 3: RETENTION — Keep customers longer (Owner: Sam)

  3.1 Value delivery
      KPI: Platform adoption (shifts posted per customer)
      Value: 2,381 shifts across 60+ pharmacies.
      Status: [MEASURED]
      Note: Platform is used for standard workday coverage (8.5hr and
            3hr shifts), not emergency fills. This suggests genuine
            operational integration.

      KPI: Activation rate (% of won deals using the platform)
      Value: Cannot calculate — no link between CRM deals and shift
             activity by account.
      Status: [DATA GAP]
      Gap: Need an account ID that connects Deals and Shifts data.

  3.2 Customer health
      KPI: Customer satisfaction (pharmacy ratings)
      Value: Mostly 5/5 where recorded. But feedback is sparse.
      Status: [PARTIAL]
      Gap: Locum-side feedback fields (Communication, Interpersonal,
           Problem Solving, Organisation) exist but are mostly empty.

      KPI: Churn rate
      Value: Cannot calculate — no churn/cancellation data in exports.
      Status: [DATA GAP]
      Gap: Need subscription status or cancellation dates.

  3.3 Churn prevention
      KPI: Revenue concentration risk
      Value: 68% of revenue from 2 customers (Healthshifts $500K,
             Wesfarmers $120K). Losing either would be catastrophic.
      Status: [MEASURED]

      KPI: Account health score
      Value: Cannot calculate — no composite scoring in current data.
      Status: [DATA GAP]
      Note: TWC has $230K won revenue but 14 unfilled shifts at Kirwan.
            This is a potential early warning signal that Sam should
            investigate.

  3.4 Service reliability
      KPI: Shift fill rate
      Value: ~99% overall, but 28 unfilled shifts concentrated at
             TWC Kirwan (14) and a few other pharmacies.
      Status: [MEASURED]

      KPI: Supply concentration
      Value: Shortis & Timmins — 22 shifts in September, all filled
             by a single locum (Kim Le, 419km travel).
      Status: [MEASURED]
      Note: If Kim Le is unavailable, this pharmacy has zero backup.
            How many other pharmacies have this pattern?

BRANCH 4: CAPACITY — Scale the above three (Owner: Shared)

  4.1 People capacity
      KPI: Deals per sales rep
      Value: 32 deals / 1 person (Surge). Team of 17, but no one else
             owns deals.
      Status: [MEASURED]

      KPI: CS-sourced pipeline
      Value: $0. Sam's team owns zero deals in CRM.
      Status: [MEASURED]
      Note: Clayton Dunn (Head of Sales) hired Aug 2024, disabled
            Oct 2025, zero deals attributed during that period.

  4.2 Product / service capacity
      KPI: Roadmap data signals
      Value: Qualitative — shift data reveals opportunities for
             regional matching, travel cost optimisation, and
             feedback loops. 28 unfilled shifts suggest a supply-side
             feature gap.
      Status: [PARTIAL]
      Note: Surge's upcoming decisions include "prioritise product
            roadmap" and "assess internal hiring vs external dev."
            The shift data provides direct input to both.

  4.3 Data & decision-making capacity
      KPI: CRM field completion rate
      Value: Lead Source: 0/52 (0%). Lead Status: 0/52 (0%).
             Industry: 0/52 (0%). Deal Amount: 28/32 (88%).
             Loss Reason: 1 value for all losses (uninformative).
             Lead Source on Deals: 6/32 (19%).
      Status: [MEASURED]
      Note: This is the single cheapest fix. A 30-minute CRM cleanup
            would unlock channel attribution and funnel analysis.

  4.4 Market knowledge
      KPI: Win rate by segment
      Value: Domestic subscriptions convert. International deals
             ($579K across 2 deals) have failed entirely.
             8 of 13 won deals are subscriptions.
      Status: [PARTIAL]
      Gap: Lead Source and Industry fields are empty, so segment
           analysis is limited to what's visible in deal names.

      KPI: Geographic coverage (from Shifts)
      Value: Concentrated in VIC and NSW. Regional QLD has supply
             gaps. SA and WA have minimal representation.
      Status: [MEASURED]


5.2 Summary scorecard
-----------------------

  Branch      Measured    Partial    Data Gap
  ------      --------    -------    --------
  Volume         2           1          0
  Value          1           1          2
  Retention      3           1          3
  Capacity       3           2          0

  Total:  9 measured / 5 partial / 5 data gaps

Key observation: Volume (Surge's sales domain) has the most
measurable KPIs. Retention (Sam's CS domain) has the most data
gaps. This means Sam is flying the most blind — the very function
responsible for protecting revenue has the least visibility.


6. HOW THIS CONNECTS TO CAMINO'S PRODUCT
==========================================

The issue tree is the backbone of Camino's product. Every other
feature plugs into it.


6.1 Onboarding → Tree Generation
----------------------------------

During a 30-minute onboarding call, Camino collects:
- Business goal and measurement (→ sets the root node)
- Top 3 KPIs they track (→ places requested KPIs on the tree)
- Business context: stage, model, roles (→ selects business-model
  variant and ownership mapping)

Output: A populated tree skeleton with ownership tags.


6.2 KPI Discovery → Tree Enrichment
--------------------------------------

After onboarding, Camino:
- Recommends additional KPIs to cover tree gaps (the "management
  consultant" step from the workflow doc)
- Explains why each KPI matters, how it's normally calculated,
  and what data is needed
- Distinguishes between "requested" KPIs (what the customer asked
  for) and "recommended" KPIs (what the tree says they should also
  track)

Output: A complete tree with KPIs assigned to every node, some
requested, some recommended.


6.3 Data Ingestion → Tree Population
--------------------------------------

When the customer provides data exports, Camino:
- Calculates KPIs where possible (→ [MEASURED])
- Flags partial data (→ [PARTIAL])
- Identifies gaps and recommends fixes (→ [DATA GAP])

Output: The tree with live KPI values and a gap list.


6.4 Data Briefing Cards → Tree Leaves
---------------------------------------

Each data briefing card (as defined in the current prototype)
corresponds to one or more tree nodes. The tree provides the
"why this card matters" context:

  Card                     Tree Node
  ----                     ---------
  Pipeline Pulse           Volume > Closing (1.3)
  Revenue Closed           Value > Initial Deal (2.1)
  Deals Lost               Volume > Closing (1.3)
  Shift Activity           Retention > Value Delivery (3.1)
  Lead Funnel              Volume > Demand Generation (1.1)
  Workforce Mix            Retention > Service Reliability (3.4)
  Market Expansion         Capacity > Market Knowledge (4.4)
  Revenue Concentration    Retention > Churn Prevention (3.3)
  Product Signal           Capacity > Product (4.2)
  Data Quality             Capacity > Data (4.3)
  Sales Capacity           Capacity > People (4.1)

This mapping means every card can explain its place in the
bigger picture: "This card matters because it affects [branch],
which is one of four drivers of your business goal."


6.5 Weekly Briefs → Tree Traversal
------------------------------------

The weekly executive brief is essentially a top-down traversal
of the tree, highlighting:
- KPIs that changed this week
- KPIs that are at risk
- Data gaps that should be fixed

The tree provides the structure. The brief provides the narrative.


7. DESIGN PRINCIPLES
======================

7.1 The tree structure is fixed. The data is variable.
Every customer gets the same 4-branch skeleton. What differs is
the KPIs, values, ownership, and gaps.

7.2 The tree is role-agnostic. Ownership is a layer.
The tree never says "Sales branch" or "CS branch." It says
"Volume" and "Retention." Who owns those branches is determined
by the customer's org, not the tree itself.

7.3 Depth adapts to business maturity.
A seed-stage company with 1 data source gets a shallow tree (2
levels). A Series B company with 5 data sources gets a deeper
tree (3–4 levels). The branches are the same; the granularity
increases.

7.4 Data gaps are features, not bugs.
A [DATA GAP] tag is valuable output. It tells the customer
exactly what they're missing and how to fix it. This is one of
Camino's core value propositions: "We show you what you can't
see yet."

7.5 Every card traces to a tree node.
No data briefing card should exist without a place on the tree.
If a card doesn't map to a node, either the tree is incomplete
or the card shouldn't exist.


8. OPEN QUESTIONS
==================

8.1 How many levels deep should the tree go at V1?
Recommendation: 2 levels (Branch + Sub-issue) for V1. Add Level 3
(specific KPI variants, e.g. win rate by segment) as an expansion.

8.2 Should the tree be visible to the customer?
Option A: Yes — show it as a navigation/dashboard view.
Option B: No — use it internally to structure cards and briefs.
Recommendation: Start with Option B (internal structure), graduate
to Option A once the framework is validated across 3+ customers.

8.3 How does the tree handle non-revenue goals?
The current framework assumes revenue as the root. Some customers
may care about profitability, market share, or operational
efficiency. The Volume/Value/Retention math still works — it just
needs different leaf KPIs. Capacity always applies.

8.4 How does Camino detect the business model automatically?
During onboarding, the combination of business context (stage,
industry, product type) and data sources (CRM, transactions,
marketplace activity) should be enough to select the right
KPI variant. This could be rule-based at V1, LLM-assisted later.
