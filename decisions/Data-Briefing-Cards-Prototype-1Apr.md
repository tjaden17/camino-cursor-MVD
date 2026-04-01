Data Briefing Cards — Prototype (Real Locumate Data)
=====================================================
Date: 1 Apr 2026
Data sources: Zoho CRM Deals (32 deals), Shifts (2,381 shifts), Zoho CRM Leads (52 leads)
User context: Surge (CEO), Sam (CSM) @ Locumate — seed-stage SaaS, pharmacy/workforce tech


========================================================================
LENS 1: DATA DOMAIN (organized by data source)
========================================================================

------------------------------------------------------------------------
CARD: Pipeline Pulse
Source: Zoho CRM Deals
------------------------------------------------------------------------

$1.4M in open pipeline across 11 deals
Direction: ~unchanged (no deals entered or exited pipeline this week)

• Highest-probability open deals: WholeLife Subs ($47K, Contracts, 80%) 
  and Wesfarmers p4L ($19.5K, Contracts, 80%). Both close to landing.

• Largest open deal: RMH Outreach ($1M, Qualification, 10%). 
  Has been in Qualification for 342 days. No stage movement recorded.

• 3 deals in Proposal stage: TWC Network ($300K), PGA Job Board (no amount), 
  PGA-TAS ($0). TWC Network has been in Proposal for 210 days.

• Stale pipeline risk: 6 of 11 open deals are over 170 days old. 
  Only 2 (WholeLife at 11 days, Blooms at 105 days) are under 6 months.

Source rows: All 11 deals where Stage ≠ "Closed Won" and Stage ≠ "Closed - No Budget"


------------------------------------------------------------------------
CARD: Revenue Closed
Source: Zoho CRM Deals — Closed Won only
------------------------------------------------------------------------

$914K total closed-won revenue from 13 deals
Direction: +$1.2K this month (VH Subs, most recent close)

• Revenue is concentrated: Healthshifts ($500K) and Westfarmers ($120K) 
  account for 68% of all closed revenue. Remove those 2, and average 
  deal size drops from $76K to $32K.

• Most recent close: VH Subs ($1.2K, 45-day cycle). This is your 
  smallest won deal on record.

• Fastest closes: AI Agent Prime (22 days, $3.5K) and LPG Subs 
  (24 days, $9.9K). Pattern: deals under $10K close in under 25 days.

• Largest close: Healthshifts at $500K. Second largest: Westfarmers 
  at $120K. Third: TWC PSS at $110K.

• 4 won deals have no Amount recorded (DCO, FriendlyCare, and 2 others). 
  This means closed revenue is likely understated.

Source rows: 13 deals where Stage = "Closed Won"


------------------------------------------------------------------------
CARD: Deals Lost
Source: Zoho CRM Deals — Closed No Budget only
------------------------------------------------------------------------

$2.29M lost across 8 deals marked "Closed - No Budget"
Direction: +$579K lost this quarter (HSS NZ $252K + Latvia Nexus $327K)

• You've lost 2.5x more dollar value than you've won ($2.29M lost vs 
  $914K won). However, 3 of those losses were $600K+ deals — 
  CreweSharp ($750K), LC+Locumate ($600K), Latvia Nexus ($327K).

• Large-deal pattern: Every deal above $300K that closed ended in 
  "No Budget," except Healthshifts ($500K, Won). This suggests a 
  possible deal-size ceiling around $120-230K for repeatable wins.

• The "No Budget" label is used for all losses. It's unclear whether 
  these are truly budget-constrained, or if "No Budget" is the 
  catch-all close reason. Clarifying this would sharpen pipeline analysis.

Source rows: 8 deals where Stage = "Closed - No Budget"


------------------------------------------------------------------------
CARD: Shift Activity
Source: Shifts Data
------------------------------------------------------------------------

2,381 shifts across 60+ pharmacies
Direction: data covers up to Sep 2025 (snapshot, not live feed)

• Busiest pharmacy: Shortis & Timmins — 22 shifts in September alone, 
  all filled by a single locum (Kim Le).

• Rate range: $45/hr to $90/hr (excl. super). Average approximately 
  $67/hr. Regional pharmacies tend toward the higher end.

• Unfilled shifts: ~28 shifts show with no locum assigned and status 
  N/A. Concentrated in TWC Kirwan (QLD) — 14 unfilled across Sep-Oct.

• Travel compensation: 15+ shifts included travel pay, ranging from 
  $134 to $415. All were regional placements 300+ km from the locum's 
  home suburb.

• Pharmacy feedback: Where recorded, most shifts received a 5/5 
  pharmacy rating. A small number have no feedback at all.

Source rows: 2,381 shift records


------------------------------------------------------------------------
CARD: Lead Funnel
Source: Zoho CRM Leads
------------------------------------------------------------------------

52 leads on record. 5 converted to contacts/deals.
Direction: 3 new leads added in Oct 2025 (most recent data)

• Conversion rate observation: 5 of 52 leads show "Is Converted = Yes." 
  The most notable conversion: Sandra Cochrane → FriendlyCare Pharmacies 
  deal (now Closed Won). Angela Shaw → Hospital Staff Solutions deal.

• Data completeness warning: Industry, Lead Source, and Lead Status 
  fields are empty for all 52 leads. This means we cannot tell you 
  where leads are coming from or what stage they're in.

• Ownership: All leads assigned to Surge Singh or Tiani S. No leads 
  assigned to Clayton Dunn (Head of Sales, now disabled) or the 
  Customer Success team.

• Duplicate: Asha Gilkapalli appears twice (rows 4-5, identical dates). 
  Minor data hygiene flag.

Source rows: 52 lead records


------------------------------------------------------------------------
CARD: Workforce Mix
Source: Shifts Data
------------------------------------------------------------------------

Single-locum dependency at Shortis & Timmins
Direction: risk flag (unchanged)

• Kim Le filled 22 shifts at Shortis & Timmins across the full month 
  of September. That's every shift for that pharmacy — weekdays, 
  Saturdays, full-day and half-day.

• Kim Le is based in Doonside, NSW — 419 km from Condobolin. Each 
  shift involved significant travel. One shift included $414.81 in 
  travel compensation.

• If Kim Le becomes unavailable, this pharmacy has zero demonstrated 
  backup coverage based on available shift data.

• Broader question: How many other pharmacies depend on a single locum? 
  This would require a per-pharmacy locum count across the full dataset.

Source rows: Shifts where Pharmacy Name = "Shortis & Timmins Pharmacy"


========================================================================
LENS 2: UPCOMING DECISIONS (organized by Surge's decision context)
========================================================================

From onboarding, Surge's upcoming decisions are:
- Prioritize product roadmap
- Assess internal hiring vs external development
- Evaluate market expansion options

------------------------------------------------------------------------
CARD: Market Expansion Evidence
Relevant to: Evaluate market expansion options
Sources: Deals + Shifts
------------------------------------------------------------------------

Your closed-won deals span pharmacy groups, white-labels, AI agents, 
and job boards. But geographic and segment patterns are visible.

• By customer type: 8 of 13 won deals are subscription/SaaS deals. 
  2 are white-label. 1 is an AI agent product. This suggests 
  subscriptions are your proven revenue model.

• By geography (from Shifts): Shifts are concentrated in VIC and NSW, 
  with some QLD presence (TWC Kirwan). SA and WA have minimal 
  representation. Unfilled shifts cluster in regional QLD.

• International attempts: HSS NZ ($252K) and Latvia Nexus ($327K) both 
  closed as "No Budget." Combined: $579K in failed international deals. 
  All domestic deals above $40K have closed successfully.

• Expansion signal: The Wesfarmers relationship is broadening — original 
  $120K subscription won, now a $19.5K p4L deal in Contracts (80% 
  probability). This account shows organic expansion behaviour.

What this means for the decision: Domestic pharmacy subscriptions are 
the proven wedge. International and large white-label deals ($300K+) 
have not converted. Wesfarmers is the strongest expansion account.


------------------------------------------------------------------------
CARD: Revenue Concentration & Hiring
Relevant to: Assess internal hiring vs external development
Sources: Deals + Users
------------------------------------------------------------------------

Revenue depends on a very small number of deals and one salesperson.

• Surge Singh owns 100% of deals in the CRM. All 32 deals — won, 
  lost, and open — are owned by Surge. Clayton Dunn (Head of Sales) 
  is now disabled in Zoho, and no deals were reassigned.

• Top-2 deal concentration: Healthshifts ($500K) and Westfarmers ($120K) 
  are 68% of all won revenue. Losing either relationship would have 
  outsized impact.

• Pipeline capacity: Surge has 11 open deals. With a team of 17, 
  there is no visible sales capacity beyond the CEO.

What this means for the decision: If you're evaluating hiring, the data 
shows a single-person sales function. Adding sales capacity could 
de-risk both pipeline generation and deal management.


------------------------------------------------------------------------
CARD: Product Signal from Shifts
Relevant to: Prioritize product roadmap
Sources: Shifts
------------------------------------------------------------------------

The Shifts data reveals how the platform is actually being used.

• Shift duration pattern: Most shifts are 8.5hr full-day or 3hr 
  half-day. The platform is being used for standard workday coverage, 
  not ad-hoc emergency fills.

• Travel compensation is a real cost: Multiple shifts include $300-$400+ 
  in travel pay. Regional pharmacies pay higher rates AND travel costs 
  to attract locums. This could be a product feature opportunity 
  (travel optimization, regional matching).

• Unfilled shifts exist: ~28 shifts have no locum assigned. These are 
  concentrated in specific pharmacies (TWC Kirwan). Understanding why 
  shifts go unfilled could inform supply-side product features.

• Feedback data: Pharmacy feedback is recorded for some shifts (mostly 
  5/5). Locum-side feedback fields (Communication, Interpersonal, 
  Problem Solving, Organisation) exist but appear sparsely populated.

What this means for the decision: Roadmap opportunities visible in the 
data include regional locum matching, travel cost optimization, and 
better feedback/rating loops. The unfilled shift pattern is worth 
investigating as a supply-side constraint.


========================================================================
LENS 3: RISKS (organized by what could go wrong)
========================================================================

------------------------------------------------------------------------
CARD: Pipeline Staleness
Risk: Deals aging without progress
Source: Deals
------------------------------------------------------------------------

6 of 11 open deals are over 170 days old.

• RMH Outreach: $1M, Qualification stage, 342 days. No recorded 
  movement. This deal alone is 71% of your open pipeline value.

• TWC Network Store: $300K, Proposal stage, 210 days. This is your 
  second-largest open deal. Combined with RMH, these two stale deals 
  represent 93% of open pipeline dollar value.

• If these 2 deals are effectively dead but not closed, your real 
  pipeline is closer to $100K across 9 small deals, not $1.4M.

Action: Review RMH and TWC Network status. If they're still alive, 
what's the next step? If they're not, closing them would give a 
more honest pipeline picture.


------------------------------------------------------------------------
CARD: Sales Capacity Risk
Risk: Single-person sales function
Source: Deals + Users
------------------------------------------------------------------------

All 32 deals are owned by Surge Singh (CEO).

• No other team member has ever owned a deal in this CRM export.

• Clayton Dunn (Head of Sales) was added Aug 2024, disabled Oct 2025. 
  Zero deals attributed to this role during that period.

• The Customer Success team (Sam, Edge, Tiani) owns zero deals.

• Implication: If Surge is unavailable for a week, there is no one 
  managing the pipeline. Deal follow-ups, proposals, and closings 
  all depend on one person.


------------------------------------------------------------------------
CARD: Data Quality Gaps
Risk: Analysis limited by missing fields
Sources: Leads, Deals
------------------------------------------------------------------------

Several fields across datasets are empty or inconsistent, which limits 
what we can observe.

• Leads: Industry (0/52 populated), Lead Source (0/52), Lead Status 
  (0/52). We cannot determine where leads come from or their stage.

• Deals: 4 Closed Won deals have no Amount field. Revenue totals are 
  understated. "Closed - No Budget" is used for all losses — unclear 
  if this is the only close-lost reason or a catch-all.

• Deals: Lead Source populated for only 6 of 32 deals. Can't determine 
  which channels drive pipeline.

• Shifts: Locum feedback fields (Communication, Interpersonal, Problem 
  Solving, Organisation) exist in the schema but are mostly empty.

Action: Populating Lead Source on Deals and Leads would unlock 
channel-attribution analysis. Populating Lead Status would enable 
proper funnel tracking.


------------------------------------------------------------------------
CARD: Workforce Supply Risk
Risk: Locum concentration at key pharmacies
Source: Shifts
------------------------------------------------------------------------

At least 1 pharmacy depends entirely on a single locum.

• Shortis & Timmins: 22 shifts in September, 100% filled by Kim Le. 
  Kim Le travels 419km each way for these shifts.

• This pattern may exist at other pharmacies. A full concentration 
  analysis (locum-per-pharmacy count) would surface all single-points 
  of failure.

• Separately: TWC Kirwan has 14 unfilled shifts. This could indicate 
  a supply gap in regional QLD that no single locum is covering.


========================================================================
CROSS-SOURCE CARD (appears in all lenses)
========================================================================

------------------------------------------------------------------------
CARD: Account Spotlight — TerryWhite Chemmart (TWC)
Sources: Deals + Shifts + Leads (AI fuzzy-matched on "TWC" / "TerryWhite")
------------------------------------------------------------------------

TWC is your most data-rich account across all sources.

From Deals:
• TWC PSS: $110K, Closed Won (94-day sales cycle)
• TWC Network Store Subscription: $300K, Proposal stage, 210 days old
• Wesfarmers Subscription: $120K, Closed Won (235-day cycle) 
  — Wesfarmers owns TerryWhite Chemmart
• Wesfarmers p4L: $19.5K, Contracts stage, 80% probability
• Total TWC-related revenue (won): $230K. Open: $319.5K.

From Shifts:
• TWC-branded pharmacies appear in the Shifts data (e.g., TWC Kirwan)
• TWC Kirwan: 14 unfilled shifts in Sep-Oct 2025
• Other TWC pharmacies show filled shifts with travel compensation

From Leads:
• 3 TWC-affiliated leads: TerryWhite Chemmart Kambah (Peter Miller, 
  converted), TerryWhite Chemmart Inverloch (Jungho Oh, not converted),
  TWC Sydenham (Sam Gergis, not converted)

Cross-source observation:
TWC is simultaneously your largest open deal ($300K), an expanding 
relationship (Wesfarmers p4L), and has operational challenges on the 
platform (14 unfilled shifts at Kirwan). The unfilled shifts could be 
a risk to the $300K deal if they indicate platform dissatisfaction, or 
they could be an opportunity to demonstrate value if you solve the 
supply gap. Worth investigating before the next TWC touchpoint.


========================================================================
WEEKLY EXEC BRIEF — Surge (Example)
========================================================================

Locumate Weekly Brief — Week of 30 Mar 2026

THE HEADLINE
Your open pipeline is $1.4M on paper, but $1.3M of that sits in 2 deals 
(RMH, TWC Network) that haven't moved stage in 200+ days. Your real 
active pipeline is closer to $100K across 9 smaller deals. Meanwhile, 
your most recent win was your smallest ever ($1.2K). The trend line 
on deal sizes is pointing down.

WORTH WATCHING
The Wesfarmers/TWC relationship is your strongest expansion story. 
$230K already won, another $19.5K at 80% probability. But TWC Kirwan 
has 14 unfilled shifts on the platform — that's operational friction 
in your most valuable account.

PLATFORM PULSE
2,381 shifts on record. Fill rates look healthy overall, but regional 
QLD has a supply gap. Rates average $67/hr with a wide range ($45-$90). 
Travel compensation costs are non-trivial for regional placements.

DATA GAPS WORTH FIXING
Your Lead data has zero information in the Source, Status, and Industry 
fields. This means we can't tell you where your leads are coming from. 
Populating these fields (even retroactively for the 52 existing leads) 
would unlock channel analysis for the next briefing.

RISK FLAGS
1. Sales function is a single point of failure (all 32 deals owned 
   by Surge)
2. 6 of 11 open deals are 170+ days old with no stage movement
3. Kim Le is the sole locum covering Shortis & Timmins (22 shifts, 
   419km travel each way)
