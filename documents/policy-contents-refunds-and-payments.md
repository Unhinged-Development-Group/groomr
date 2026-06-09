# Refunds and Payments Policy — Contents Breakdown

## 1. Purpose & scope

- Governs: how payments are collected, held, and disbursed through the Groomr platform; when and how refunds are issued; what happens to deposits on cancellation or no-show.
- **Deliberately out of scope:** the quality of the grooming service itself (that's the owner↔groomer service contract and the disputes policy); tipping (separate flow, separate Stripe PaymentIntent, no refund mechanism needed here); chargeback handling beyond what Groomr can control.
- **Audience:** both sides — owner-facing (what you pay, when, what you get back) and groomer-facing (when you receive funds, how fees are deducted, what clawbacks look like). These sections should be clearly separated or the policy should exist in two flavours.
- **Sits under:** the main Terms of Service (which establishes the tripartite relationship — Groomr / owner / groomer). This policy is a schedule or annexe to those terms, not a standalone contract. It should be linked from the ToS and from every booking confirmation email.

---

## 2. Regulatory drivers

- **Consumer Contracts (Information, Cancellation & Additional Charges) Regs 2013** [REQUIRED]: Distance contracts (online bookings) trigger a 14-day cooling-off right. For services *booked* but not yet started, the owner can cancel and get a full refund unless they have expressly asked for the service to begin within that window. The policy must define the cooling-off window, explain how it interacts with bookings made close to the appointment date, and capture the express waiver for same-day or imminent appointments. This is the single most consumer-law-loaded section.
- **Consumer Rights Act 2015** [REQUIRED]: Services must be performed with reasonable care and skill. Where they're not, the owner's first remedy is repeat performance; if that's not possible or refused, a price reduction or full refund. This bites on the owner↔groomer contract — Groomr is the facilitator, not the liable party — but the policy must route owners to the correct remedy (i.e. the groomer) without abandoning them entirely. A facilitated refund mechanism (Groomr's "dispute-triggered refund" tool) needs to be explained here.
- **Payment Services Regs 2017** [REQUIRED]: Mostly Stripe's burden as the regulated entity, but Groomr is a payment chain participant. The policy must accurately describe who holds funds at each stage. Misdescribing this (e.g. implying Groomr holds client money) could attract FCA scrutiny. The safe framing: Stripe is the payment processor and regulated entity; Groomr instructs Stripe on disbursement; groomers hold their earnings in their Stripe Connect account.
- **Unfair Contract Terms — Consumer Rights Act 2015, Part 2** [REQUIRED]: Deposit forfeiture clauses and cancellation fees must pass the fairness test (not create a significant imbalance to the consumer's detriment). A blanket "all deposits are non-refundable" clause is high risk. The policy must tie forfeiture to demonstrable loss or a genuinely proportionate schedule.
- **Consumer Protection from Unfair Trading Regs 2008** [REQUIRED]: Misleading omissions about cancellation rights or refund terms (e.g. hiding the 14-day right in fine print, or claiming deposits are never refundable when they legally might be) are an offence. Transparency is mandatory.
- **Prescription and Limitation (Scotland) Act 1973** [REQUIRED, Scots-law baseline]: The five-year short negative prescription applies to contractual and delictual claims. Refund requests should carry a clear deadline (Groomr's own: e.g. within 30 days of the appointment) but the policy can't waive the statutory five-year period for genuine legal claims.
- **Alternative Dispute Resolution for Consumer Disputes Regs 2015** [REQUIRED]: If a refund dispute can't be resolved, the policy must signpost an ADR route. Groomr is not obliged to offer ADR itself — it just has to point owners to an approved scheme. Note this in the complaints/escalation section.
- **E-Commerce (EC Directive) Regs 2002** [BEST PRACTICE]: For Groomr to preserve its intermediary hosting defence, the policy must not position Groomr as guaranteeing the quality of service or taking on primary liability for refunds it didn't directly cause. Language matters — "Groomr may, at its discretion, facilitate a refund" is very different from "Groomr will refund you."
- **E&W / NI divergence note:** Consumer statutory rights are GB/UK-wide and consistent across CRA 2015 / CCR 2013 — no meaningful divergence here. Court procedure differs (see below), but the substance of the right is the same for a consumer wherever they are in the UK.

---

## 3. Recommended sections

### 3.1 — How Groomr Payments Work (the plumbing)
[REQUIRED]

Explain the full payment flow before anything else. Owners need to know what happens to their money; groomers need to know when they get paid.

**Include:**
- Groomr uses Stripe as its payment processor. Groomr is not a bank and does not hold client money.
- On booking: the owner's payment is processed via Stripe. Depending on groomer settings: deposit only (held by Stripe, released to groomer on completion minus platform fee) or full amount upfront.
- Platform fee: 8% deducted by Groomr from the groomer's payout. Founding groomers pay 0% for their first 6 months — state this here and cross-reference the Groomer Terms. Note that the fee is configurable per-platform-settings; the policy should reference the current applicable rate without hard-coding it, or commit to updating the policy when the rate changes.
- The owner contracts the *grooming service* directly with the groomer. Groomr facilitates payment; it is not a party to the service contract.
- Payout timing: when funds are released to the groomer's Stripe Connect account (typically on appointment completion — define this trigger clearly).

### 3.2 — Deposit Policy
[COMMERCIAL CHOICE — this section's content depends on decisions you need to make; see §8]

The platform already has three deposit modes (`none`, `percentage`, `full`) configurable per groomer. The policy must explain all three, what each means for the owner, and what happens to the deposit in each cancellation scenario.

**Include:**
- Whether a deposit is required depends on the individual groomer's settings.
- Deposit amount will be shown at booking confirmation before the owner commits.
- Where a deposit is taken, the balance is due [on the day / on completion — confirm in §8].
- Forfeiture rules: under what circumstances is a deposit retained by the groomer? The fairness test under CRA 2015 Part 2 requires that forfeiture reflects genuine loss — a blanket "deposits are never returned" clause is legally fragile. A tiered schedule (full refund if cancelled >X days out; deposit forfeited if <X days; full charge if no-show) is defensible.
- Groomr's role: if a deposit needs to be refunded, Groomr instructs Stripe to process the refund. Timing caveats (banking days, card scheme delays).

### 3.3 — Owner Cancellation
[REQUIRED]

**Include:**
- **Cooling-off right (14 days):** Under the CCR 2013, the owner has 14 days from booking to cancel and receive a full refund unless the appointment is within that window and the owner expressly consented to service commencement. The policy must capture the consent mechanism (a clearly-worded checkbox or acknowledgement at booking, not buried text).
- **Outside cooling-off:** cancellation fees / deposit forfeiture by how far in advance the cancellation is made. The window thresholds are a commercial choice (§8) — the policy should state them clearly in a table or bullet list, not buried in prose.
- **Refund method:** always back to the original payment method. No store credit unless the owner explicitly chooses it. (Store credit as a default would be an unfair term under CRA 2015 for consumers.)
- **How to cancel:** the in-app mechanism (dashboard → appointment → cancel). Specify whether a reason is required and what happens to that data.
- **Confirmation:** owner should receive an email confirmation of cancellation and refund initiation; set timing expectation (3–5 business days for card refunds to appear).

### 3.4 — Groomer Cancellation
[REQUIRED]

**Include:**
- If the groomer cancels: full refund to the owner, no deduction, as a matter of course. This is non-negotiable — the owner hasn't received the service and bears no fault.
- Where a deposit was already transferred to the groomer and the groomer then cancels: Groomr will initiate a Stripe refund but may need to claw back from the groomer's connected account balance. State this mechanism clearly for groomers. If the groomer's balance is insufficient, Groomr may pursue recovery — flag in the Groomer Terms (this is a groomer-facing consequence, not the owner's problem).
- Repeat groomer cancellations: flag that Groomr may review the groomer's listing status. This is a platform-governance clause, not a payment clause, but it belongs here as a deterrent.
- Owner notification: immediate email + in-app notification when groomer cancels.

### 3.5 — No-Shows
[REQUIRED — define both sides]

**Include:**
- **Owner no-show:** deposit forfeited (if applicable); where no deposit was taken, full cancellation fee may apply if within the no-show window (commercial choice — §8). The policy must make the no-show threshold crystal clear (e.g. "failing to arrive within 15 minutes of the scheduled start").
- **Groomer no-show:** treated as a groomer cancellation — full refund to owner. Groomr should flag the groomer account.
- **Disputed no-shows:** this is a dispute, not a payment process. Cross-reference the disputes policy.

### 3.6 — Refund Process & Timelines
[REQUIRED]

**Include:**
- Who initiates a refund: owner requests via [mechanism]; Groomr reviews and instructs Stripe. Groomr does not hold funds between instruction and the owner's bank receiving them — set accurate expectations.
- Stripe's processing time: typically 5–10 business days for the refund to appear on a card statement. Groomr cannot accelerate this.
- Partial refunds: where applicable (e.g. partial service delivered, deposit-only refund). Explain how the maths works.
- Maximum refund: cannot exceed the amount originally paid. If the platform fee has already been deducted, Groomr will refund the owner's full payment and absorb the fee — or the groomer bears it. Decide and state this clearly (§8).
- Currency: all payments in GBP. Stripe handles any FX for non-GBP cardholders at their own card scheme rate — not Groomr's responsibility.

### 3.7 — Chargebacks
[REQUIRED — groomer-facing primarily, but owner-facing transparency also needed]

**Include:**
- A chargeback is a card-scheme-level dispute initiated by the owner's bank, distinct from Groomr's own refund process.
- Groomr does not control the chargeback process — it is administered by Stripe and the card scheme.
- Where a chargeback succeeds, Stripe debits the groomer's connected account (this is standard Stripe Connect destination-charge behaviour — make sure your Stripe Connect docs are read before committing to specific language here, as liability allocation varies by charge type).
- Groomr will represent a chargeback with available evidence (booking record, communications, confirmation of service delivery) on the groomer's behalf, but cannot guarantee outcomes.
- Filing a chargeback while a refund request is pending through Groomr creates a parallel process — state that this may complicate both and delay resolution.
- Owners who routinely file chargebacks may have their accounts reviewed.

### 3.8 — Groomer Payouts
[REQUIRED — groomer-facing]

**Include:**
- Trigger: payout is initiated [on appointment completion / on confirmation / on a rolling schedule — commercial choice, §8].
- The 8% platform fee is deducted at payout. Founding groomers: 0% during the founding period.
- Groomers need a connected Stripe Express account to receive payouts. Groomers who have not completed Stripe onboarding will have funds held until onboarding is complete.
- Stripe's payout schedule to the groomer's bank account (Stripe typically pays out on a rolling basis — the groomer's Stripe Express dashboard shows this). Groomr does not control the bank-to-bank leg.
- Clawbacks: where a refund or successful chargeback occurs post-payout, Stripe will debit the groomer's connected account. If the balance is negative, Stripe may debit the groomer's bank account or suspend payouts. This is a groomer risk to flag clearly — it is standard Stripe Connect behaviour, not an arbitrary Groomr decision.
- Groomr's liability: Groomr is not liable for Stripe platform outages, banking delays, or card-scheme rules that affect payout timing.

### 3.9 — Clawback from Groomers
[REQUIRED — groomer-facing; contractually load-bearing]

This is the mechanism that makes the whole refund system solvent. Without an explicit, enforceable clawback clause in the Groomer Terms (cross-referenced here), Groomr absorbs the cost every time a refund is issued post-payout and the groomer's Stripe balance is empty.

**Include:**

- **The trigger:** any event that requires Groomr to refund an owner — groomer cancellation, successful chargeback, platform-adjudicated refund following a dispute — creates an automatic debt owed by the groomer to Groomr for the net amount refunded (i.e. the amount the groomer actually received: booking total minus the platform fee).
- **First recourse — Stripe balance offset:** Groomr will instruct Stripe to debit the corresponding amount from the groomer's connected account. This happens automatically as part of Stripe Connect's destination-charge refund mechanics. The groomer does not need to take any action, and cannot block this.
- **Second recourse — future payout offset:** where the groomer's Stripe balance is insufficient to cover the clawback in full, the outstanding balance will be deducted from future payouts until the debt is cleared. Groomr will notify the groomer by email when this is applied, showing the amount withheld and the refund it relates to.
- **Third recourse — direct recovery:** where the groomer ceases using the platform (account closed, suspended, or voluntarily deactivated) with an outstanding clawback balance, Groomr reserves the right to pursue recovery of that debt directly. Under Scots law this is via **diligence** (sheriff officers, arrestment of bank accounts or earnings) through the Sheriff Court. The Groomer Terms must contain an express debt-acknowledgment clause to make this recovery straightforward without re-litigating the underlying obligation.
- **Dispute of a clawback:** a groomer who disputes that a refund was correctly issued may raise this through Groomr's internal complaints process within [X days] of being notified. Raising a dispute does not suspend the clawback — Groomr will continue to apply payout offsets during the review period. If the dispute is upheld, the withheld amount is restored to the next payout.
- **Chargeback-specific note:** where the clawback arises from a card-scheme chargeback rather than a Groomr-adjudicated refund, the outcome is determined by Stripe and the card scheme — Groomr has no discretion. The groomer bears the full chargeback amount plus any Stripe dispute fee. State this plainly; groomers sometimes conflate "I disagree with the chargeback" with "Groomr should cover it."
- **Cap / no-cap:** consider whether to cap total clawback exposure per groomer per rolling period (e.g. no single clawback may exceed £X without a manual review). This is a commercial choice (§8) — a cap protects groomers from catastrophic single events but limits Groomr's recovery in abuse scenarios.

**Governing law note (Scots):** the debt-acknowledgment clause in the Groomer Terms should specify that the clawback debt is immediately due and constitutes a liquid debt for the purposes of diligence in Scotland. A solicitor should draft this — "we'll take it from future payouts" is a policy statement, not an enforceable debt clause.

### 3.11 — Platform Fee & Invoicing
[BEST PRACTICE — transparency obligation]

**Include:**
- Groomers are entitled to a breakdown of deductions. The platform must provide (or Stripe provides via the Express dashboard) a record showing gross booking value, platform fee, and net payout for each transaction.
- VAT note: if Groomr is or becomes VAT-registered, the platform fee may be subject to VAT — groomers who are VAT-registered themselves will need a valid VAT invoice. Flag this as a decision for when Groomr hits the VAT threshold. **This is not a standard inclusion — add it when approaching £90k turnover.**
- Founding groomer fee waiver: confirm in writing (email) at onboarding when the 0% period ends and what the rate transitions to.

### 3.12 — Disputed Payments / Complaints
[REQUIRED]

**Include:**
- First step: contact Groomr's support within [X days] of the appointment.
- Groomr will investigate and respond within [X business days].
- If unresolved: the owner may escalate to an ADR scheme — signpost an approved scheme (Groomr should register with one; check the CTSI / Civil Mediation Council approved list). [REQUIRED under ADR Regs 2015]
- Groomr's decision on a payment dispute is not binding on the parties' legal rights — owners retain the right to pursue the groomer through the courts (or Groomr, where Groomr itself is the liable party). Reference Sheriff Court / Simple Procedure for claims up to £5,000.
- Limitation reminder: legal claims must be brought within five years under the Prescription and Limitation (Scotland) Act 1973 (Scots law baseline), though this does not limit Groomr's own internal deadline for raising complaints with the platform.

---

## 4. Marketplace-specific considerations

- **Destination charges vs. direct charges:** Groomr uses Stripe Connect destination charges. In this model, the charge is on Groomr's Stripe account and the connected groomer account receives a transfer. This means *Groomr* is the merchant of record for the charge. Refunds are processed from Groomr's account, with Stripe then debiting the groomer's connected account for their share. This is fine but it means Groomr has a contingent liability if the groomer's account is empty — the policy needs to acknowledge this, and the Groomer Terms need to make clawback rights explicit.
- **Who holds the money:** in destination-charge mode, between payment and payout, funds sit in Groomr's Stripe balance, not the owner's or groomer's. The policy must not describe this as "Groomr holds your money in trust" — that language implies a regulated payment institution. Correct framing: "Stripe processes and holds funds on our behalf."
- **Intermediary posture:** Groomr must not describe itself as guaranteeing refunds for service-quality failures (bad groom, injury, etc.) — that pulls it into the service contract. Groomr can, at its discretion, facilitate a resolution, but the obligation for service-quality remedies sits with the groomer. The policy should say this explicitly and consistently.
- **Founding groomer fee:** the 0% rate is a time-limited contractual commitment. The policy should not hard-code "0% for founding groomers" without also specifying when it expires (deadline stored in `platform_settings.founding_groomer_deadline`). If that deadline isn't set, state the applicable duration at signup and track it per groomer.
- **Group bookings:** `createGroupAppointment` books multiple dogs back-to-back under a shared `booking_group_id`. The policy needs to address whether a partial cancellation (one dog from a group booking) is possible, and how refunds work in that case. Currently the system creates individual appointments — the policy should confirm whether each appointment in a group is independently cancellable.
- **Tips:** `tips` table is a separate Stripe PaymentIntent. Tips are treated as voluntary gratuities — they are not refundable through the standard refund mechanism. State this clearly. If an owner disputes a tip as unauthorised, that's a chargeback scenario, not a Groomr refund.

---

## 5. Animal-welfare considerations

Not directly applicable to a payments policy. However, include one clause in the refund section: **where a grooming appointment is refused because the animal presents a welfare risk (aggression, illness, vaccination not current)** — and the groomer invokes this at the start of the appointment — this is not a groomer cancellation for payment purposes. The policy should state whether the owner receives a refund in this scenario and who bears the deposit. This is a genuinely contested area — cross-reference the acceptable use / welfare policy for the factual trigger, but deal with the payment consequence here.

---

## 6. Cross-references

- **Terms of Service** — establishes the tripartite relationship and the governing-law clause (Scots law). The payments policy is a schedule to the ToS.
- **Disputes Policy** — where a refund request arises from a service-quality dispute, the disputes policy governs the adjudication process. The payments policy handles the mechanics of the money movement once a resolution is reached.
- **Groomer Terms & Conditions** — must contain the platform fee rate, clawback rights, payout trigger, and the founding groomer rate and its expiry. The payments policy should not be the primary source for groomer contractual obligations — the Groomer Terms should be.
- **Acceptable Use / Community Standards** — governs account suspension, which triggers questions about what happens to pending payments and payouts on suspension. Deal with the payment consequence in this policy or cross-reference explicitly.
- **Privacy Policy** — payment data (card details) is held by Stripe, not Groomr. The privacy policy should confirm this and link to Stripe's own privacy terms. The payments policy can cross-reference rather than repeat.
- **Cookie / Tracking Policy** — Stripe.js drops cookies for fraud detection. Flag this in the cookie policy; cross-reference from here.

---

## 7. Risk flags — get a solicitor on these

1. **Destination-charge liability gap:** In Stripe Connect destination charges, Groomr is the merchant of record. If a groomer's connected account is negative when a refund is owed, the shortfall is Groomr's exposure. The policy needs to state Groomr's clawback rights against the groomer clearly enough to be contractually enforceable — this needs solicitor review for debt-enforcement language under Scots law (diligence / arrestment, not English bailiff/CCJ).

2. **The 14-day cooling-off / express waiver:** The CCR 2013 mechanism for capturing the consumer's consent to start a service within the cooling-off period (and thereby waive the cancellation right) must be implemented correctly in the booking UI and evidenced. Getting this wrong means every booking is potentially refundable in full within 14 days regardless of proximity to the appointment. The wording of the waiver — and whether the UI currently captures it — needs legal and product sign-off together.

3. **Groomer T&Cs and the CRA 2015 fairness test:** Since cancellation terms are set by individual groomers, Groomr is facilitating consumer contracts that Groomr itself doesn't control. The fairness test under CRA 2015 Part 2 still bites on every one of those contracts — a groomer whose T&Cs say "all deposits non-refundable in all circumstances" is publishing an unfair term via Groomr's platform. Groomr could be seen as complicit if it knowingly facilitates those terms at scale. **Groomr must publish minimum platform standards** (e.g. "groomer T&Cs must provide a full refund for cancellations more than 48 hours in advance; deposit forfeiture is only permitted within 48 hours; no-show full charge permitted") and enforce them as a condition of listing. Without this floor, Groomr has no defence if a groomer's T&Cs are challenged. Get these minimum standards drafted and reviewed before groomers start uploading free-form T&Cs.

4. **VAT on the platform fee:** If Groomr is VAT-registered (or approaches the threshold), the 8% platform fee charged to groomers may need to be quoted VAT-exclusive, with VAT added on top. This changes the economic deal for groomers. Flag this now and get tax advice before Groomr hits £90k taxable turnover.

5. **FCA / e-money perimeter:** Groomr sits in Stripe's payment flow. Depending on exactly how destination charges are structured and whether Groomr ever "holds" funds between collection and transfer in any meaningful sense, there is a perimeter question about whether Groomr needs its own FCA authorisation (Payment Institution or e-money exemption). This is Stripe's standard use case so the risk is low — but it needs a one-time legal opinion, not an assumption.

---

## 8. Decisions — resolved

1. **Cancellation window thresholds:** ✅ Governed by each groomer's own T&Cs (stored in `contract_terms`, accepted via `contract_acceptances`). Groomr's policy states that cancellation terms are set by the individual groomer and presented to the owner before booking. **Groomr must publish minimum platform standards that groomer T&Cs cannot fall below** — see §7 addition below.

2. **No-show threshold:** ✅ Governed by groomer T&Cs.

3. **Balance due timing:** ✅ Balance charged when groomer marks appointment complete in-app.

4. **Payout trigger:** ✅ Weekly, every Monday. Implication: up to 6 days can pass between a Monday payout and the next. Refunds requested in that window against an empty Stripe balance will trigger the payout-offset clawback (§3.9). The policy should state that clawback may apply to the following Monday's payout.

5. **Platform fee on full refunds:** ✅ Groomr absorbs the 8% when it issues a full refund. The groomer receives nothing and bears no further liability for the fee on a cancelled booking. State this in the Groomer Terms as a genuine benefit of the platform.

6. **Partial group-booking cancellation:** ✅ Governed by groomer T&Cs. Each appointment in a group booking is independently subject to the groomer's cancellation policy.

7. **Welfare-triggered refusals:** ✅ Governed by groomer T&Cs as a baseline. However: **if the owner failed to declare a known health, aggression, or vaccination issue at booking, the owner bears liability and the groomer may retain the deposit or charge the full fee.** This creates a disclosure obligation that must appear in the platform ToS and the booking flow — not just the policy. The groomer's T&Cs cannot override this owner-liability rule; it is a platform-level term.

8. **ADR scheme:** ✅ Ombudsman Services. **⚠ Verify scope before publishing** — Ombudsman Services primarily covers regulated sectors (energy, telecoms, property). Confirm with them directly that they accept general consumer-to-marketplace complaints for a pet services platform. If out of scope, **Retail ADR** or **ProMediate** are the fallback CTSI-approved options.

---

*This is a structural brief to scope and draft the Refunds and Payments Policy — it is not a substitute for review by a qualified solicitor, particularly on the deposit forfeiture fairness analysis (§7.3), the CCR 2013 cooling-off mechanism (§7.2), and the Stripe Connect liability exposure (§7.1).*
