# Sutra Books — research, product brief & application design

**Research cut-off:** 30 September 2026
**Application entry point:** `index.html` (plain local HTML/CSS/JavaScript; no build step or network dependency)
**Status:** interactive offline-first prototype, not a production accounting or tax-filing product.

> **Reference-material note:** no TallyPrime study material or attachment was present in the repository when work began. This brief therefore uses publicly available vendor and government/professional sources. Attach the study material in a later turn and it can be mapped against this specification.

## 1. Executive summary

Build an original Indian small-business accounting workspace that borrows familiar accounting *workflows*—company books, vouchers, ledgers, stock, statutory summaries and reports—without copying Tally/BUSY code, screens, branding, manuals or proprietary assets. The first deliverable is a local browser prototype that opens by double-clicking `index.html` and demonstrates a coherent bookkeeping loop with sample books.

The prototype is deliberately **offline-first**: the interface, rules, demo data and calculations execute locally; no account, server or external AI provider is required. It uses browser local storage and JSON backup/restore. This is a usability prototype, not a safe long-term system of record: browser storage is not encrypted, durable archival storage, a multi-user database or a substitute for a production backup strategy.

### Product principles

1. **Books before cleverness:** every posted voucher must balance; reports derive from the same postings.
2. **Compliance is date- and entity-sensitive:** rates, thresholds, return forms, due dates and accounting standards are versioned/configurable data, not hard-coded universal truths.
3. **Human review for statutory work:** software can prepare checks and summaries; a taxpayer/CA must verify applicability and filing output against current official notices and portal data.
4. **Traceability:** posted vouchers are not silently overwritten. Corrections should be reversals/adjustments; keep a readable event trail and backups.
5. **Offline by default:** no external calls in the MVP. “AI” features must explain which local records/rules produced an observation.
6. **Original product identity:** use common accounting conventions, not a pixel-copy of TallyPrime or BUSY.

## 2. Market and workflow study

### TallyPrime (official Release 7.1 notes)

As of this research date, Tally’s official help site describes Release 7.1 (release notes dated 20 May 2026). The release notes highlight editable invoice templates and text wrapping, GST/IMS books reconciliation, bank reconciliation and online payment improvements, GST validations and e-returns, TDS/TCS return support aligned with the Income-tax Act, 2025, OAuth email, and Schedule III (Division I) financial-statement support. These are useful indicators of the depth users expect from a mature product, not a claim that this prototype implements them.

**Common workflow to preserve:** open a company → search or create a master → enter a voucher → review its accounting/inventory/tax effect → inspect a ledger or statutory report → reconcile or export.

### BUSY (official product pages)

BUSY’s official feature pages describe a similar integrated SMB surface: GST billing and return data, ledger books and financial statements, bank reconciliation, receivables/payables, inventory with locations/batches/units, purchase/order workflows, reporting, user activity/audit controls, TDS/TCS and optional integrations. Availability varies by edition and configuration. The useful benchmark is the *breadth of linked workflows*, not any one screen or menu.

### Shared product expectations identified

- Company and financial-year selection; keyboard-friendly voucher entry and quick search.
- Chart of accounts, party ledgers, bill-wise outstanding, receipts/payments/journals, numbering and narration.
- Sales/purchase documents connected to tax and stock movements.
- Trial balance, P&L, balance sheet, cash/bank, stock, receivable/payable and GST views.
- GST classification/reconciliation, e-invoice/e-way-bill workflow, TDS/TCS, audit trail, import/export and backup.
- Controls that expose uncertainty and exceptions rather than silently “fixing” statutory values.

## 3. Indian accounting and compliance domain notes

This is a software discovery summary, **not legal, tax, audit or CA advice**. Indian obligations depend on entity type, turnover, transaction facts, registration, location, notified exemptions, elections, tax period, and later amendments/notifications. State/UT-specific rules and extensions matter. A CA/tax professional must validate production rules.

### Double-entry and financial reporting

- Use a balanced journal as the canonical posting: debit total must equal credit total for each posted voucher. Reports should be calculated from posted lines, not separately maintained dashboard totals.
- Keep party control accounts, tax accounts, cash/bank, stock, income/expense, equity and dimensions/cost centres distinct. Support opening balances and a controlled year-end process.
- India’s financial year normally runs 1 April–31 March; “financial year,” “assessment year,” and the post-2026-27 “tax year” should not be conflated.
- Reporting framework depends on the entity and applicability: Companies Act Schedule III presentation and notified AS/Ind AS requirements are not interchangeable. A sole proprietor, partnership, LLP, company, NBFC, listed company and regulated entity can need different books, disclosures and controls.
- Inventory needs a configured valuation policy and period-end stock reconciliation. A production implementation must address returns, discounts, freight, landed cost, multiple units/godowns, batches, expiry, serial numbers, WIP/manufacturing and negative-stock controls; the prototype only demonstrates basic quantities and weighted-average cost.

### GST workflow requirements

- Capture supplier/customer GSTIN and state/place-of-supply facts, document type/number/date, HSN/SAC, quantity/unit for goods, taxable value, rate, tax components, reverse charge/export/SEZ status, discounts, notes and supporting documents as applicable.
- Tax split is not just a rate lookup: place of supply, supplier location, supply type, reverse charge, exemptions, time of supply, composition status and notifications affect the treatment. The prototype’s same-state CGST+SGST vs different-state IGST split is intentionally a teaching/demo shortcut only.
- GST Portal help currently states a general GSTR-1 deadline of the 11th of the succeeding month for monthly filers and the 13th after the quarter for quarterly filers; it also says dates can be extended. GSTR-3B general dates are the 20th monthly or 22nd/24th after the quarter for QRMP taxpayers according to State/UT, subject to notification. GST Portal is the final source for each taxpayer and period.
- GSTN material describes e-invoicing for notified taxpayers at the ₹5 crore aggregate-turnover threshold. A separate IRP advisory states that taxpayers with AATO of ₹10 crore or more must report covered e-invoices within 30 days from 1 April 2025. These are separate rules; eligibility and exemptions must be checked against the latest notification and taxpayer profile.
- E-way bill is generally required for covered movements with consignment value over ₹50,000, but the rules contain exceptions and special cases (including certain below-threshold movements); State/UT and goods-specific notifications can change treatment.
- GST records need reliable electronic backup, audit trail/inter-linkage and retention controls. Section 36 generally refers to 72 months from the due date of the annual return, with a later period where proceedings/investigations are pending. Do not treat this as the only retention law: another statute or litigation hold can require longer preservation.
- Never label a locally computed GST preview “filed” or “portal reconciled.” GSTR-1, GSTR-3B, GSTR-2B/IMS, annual returns, e-invoice and e-way bill are separate workflows that require official schemas, notices, credentials/integrations and taxpayer review.

### Income tax, TDS/TCS and 2026 transition

- The Income-tax Act, 2025 and Income-tax Rules, 2026 apply from 1 April 2026 for relevant new tax-year transactions. Official e-Filing guidance says TDS obligations are determined by the earlier of credit or payment: events up to 31 March 2026 remain under the 1961 Act; events from 1 April 2026 are governed by the corresponding 2025 Act provisions.
- For post-1 April 2026 transactions, the official portal describes salary withholding under section 392, other TDS under section 393, and TCS under section 394; legacy sections such as 194C must not simply be copied into new-period filings. Pre-transition statements and corrections can remain under the old Act. This is a material product requirement for period-aware rules, master data and exports.
- A TDS/TCS engine must model payee residency/type, payment/credit trigger, threshold, rate, lower/nil certificate, PAN, section/table reference, challan, deposit date, statements/forms, correction history and year-specific law. A generic “percentage on expenses” checkbox is unsafe. Rates, forms and due dates must be maintained from current law and validated by a tax professional.
- Tax audit, depreciation, advance tax, payroll/salary withholding and income-tax computation each have their own applicability tests, periods and rules. The MVP does not compute or certify any of these.

### Audit, company law and data protection

- Companies Act, 2013 covers company books and financial statements (including sections 128–134); the Companies (Accounts) Rules / Companies (Audit and Auditors) Rules prescribe additional controls. Applicable companies need an accounting-software audit trail/edit-log feature; the log must not be disabled/tampered with and must be preserved as required. Applicability, effective period and record retention should be verified against current rules and amendments.
- Audit support should retain source documents, accounting policies, change history, reconciliations, period locks, supporting schedules and exportable evidence. It must not claim to perform an independent statutory audit or issue a CA opinion. ICAI Standards on Auditing include documentation, laws/regulations, risk assessment and evidence responsibilities; the independent auditor remains responsible for the audit.
- Personal data (employee, proprietor, customer and vendor information) calls for privacy-by-design, least privilege, retention/deletion policy and secure backup. The DPDP Act, 2023 and 2025 Rules have staged commencement; check the Gazette schedule and current implementation date for each obligation rather than assuming every rule is already in force.
- Production security requirements: encrypted database and backups, authenticated roles, maker-checker where needed, least privilege, secure key recovery, tamper-evident audit events, backup/restore drills, signed releases, dependency inventory, crash recovery and a documented data export/deletion policy.

## 4. Proposed product scope

### Core bookkeeping

- Multiple companies and financial years (later phase); company settings for legal type, GSTIN/state, tax profile, accounting framework and fiscal year.
- Chart of accounts and party/item masters; voucher types for sales, purchase, receipt, payment, journal, credit/debit notes, stock adjustment and opening balances.
- Bill-wise receivables/payables, narration, attachments, numbering, recurring templates and audit events.
- Balanced double-entry posting with reversal/adjustment rather than silent deletion.

### Inventory and business operations

- Product/unit/HSN/GST rate, opening stock, purchases, sales, weighted-average/FIFO configuration, stock summary, reorder alert and stock ledger.
- Later: multiple godowns, batch/expiry, serials, purchase/sales orders, delivery challans, returns, job-work and BOM/manufacturing.

### GST/TDS/audit readiness

- GST sales/purchase summaries, tax split, input/output tax review, mismatch/reconciliation queue, due-date calendar and report exports.
- E-invoice/e-way-bill data preparation, validation and status fields; actual IRP/GSTN submission requires a separate certified integration and credentials.
- TDS/TCS configuration with dated legal rule packs, challan/statement tracking and transition support. No rates should ship as “current” without a dated official-source review.
- Audit log, attachments, period lock, backup/restore and audit-ready report pack.

### Offline AI and automation

For an offline app, “AI” must be precise about what is running locally. The MVP uses explainable rule-based checks, not an LLM: duplicate-looking documents, unusual amounts, overdue balances, low stock, missing tax identifiers, unbalanced books, and cash/expense trends. Each suggestion should show its evidence and a dismiss/mark-reviewed action.

Future optional local model: downloadable/open-weight inference with explicit model size, CPU/RAM requirements and user consent. Cloud LLMs, bank feeds, GSTN, email, WhatsApp and e-signature are opt-in integrations and are outside the offline core.

## 5. Prototype delivered in this repository

### Implemented in the current version

- `index.html` opens the self-contained app shell; CSS and ordered classic scripts are local files and require no bundler/CDN/network.
- Sample Indian stationery-company books; dashboard; voucher register and creation for sales, purchases, receipts, payments and journals.
- Balanced double-entry postings, basic intra/inter-state GST split, one inventory item per sales/purchase voucher, weighted-average stock movement, ledgers, stock summary, GST preview and Trial Balance / P&L / Balance Sheet reports.
- Local rule-based “AI desk” with explainable checks; search; local audit-event list; JSON backup/restore; CSV report export.
- Posts are immutable in the UI; corrections are intended to be made through reversal/adjustment rather than deleting a posted record.

### Explicitly not implemented / not production-ready

- No official GST portal, IRP, e-way bill, bank, MCA or income-tax API/file submission; no credential handling.
- No production tax engine, TDS/TCS rates, eligibility, returns, payroll, tax audit, depreciation, final accounts certification, Schedule III export, statutory filing, company-law checklist or CA audit sign-off.
- No multi-user/concurrent database, role-based access, encrypted local storage, operating-system key store, document vault, legally robust hash-chained audit log, or guaranteed archival retention.
- No genuine generative AI model is bundled; the MVP’s offline “AI” label means deterministic local analysis only.
- Demo company and transactions are fictional and should never be filed, printed as a real tax invoice or relied on for a real accounting decision.

## 6. Recommended technical architecture

### MVP (implemented)

- Static web app: `index.html` → `styles.css` + `src/data.js` + `src/engine.js` + `src/storage.js` + `src/app.js`.
- Classic `<script>` files (not ES modules) keep direct `file://` launch practical in browsers that block file-based module imports.
- LocalStorage JSON with a schema version; explicit JSON backup/restore; no external requests. Use numeric paise/integer minor units in production to avoid floating-point tax rounding drift; the demo rounds at display/posting boundaries and should be replaced with a decimal-money library or integer paise model before financial use.

### Production direction

1. Desktop shell (Tauri/Electron) with SQLite or equivalent transactional local database; keep UI assets bundled and offline.
2. Migration framework, integer-paise/decimal calculations, immutable voucher ledger, database constraints and deterministic GST/TDS rule-pack versioning.
3. Encrypted at-rest DB and backups, account roles, period lock, strong append-only/tamper-evident audit log and secure restore/recovery.
4. Official-format import/export + schema/version validation; sandbox integration tests and CA-reviewed legal rule updates.
5. Optional, explicit integrations and local AI model behind provider interfaces; offline mode remains the default.

## 7. Acceptance criteria for the first interactive prototype

- Double-clicking `index.html` loads the app with no network and no build step.
- A new sale/purchase updates vouchers, ledgers, GST preview, stock and financial reports consistently.
- Every posted voucher balances; invalid dates/amounts/stock quantities are rejected with a clear reason.
- Refresh preserves data; backup export and restore round-trip the workspace.
- Demo AI findings name the underlying transaction/ledger and do not claim tax-law certainty.
- Statutory widgets are labelled “review/preview,” not “filed/compliant.”

## 8. Research sources (official/vendor/professional, accessed 30 Sep 2026)

### Product references

- Tally Solutions, [TallyPrime Release 7.1 notes](https://help.tallysolutions.com/release-notes-tallyprime-7-1/).
- BUSY, [Accounting software / product capability overview](https://busy.in/accounting-software/), [BUSY Smart](https://busy.in/smart/) and [BUSY Standard](https://busy.in/standard/). Plan/edition scope varies.

### GST and company law

- GST Portal, [GSTR-1 FAQ](https://tutorial.gst.gov.in/userguide/returns/GSTR_1.htm) and [GSTR-3B FAQ](https://tutorial.gst.gov.in/userguide/returns/GSTR3B.htm).
- CBIC, [Tax invoice / credit and debit note rules](https://cbic-gst.gov.in/gst-invoice-rules.html), [CGST Rules: accounts and electronic records](https://cbic-gst.gov.in/pdf/cgst-rules-30122017.pdf), [accounts and records rules](https://cbic-gst.gov.in/aces/Documents/accounts-and-records-rules.pdf) and [GST e-way bill FAQs](https://docs.ewaybillgst.gov.in/html/faq.html).
- GSTN/IRP, [e-invoice reporting time limit for AATO ₹10 crore and above](https://einvoice6.gst.gov.in/content/revised-time-limit-for-e-invoice-reporting-for-businesses-with-aato-of-%E2%82%B910-crores-above/) and [GSTN e-invoice overview](https://tutorial.gst.gov.in/downloads/news/e_invoice_overview.pdf).
- Ministry of Corporate Affairs, [Companies Act, 2013](https://www.mca.gov.in/content/dam/mca/pdf/CompaniesAct2013.pdf), [Companies (Audit and Auditors) Amendment Rules, 2021](https://www.mca.gov.in/bin/ebook/dms/getdocument?doc=MTM0ODY%3D&amp=&docCategory=Notifications&amp=&type=open), and [MCA Schedule III notification](https://www.mca.gov.in/Ministry/pdf/NotificationScheduleIII_12102018.pdf).

### Income tax, audit and privacy

- Income Tax Department, [TDS compliance and the 2026 transition](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/tds-compliance), [tax payment/TDS FAQs under the 2025 Act](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/tax-payments) and [Forms/filing help](https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/).
- ICAI, [Standards on Auditing index](https://www.icai.org/post/5066) and [ICAI Chartered Accountant Journal: SA 230 audit documentation](https://cajournal.icai.org/article-details/audit-documentation-a-cornerstone-of-audit-quality).
- MeitY, [Digital Personal Data Protection Rules, 2025 Gazette notification](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf) and [DPDP Act and framework](https://www.meity.gov.in/data-protection-framework).

**Research maintenance rule:** revisit official notifications and portal advisories before each release and before any customer relies on statutory outputs. Web pages can be amended; this document is a dated research snapshot, not an assertion that every rule here is complete or unchanged.
