# Disputes Policy — Contents Breakdown
**Scope: Service disputes between owner and groomer (quality, no-show, injury, unmet expectations)**

---

## 1. Purpose & scope

- Governs disputes arising from the **grooming service itself** — quality of groom, no-show by either party, injury or distress to a dog during grooming, failure to perform a booked service, or material deviation from what was agreed.
- **Does not cover** payment chargebacks, Stripe-side disputes, deposit refunds, or tip disputes — those belong in a separate Refunds & Payments policy (note: these will be caught in the background anyway via the refund fields in the `payments` table — see cross-references).
- Applies to **both owners and groomers** — either party can raise a dispute.
- Sits beneath the main Terms of Service and is cross-referenced from groomer Terms of Engagement. It does not supersede the owner↔groomer service contract — it describes Groomr's facilitation process only.

---

## 2. Regulatory drivers

| Law | What it obliges | Tag |
|---|---|---|
| **Consumer Rights Act 2015, s.49** | The grooming service must be performed with reasonable care and skill. If not, the owner's primary remedy is against the **groomer**, not Groomr. The policy must be explicit that Groomr is not the service provider. | [REQUIRED] |
| **Alternative Dispute Resolution for Consumer Disputes Regs 2015** | Where a trader cannot resolve a consumer complaint in-house, they must signpost a certified ADR scheme. Applies to the owner↔groomer relationship AND to any direct complaint against Groomr. | [REQUIRED] |
| **Consumer Contracts (Information, Cancellation & Additional Charges) Regs 2013** | Pre-contract information obligations. Where a cancellation (whether owner or groomer-initiated) triggers a service failure, the refund entitlement rules interact with the dispute. Needs a clear handoff. | [REQUIRED] |
| **Electronic Commerce (EC Directive) Regs 2002** | Groomr's intermediary safe harbour (hosting defence) under reg 19 requires it to act on notice of illegal or harmful content/conduct. A dispute mechanism is how that notice is given. Policies must not undermine this posture by making Groomr an adjudicator of service quality. | [REQUIRED] |
| **Animal Health & Welfare (Scotland) Act 2006 / Animal Welfare Act 2006 (E&W) / Welfare of Animals Act (NI) 2011** | Groomers have a duty of care to animals in their care. Injury to a dog during grooming may be a welfare matter, not just a contract matter. The applicable Act follows where the groom takes place. A UK-wide marketplace touches all three. | [REQUIRED] — injury pathway must reference welfare obligations |
| **Consumer Protection from Unfair Trading Regs 2008** | Misleading representations by either party can be an unfair commercial practice — a groomer misrepresenting qualifications, but equally an owner making a fabricated or exaggerated injury claim to pressure a refund. Both are in scope. | [BEST PRACTICE] to reference as a backstop |
| **Equality Act 2010** | Dispute handling must not discriminate against either party. Relevant if a groomer refuses a booking for a protected-characteristic reason, but equally if an owner is abusive or discriminatory toward a groomer. | [BEST PRACTICE] — cross-refer to Acceptable Use policy |
| **Online Safety Act 2023** | User-generated content in dispute submissions (comments, evidence uploads) is in scope for illegal-content duties. Grooming-related exploitation and animal-cruelty content have specific obligations. | [REQUIRED] — flag the evidence-upload pathway |
| **Prescription and Limitation (Scotland) Act 1973** | Five-year short negative prescription applies to contractual and delictual claims (Scots law). Sets the outer boundary for how long a dispute could theoretically be raised. Policy should state Groomr's own shorter platform window for raising disputes (e.g. 14 or 30 days post-appointment). | [BEST PRACTICE] — platform window is a commercial choice, but must not claim to extinguish legal rights |

**Scots-law note:** Groomr's own dispute facilitation process is governed by Scots law. Consumer enforcement rights (including the right to sue in their local court) cannot be contracted out of for customers based in England, Wales, or Northern Ireland — the policy must not claim Scots courts as the exclusive forum for owner-side consumer claims.

---

## 3. Recommended sections

### 3.1 Who contracts with whom [REQUIRED]
State explicitly: the grooming service is contracted between the **owner and the independent groomer**. Groomr is the platform — it facilitates discovery, booking, and payment. It is not party to the service contract, does not employ groomers, and is not responsible for the quality of the groom, the groomer's conduct, or injury caused during the service. This is the single most important paragraph in the policy — every liability question flows from it.

### 3.2 What qualifies as a dispute [REQUIRED]
Define the types of service dispute the platform will facilitate. Either party can raise a dispute — frame the list accordingly.

**Owner-initiated disputes** (owner raises against groomer):
- Quality of groom materially below what was agreed or advertised
- Groomer no-show (confirmed appointment, groomer did not attend or open)
- Injury or distress to a dog during grooming
- Groomer refusal to perform a booked service without notice or reasonable grounds
- Damage to owner property on groomer premises or during a mobile visit
- Unprofessional conduct by the groomer toward the owner or dog

**Groomer-initiated disputes** (groomer raises against owner):
- Owner no-show without notice (dog not brought to confirmed appointment)
- Owner providing a dog with undisclosed aggression, vaccination status, or health conditions that affected the ability to complete the service
- Owner causing damage to groomer's premises or equipment
- Abusive, threatening, or harassing conduct by the owner
- Owner making a claim the groomer believes to be false or exaggerated

State what is **not** in scope: pricing disputes (handled under Refunds & Payments), account access, platform technical issues, or anything already covered by a Stripe chargeback.

### 3.3 Time window for raising a dispute [COMMERCIAL CHOICE]
How long after the appointment can an owner or groomer raise a dispute via the platform? Groomr needs a stated window (suggest 14 days post-appointment as a starting point — enough time to notice a poor groom result, short enough to be useful). **The window cannot be stated as extinguishing legal rights** — it governs only Groomr's platform facilitation. Add: "This does not affect any legal rights you may have under the Consumer Rights Act 2015 or applicable Scottish or UK law."

### 3.4 How to raise a dispute [BEST PRACTICE]
Step-by-step for both parties:
- Who can initiate: either the owner or the groomer (the `raised_by` field in the DB already captures this)
- Where: through the Groomr platform (`/disputes/[id]` is already built — link to the relevant dashboard section)
- What to include: description of the issue, appointment details (the `appointment_id` link is already supported), supporting evidence relevant to the nature of the claim

**Evidence guidance — what each party might usefully submit:**

*Owner raising a dispute:* photos of the dog pre- and post-groom, vet report or notes if injury is alleged, screenshots of agreed service description, any relevant platform messages.

*Groomer raising a dispute:* photos taken during or after the groom, record of no-show or late notice (appointment status, message timestamps), photos of any property damage, platform messages showing prior communication about the dog's behaviour or health status.

Stress for both: written communications **through the Groomr messaging system** carry more weight — off-platform evidence is harder to verify and may be edited. Groomr cannot authenticate screenshots from external channels.

### 3.5 Groomr's role in disputes — what it is and isn't [REQUIRED]
This is the intermediary-posture section. Be precise:
- Groomr will **facilitate** the dispute — provide the structured two-party comment system, notify the relevant parties, and review submissions
- Groomr will **propose** a resolution where it considers appropriate — but cannot compel either party to accept it
- Groomr is **not** an arbitrator, ombudsman, or court; its resolution proposals are not legally binding
- Groomr's facilitation does not make it a party to the owner↔groomer contract
- Referencing the built workflow: the current implementation has two resolution rounds (`awaiting_agreement` → `final_review` → `awaiting_final_agreement` → `resolved`/`closed`). The policy should describe this without exposing the internal status codes.

### 3.6 The resolution process — step by step [REQUIRED]
Map the actual two-round workflow into plain language:

**Round 1 — Both parties submit their account**
Both the owner and groomer are asked to submit their account of events. Once both submissions are received, Groomr reviews and may propose a resolution. (The current code advances to `open` status when both comments are received and notifies the admin.)

**Round 1 resolution proposal**
Groomr proposes a resolution. Both parties are asked whether they accept it. If both accept → dispute resolved. If either rejects → escalation.

**Round 2 — Final resolution**
Groomr issues a final resolution after reviewing any rejection reasons. Both parties are asked to respond. After Round 2, Groomr closes the dispute. State clearly that the final platform resolution does not prevent either party pursuing legal remedies independently.

Include **target timeframes** — currently not defined in the code. Suggest: Groomr aims to acknowledge within 1 business day, propose a Round 1 resolution within 5 business days of receiving both submissions, and issue a final resolution within 10 business days of a Round 1 rejection. [COMMERCIAL CHOICE — agree the SLAs.]

### 3.7 Evidence handling [BEST PRACTICE + ONLINE SAFETY ACT]
- What types of evidence are accepted (photos, screenshots of Groomr messages)
- What Groomr does with evidence — reviewed by admin only; shared with the other party only to the extent necessary for resolution
- Retention: how long evidence is kept after dispute closure
- Content warning: evidence uploads must not contain illegal content; Groomr will act on any notified illegal content per its legal obligations under the Online Safety Act
- Animal welfare images: if evidence submitted indicates a welfare offence, Groomr will consider referral to the relevant authority (SSPCA in Scotland, RSPCA in E&W, USPCA in NI)
- **Bad-faith or fabricated evidence:** if a party submits evidence Groomr reasonably believes has been manipulated, fabricated, or is being used to make a false claim, this is itself grounds for a dispute finding against that party and may result in account action under the Acceptable Use policy — this applies equally to owners and groomers

### 3.8 Possible outcomes [REQUIRED]
Be explicit about what Groomr can and cannot do as outcomes. Critically, **outcomes must be framed as bilateral** — disputes can be raised by either party, and the owner is not automatically the aggrieved one.

**Where the evidence weighs against the groomer:**
- Recommend a partial or full refund to the owner
- Recommend a repeat groom at the groomer's cost
- Recommend the groomer contact their insurer (injury cases)
- Note the dispute on the groomer's internal record
- Suspend or remove the groomer from the platform pending or following investigation

**Where the evidence weighs against the owner:**
- Find the owner's claim unsubstantiated and close in the groomer's favour
- Note a pattern of unsubstantiated or bad-faith claims on the owner's account
- Restrict or remove the owner's ability to book through the platform
- Recommend the groomer be entitled to retain any deposit or cancellation fee per their stated policy

**In all cases, Groomr cannot:**
- Compel either party to pay money directly
- Award damages
- Act as a court, arbitrator, or ombudsman
- Guarantee any outcome

State which outcomes (e.g. platform suspension of either party) are governed by Groomr's separate Acceptable Use / Community Standards policy.

### 3.9 Interaction with Stripe refunds [REQUIRED]
Where the proposed resolution involves a refund and payment was taken through the platform:
- The refund process is separate — refer to the Refunds & Payments policy
- Groomr facilitated the payment via Stripe Connect; the refund mechanics and who bears the cost (platform, groomer payout clawback) should be in that policy
- If a dispute overlaps with a Stripe chargeback already raised, Groomr will coordinate but the chargeback outcome is Stripe's, not Groomr's
- The `payments` table has `refund_status` and `refund_amount_pence` fields — the policy should acknowledge this linkage without exposing the DB structure

### 3.10 Insurance and liability [BEST PRACTICE]
**Groomer-side:**
- Groomers operating on the platform are required to hold public liability insurance (a verification condition — align with Verification Policy)
- Where a dog injury is alleged, Groomr will provide the relevant appointment and dispute record to assist an insurance claim if requested
- Injury incidents may need to be reported to the relevant animal welfare authority — see section 5

**Owner-side:**
- Owners are responsible for their dog's behaviour. If a dog injures a groomer, damages groomer equipment, or causes harm during a session, the owner may bear liability — this is not automatically a successful dispute by the owner
- Groomr will equally provide appointment and dispute records to a groomer pursuing an insurance or damage claim arising from owner-side conduct
- Groomr does not act as an insurer for either party and does not handle insurance claims directly

### 3.11 Impact on platform standing — both parties [COMMERCIAL CHOICE]
State whether, and how, dispute outcomes affect either party's standing on the platform.

**Groomer:**
- Whether the groomer's listing is temporarily suspended during an active investigation
- Whether a pattern of upheld disputes triggers review of `is_verified` or `is_listed` status
- Whether resolved disputes are visible to future owners (almost certainly no — but say so explicitly)

**Owner:**
- Whether a pattern of disputes raised by the owner (particularly ones found unsubstantiated) triggers review of the owner's account
- Whether owners with a history of no-shows or bad-faith claims can be restricted from booking certain groomers
- Whether the owner's dispute history is visible to groomers before they accept a booking (a commercial decision with product implications)

These decisions need to be made before the policy can be written. Currently the `disputes` table has no direct FK from `groomer_profiles` or owner-side account flags — surfacing patterns in admin analytics would require a query join on both sides.

### 3.12 ADR signposting [REQUIRED — ADR Regs 2015]
After exhausting Groomr's dispute process (or if the party is unhappy with the outcome), signpost ADR. Options for a UK consumer marketplace at this scale:
- For low-value claims (under £5,000 in Scotland): **Simple Procedure** in the Sheriff Court
- ADR scheme: Groomr should identify a certified scheme (e.g. Ombudsman Services, ProMediate, or similar) — this decision needs to be made and the scheme named in the policy. Without a named scheme, the policy is non-compliant with the ADR Regs.
- For claims in England & Wales: Money Claims Online / Small Claims track in the County Court

### 3.13 Governing law and jurisdiction [REQUIRED]
- Groomr's facilitation process is governed by Scots law
- Scots courts (Sheriff Court / Court of Session) have jurisdiction over claims against Groomr as a Scottish-registered company
- **Caveat:** consumer owners and groomers in England, Wales, or Northern Ireland retain the right to bring claims in their local courts — this clause cannot override statutory consumer rights

---

## 4. Marketplace-specific considerations

- **Intermediary safe harbour:** The dispute policy must at all times position Groomr as a neutral facilitator. The risk is that if Groomr goes too far in "adjudicating" service quality — imposing outcomes, making findings of fault — it may undermine its hosting defence under the E-Commerce Regs and potentially become a party to the owner↔groomer contract. The two-round proposal model (Groomr *proposes*, parties *agree*) is architecturally correct. The policy must reflect this same framing.
- **Stripe Connect:** Groomr processes payment as a platform; the groomer receives a payout minus the platform fee. If a dispute results in a refund, the mechanics of clawing back a groomer payout or absorbing refund cost are a separate financial decision — the policy should acknowledge the link and cross-refer, not attempt to explain Stripe Connect mechanics.
- **Two-sided audience:** The dispute form and process must be accessible to both owners and groomers. The current `/disputes/[id]` implementation already scopes the view by `viewer_role` — the policy should reflect that each party sees the process from their own perspective, and that each party's submission is visible to the other (confirm this is the intended behaviour).
- **Stake asymmetry:** The groomer's professional reputation and livelihood are on the line; the owner's emotional attachment to their dog is significant. Neither stake makes either party's account more credible by default. The policy should be explicit that Groomr assesses evidence on its merits, not on whose claim feels more sympathetic.
- **Notification flow:** The current code sends admin email notifications when both parties comment and when a resolution is rejected — the policy doesn't need to describe the technical implementation but should commit to notifying parties at each status change.

---

## 5. Animal-welfare considerations

This section is directly relevant given the "injury to a dog" dispute type.

- **Duty of care during grooming:** A groomer holding a dog for grooming has a duty of care under the applicable animal welfare legislation (Act varies by where the groom takes place). Injury to a dog is not just a service-quality matter — it may be a welfare offence if caused by negligence or mistreatment.
- **Injury reporting pathway:** The policy should specify: if a dispute involves alleged injury to a dog, Groomr will request veterinary evidence if available. If the evidence suggests deliberate mistreatment or serious neglect, Groomr will consider whether to refer to the relevant animal welfare body (SSPCA / RSPCA / USPCA). This is a platform-level obligation under the Online Safety Act and welfare legislation.
- **Owner's pre-booking disclosure obligations:** Owners are required to disclose relevant health conditions, vaccination status, temperament issues, and aggression history before booking. Failure to disclose is a legitimate defence for the groomer in a quality or injury dispute — the policy should make this expectation explicit and cross-reference wherever pre-booking disclosure is required in the booking flow.
- **Aggression / muzzling:** If a groomer stops a groom due to dog aggression or safety concerns, that is a legitimate ground for service termination. This is not a ground for a successful dispute by the owner, provided the groomer took reasonable care and communicated clearly. The groomer may still be entitled to a partial fee for work completed.
- **Post-groom condition:** Coat damage, skin irritation, and clipper injuries are the most common owner-initiated disputes. The policy should specify what evidence is useful (vet notes, pre/post photos) without guaranteeing any outcome, and should note that pre-existing conditions — particularly in elderly or matted dogs — complicate causation.
- **Groomer safety:** If an owner's dog injures a groomer, this is a welfare matter for the groomer as well. The policy should acknowledge the groomer's right to refuse future bookings from that owner and cross-reference the Acceptable Use policy on repeat safety incidents.

---

## 6. Cross-references

| Policy | Relationship |
|---|---|
| **Terms of Service** | Parent document — disputes policy operates within it. The owner↔groomer contract formation, cancellation rights, and platform rules are set there. |
| **Refunds & Payments Policy** | Dispute outcomes may trigger refunds — the refund mechanics, Stripe interaction, and deposit handling belong there. The two must not contradict each other. |
| **Acceptable Use / Community Standards** | Dispute outcomes involving platform suspension or groomer removal are governed by that policy. |
| **Verification Policy** | Insurance requirements for groomers (relevant to injury disputes) are a verification condition — align the two policies. |
| **Privacy Policy / UK GDPR** | Evidence submitted in disputes is personal data. The dispute policy must cross-refer to the Privacy Policy for how that data is handled, retained, and (if applicable) shared. |
| **Groomer Terms of Engagement** | The groomer-side contract should include a clause requiring participation in the dispute process in good faith. Check that the current groomer onboarding terms include this. |
| **Owner Terms of Service** | The owner-side terms should include equivalent good-faith participation obligations, the pre-booking disclosure requirement, and the consequences of making a false or bad-faith dispute claim. |

---

## 7. Risk flags — get a solicitor on these

1. **Adjudicator vs. facilitator line.** The most significant legal risk. If Groomr's dispute process is seen as making binding determinations of fault — rather than proposals both parties can accept or reject — it risks losing the E-Commerce Regs hosting defence and potentially being construed as a party to the owner↔groomer service contract. The current two-round architecture is sound; the policy language must match it precisely. This needs solicitor sign-off.

2. **ADR Regs compliance.** The ADR Regs require naming a certified ADR scheme. Groomr does not currently appear to have identified one. Without this, the policy is non-compliant from day one. This must be resolved before the policy is published. A solicitor can recommend an appropriate certified scheme for a UK consumer marketplace of this type.

3. **Animal injury liability.** Where a dog is injured during grooming, the groomer's liability is clear — but if Groomr's dispute process is seen as having validated or cleared a groomer who then causes further injury, there is a potential negligence argument against Groomr. The policy must limit Groomr's role to facilitating, not clearing. Solicitor to review the injury handling section specifically.

4. **Prescription / limitation interaction.** Stating a "14-day window" for raising disputes is commercially sensible, but the policy must make crystal clear this does not extinguish legal rights under Scots law (five-year prescription) or E&W law (six years under the Limitation Act 1980 for consumers located there). Get solicitor review of this clause.

5. **GDPR and evidence.** Dispute evidence (photos, written statements) is personal data of both parties and potentially of the dog (animal welfare data). Retention limits, lawful basis for processing, and cross-sharing between parties need to be worked through with a solicitor or a DPO.

---

## 8. Decisions needed from you

1. **Time window to raise a dispute.** How many days post-appointment? (Suggest 14 days — enough for a skin reaction or coat damage to become apparent; short enough to be useful.) Does the clock run from the appointment date or from when the owner first notices the issue?

2. **Target resolution SLAs.** What timeframes does Groomr commit to for acknowledging, reviewing, and proposing resolution? These become contractual commitments — set them at a level the admin team can actually meet.

3. **Refund authority.** When Groomr proposes a refund as a resolution, who absorbs the cost — the groomer (payout clawback), Groomr (platform fee), or split? This is a financial policy decision that determines the language in the dispute policy and the Refunds & Payments policy. Note: currently no automated refund pathway is wired to the dispute workflow; admin manually initiates refunds from the payments table.

4. **ADR scheme.** Which certified ADR provider will Groomr sign up with? This must be named in the policy to comply with the ADR Regs. This requires action before launch.

5. **Dispute history visibility — both sides.** Do resolved disputes affect a groomer's listing or verification status? Can a groomer see an owner's dispute history before accepting a booking? Can a pattern of unsubstantiated owner claims trigger account review? These need product decisions before the policy can describe consequences for either party.

6. **Suspension during investigation — both sides.** Does raising a dispute trigger any temporary restriction? For groomers: the `is_accepting_bookings` flag could be used, but the threshold needs defining (injury allegation vs. quality complaint). For owners: can a groomer flag an owner as a no-show risk, or request they not be matched again? Neither mechanism currently exists in the DB — flag if it needs building.

7. **Cross-party evidence sharing.** Does the owner's submission (including photos, comments) get shown verbatim to the groomer, and vice versa? The `DisputeView` interface currently returns both `owner_comment` and `groomer_comment` to whichever party is viewing — confirm this is intentional and state it in the policy.

8. **Animal welfare referral.** If Groomr receives evidence of dog mistreatment, will it proactively refer to SSPCA/RSPCA/USPCA? Or only if compelled? This is a reputational and legal decision that needs to be made now, not after an incident.

---

*This is structural legal guidance to scope and draft the policy — not a substitute for sign-off from a qualified solicitor, particularly on items 1, 2, 3, and 4 in the risk flags section, which require legal review before the policy is published.*
