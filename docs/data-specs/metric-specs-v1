# Metric Specifications Document

## Purpose
This document defines the exact calculation formulas, row filtering rules, and validation criteria for all signal types in Camino. It serves as the single source of truth for metric accuracy and is used to validate signal calculations against test data.

---

## Signal Types Overview

Camino generates signals across four primary domains based on the data source:

1. **Sales/Pipeline Signals** (from deals/opportunities)
2. **Support/Customer Success Signals** (from tickets/conversations)
3. **Activity/Engagement Signals** (from activities/interactions)
4. **Custom Signals** (user-defined metrics)

---

## 1. SALES/PIPELINE SIGNALS

### 1.1 Pipeline Value

**Definition:** Total monetary value of all deals in non-terminal stages.

**Formula:**
\`\`\`
Pipeline Value = SUM(deal_amount) 
WHERE deal_status NOT IN ('Closed Won', 'Closed Lost')
AND deal_amount IS NOT NULL
AND deal_amount > 0
\`\`\`

**Test Case:**
- Input: 10 deals, 3 Closed Won ($50K each), 2 Closed Lost ($40K each), 5 Open ($20K each)
- Expected Output: $100K (only 5 open deals)
- Validation: Row filtering is critical here

**Data Type:** Currency (numeric)
**Frequency:** Real-time (recalculates on every data update)
**Trend Calculation:** Compare current value to previous period (last 30 days vs. 30 days prior)

---

### 1.2 Win Rate

**Definition:** Percentage of deals closed won in the current period.

**Formula:**
\`\`\`
Win Rate = (COUNT(deals WHERE status = 'Closed Won' AND close_date IN current_period) / 
            COUNT(deals WHERE status IN ('Closed Won', 'Closed Lost') AND close_date IN current_period)) * 100

WHERE close_date is not null
\`\`\`

**Test Case:**
- Input: 8 closed deals in period, 5 won, 3 lost
- Expected Output: 62.5%
- Validation: Denominator includes ONLY terminal stages

**Data Type:** Percentage (0-100)
**Frequency:** Period-based (daily/weekly/monthly)
**Critical Rule:** Do NOT include open deals in denominator

---

### 1.3 Average Deal Size

**Definition:** Average monetary value per deal in the current period.

**Formula:**
\`\`\`
Avg Deal Size = SUM(deal_amount) / COUNT(deal_id)
WHERE deal_status IN ('Closed Won', 'Closed Lost')
AND close_date IN current_period
AND deal_amount > 0
\`\`\`

**Test Case:**
- Input: 4 closed deals ($10K, $20K, $15K, $25K)
- Expected Output: $17.5K
- Validation: Only closed deals, excludes nulls and zero values

**Data Type:** Currency
**Frequency:** Period-based
**Edge Case:** Handle division by zero (return null if no deals)

---

### 1.4 Deal Velocity

**Definition:** Average number of days from deal creation to close.

**Formula:**
\`\`\`
Deal Velocity = AVG(close_date - created_date)
WHERE deal_status IN ('Closed Won', 'Closed Lost')
AND close_date IN current_period
AND close_date IS NOT NULL
AND created_date IS NOT NULL
\`\`\`

**Test Case:**
- Input: 3 deals closed with durations of 30, 45, 60 days
- Expected Output: 45 days
- Validation: Only use closed deals with both dates

**Data Type:** Integer (days)
**Frequency:** Period-based
**Anomaly Threshold:** Flag if > 3x normal velocity

---

## 2. SUPPORT/CUSTOMER SUCCESS SIGNALS

### 2.1 Ticket Resolution Time

**Definition:** Average time to resolve support tickets.

**Formula:**
\`\`\`
Resolution Time = AVG(resolved_date - created_date)
WHERE ticket_status = 'Resolved'
AND resolved_date IN current_period
AND resolved_date IS NOT NULL
AND created_date IS NOT NULL
\`\`\`

**Test Case:**
- Input: 5 resolved tickets with durations of 4hr, 2hr, 6hr, 3hr, 5hr
- Expected Output: 4 hours
- Validation: Only resolved tickets with complete timestamps

**Data Type:** Time (hours or minutes)
**Frequency:** Real-time (rolling average)
**SLA Check:** Flag if > target (e.g., > 8 hours)

---

### 2.2 Ticket Reopen Rate

**Definition:** Percentage of resolved tickets that are reopened.

**Formula:**
\`\`\`
Reopen Rate = (COUNT(tickets WHERE status = 'Reopened' AND reopened_date IN current_period) / 
               COUNT(tickets WHERE status IN ('Resolved', 'Reopened') AND resolved_date IN current_period)) * 100
\`\`\`

**Test Case:**
- Input: 20 tickets resolved in period, 3 reopened
- Expected Output: 15%
- Validation: Denominator includes both resolved and reopened

**Data Type:** Percentage
**Frequency:** Period-based
**Red Flag:** > 10% reopen rate indicates quality issues

---

### 2.3 Customer Satisfaction (CSAT)

**Definition:** Average customer satisfaction score.

**Formula:**
\`\`\`
CSAT = AVG(satisfaction_score)
WHERE satisfaction_score IS NOT NULL
AND satisfaction_score BETWEEN 1 AND 5
AND survey_date IN current_period
\`\`\`

**Test Case:**
- Input: 10 surveys with scores [5,4,5,3,4,5,4,5,4,3]
- Expected Output: 4.2
- Validation: Only scores within valid range

**Data Type:** Decimal (1.0 - 5.0)
**Frequency:** Period-based
**Benchmark:** Target >= 4.0

---

### 2.4 First Response Time

**Definition:** Average time from ticket creation to first response.

**Formula:**
\`\`\`
First Response Time = AVG(first_response_date - created_date)
WHERE ticket_status IN ('Open', 'Resolved', 'Reopened')
AND first_response_date IS NOT NULL
AND created_date IS NOT NULL
AND first_response_date IN current_period
\`\`\`

**Test Case:**
- Input: 8 tickets with first response times of 15min, 20min, 10min, 25min, 12min, 18min, 22min, 16min
- Expected Output: 17.375 minutes
- Validation: Only tickets with actual response timestamps

**Data Type:** Time (minutes)
**Frequency:** Real-time
**Target:** < 1 hour for high-priority tickets

---

## 3. ACTIVITY/ENGAGEMENT SIGNALS

### 3.1 Lead Activity Score

**Definition:** Count of qualifying activities per lead in the current period.

**Formula:**
\`\`\`
Activity Score = COUNT(activity_id)
WHERE contact_id = lead_id
AND activity_type IN ('Email', 'Call', 'Meeting', 'Demo')
AND activity_date IN current_period
AND activity_status = 'Completed'
\`\`\`

**Test Case:**
- Input: Lead with 2 emails, 1 call, 1 meeting, 1 failed call (in period)
- Expected Output: 4 (excludes failed activities)
- Validation: Only completed, qualifying activities

**Data Type:** Integer
**Frequency:** Real-time
**Scoring:** Can be weighted by activity type

---

### 3.2 Email Open Rate

**Definition:** Percentage of sent emails that are opened.

**Formula:**
\`\`\`
Email Open Rate = (COUNT(emails WHERE was_opened = true) / 
                   COUNT(emails WHERE was_sent = true)) * 100
WHERE email_date IN current_period
AND was_sent = true
\`\`\`

**Test Case:**
- Input: 50 emails sent, 35 opened
- Expected Output: 70%
- Validation: Only count sent emails in denominator

**Data Type:** Percentage
**Frequency:** Real-time
**Industry Benchmark:** 20-30% typical

---

### 3.3 Meeting Attendance Rate

**Definition:** Percentage of scheduled meetings that were attended.

**Formula:**
\`\`\`
Attendance Rate = (COUNT(meetings WHERE status = 'Completed') / 
                   COUNT(meetings WHERE status IN ('Scheduled', 'Completed'))) * 100
WHERE scheduled_date IN current_period
AND scheduled_date IS NOT NULL
\`\`\`

**Test Case:**
- Input: 10 meetings scheduled, 8 completed, 2 cancelled
- Expected Output: 80% (8/10, excludes cancelled)
- Validation: Only use scheduled/completed, not cancelled

**Data Type:** Percentage
**Frequency:** Period-based
**Alert:** < 70% may indicate engagement issues

---

## 4. TREND CALCULATION RULES

### Trend Direction
\`\`\`
IF current_period_value > previous_period_value
  THEN trend = "UP"
ELSE IF current_period_value < previous_period_value
  THEN trend = "DOWN"
ELSE
  THEN trend = "FLAT"
\`\`\`

### Trend Magnitude
\`\`\`
Trend_Percent = ((current - previous) / previous) * 100
IF ABS(Trend_Percent) > 20%
  THEN flag as "Significant Trend"
\`\`\`

### Period Definition
- **Daily:** Last 24 hours vs. 24-48 hours prior
- **Weekly:** Last 7 days vs. 7-14 days prior
- **Monthly:** Last 30 days vs. 30-60 days prior

---

## 5. KNOWN ISSUES & FIXES NEEDED

### Issue 1: No Row Filtering (CRITICAL)
**Current Problem:** Every signal includes ALL rows. Pipeline Value includes Closed Lost deals.

**Fix:** Add 4th question to onboarding
- "Which column represents the status/stage of your data?"
- Build status filtering into signal templates per row type

**Test:** Verify Pipeline Value excludes terminal stages

---

### Issue 2: No Signal Templates Per Row Type
**Current Problem:** Generic signals generated for every data type.

**Fix:** Create templates that encode business logic
- Template: "Sales Pipeline" → automatically filters to non-terminal stages
- Template: "Support Tickets" → automatically filters to resolved only
- Template: "Activities" → automatically filters to completed only

---

### Issue 3: Client Preview vs. Server Divergence
**Current Problem:** Preview numbers differ from stored numbers.

**Fix:** Use identical calculation logic on both client and server
- Extract calculation into shared utility function
- Pass same row set to both

---

### Issue 4: Date Parsing Ambiguity
**Current Problem:** DD/MM vs MM/DD creates wrong date ranges.

**Fix:** Add explicit format confirmation
- Show user a sample date: "Is 01/02/2026 January 2nd or February 1st?"
- Lock in format before calculations begin

---

### Issue 5: Trend Uses Halves, Not Periods
**Current Problem:** Splits data exactly in half.

**Fix:** Compare same-period previous ranges
- Current: Last 30 days vs. 30-60 days ago (not half and half)
- Aligns with business calendar

---

## 6. VALIDATION CHECKLIST

Before deploying any signal, verify:

- [ ] Row filtering is correctly applied per business rules
- [ ] Null/zero values are handled (excluded or defaulted)
- [ ] Date ranges match specification
- [ ] Data types are correct (currency, percentage, integer, time)
- [ ] Test case passes with expected output
- [ ] Trend calculation uses correct period comparison
- [ ] Division by zero is handled
- [ ] Duplicate rows are deduplicated if needed
- [ ] Timestamps are parsed in correct format
- [ ] Signal works with both CSV and API data sources

---

## 7. IMPLEMENTATION PRIORITY

**High Impact (implement first):**
1. Add row filtering (fixes Pipeline Value, Win Rate, etc.)
2. Build signal templates per row type
3. Fix trend period comparisons

**Medium Impact:**
1. Date format confirmation
2. Null/zero value handling
3. Test fixture validation

**Low Impact (polish):**
1. Signal naming customization
2. Decimal precision options
3. Custom thresholds

---

## Appendix: Field Aliases Reference

### Zoho CRM (Deals)
- Amount → `deal_amount`
- Stage → `deal_status`
- Created Time → `created_date`
- Expected Close Date → `close_date`

### Zoho Desk (Tickets)
- Resolution Time → `resolution_time`
- Status → `ticket_status`
- Created Time → `created_date`
- Resolved Time → `resolved_date`

### Generic Fields
- Amount/Value → `numeric_column`
- Status/Stage → `categorical_column`
- Date Fields → `date_column`
- Count/Volume → `integer_column`
