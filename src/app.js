/* Browser UI for Sutra Books. All user data stays in this page's local browser storage. */
(function () {
  "use strict";

  const Engine = window.SutraEngine;
  const Storage = window.SutraStorage;
  let data = Storage.load();
  let route = "dashboard";
  let period = getDefaultPeriod();
  let reportTab = "pnl";
  let voucherFilter = "All";
  let voucherQuery = "";
  let ledgerQuery = "";
  let aiMessages = [{ role: "assistant", text: "I can review the books stored in this browser. Ask about sales, cash, stock, receivables, GST preview or the trial balance. I use local rules only; I do not contact a cloud AI or file returns.", time: "Just now" }];

  const pageMeta = {
    dashboard: ["Overview", "Your books, in one clear view", "Overview", "A calm, current view of this company’s books."],
    vouchers: ["Vouchers", "Transactions and posting history", "Books", "Review posted sales, purchases, receipts, payments and journals."],
    ledgers: ["Ledgers", "Accounts and party balances", "Books", "See the chart of accounts and the balance of every ledger."],
    inventory: ["Inventory", "Stock on hand and valuation", "Operations", "Track quantities, weighted-average cost and reorder points."],
    gst: ["GST & TDS", "Tax summaries and review calendar", "Operations", "A local books preview for review — not a portal filing or compliance sign-off."],
    reports: ["Reports", "Financial statements and books", "Insights", "Statements calculated from the posted double-entry vouchers."],
    ai: ["Sutra Assist", "Local checks, clear explanations", "Insights", "A rules-based assistant that works from this browser’s books."],
    settings: ["Settings & data", "Company profile, backups and traceability", "Workspace", "Manage the local workspace and protect your own backup copy."]
  };

  const NAV_GROUPS = [
    { label: "HOME", links: [{ id: "dashboard", label: "Overview", icon: "home" }] },
    { label: "BOOKS", links: [{ id: "vouchers", label: "Vouchers", icon: "receipt" }, { id: "ledgers", label: "Ledgers", icon: "ledger" }] },
    { label: "OPERATIONS", links: [{ id: "inventory", label: "Inventory", icon: "inventory" }, { id: "gst", label: "GST & TDS", icon: "tax" }] },
    { label: "INSIGHTS", links: [{ id: "reports", label: "Reports", icon: "chart" }, { id: "ai", label: "Sutra Assist", icon: "spark" }] }
  ];

  const ICONS = {
    home: '<svg viewBox="0 0 24 24"><path d="m3.5 10 8.5-7 8.5 7v10.5H14v-6H9v6H3.5z"/></svg>',
    receipt: '<svg viewBox="0 0 24 24"><path d="M6 3.5h12v17l-2.2-1.4-2.1 1.4-2.2-1.4-2.2 1.4L7.1 19 6 20.5z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
    ledger: '<svg viewBox="0 0 24 24"><path d="M5 4.5h14v15H5z"/><path d="M9 4.5v15M12 8h4M12 12h4M12 16h4"/></svg>',
    inventory: '<svg viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4.3 7.6 7.7 4.3 7.7-4.3M12 12v9M8 5.2l8 4.5"/></svg>',
    tax: '<svg viewBox="0 0 24 24"><path d="M4 5.5h16v13H4z"/><path d="M8 9h8M8 12h4M8 15h6"/><circle cx="17" cy="15" r="2"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M4 19.5V4.5M4 19.5h16"/><path d="m7 15 3.2-4 3 2.2 5.3-6.2"/><circle cx="7" cy="15" r=".8"/><circle cx="10.2" cy="11" r=".8"/><circle cx="13.2" cy="13.2" r=".8"/><circle cx="18.5" cy="7" r=".8"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="m12 2.8 1.8 6.4 6.4 1.8-6.4 1.8-1.8 6.4-1.8-6.4-6.4-1.8 6.4-1.8z"/><path d="m19.5 15.5.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/></svg>',
    cash: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M8 14h2M16 14h.1"/></svg>',
    bank: '<svg viewBox="0 0 24 24"><path d="m3 9 9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18M2.5 9h19"/></svg>',
    users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.3"/><path d="M3 20v-1.2a6 6 0 0 1 12 0V20z"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6.2M18 14.5a4.4 4.4 0 0 1 3 4.2V20h-3"/></svg>',
    box: '<svg viewBox="0 0 24 24"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3.4 7.8 12 12l8.6-4.2M12 12v9"/></svg>',
    file: '<svg viewBox="0 0 24 24"><path d="M6 3.5h8l4 4V20H6z"/><path d="M14 3.5v4h4M9 12h6M9 16h6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M4 12h15M13 5l7 7-7 7"/></svg>'
  };

  function localDateISO(date) {
    const current = date || new Date();
    const tzOffset = current.getTimezoneOffset() * 60000;
    return new Date(current.getTime() - tzOffset).toISOString().slice(0, 10);
  }

  function getDefaultPeriod() {
    const today = localDateISO();
    const date = new Date(`${today}T12:00:00`);
    const startYear = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
    const start = `${startYear}-04-01`;
    const latestVoucher = (window.SutraDemo.vouchers || []).reduce((latest, voucher) => voucher.date > latest ? voucher.date : latest, start);
    const end = today < start ? latestVoucher : today;
    return { start, end: end < start ? start : end };
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }

  function money(value) {
    const amount = Number(value || 0);
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  }

  function compactMoney(value) {
    const amount = Number(value || 0);
    const abs = Math.abs(amount);
    if (abs >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (abs >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (abs >= 1000) return `₹${(amount / 1000).toFixed(0)}k`;
    return `₹${Math.round(amount)}`;
  }

  function number(value, digits) {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits == null ? 0 : digits, minimumFractionDigits: digits == null ? 0 : digits }).format(Number(value || 0));
  }

  function dateLabel(iso, options) {
    if (!iso || !Engine.validIsoDate(iso)) return "—";
    return new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", options || { day: "2-digit", month: "short", year: "numeric" });
  }

  function fiscalYearLabel(dateIso) {
    const date = new Date(`${dateIso}T12:00:00`);
    const first = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
    return `FY ${first}–${String(first + 1).slice(-2)}`;
  }

  function selectedPeriodLabel() {
    if (period.start === Engine.getFiscalYearStart(period.end)) return fiscalYearLabel(period.end);
    return `${dateLabel(period.start, { day: "2-digit", month: "short" })} – ${dateLabel(period.end, { day: "2-digit", month: "short", year: "numeric" })}`;
  }

  function icon(name) { return ICONS[name] || ICONS.file; }

  function getPartyName(partyId) {
    const party = Engine.findParty(data, partyId);
    return party ? party.name : "—";
  }

  function getLedgerName(ledgerId) {
    const ledger = Engine.findLedger(data, ledgerId);
    return ledger ? ledger.name : "Unknown ledger";
  }

  function getPartyBalances(asOf) {
    const balances = { receivables: 0, payables: 0, byParty: new Map() };
    (data.parties || []).forEach(party => {
      const ledger = Engine.findLedger(data, party.ledgerId);
      if (!ledger) return;
      const net = Engine.getLedgerNet(data, ledger.id, asOf).net;
      const open = ledger.nature === "asset" ? net : -net;
      balances.byParty.set(party.id, open);
      if (party.role === "customer") balances.receivables += open;
      if (party.role === "supplier") balances.payables += open;
    });
    balances.receivables = Engine.round2(balances.receivables);
    balances.payables = Engine.round2(balances.payables);
    return balances;
  }

  function normalLedgerBalance(ledger, asOf) {
    return Engine.naturalBalance(ledger, Engine.getLedgerNet(data, ledger.id, asOf).net);
  }

  function sortVouchersNewest(list) {
    return list.slice().sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number));
  }

  function voucherTypeClass(type) {
    return ({ Sales: "pill-green", Purchase: "pill-blue", Receipt: "pill-green", Payment: "pill-amber", Journal: "pill-neutral", Opening: "pill-neutral" })[type] || "pill-neutral";
  }

  function typePill(type) {
    return `<span class="pill ${voucherTypeClass(type)}"><span class="pill-dot"></span>${esc(type)}</span>`;
  }

  function pageHead(eyebrow, title, description, actions) {
    return `<div class="page-head"><div class="page-head-copy"><p class="eyebrow"><span class="eyebrow-mark"></span>${esc(eyebrow)}</p><h1>${esc(title)}</h1><p class="page-description">${esc(description)}</p></div><div class="page-head-actions">${actions || ""}</div></div>`;
  }

  function sampleBanner() {
    if (!(data.settings && data.settings.sampleWorkspace)) return "";
    return `<div class="sample-strip"><span class="sample-mark">ⓘ</span><p><strong>Fictional sample books.</strong> These figures, names and GST labels are for product demonstration only — do not issue as an invoice, file returns or rely on them for a real decision. Use Settings → Create blank workspace to start clean.</p></div>`;
  }

  function updateShell() {
    const meta = pageMeta[route] || pageMeta.dashboard;
    document.getElementById("breadcrumb-current").textContent = meta[0];
    document.getElementById("topbar-subtitle").textContent = meta[1];
    document.getElementById("period-label").textContent = selectedPeriodLabel();
    document.getElementById("sidebar-company-name").textContent = data.company.name || "Untitled company";
    const status = Storage.getStatus();
    document.getElementById("footer-storage").textContent = status.label;
    document.getElementById("main-nav").innerHTML = NAV_GROUPS.map(group => `<div class="nav-section-label">${esc(group.label)}</div>${group.links.map(link => `<button class="nav-item ${route === link.id ? "active" : ""}" type="button" data-route="${link.id}"><span class="nav-icon" aria-hidden="true">${icon(link.icon)}</span><span>${esc(link.label)}</span>${link.id === "ai" ? `<span class="nav-count">local</span>` : ""}</button>`).join("")}`).join("");
    document.querySelector(".nav-settings").classList.toggle("active", route === "settings");
  }

  function render() {
    updateShell();
    const target = document.getElementById("page-content");
    const renderers = {
      dashboard: renderDashboard,
      vouchers: renderVouchers,
      ledgers: renderLedgers,
      inventory: renderInventory,
      gst: renderGst,
      reports: renderReports,
      ai: renderAIDesk,
      settings: renderSettings
    };
    target.innerHTML = (renderers[route] || renderDashboard)();
  }

  function renderDashboard() {
    const pnl = Engine.getProfitAndLoss(data, period.start, period.end);
    const partyBalances = getPartyBalances(period.end);
    const cash = normalLedgerBalance(Engine.findLedger(data, "cash"), period.end);
    const bank = normalLedgerBalance(Engine.findLedger(data, "bank"), period.end);
    const cashBank = Engine.round2(cash + bank);
    const sales = Engine.getLedgerActivity(data, "sales", period.start, period.end).credit - Engine.getLedgerActivity(data, "sales", period.start, period.end).debit;
    const findings = Engine.assessBooks(data, period.end);
    const highlight = findings.find(row => row.level === "watch" || row.level === "critical") || findings[0];
    const recent = sortVouchersNewest(data.vouchers.filter(voucher => voucher.type !== "Opening" && voucher.date <= period.end)).slice(0, 6);
    const series = Engine.getMonthlySeries(data, period.start, period.end);
    const maxChart = Math.max(1, ...series.flatMap(item => [item.income, item.expenses]));
    const firstName = "Riya";
    const dashboardActions = `<button class="button button-secondary" type="button" data-action="open-voucher" data-type="Receipt">＋ Receipt</button><button class="button button-primary" type="button" data-action="open-voucher" data-type="Sales"><span class="plus">＋</span>New sale</button>`;
    return `${pageHead("COMPANY BOOKS · ${fiscalYearLabel(period.end)}", `Good morning, ${firstName}`, `Here’s the pulse of ${data.company.name || "your company"} from ${dateLabel(period.start)} to ${dateLabel(period.end)}.`, dashboardActions)}
      ${sampleBanner()}
      <section class="kpi-grid" aria-label="Key balances">
        <article class="kpi-card"><div class="kpi-top"><span class="kpi-label">Cash & bank</span><span class="kpi-icon">${icon("bank")}</span></div><div class="kpi-value">${money(cashBank)}</div><div class="kpi-note">${money(cash)} cash <span>·</span> ${money(bank)} bank</div></article>
        <article class="kpi-card"><div class="kpi-top"><span class="kpi-label">Sales this period</span><span class="kpi-icon blue">${icon("chart")}</span></div><div class="kpi-value">${money(sales)}</div><div class="kpi-note"><span class="positive">${data.vouchers.filter(voucher => voucher.type === "Sales" && voucher.date >= period.start && voucher.date <= period.end).length} invoices</span> posted in selected dates</div></article>
        <article class="kpi-card"><div class="kpi-top"><span class="kpi-label">Receivables</span><span class="kpi-icon amber">${icon("users")}</span></div><div class="kpi-value">${money(partyBalances.receivables)}</div><div class="kpi-note">Customer ledger balances at ${dateLabel(period.end, { day: "2-digit", month: "short" })}</div></article>
        <article class="kpi-card"><div class="kpi-top"><span class="kpi-label">Payables</span><span class="kpi-icon slate">${icon("file")}</span></div><div class="kpi-value">${money(partyBalances.payables)}</div><div class="kpi-note">Supplier ledger balances at ${dateLabel(period.end, { day: "2-digit", month: "short" })}</div></article>
      </section>
      <section class="dashboard-grid">
        <article class="card chart-card card-pad">
          <div class="card-head"><div><h2 class="card-title">Income & operating costs</h2><p class="card-subtitle">Month-by-month view · ${esc(selectedPeriodLabel())}</p></div><div class="chart-legend"><span><i class="legend-dot sales"></i>Income</span><span><i class="legend-dot expenses"></i>Costs</span></div></div>
          <div class="chart-area"><div class="chart-y-labels"><span>${esc(compactMoney(maxChart))}</span><span>${esc(compactMoney(maxChart * .66))}</span><span>${esc(compactMoney(maxChart * .33))}</span><span>₹0</span></div><div class="chart-grid-lines"><i></i><i></i><i></i><i></i></div><div class="month-columns">${series.map(item => `<div class="month-column"><div class="month-bars" title="${esc(item.label)} · Income ${esc(money(item.income))} · Costs ${esc(money(item.expenses))}"><span class="chart-bar sales" style="height:${Math.max(2, item.income / maxChart * 100)}%"></span><span class="chart-bar expenses" style="height:${Math.max(2, item.expenses / maxChart * 100)}%"></span></div><span class="month-label">${esc(item.label)}</span></div>`).join("")}</div></div>
          <div class="chart-footnote"><span>Figures are from posted ledger activity.</span><button class="card-action" type="button" data-route="reports">Open reports →</button></div>
        </article>
        <article class="ai-highlight"><span class="ai-tag"><span class="spark-mark">✦</span> Sutra Assist · local rules</span><h2>${esc(highlight ? highlight.title : "Your books are in view")}</h2><p>${esc(highlight ? highlight.detail : "Ask a question or run a local book check for an explainable summary.")}</p><button class="button" type="button" data-route="ai">Review local insights <span aria-hidden="true">→</span></button></article>
      </section>
      <section class="dashboard-lower">
        <article class="card activity-card"><div class="card-pad"><div class="card-head"><div><h2 class="card-title">Recent activity</h2><p class="card-subtitle">Latest posted vouchers in this workspace</p></div><button class="card-action" type="button" data-route="vouchers">View all vouchers →</button></div></div>${recent.length ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Type & number</th><th>Party / note</th><th class="table-right">Amount</th></tr></thead><tbody>${recent.map(voucher => `<tr><td>${dateLabel(voucher.date, { day: "2-digit", month: "short" })}</td><td>${typePill(voucher.type)}<span class="row-sub"><button class="voucher-link" data-action="voucher-detail" data-id="${esc(voucher.id)}" type="button">${esc(voucher.number)}</button></span></td><td><span class="row-main">${esc(voucher.partyId ? getPartyName(voucher.partyId) : (voucher.narration || "—"))}</span><span class="row-sub">${esc(voucher.narration || "")}</span></td><td class="amount-cell">${money(voucher.total)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No vouchers in this date range yet.</div>`}</article>
        <article class="card compliance-card"><div class="card-pad"><div class="card-head"><div><h2 class="card-title">Next compliance dates</h2><p class="card-subtitle">Indicative statutory calendar · review before action</p></div><span class="pill pill-amber">Preview</span></div>
          ${renderComplianceRows()}
          <p class="compliance-foot">Dates shown are general rules only. Government notifications, State/UT, taxpayer scheme and portal status can change a due date.</p>
        </div></article>
      </section>`;
  }

  function dueDateAfter(periodEnd, day) {
    const date = new Date(`${periodEnd}T12:00:00`);
    date.setDate(1);
    date.setMonth(date.getMonth() + 1);
    date.setDate(day);
    return localDateISO(date);
  }

  function renderComplianceRows() {
    const quarterly = String(data.company.gstFrequency || "Monthly").toLowerCase() === "quarterly";
    const gst1Day = quarterly ? 13 : 11;
    const qrmpDay22States = new Set(["22", "23", "24", "25", "26", "27", "29", "30", "31", "32", "33", "34", "35", "36", "37", "97"]);
    const gst3Day = quarterly ? (qrmpDay22States.has(String(data.company.stateCode)) ? 22 : 24) : 20;
    const gst1Due = dueDateAfter(period.end, gst1Day);
    const gst3Due = dueDateAfter(period.end, gst3Day);
    const labelPeriod = quarterly ? "Quarterly GST return" : "Monthly GST return";
    return `<div class="compliance-row"><span class="compliance-icon">▦</span><div class="compliance-copy"><strong>GSTR-1 review</strong><span>${esc(labelPeriod)} · outward supplies preview</span></div><div class="compliance-date">${dateLabel(gst1Due, { day: "2-digit", month: "short" })}<small>Indicative</small></div></div>
      <div class="compliance-row"><span class="compliance-icon">₹</span><div class="compliance-copy"><strong>GSTR-3B review</strong><span>Liability / ITC check · not filed</span></div><div class="compliance-date">${dateLabel(gst3Due, { day: "2-digit", month: "short" })}<small>Indicative</small></div></div>
      <div class="compliance-row"><span class="compliance-icon">⌕</span><div class="compliance-copy"><strong>TDS rule setup</strong><span>Act/section profile needs review</span></div><div class="compliance-date">Review<small>Not calculated</small></div></div>`;
  }

  function getVoucherRows() {
    return sortVouchersNewest(data.vouchers.filter(voucher => voucher.type !== "Opening" && voucher.date >= period.start && voucher.date <= period.end))
      .filter(voucher => voucherFilter === "All" || voucher.type === voucherFilter)
      .filter(voucher => {
        if (!voucherQuery.trim()) return true;
        const query = voucherQuery.trim().toLowerCase();
        return [voucher.number, voucher.type, voucher.narration, voucher.reference, voucher.itemName, getPartyName(voucher.partyId)].some(text => String(text || "").toLowerCase().includes(query));
      });
  }

  function renderVoucherTableRows(list) {
    const body = document.getElementById("voucher-table-body");
    const footer = document.getElementById("voucher-table-footer");
    if (!body || !footer) return;
    if (!list.length) {
      body.innerHTML = `<tr><td colspan="7"><div class="empty-state"><span class="empty-illustration">▤</span><strong>No matching vouchers</strong>Try another filter, or create a new voucher.</div></td></tr>`;
    } else {
      body.innerHTML = list.map(voucher => `<tr>
        <td>${dateLabel(voucher.date, { day: "2-digit", month: "short", year: "numeric" })}</td>
        <td>${typePill(voucher.type)}</td>
        <td><button class="voucher-link" type="button" data-action="voucher-detail" data-id="${esc(voucher.id)}">${esc(voucher.number)}</button><span class="row-sub">${esc(voucher.reference || "No external reference")}</span></td>
        <td><span class="row-main">${esc(getPartyName(voucher.partyId))}</span><span class="row-sub">${esc(voucher.narration || "")}</span></td>
        <td>${voucher.tax ? `<span class="row-main">${esc(voucher.taxType || "GST")}</span><span class="row-sub">${money(voucher.tax)}</span>` : `<span class="row-sub">—</span>`}</td>
        <td><span class="pill pill-green"><span class="pill-dot"></span>Posted</span></td>
        <td class="amount-cell">${money(voucher.total)}</td>
      </tr>`).join("");
    }
    footer.innerHTML = `<span><strong>${list.length}</strong> voucher${list.length === 1 ? "" : "s"} · ${esc(dateLabel(period.start, { day: "2-digit", month: "short" }))}–${esc(dateLabel(period.end, { day: "2-digit", month: "short", year: "numeric" }))}</span><span>Posted total <strong>${money(Engine.sum(list.map(voucher => voucher.total)))}</strong></span>`;
  }

  function renderVouchers() {
    const actions = `<button class="button button-secondary" type="button" data-action="export-vouchers">↓ Export CSV</button><button class="button button-primary" type="button" data-action="open-voucher" data-type="Sales"><span class="plus">＋</span>New voucher</button>`;
    const options = ["All", "Sales", "Purchase", "Receipt", "Payment", "Journal"];
    const page = `${pageHead("BOOKS", "Vouchers", "Your posting register. Posted entries are kept in the book; correct an error with an adjusting or reversal entry.", actions)}
      ${sampleBanner()}
      <div class="toolbar"><label class="search-control"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg><input id="voucher-search-input" class="input-control" type="search" placeholder="Search number, party or narration…" value="${esc(voucherQuery)}" aria-label="Search vouchers"></label><span class="toolbar-spacer"></span><label class="visually-hidden" for="voucher-type-filter">Filter voucher type</label><select id="voucher-type-filter" class="filter-select">${options.map(option => `<option value="${esc(option)}" ${voucherFilter === option ? "selected" : ""}>${option === "All" ? "All types" : esc(option)}</option>`).join("")}</select><button class="button button-secondary button-small" type="button" data-action="open-voucher" data-type="Receipt">＋ Receipt</button></div>
      <article class="card table-card"><div class="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Voucher no.</th><th>Party / narration</th><th>Tax</th><th>Status</th><th class="table-right">Total</th></tr></thead><tbody id="voucher-table-body"></tbody></table></div><div class="table-footer" id="voucher-table-footer"></div></article>`;
    requestAnimationFrame(() => renderVoucherTableRows(getVoucherRows()));
    return page;
  }

  function renderLedgers() {
    const rows = data.ledgers.map(ledger => {
      const amount = normalLedgerBalance(ledger, period.end);
      return { ledger, amount };
    }).filter(row => {
      if (!ledgerQuery.trim()) return true;
      const query = ledgerQuery.trim().toLowerCase();
      const party = row.ledger.partyId ? Engine.findParty(data, row.ledger.partyId) : null;
      return [row.ledger.name, row.ledger.group, row.ledger.nature, party && party.gstin].some(value => String(value || "").toLowerCase().includes(query));
    }).sort((a, b) => a.ledger.name.localeCompare(b.ledger.name));
    const rowsHTML = rows.length ? rows.map(row => {
      const ledger = row.ledger;
      const party = ledger.partyId ? Engine.findParty(data, ledger.partyId) : null;
      const balanceSide = row.amount < 0 ? (ledger.nature === "asset" || ledger.nature === "expense" ? "Cr" : "Dr") : (ledger.nature === "asset" || ledger.nature === "expense" ? "Dr" : "Cr");
      return `<tr><td><span class="row-main">${esc(ledger.name)}</span><span class="row-sub">${esc(ledger.group)}</span></td><td>${party ? `<span class="pill ${party.role === "customer" ? "pill-blue" : "pill-amber"}">${esc(party.role)}</span>` : `<span class="pill pill-neutral">${esc(ledger.nature)}</span>`}</td><td>${party ? `<span class="row-main">${esc(party.state || "—")}</span><span class="row-sub">${esc(party.gstin || "GSTIN not added")}</span>` : `<span class="row-sub">${ledger.system ? "System account" : "User account"}</span>`}</td><td class="amount-cell">${money(Math.abs(row.amount))}<span class="row-sub">${balanceSide} balance</span></td></tr>`;
    }).join("") : `<tr><td colspan="4"><div class="empty-state"><span class="empty-illustration">▥</span><strong>No matching ledgers</strong>Create an account or a party to get started.</div></td></tr>`;
    const actions = `<button class="button button-secondary" type="button" data-action="open-party">＋ Add party</button><button class="button button-primary" type="button" data-action="open-ledger"><span class="plus">＋</span>New account</button>`;
    return `${pageHead("BOOKS", "Ledgers & parties", "One place for accounts, customers and suppliers. Balances are derived from posted entries.", actions)}${sampleBanner()}
      <div class="toolbar"><label class="search-control"><svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg><input class="input-control" id="ledger-search-input" type="search" placeholder="Search name, group or GSTIN…" value="${esc(ledgerQuery)}"></label><span class="toolbar-spacer"></span><span class="pill pill-neutral">${data.ledgers.length} accounts</span><span class="pill pill-blue">${data.parties.length} parties</span></div>
      <article class="card table-card"><div class="table-wrap"><table><thead><tr><th>Account / ledger</th><th>Nature</th><th>Party details</th><th class="table-right">Balance at ${dateLabel(period.end, { day: "2-digit", month: "short" })}</th></tr></thead><tbody id="ledger-table-body">${rowsHTML}</tbody></table></div><div class="table-footer"><span>Balances are calculated from all posted vouchers up to the selected end date.</span><span><strong>${rows.length}</strong> shown</span></div></article>`;
  }

  function renderInventory() {
    const balances = Engine.getStockBalances(data, period.end);
    const rows = (data.items || []).map(item => ({ item, balance: balances.get(item.id) || { quantity: 0, value: 0, averageCost: 0 } })).sort((a, b) => a.item.name.localeCompare(b.item.name));
    const totalValue = Engine.sum(rows.map(row => row.balance.value));
    const low = rows.filter(row => Number(row.item.reorderLevel || 0) > 0 && row.balance.quantity <= Number(row.item.reorderLevel));
    const tableRows = rows.length ? rows.map(row => {
      const { item, balance } = row;
      const isLow = Number(item.reorderLevel || 0) > 0 && balance.quantity <= Number(item.reorderLevel);
      const fill = item.reorderLevel ? Math.min(100, Math.round(balance.quantity / (item.reorderLevel * 1.6) * 100)) : 50;
      return `<tr><td><span class="row-main">${esc(item.name)}</span><span class="row-sub">${esc(item.unit)} · ${esc(item.id)}</span></td><td>${esc(item.hsn || "—")}</td><td>${number(item.gstRate, 2)}%</td><td class="amount-cell">${number(balance.quantity, 2)} <span class="row-sub">${esc(item.unit)}</span></td><td class="amount-cell">${money(balance.averageCost)}</td><td class="amount-cell">${money(balance.value)}</td><td><span class="row-main">${isLow ? `<span class="pill pill-amber">Reorder</span>` : `<span class="pill pill-green">In range</span>`}</span><div style="width:76px;height:4px;margin-top:6px;border-radius:8px;background:#eef1f2;overflow:hidden"><span style="display:block;width:${fill}%;height:100%;border-radius:8px;background:${isLow ? "#c28b42" : "#6ca48b"}"></span></div></td></tr>`;
    }).join("") : `<tr><td colspan="7"><div class="empty-state"><span class="empty-illustration">◫</span><strong>No stock items yet</strong>Add a product and receive stock using a purchase voucher.</div></td></tr>`;
    const actions = `<button class="button button-secondary" type="button" data-action="export-stock">↓ Export stock</button><button class="button button-primary" type="button" data-action="open-item"><span class="plus">＋</span>New item</button>`;
    return `${pageHead("OPERATIONS", "Inventory", "Quantities and value are based on opening stock plus posted purchase/sales movements. Costing: moving weighted average.", actions)}${sampleBanner()}
      <section class="gst-summary-grid"><div class="gst-card"><span>Stock value in item register</span><strong>${money(totalValue)}</strong><small>at ${dateLabel(period.end)}</small></div><div class="gst-card"><span>Items tracked</span><strong>${number(rows.length)}</strong><small>Inventory masters</small></div><div class="gst-card"><span>Below reorder point</span><strong>${number(low.length)}</strong><small>Local stock alert</small></div><div class="gst-card"><span>Inventory ledger</span><strong>${money(normalLedgerBalance(Engine.findLedger(data, "inventory"), period.end))}</strong><small>Check against valuation</small></div></section>
      ${Math.abs(totalValue - normalLedgerBalance(Engine.findLedger(data, "inventory"), period.end)) > 1 ? `<div class="notice info" style="margin-bottom:12px"><span class="notice-icon">ⓘ</span><span>Stock valuation and the Inventory on Hand ledger differ. Review opening stock, journals and inventory-linked vouchers before relying on the balance.</span></div>` : ""}
      <div class="toolbar"><span class="pill pill-green"><span class="pill-dot"></span>Weighted-average demo costing</span><span class="toolbar-spacer"></span><span class="row-sub">As at ${dateLabel(period.end)}</span></div>
      <article class="card table-card"><div class="table-wrap"><table><thead><tr><th>Item</th><th>HSN</th><th>GST rate</th><th class="table-right">On hand</th><th class="table-right">Avg. cost</th><th class="table-right">Stock value</th><th>Reorder status</th></tr></thead><tbody>${tableRows}</tbody></table></div><div class="table-footer"><span><strong>${low.length}</strong> item${low.length === 1 ? "" : "s"} at/below reorder point</span><span>Tax rates/HSN are sample master data — verify before use</span></div></article>`;
  }

  function renderGst() {
    const gst = Engine.getTaxSummary(data, period.start, period.end);
    const netTone = gst.provisionalNet > 0 ? "pill-amber" : "pill-green";
    const actions = `<button class="button button-secondary" type="button" data-action="export-gst">↓ Export preview</button><button class="button button-primary" type="button" data-route="reports" data-report-tab="gst">Review GST report <span aria-hidden="true">→</span></button>`;
    const transactions = sortVouchersNewest(data.vouchers.filter(voucher => ["Sales", "Purchase"].includes(voucher.type) && voucher.date >= period.start && voucher.date <= period.end)).slice(0, 8);
    return `${pageHead("OPERATIONS", "GST & TDS", "Books-side review for the selected period. No portal, IRP, GSTN or income-tax filing occurs in this offline prototype.", actions)}${sampleBanner()}
      <div class="notice" style="margin-bottom:14px"><span class="notice-icon">ⓘ</span><span><strong>Preview only.</strong> These totals come from demo book postings. They are not a filed return, eligible ITC decision, tax liability confirmation or compliance opinion. Reconcile with portal data and current notifications before filing.</span></div>
      <section class="gst-summary-grid"><div class="gst-card"><span>Outward taxable value</span><strong>${money(gst.salesTaxable)}</strong><small>${gst.salesCount} sales vouchers · ${esc(selectedPeriodLabel())}</small></div><div class="gst-card"><span>Output tax in books</span><strong>${money(gst.output.total)}</strong><small>CGST ${money(gst.output.cgst)} · SGST ${money(gst.output.sgst)} · IGST ${money(gst.output.igst)}</small></div><div class="gst-card"><span>Input tax booked</span><strong>${money(gst.input.total)}</strong><small>Not validated against GSTR-2B/IMS</small></div><div class="gst-card"><span>Provisional net tax</span><strong>${money(gst.provisionalNet)}</strong><small><span class="pill ${netTone}">${gst.provisionalNet >= 0 ? "Output less input" : "Input exceeds output"}</span></small></div></section>
      <div class="two-col"><article class="card card-pad"><div class="card-head"><div><h2 class="card-title">GST document review</h2><p class="card-subtitle">Outward and inward books entries by voucher</p></div><span class="pill pill-neutral">${transactions.length} recent</span></div><div class="table-wrap" style="margin-top:11px"><table><thead><tr><th>Date</th><th>Type / party</th><th>Tax treatment</th><th class="table-right">Tax</th><th class="table-right">Invoice</th></tr></thead><tbody>${transactions.length ? transactions.map(voucher => `<tr><td>${dateLabel(voucher.date, { day: "2-digit", month: "short" })}</td><td>${typePill(voucher.type)}<span class="row-sub">${esc(getPartyName(voucher.partyId))} · ${esc(voucher.number)}</span></td><td><span class="row-main">${esc(voucher.taxType || "—")}</span><span class="row-sub">${number(voucher.gstRate, 2)}% · ${voucher.itemId ? esc(Engine.findItem(data, voucher.itemId)?.hsn || "HSN missing") : ""}</span></td><td class="amount-cell">${money(voucher.tax)}</td><td class="amount-cell">${money(voucher.total)}</td></tr>`).join("") : `<tr><td colspan="5"><div class="empty-state">No GST vouchers in this period.</div></td></tr>`}</tbody></table></div><div class="table-footer"><span>Recent entries; use vouchers/reports for the complete period.</span><button class="card-action" type="button" data-route="vouchers">Open register →</button></div></article>
        <div><article class="card card-pad"><div class="card-head"><div><h2 class="card-title">Return preparation</h2><p class="card-subtitle">General due-date rule · verify GST Portal</p></div></div>${renderComplianceRows()}<div class="notice info" style="margin-top:10px"><span class="notice-icon">↗</span><span>GST dates may be changed by notification. Log in to the GST Portal to confirm actual due dates, filing frequency and portal status.</span></div></article>
          <article class="card card-pad" style="margin-top:13px"><div class="card-head"><div><h2 class="card-title">TDS / TCS profile</h2><p class="card-subtitle">Income-tax Act 2025 transition matters</p></div><span class="pill pill-amber">Setup required</span></div><p style="margin:12px 0 10px;color:#87949d;font-size:9px;line-height:1.6">The prototype does not calculate or deduct TDS/TCS. For events from 1 April 2026, verify the applicable Income-tax Act, 2025 section/table item and form; pre-transition events may continue under the 1961 Act.</p><button type="button" class="button button-secondary button-small" data-route="settings">Review workspace setup →</button></article></div></div>`;
  }

  function renderReports() {
    const tabs = [
      ["pnl", "Profit & Loss"], ["bs", "Balance Sheet"], ["tb", "Trial Balance"], ["gst", "GST Summary"], ["stock", "Stock Summary"]
    ];
    let body = "";
    if (reportTab === "pnl") body = renderProfitAndLossReport();
    else if (reportTab === "bs") body = renderBalanceSheetReport();
    else if (reportTab === "tb") body = renderTrialBalanceReport();
    else if (reportTab === "gst") body = renderGstReport();
    else body = renderStockReport();
    return `${pageHead("INSIGHTS", "Reports", "Books-based statements. Verify policy, closing adjustments and entity-specific presentation before issuing financial statements.", `<button class="button button-secondary" type="button" data-action="export-report">↓ Export CSV</button>`)}${sampleBanner()}
      <div class="toolbar"><div class="reports-tabs" role="tablist" aria-label="Financial reports">${tabs.map(([id, label]) => `<button type="button" class="report-tab ${reportTab === id ? "active" : ""}" role="tab" aria-selected="${reportTab === id}" data-report-tab="${id}">${label}</button>`).join("")}</div><span class="toolbar-spacer"></span><span class="pill pill-neutral">${reportTab === "bs" || reportTab === "tb" || reportTab === "stock" ? `As at ${dateLabel(period.end)}` : `${dateLabel(period.start)}–${dateLabel(period.end)}`}</span></div>
      ${body}`;
  }

  function reportHero(title, sub, amount) {
    return `<div class="report-hero"><div><strong>${esc(title)}</strong><span>${esc(sub)}</span></div><div class="report-total"><strong>${money(amount)}</strong></div></div>`;
  }

  function reportLineRow(name, amount, options) {
    const opts = options || {};
    return `<tr class="${opts.className || ""}"><td>${opts.indent ? "&nbsp;&nbsp;&nbsp;" : ""}${esc(name)}</td><td class="amount-cell">${money(amount)}</td></tr>`;
  }

  function renderProfitAndLossReport() {
    const pnl = Engine.getProfitAndLoss(data, period.start, period.end);
    const incomes = pnl.rows.filter(row => row.ledger.nature === "income");
    const expenses = pnl.rows.filter(row => row.ledger.nature === "expense");
    const content = `<article class="card table-card report-table"><div class="table-wrap"><table><thead><tr><th>Particulars</th><th class="table-right">Amount (INR)</th></tr></thead><tbody>
      <tr class="report-section-row"><td colspan="2">Operating income</td></tr>${incomes.length ? incomes.map(row => reportLineRow(row.ledger.name, row.amount, { indent: true })).join("") : reportLineRow("No income posted", 0, { indent: true })}
      ${reportLineRow("Total income", pnl.income, { className: "report-total-row" })}
      <tr class="report-section-row"><td colspan="2">Operating costs and expenses</td></tr>${expenses.length ? expenses.map(row => reportLineRow(row.ledger.name, row.amount, { indent: true })).join("") : reportLineRow("No expenses posted", 0, { indent: true })}
      ${reportLineRow("Total costs and expenses", pnl.expenses, { className: "report-total-row" })}
      ${reportLineRow(pnl.net >= 0 ? "Net profit for period" : "Net loss for period", Math.abs(pnl.net), { className: "report-total-row" })}
      </tbody></table></div><div class="table-footer"><span>Accrual postings from the selected date range.</span><span>${esc(fiscalYearLabel(period.end))}</span></div></article>`;
    return `${reportHero("Profit & Loss", `${dateLabel(period.start)} to ${dateLabel(period.end)}`, pnl.net)}${content}`;
  }

  function renderBalanceSheetReport() {
    const bs = Engine.getBalanceSheet(data, period.end);
    const assets = bs.asset;
    const liabilities = bs.liability;
    const equity = bs.equity;
    const content = `<article class="card table-card report-table"><div class="table-wrap"><table><thead><tr><th>Particulars</th><th class="table-right">Amount (INR)</th></tr></thead><tbody>
      <tr class="report-section-row"><td colspan="2">Assets</td></tr>${assets.length ? assets.map(row => reportLineRow(row.ledger.name, row.amount, { indent: true })).join("") : reportLineRow("No asset balances", 0, { indent: true })}${reportLineRow("Total assets", bs.totalAssets, { className: "report-total-row" })}
      <tr class="report-section-row"><td colspan="2">Liabilities</td></tr>${liabilities.length ? liabilities.map(row => reportLineRow(row.ledger.name, row.amount, { indent: true })).join("") : reportLineRow("No liability balances", 0, { indent: true })}${reportLineRow("Total liabilities", bs.totalLiabilities, { className: "report-total-row" })}
      <tr class="report-section-row"><td colspan="2">Equity</td></tr>${equity.length ? equity.map(row => reportLineRow(row.ledger.name, row.amount, { indent: true })).join("") : reportLineRow("No equity balances", 0, { indent: true })}${bs.priorProfit ? reportLineRow("Prior years profit / (loss) carried forward", bs.priorProfit, { indent: true }) : ""}${reportLineRow("Current year profit / (loss)", bs.profit, { indent: true })}${reportLineRow("Total equity and liabilities", bs.totalLiabilitiesEquity, { className: "report-total-row" })}
      </tbody></table></div><div class="table-footer"><span>Balance sheet at ${dateLabel(period.end)} · current-year result is shown separately.</span><span>${esc(fiscalYearLabel(period.end))}</span></div></article>
      <div class="notice ${Math.abs(bs.difference) < 0.02 ? "success" : ""} balance-match"><span class="notice-icon">${Math.abs(bs.difference) < 0.02 ? "✓" : "ⓘ"}</span><span><strong>${Math.abs(bs.difference) < 0.02 ? "Balances in this demo view." : "Review required."}</strong> Assets less liabilities and equity equals ${money(bs.difference)}. This is not a substitute for closing entries, accounting policies or audited financial statements.</span></div>`;
    return `${reportHero("Balance Sheet", `As at ${dateLabel(period.end)}`, bs.totalAssets)}${content}`;
  }

  function renderTrialBalanceReport() {
    const tb = Engine.getTrialBalance(data, period.end);
    const content = `<article class="card table-card report-table"><div class="table-wrap"><table><thead><tr><th>Ledger account</th><th>Group</th><th class="table-right">Debit (INR)</th><th class="table-right">Credit (INR)</th></tr></thead><tbody>${tb.rows.length ? tb.rows.map(row => `<tr><td><span class="row-main">${esc(row.ledger.name)}</span></td><td>${esc(row.ledger.group)}</td><td class="amount-cell">${row.debit ? money(row.debit) : "—"}</td><td class="amount-cell">${row.credit ? money(row.credit) : "—"}</td></tr>`).join("") : `<tr><td colspan="4"><div class="empty-state">No account balances yet.</div></td></tr>`}<tr class="report-total-row"><td colspan="2">Totals</td><td class="amount-cell">${money(tb.debitTotal)}</td><td class="amount-cell">${money(tb.creditTotal)}</td></tr></tbody></table></div><div class="table-footer"><span>All posted balances up to ${dateLabel(period.end)}; includes opening voucher.</span><span>${tb.rows.length} non-zero accounts</span></div></article>
      <div class="notice ${Math.abs(tb.debitTotal - tb.creditTotal) < .02 ? "success" : ""} balance-match"><span class="notice-icon">${Math.abs(tb.debitTotal - tb.creditTotal) < .02 ? "✓" : "ⓘ"}</span><span>Debit and credit totals differ by <strong>${money(Math.abs(tb.debitTotal - tb.creditTotal))}</strong>. A balanced trial balance does not prove the books are correct.</span></div>`;
    return `${reportHero("Trial Balance", `As at ${dateLabel(period.end)}`, tb.debitTotal)}${content}`;
  }

  function renderGstReport() {
    const gst = Engine.getTaxSummary(data, period.start, period.end);
    const content = `<article class="card table-card report-table"><div class="table-wrap"><table><thead><tr><th>Tax summary</th><th class="table-right">Outward tax</th><th class="table-right">Input tax booked</th></tr></thead><tbody>
      <tr><td>CGST</td><td class="amount-cell">${money(gst.output.cgst)}</td><td class="amount-cell">${money(gst.input.cgst)}</td></tr>
      <tr><td>SGST / UTGST</td><td class="amount-cell">${money(gst.output.sgst)}</td><td class="amount-cell">${money(gst.input.sgst)}</td></tr>
      <tr><td>IGST</td><td class="amount-cell">${money(gst.output.igst)}</td><td class="amount-cell">${money(gst.input.igst)}</td></tr>
      <tr class="report-total-row"><td>Total tax in books</td><td class="amount-cell">${money(gst.output.total)}</td><td class="amount-cell">${money(gst.input.total)}</td></tr>
      <tr class="report-total-row"><td>Provisional output less input</td><td colspan="2" class="amount-cell">${money(gst.provisionalNet)}</td></tr>
      </tbody></table></div><div class="table-footer"><span>Input tax is not screened for eligibility; no GSTR-2B/IMS reconciliation.</span><span>Preview only</span></div></article><div class="notice" style="margin-top:12px"><span class="notice-icon">ⓘ</span><span>Reverse charge, place of supply, blocked/reversed ITC, credit/debit notes, exports, exempt supplies, advances and portal amendments are not modelled here. Verify the complete return against current GST Portal data.</span></div>`;
    return `${reportHero("GST Summary", `${dateLabel(period.start)} to ${dateLabel(period.end)} · not a return`, gst.provisionalNet)}${content}`;
  }

  function renderStockReport() {
    const balances = Engine.getStockBalances(data, period.end);
    const rows = (data.items || []).map(item => ({ item, balance: balances.get(item.id) || { quantity: 0, value: 0, averageCost: 0 } })).sort((a, b) => a.item.name.localeCompare(b.item.name));
    const total = Engine.sum(rows.map(row => row.balance.value));
    return `${reportHero("Stock Summary", `Quantity and valuation at ${dateLabel(period.end)} · weighted-average demo method`, total)}<article class="card table-card report-table"><div class="table-wrap"><table><thead><tr><th>Item</th><th>HSN</th><th class="table-right">Quantity</th><th>Unit</th><th class="table-right">Average cost</th><th class="table-right">Stock value</th></tr></thead><tbody>${rows.length ? rows.map(({ item, balance }) => `<tr><td>${esc(item.name)}</td><td>${esc(item.hsn || "—")}</td><td class="amount-cell">${number(balance.quantity, 2)}</td><td>${esc(item.unit)}</td><td class="amount-cell">${money(balance.averageCost)}</td><td class="amount-cell">${money(balance.value)}</td></tr>`).join("") : `<tr><td colspan="6"><div class="empty-state">No inventory items in this company.</div></td></tr>`}<tr class="report-total-row"><td colspan="5">Total stock value</td><td class="amount-cell">${money(total)}</td></tr></tbody></table></div><div class="table-footer"><span>Inventory valuation is a book estimate; perform a physical stock count.</span><span>${rows.length} item masters</span></div></article>`;
  }

  function renderAIDesk() {
    const findings = Engine.assessBooks(data, period.end);
    const messages = aiMessages.map(message => `<div class="chat-message ${message.role === "user" ? "user" : "assistant"}"><div class="chat-bubble">${esc(message.text)}<span class="chat-time">${esc(message.time || "")}</span></div></div>`).join("");
    const questions = ["How much cash and bank do we have?", "What are the open receivables?", "Summarise GST in the books", "Which items need reordering?", "Is the trial balance balanced?"];
    return `${pageHead("INSIGHTS · LOCAL ONLY", "Sutra Assist", "Ask a question about this local workspace. Replies are deterministic summaries of the books, not professional advice.", `<span class="pill pill-green"><span class="pill-dot"></span>No network calls</span>`)}${sampleBanner()}
      <div class="ai-layout"><article class="card ai-chat-card"><div class="ai-chat-top"><div class="ai-chat-title"><span class="ai-avatar">${icon("spark")}</span><div><strong>Books assistant</strong><span>On-device rules · ${esc(selectedPeriodLabel())}</span></div><span class="toolbar-spacer"></span><span class="pill pill-neutral">Local</span></div></div><div class="ai-chat-body" id="ai-chat-body">${messages}<div class="question-chips">${questions.map(question => `<button type="button" class="question-chip" data-question="${esc(question)}">${esc(question)}</button>`).join("")}</div></div><form class="ai-input-row" id="ai-query-form"><label class="visually-hidden" for="ai-query">Ask about your books</label><input id="ai-query" class="input-control" type="text" maxlength="220" placeholder="Ask about your books…" autocomplete="off"><button type="submit" class="button button-primary" aria-label="Send question">${icon("arrow")}</button></form><p class="ai-note">Your questions and books stay in this browser. No generative model or external service is connected.</p></article>
        <article class="card findings-card"><div class="card-pad"><div class="card-head"><div><h2 class="card-title">Book checks</h2><p class="card-subtitle">Evidence-backed patterns from local data</p></div><button class="card-action" type="button" data-action="refresh-ai">Run again</button></div><div style="margin-top:6px">${findings.map(finding => `<div class="finding"><div class="finding-head"><i class="finding-indicator ${esc(finding.level)}"></i><strong>${esc(finding.title)}</strong></div><p>${esc(finding.detail)}</p><span class="finding-evidence">Evidence · ${esc(finding.evidence)}</span></div>`).join("")}</div></div></article></div>
      <div class="notice info" style="margin-top:13px"><span class="notice-icon">ⓘ</span><span><strong>How to use this safely.</strong> The assistant can identify patterns such as low stock and ageing balances. It cannot determine GST/TDS applicability, assess eligibility, interpret a legal notice, make a filing or replace a CA’s review.</span></div>`;
  }

  function renderSettings() {
    const storageStatus = Storage.getStatus();
    const logs = (data.auditLog || []).slice().sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 9);
    const states = [
      ["27", "Maharashtra"], ["29", "Karnataka"], ["24", "Gujarat"], ["07", "Delhi"], ["33", "Tamil Nadu"], ["36", "Telangana"], ["09", "Uttar Pradesh"], ["06", "Haryana"], ["08", "Rajasthan"], ["19", "West Bengal"], ["32", "Kerala"], ["23", "Madhya Pradesh"], ["22", "Chhattisgarh"], ["21", "Odisha"], ["10", "Bihar"], ["03", "Punjab"], ["05", "Uttarakhand"], ["20", "Jharkhand"], ["30", "Goa"], ["02", "Himachal Pradesh"], ["01", "Jammu & Kashmir"], ["04", "Chandigarh"], ["11", "Sikkim"], ["12", "Arunachal Pradesh"], ["13", "Nagaland"], ["14", "Manipur"], ["15", "Mizoram"], ["16", "Tripura"], ["17", "Meghalaya"], ["18", "Assam"], ["31", "Lakshadweep"], ["34", "Puducherry"], ["35", "Andaman & Nicobar Islands"], ["37", "Andhra Pradesh"], ["38", "Ladakh"]
    ];
    const actions = `<button class="button button-secondary" type="button" data-action="export-backup">↓ Download backup</button>`;
    return `${pageHead("WORKSPACE", "Settings & data", "The current app is local to this browser. Back up your data before changing devices or clearing browser storage.", actions)}${sampleBanner()}
      <div class="settings-layout"><div>
        <article class="card settings-card"><h2>Company profile</h2><p>These fields help classify future demo entries. They do not change historical voucher postings or verify your GST/tax registration.</p><form id="settings-form"><div class="form-grid">
          <div class="form-field full"><label for="company-name">Company / business name</label><input class="input-control" id="company-name" name="name" required maxlength="90" value="${esc(data.company.name || "")}"></div>
          <div class="form-field"><label for="company-legal-form">Entity type</label><select class="select-control" id="company-legal-form" name="legalForm"><option ${String(data.company.legalForm || "").toLowerCase().includes("proprietorship") ? "selected" : ""}>Sole proprietorship</option><option ${String(data.company.legalForm || "").toLowerCase().includes("partnership") ? "selected" : ""}>Partnership firm</option><option ${String(data.company.legalForm || "").toLowerCase().includes("llp") ? "selected" : ""}>Limited liability partnership</option><option ${String(data.company.legalForm || "").toLowerCase().includes("private") ? "selected" : ""}>Private limited company</option><option ${String(data.company.legalForm || "").toLowerCase().includes("public") ? "selected" : ""}>Public limited company</option><option>Other / not selected</option></select></div>
          <div class="form-field"><label for="company-gstin">GSTIN (optional in this prototype)</label><input class="input-control" id="company-gstin" name="gstin" maxlength="20" value="${esc(data.company.gstin === "DEMO ONLY" ? "" : (data.company.gstin || ""))}" placeholder="Enter only after verifying registration"><span class="form-help">No GSTIN validation or portal lookup is performed.</span></div>
          <div class="form-field"><label for="company-state">Principal place of business state</label><select class="select-control" id="company-state" name="stateCode">${states.map(([code, state]) => `<option value="${code}" data-state="${esc(state)}" ${String(data.company.stateCode || "27") === code ? "selected" : ""}>${esc(state)}</option>`).join("")}</select></div>
          <div class="form-field"><label for="gst-frequency">GST return frequency</label><select class="select-control" id="gst-frequency" name="gstFrequency"><option ${data.company.gstFrequency === "Monthly" ? "selected" : ""}>Monthly</option><option ${data.company.gstFrequency === "Quarterly" ? "selected" : ""}>Quarterly</option></select><span class="form-help">The return scheme and due dates need portal verification.</span></div>
          </div><div class="settings-actions"><button type="submit" class="button button-primary">Save profile</button><button type="button" class="button button-secondary" data-action="create-blank">Create blank workspace</button></div></form>
          <div class="storage-state ${storageStatus.mode === "local" ? "" : "warning"}"><span class="storage-bullet">${storageStatus.mode === "local" ? "●" : "!"}</span><div><strong>${esc(storageStatus.label)}</strong>${storageStatus.mode === "local" ? "Browser localStorage only. It is not encrypted and can be cleared with browser data. Export a separate JSON backup regularly." : "This browser could not confirm durable local storage. Export a JSON backup before closing this tab; a refreshed session may not retain changes."}</div></div></article>
        <article class="card settings-card"><h2>Backup & recovery</h2><p>Keep at least one backup outside this browser profile. Restore replaces the current workspace after validating its voucher balances.</p><div class="settings-actions" style="margin-top:0"><button class="button button-primary" type="button" data-action="export-backup">↓ Download JSON backup</button><button class="button button-secondary" type="button" data-action="restore-backup">↑ Restore from file</button><button class="button button-danger" type="button" data-action="reset-demo">Reset to sample books</button></div><div class="notice info" style="margin-top:13px"><span class="notice-icon">ⓘ</span><span>Do not email unencrypted backups containing real customer, employee, bank, PAN or GSTIN data. This prototype does not encrypt the workspace or backup file.</span></div></article>
      </div><div>
        <article class="card settings-card"><div class="card-head"><div><h2>Audit activity</h2><p style="margin:4px 0 0">Local events recorded by this prototype</p></div><span class="pill pill-green">${(data.auditLog || []).length} events</span></div><div style="margin-top:5px">${logs.length ? logs.map(log => `<div class="audit-entry"><i class="audit-dot"></i><div class="audit-copy"><strong>${esc(log.summary || `${log.action} ${log.entity}`)}</strong><span>${esc(log.actor || "Local user")} · ${esc(dateLabel(String(log.at || "").slice(0, 10), { day: "2-digit", month: "short", year: "numeric" }))}</span></div></div>`).join("") : `<div class="empty-state"><strong>No audit events yet</strong>Workspace changes will appear here.</div>`}</div><div class="notice" style="margin-top:10px"><span class="notice-icon">ⓘ</span><span>This local event list is not a legally tamper-proof audit trail. Production use requires append-only controls and tested retention.</span></div></article>
        <article class="card settings-card"><h2>Tax & accounting scope</h2><p>The rules in this prototype are intentionally conservative.</p><div class="compliance-row"><span class="compliance-icon">₹</span><div class="compliance-copy"><strong>TDS / TCS rules</strong><span>Not configured · no withholding calculation</span></div><span class="pill pill-amber">Review</span></div><div class="compliance-row"><span class="compliance-icon">▦</span><div class="compliance-copy"><strong>GST portal / IRP links</strong><span>Not connected · books preview only</span></div><span class="pill pill-neutral">Offline</span></div><div class="compliance-row"><span class="compliance-icon">⌂</span><div class="compliance-copy"><strong>Accounting framework</strong><span>Entity-specific AS / Ind AS / Schedule III</span></div><span class="pill pill-neutral">CA review</span></div></article>
      </div></div>`;
  }

  function closeModal() {
    document.getElementById("modal-root").innerHTML = "";
  }

  function showModal(title, subtitle, body, footer, wide) {
    const root = document.getElementById("modal-root");
    const content = String(body || "").trim().startsWith('<div class="modal-body"') ? body : `<div class="modal-body">${body}</div>`;
    root.innerHTML = `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal-panel ${wide ? "modal-wide" : ""}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-head"><div><h2>${esc(title)}</h2><p>${esc(subtitle || "")}</p></div><button class="icon-button" type="button" data-action="close-modal" aria-label="Close dialog">×</button></div>${content}${footer ? `<div class="modal-foot">${footer}</div>` : ""}</section></div>`;
    const focusTarget = root.querySelector("input:not([type=hidden]), select, button:not([data-action=close-modal])");
    if (focusTarget) setTimeout(() => focusTarget.focus(), 25);
  }

  function dateFieldValue() {
    const candidate = period.end;
    return Engine.validIsoDate(candidate) ? candidate : localDateISO();
  }

  function openPeriodModal() {
    const body = `<form id="period-form"><div class="form-grid"><div class="form-field"><label for="period-start">From</label><input class="input-control" type="date" id="period-start" name="start" required value="${esc(period.start)}"></div><div class="form-field"><label for="period-end">To</label><input class="input-control" type="date" id="period-end" name="end" required value="${esc(period.end)}"></div><div class="form-field full"><span class="form-help">P&L, GST preview and dashboard activity use this range. Balance sheet and trial balance use the end date.</span></div></div></form>`;
    showModal("Reporting period", "Choose the dates used by dashboard and reports.", body, `<span class="modal-foot-note">Dates do not change historical voucher postings.</span><div class="modal-foot-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit" form="period-form">Apply period</button></div>`);
  }

  function productOptions(selectedId) {
    return (data.items || []).map(item => `<option value="${esc(item.id)}" ${item.id === selectedId ? "selected" : ""}>${esc(item.name)} · HSN ${esc(item.hsn || "—")} · ${number(item.gstRate, 2)}%</option>`).join("");
  }

  function ledgerOptions(filterFn, selectedId) {
    return data.ledgers.filter(filterFn).slice().sort((a, b) => a.name.localeCompare(b.name)).map(ledger => `<option value="${esc(ledger.id)}" ${ledger.id === selectedId ? "selected" : ""}>${esc(ledger.name)}</option>`).join("");
  }

  function renderVoucherFields(type) {
    const holder = document.getElementById("voucher-fields-holder");
    if (!holder) return;
    if (["Sales", "Purchase"].includes(type)) {
      const role = type === "Sales" ? "customer" : "supplier";
      const matchingParties = data.parties.filter(party => party.role === role);
      const firstItem = data.items[0];
      const firstParty = matchingParties[0];
      const unitPrice = firstItem ? (type === "Sales" ? firstItem.sellingPrice : firstItem.openingCost) : "";
      holder.innerHTML = `<div class="voucher-fields">
        <div class="form-field"><label for="voucher-party">${type === "Sales" ? "Customer" : "Supplier"}</label><select class="select-control" id="voucher-party" name="partyId" required><option value="">Choose ${type === "Sales" ? "customer" : "supplier"}</option>${matchingParties.map(party => `<option value="${esc(party.id)}" ${party.id === (firstParty && firstParty.id) ? "selected" : ""}>${esc(party.name)} · ${esc(party.state || "State not set")}</option>`).join("")}</select><span class="form-help">${matchingParties.length ? "GST split is estimated from company and party state." : `No ${role} yet — add a party in Ledgers & parties first.`}</span></div>
        <div class="form-field"><label for="voucher-item">Stock item</label><select class="select-control" id="voucher-item" name="itemId" required><option value="">Choose item</option>${productOptions(firstItem && firstItem.id)}</select><span class="form-help">One item per voucher in this prototype.</span></div>
        <div class="form-field"><label for="voucher-quantity">Quantity</label><input class="input-control" type="number" id="voucher-quantity" name="quantity" min="0.001" step="0.001" value="1" required></div>
        <div class="form-field"><label for="voucher-unit-price">Rate per unit · before GST</label><input class="input-control" type="number" id="voucher-unit-price" name="unitPrice" min="0" step="0.01" value="${esc(unitPrice)}" required></div>
        <div class="form-field full"><label for="voucher-narration">Narration</label><input class="input-control" id="voucher-narration" name="narration" maxlength="180" placeholder="Short description for the books"></div>
      </div><div class="voucher-preview" id="voucher-preview"><div><span>Taxable value · GST</span><strong id="preview-taxable">—</strong></div><div class="preview-total"><span>Invoice total</span><strong id="preview-total">—</strong></div></div><div class="form-help" id="preview-stock-note" style="margin-top:6px">GST is a local estimate. Check HSN, place of supply, exemptions, reverse charge and current rules.</div>`;
    } else if (["Receipt", "Payment"].includes(type)) {
      const role = type === "Receipt" ? "customer" : "supplier";
      const acceptable = ledger => {
        if (["cash", "bank", "inventory", "gst-in-cgst", "gst-in-sgst", "gst-in-igst", "gst-out-cgst", "gst-out-sgst", "gst-out-igst", "tds-payable"].includes(ledger.id)) return false;
        if (ledger.partyId) return Engine.findParty(data, ledger.partyId)?.role === role;
        return type === "Receipt" ? ["income", "equity"].includes(ledger.nature) : ["expense", "liability"].includes(ledger.nature);
      };
      const ledgerList = data.ledgers.filter(acceptable);
      const suggestedLedger = ledgerList.find(ledger => ledger.partyId && Engine.findParty(data, ledger.partyId)?.role === role) || ledgerList[0];
      holder.innerHTML = `<div class="voucher-fields">
        <div class="form-field"><label for="counter-ledger">${type === "Receipt" ? "Received from" : "Paid to"}</label><select class="select-control" id="counter-ledger" name="ledgerId" required><option value="">Choose account / party</option>${ledgerList.map(ledger => `<option value="${esc(ledger.id)}" ${ledger.id === (suggestedLedger && suggestedLedger.id) ? "selected" : ""}>${esc(ledger.name)}</option>`).join("")}</select><span class="form-help">Select the party ledger for bill-wise local ageing.</span></div>
        <div class="form-field"><label for="settlement-account">${type === "Receipt" ? "Deposit to" : "Pay from"}</label><select class="select-control" id="settlement-account" name="accountId"><option value="bank">Current Account · 4042</option><option value="cash">Cash in Hand</option></select></div>
        <div class="form-field"><label for="voucher-amount">Amount (INR)</label><input class="input-control" type="number" id="voucher-amount" name="amount" min="0.01" step="0.01" required placeholder="0.00"></div>
        <div class="form-field"><label for="voucher-narration">Narration</label><input class="input-control" id="voucher-narration" name="narration" maxlength="180" placeholder="Payment / receipt details"></div>
      </div><div class="voucher-preview"><div><span>Posting</span><strong>${type === "Receipt" ? "Debit cash/bank · Credit counter-ledger" : "Debit counter-ledger · Credit cash/bank"}</strong></div><div class="preview-total"><span>Amount</span><strong id="preview-total">₹0.00</strong></div></div>`;
    } else {
      const options = ledgerOptions(() => true);
      const firstDebit = data.ledgers.find(ledger => ledger.id === "rent") || data.ledgers[0];
      const firstCredit = data.ledgers.find(ledger => ledger.id === "bank") || data.ledgers[1];
      holder.innerHTML = `<div class="voucher-fields">
        <div class="form-field"><label for="debit-ledger">Debit ledger</label><select class="select-control" id="debit-ledger" name="debitLedgerId" required>${options}</select></div>
        <div class="form-field"><label for="credit-ledger">Credit ledger</label><select class="select-control" id="credit-ledger" name="creditLedgerId" required>${options}</select></div>
        <div class="form-field"><label for="voucher-amount">Amount (INR)</label><input class="input-control" type="number" id="voucher-amount" name="amount" min="0.01" step="0.01" required placeholder="0.00"></div>
        <div class="form-field"><label for="voucher-narration">Narration</label><input class="input-control" id="voucher-narration" name="narration" maxlength="180" placeholder="Reason for journal entry"></div>
      </div><div class="voucher-preview"><div><span>Balanced posting</span><strong>Debit and credit ledgers must differ</strong></div><div class="preview-total"><span>Amount</span><strong id="preview-total">₹0.00</strong></div></div>`;
      const debit = document.getElementById("debit-ledger");
      const credit = document.getElementById("credit-ledger");
      if (debit && firstDebit) debit.value = firstDebit.id;
      if (credit && firstCredit) credit.value = firstCredit.id;
    }
    updateVoucherPreview();
  }

  function updateVoucherPreview() {
    const typeInput = document.getElementById("voucher-type");
    if (!typeInput) return;
    const type = typeInput.value;
    const totalNode = document.getElementById("preview-total");
    if (["Sales", "Purchase"].includes(type)) {
      const item = Engine.findItem(data, document.getElementById("voucher-item")?.value);
      const party = Engine.findParty(data, document.getElementById("voucher-party")?.value);
      const quantity = Number(document.getElementById("voucher-quantity")?.value || 0);
      const rate = Number(document.getElementById("voucher-unit-price")?.value || 0);
      const taxable = Engine.round2(quantity * rate);
      const inter = Boolean(party && data.company.stateCode && party.stateCode && party.stateCode !== data.company.stateCode);
      const gstTotal = item ? Engine.round2(taxable * Number(item.gstRate || 0) / 100) : 0;
      const split = inter ? `IGST ${money(gstTotal)}` : `CGST ${money(gstTotal / 2)} · SGST ${money(gstTotal - Engine.round2(gstTotal / 2))}`;
      const taxLabel = document.getElementById("preview-taxable");
      if (taxLabel) taxLabel.textContent = `${money(taxable)} · ${item ? number(item.gstRate, 2) : "0"}% (${split})`;
      if (totalNode) totalNode.textContent = money(taxable + gstTotal);
      const stockNote = document.getElementById("preview-stock-note");
      if (stockNote && item && type === "Sales") {
        const stock = Engine.getStockBalance(data, item.id, document.getElementById("voucher-date")?.value || period.end);
        stockNote.textContent = `Available ${number(stock.quantity, 2)} ${item.unit} · approximate moving cost ${money(stock.averageCost)}. GST/HSN classification and eligibility still need professional review.`;
      } else if (stockNote && item) {
        stockNote.textContent = `HSN ${item.hsn || "not set"} · GST ${number(item.gstRate, 2)}% · ${inter ? "inter-state estimate" : "intra-state estimate"}. Confirm classification and rate before use.`;
      }
    } else {
      const amount = Number(document.getElementById("voucher-amount")?.value || 0);
      if (totalNode) totalNode.textContent = money(amount);
    }
  }

  function openVoucherModal(type) {
    const allowed = ["Sales", "Purchase", "Receipt", "Payment", "Journal"];
    const chosenType = allowed.includes(type) ? type : "Sales";
    const date = dateFieldValue();
    const body = `<form id="voucher-form"><input type="hidden" id="voucher-type" name="type" value="${chosenType}">
      <div class="voucher-type-row" role="tablist" aria-label="Voucher type">${allowed.map(option => `<button type="button" class="voucher-type-choice ${option === chosenType ? "active" : ""}" role="tab" aria-selected="${option === chosenType}" data-modal-type="${option}">${option}</button>`).join("")}</div>
      <div class="voucher-fields"><div class="form-field"><label for="voucher-date">Voucher date</label><input class="input-control" type="date" id="voucher-date" name="date" required value="${esc(date)}"></div><div class="form-field"><label for="voucher-number">Voucher number</label><input class="input-control" id="voucher-number" value="${esc(Engine.getVoucherNumber(data, chosenType, date))}" readonly aria-readonly="true"><span class="form-help">Auto-numbered · posted vouchers are not overwritten.</span></div><div class="form-field full"><label for="voucher-reference">Reference (optional)</label><input class="input-control" id="voucher-reference" name="reference" maxlength="60" placeholder="Invoice / bank reference"></div></div>
      <div id="voucher-fields-holder"></div>
    </form>`;
    const footer = `<span class="modal-foot-note">${data.settings.sampleWorkspace ? "Fictional demo · not a tax invoice" : "Local-only posting · review before real use"}</span><div class="modal-foot-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit" form="voucher-form">Post voucher</button></div>`;
    showModal(`New ${chosenType.toLowerCase()} voucher`, "Enter the source transaction once; the books are posted in balance.", body, footer, true);
    renderVoucherFields(chosenType);
  }

  function openVoucherDetail(voucherId) {
    const voucher = data.vouchers.find(item => item.id === voucherId);
    if (!voucher) return toast("Voucher not found", "This record may have changed after a backup restore.", "warning");
    const party = voucher.partyId ? getPartyName(voucher.partyId) : "General ledger entry";
    const debit = Engine.sum(voucher.lines.map(line => line.debit));
    const credit = Engine.sum(voucher.lines.map(line => line.credit));
    const body = `<div class="modal-body"><div class="voucher-detail-head"><div>${typePill(voucher.type)}<strong style="margin-top:7px">${esc(voucher.number)}</strong><span>${dateLabel(voucher.date)} · ${esc(party)}</span></div><div class="voucher-total-box"><span class="row-sub">Voucher total</span><strong>${money(voucher.total)}</strong></div></div>
      <div class="row-sub" style="margin:0 0 9px">${esc(voucher.narration || "No narration")}${voucher.reference ? ` · Ref ${esc(voucher.reference)}` : ""}</div>
      <div class="table-wrap"><table class="voucher-lines"><thead><tr><th>Ledger account</th><th class="table-right">Debit</th><th class="table-right">Credit</th></tr></thead><tbody>${voucher.lines.map(line => `<tr><td>${esc(getLedgerName(line.ledgerId))}</td><td class="amount-cell">${line.debit ? money(line.debit) : "—"}</td><td class="amount-cell">${line.credit ? money(line.credit) : "—"}</td></tr>`).join("")}<tr class="report-total-row"><td>Balanced totals</td><td class="amount-cell">${money(debit)}</td><td class="amount-cell">${money(credit)}</td></tr></tbody></table></div>
      ${voucher.tax ? `<div class="notice info modal-notice"><span class="notice-icon">₹</span><span>Taxable value ${money(voucher.taxable)} · ${esc(voucher.taxType || "GST")} ${money(voucher.tax)} · rate ${number(voucher.gstRate, 2)}%. This is a books-side calculation only.</span></div>` : ""}
      ${voucher.stockMoves?.length ? `<div class="notice success modal-notice"><span class="notice-icon">◫</span><span>Stock movement: ${esc(voucher.itemName || Engine.findItem(data, voucher.stockMoves[0].productId)?.name || "item")} · ${number(Math.abs(voucher.stockMoves[0].qty), 2)} ${voucher.stockMoves[0].qty < 0 ? "out" : "in"} at ${money(voucher.stockMoves[0].unitCost)} average cost.</span></div>` : ""}
      <div class="form-help" style="margin-top:12px">Posted entries are read-only in this prototype. Correct a mistake by posting an adjusting or reversal entry and retaining the source evidence.</div></div>`;
    showModal("Voucher details", "Read-only posting view · audit trail available in Settings.", body, `<span class="modal-foot-note">${voucher.status || "Posted"} · debit and credit totals ${Math.abs(debit - credit) < .01 ? "tie" : "need review"}</span><div class="modal-foot-actions"><button class="button button-secondary" type="button" data-action="close-modal">Close</button></div>`, true);
  }

  function openLedgerModal() {
    const body = `<form id="ledger-form"><div class="form-grid"><div class="form-field full"><label for="new-ledger-name">Account name</label><input class="input-control" id="new-ledger-name" name="name" required maxlength="80" placeholder="e.g. Internet expense"></div><div class="form-field"><label for="new-ledger-nature">Account nature</label><select class="select-control" id="new-ledger-nature" name="nature"><option value="asset">Asset</option><option value="liability">Liability</option><option value="equity">Equity</option><option value="income">Income</option><option value="expense" selected>Expense</option></select></div><div class="form-field"><label for="new-ledger-group">Report group</label><input class="input-control" id="new-ledger-group" name="group" maxlength="60" value="Indirect expenses"></div><div class="form-field full"><span class="form-help">This account starts at zero. Enter an opening balance only through a balanced opening journal. Party accounts should be created with “Add party”.</span></div></div></form>`;
    showModal("Create ledger account", "Add an account to the chart of accounts.", body, `<span class="modal-foot-note">A ledger name should be clear and unique.</span><div class="modal-foot-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit" form="ledger-form">Create account</button></div>`);
  }

  function openPartyModal() {
    const body = `<form id="party-form"><div class="form-grid"><div class="form-field full"><label for="new-party-name">Party / legal name</label><input class="input-control" id="new-party-name" name="name" required maxlength="90" placeholder="Customer or supplier name"></div><div class="form-field"><label for="new-party-role">Party type</label><select class="select-control" id="new-party-role" name="role"><option value="customer">Customer · receivable</option><option value="supplier">Supplier · payable</option></select></div><div class="form-field"><label for="new-party-state">State / UT</label><select class="select-control" id="new-party-state" name="stateCode"><option value="27" data-state="Maharashtra">Maharashtra</option><option value="29" data-state="Karnataka">Karnataka</option><option value="24" data-state="Gujarat">Gujarat</option><option value="07" data-state="Delhi">Delhi</option><option value="33" data-state="Tamil Nadu">Tamil Nadu</option><option value="36" data-state="Telangana">Telangana</option><option value="09" data-state="Uttar Pradesh">Uttar Pradesh</option><option value="06" data-state="Haryana">Haryana</option><option value="08" data-state="Rajasthan">Rajasthan</option><option value="19" data-state="West Bengal">West Bengal</option><option value="32" data-state="Kerala">Kerala</option><option value="37" data-state="Andhra Pradesh">Andhra Pradesh</option></select></div><div class="form-field"><label for="new-party-gstin">GSTIN (optional)</label><input class="input-control" id="new-party-gstin" name="gstin" maxlength="20" placeholder="Not validated by this app"></div><div class="form-field"><label for="new-party-days">Default credit days</label><input class="input-control" id="new-party-days" name="paymentDays" type="number" min="0" max="365" step="1" value="30"></div><div class="form-field full"><span class="form-help">No GSTIN lookup, identity check or opening balance is performed. Add any opening balance as a balanced journal.</span></div></div></form>`;
    showModal("Add customer or supplier", "Creates a party ledger and a party master record.", body, `<span class="modal-foot-note">Verify GSTIN, state and registration with source documents.</span><div class="modal-foot-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit" form="party-form">Create party</button></div>`);
  }

  function openItemModal() {
    const body = `<form id="item-form"><div class="form-grid"><div class="form-field full"><label for="new-item-name">Item name</label><input class="input-control" id="new-item-name" name="name" required maxlength="90" placeholder="Product or stock item"></div><div class="form-field"><label for="new-item-hsn">HSN</label><input class="input-control" id="new-item-hsn" name="hsn" maxlength="12" placeholder="Verify classification"></div><div class="form-field"><label for="new-item-rate">GST rate (%)</label><input class="input-control" type="number" id="new-item-rate" name="gstRate" min="0" max="100" step="0.01" value="18"></div><div class="form-field"><label for="new-item-unit">Unit</label><input class="input-control" id="new-item-unit" name="unit" maxlength="18" value="Piece"></div><div class="form-field"><label for="new-item-reorder">Reorder level</label><input class="input-control" type="number" id="new-item-reorder" name="reorderLevel" min="0" step="0.001" value="0"></div><div class="form-field"><label for="new-item-price">Suggested selling rate</label><input class="input-control" type="number" id="new-item-price" name="sellingPrice" min="0" step="0.01" value="0"></div><div class="form-field full"><span class="form-help">New products start at zero stock. Receive them through a purchase voucher; the HSN/GST rate is a user master and must be verified.</span></div></div></form>`;
    showModal("Create stock item", "Add a basic inventory master.", body, `<span class="modal-foot-note">One item line per sales/purchase voucher in this prototype.</span><div class="modal-foot-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit" form="item-form">Create item</button></div>`);
  }

  function openConfirmModal(kind) {
    const isBlank = kind === "blank";
    const title = isBlank ? "Create a blank workspace?" : "Reset to fictional sample books?";
    const copy = isBlank
      ? "This replaces the current local workspace with an empty company, default system ledgers and no parties, items or vouchers. Download a backup first if you may need the current books."
      : "This replaces the current local workspace with the fictional demo company and sample transactions. Any locally entered data will be lost unless you download a backup first.";
    const body = `<div class="modal-body"><p class="confirm-copy">${esc(copy)}</p><div class="notice" style="margin-top:13px"><span class="notice-icon">!</span><span>This action cannot be undone from inside the app. A downloaded backup is your recovery copy.</span></div></div>`;
    showModal(title, "Destructive local data action", body, `<span class="modal-foot-note">Back up first if unsure.</span><div class="modal-foot-actions"><button class="button button-secondary" type="button" data-action="close-modal">Cancel</button><button class="button ${isBlank ? "button-primary" : "button-danger"}" type="button" data-action="confirm-${kind}">${isBlank ? "Create blank company" : "Reset sample books"}</button></div>`);
  }

  function addAudit(action, entity, entityId, summary) {
    data.auditLog = data.auditLog || [];
    data.auditLog.push({ id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`, at: new Date().toISOString(), action, entity, entityId, summary, actor: "Local user" });
  }

  function createBlankWorkspace() {
    const seed = window.SutraDemo;
    data = {
      schemaVersion: 1,
      company: { name: "New company", legalForm: "Other / not selected", gstin: "", pan: "", state: "Maharashtra", stateCode: "27", gstFrequency: "Monthly", fyStart: "2026-04-01", address: "", currency: "INR", isDemo: false },
      ledgers: seed.ledgers.filter(ledger => !ledger.partyId).map(ledger => JSON.parse(JSON.stringify(ledger))),
      parties: [], items: [], vouchers: [], auditLog: [],
      settings: { currency: "INR", sampleWorkspace: false, localOnly: true, tdsConfigured: false, taxRulePackDate: "2026-09-30" }
    };
    addAudit("CREATE", "Workspace", "new", "Created a blank local workspace");
    Storage.save(data);
    period = getDefaultPeriod();
    route = "settings";
    closeModal();
    render();
    toast("Blank workspace created", "Add your company profile, parties, items and opening entries.", "success");
  }

  function resetDemoWorkspace() {
    Storage.reset();
    data = Storage.load();
    period = getDefaultPeriod();
    route = "dashboard";
    closeModal();
    render();
    toast("Sample books restored", "All workspace data is now the fictional demo set.", "success");
  }

  function createLedger(form) {
    const values = new FormData(form);
    const name = String(values.get("name") || "").trim();
    const nature = String(values.get("nature") || "expense");
    const group = String(values.get("group") || "Other accounts").trim() || "Other accounts";
    if (!name) throw new Error("Enter an account name.");
    if (data.ledgers.some(ledger => ledger.name.toLowerCase() === name.toLowerCase())) throw new Error("An account with that name already exists.");
    const id = `ledger-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    data.ledgers.push({ id, name, group, nature, system: false });
    addAudit("CREATE", "Ledger", id, `Created ledger ${name}`);
    persistWorkspace();
    closeModal();
    route = "ledgers";
    render();
    toast("Account created", `${name} starts at zero balance.`, "success");
  }

  function createParty(form) {
    const values = new FormData(form);
    const name = String(values.get("name") || "").trim();
    const role = String(values.get("role") || "customer");
    const stateCode = String(values.get("stateCode") || "");
    const state = form.querySelector("#new-party-state option:checked")?.dataset.state || "";
    const gstin = String(values.get("gstin") || "").trim();
    const paymentDays = Math.max(0, Math.min(365, Number(values.get("paymentDays") || 30)));
    if (!name) throw new Error("Enter a party name.");
    if (!["customer", "supplier"].includes(role)) throw new Error("Choose customer or supplier.");
    if (data.parties.some(party => party.name.toLowerCase() === name.toLowerCase()) || data.ledgers.some(ledger => ledger.name.toLowerCase() === name.toLowerCase())) throw new Error("An account or party with that name already exists.");
    const id = `party-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    const ledgerId = `ledger-${id}`;
    data.parties.push({ id, ledgerId, name, role, gstin, state, stateCode, paymentDays });
    data.ledgers.push({ id: ledgerId, name, group: role === "customer" ? "Trade receivables" : "Trade payables", nature: role === "customer" ? "asset" : "liability", partyId: id, system: false });
    addAudit("CREATE", "Party", id, `Created ${role} ${name}`);
    persistWorkspace();
    closeModal();
    route = "ledgers";
    render();
    toast("Party added", `${name} is ready for voucher entry.`, "success");
  }

  function createItem(form) {
    const values = new FormData(form);
    const name = String(values.get("name") || "").trim();
    const hsn = String(values.get("hsn") || "").trim();
    const gstRate = Number(values.get("gstRate") || 0);
    const unit = String(values.get("unit") || "Piece").trim() || "Piece";
    const reorderLevel = Number(values.get("reorderLevel") || 0);
    const sellingPrice = Number(values.get("sellingPrice") || 0);
    if (!name) throw new Error("Enter an item name.");
    if (data.items.some(item => item.name.toLowerCase() === name.toLowerCase())) throw new Error("An item with that name already exists.");
    if (![gstRate, reorderLevel, sellingPrice].every(Number.isFinite) || gstRate < 0 || gstRate > 100 || reorderLevel < 0 || sellingPrice < 0) throw new Error("Check the rate, reorder level and selling price.");
    const id = `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    data.items.push({ id, name, hsn, gstRate: Engine.round2(gstRate), unit, openingQty: 0, openingCost: 0, sellingPrice: Engine.round2(sellingPrice), reorderLevel: Engine.round2(reorderLevel) });
    addAudit("CREATE", "Item", id, `Created inventory item ${name}`);
    persistWorkspace();
    closeModal();
    route = "inventory";
    render();
    toast("Stock item created", `${name} starts at zero stock.`, "success");
  }

  function persistWorkspace() {
    try {
      const result = Storage.save(data);
      if (!result.persistent) toast("Storage may be temporary", "Download a JSON backup before closing this browser.", "warning");
      return result;
    } catch (error) {
      throw new Error(`Could not save this change: ${error.message}`);
    }
  }

  function handleVoucherSubmit(form) {
    const values = new FormData(form);
    const type = String(values.get("type"));
    const input = {
      type,
      date: String(values.get("date") || ""),
      reference: String(values.get("reference") || ""),
      narration: String(values.get("narration") || "")
    };
    if (["Sales", "Purchase"].includes(type)) {
      input.partyId = String(values.get("partyId") || "");
      input.itemId = String(values.get("itemId") || "");
      input.quantity = Number(values.get("quantity"));
      input.unitPrice = Number(values.get("unitPrice"));
    } else if (["Receipt", "Payment"].includes(type)) {
      const counterLedger = Engine.findLedger(data, String(values.get("ledgerId") || ""));
      input.ledgerId = counterLedger ? counterLedger.id : "";
      input.partyId = counterLedger && counterLedger.partyId ? counterLedger.partyId : "";
      input.accountId = String(values.get("accountId") || "");
      input.amount = Number(values.get("amount"));
    } else {
      input.debitLedgerId = String(values.get("debitLedgerId") || "");
      input.creditLedgerId = String(values.get("creditLedgerId") || "");
      input.amount = Number(values.get("amount"));
    }
    const voucher = Engine.createVoucher(data, input);
    const result = Storage.save(data);
    closeModal();
    route = "vouchers";
    render();
    toast(`${voucher.type} ${voucher.number} posted`, result.persistent ? "The balanced posting is saved on this device." : "Saved for this session only — download a backup.", result.persistent ? "success" : "warning");
  }

  function handlePeriodSubmit(form) {
    const values = new FormData(form);
    const start = String(values.get("start") || "");
    const end = String(values.get("end") || "");
    if (!Engine.validIsoDate(start) || !Engine.validIsoDate(end)) throw new Error("Enter valid start and end dates.");
    if (start > end) throw new Error("The start date must be on or before the end date.");
    period = { start, end };
    closeModal();
    render();
  }

  function handleSettingsSubmit(form) {
    const values = new FormData(form);
    const stateCode = String(values.get("stateCode") || "27");
    const stateOption = Array.from(form.querySelectorAll("#company-state option")).find(option => option.value === stateCode);
    const previousName = data.company.name;
    data.company.name = String(values.get("name") || "Untitled company").trim();
    data.company.legalForm = String(values.get("legalForm") || "Other / not selected");
    data.company.gstin = String(values.get("gstin") || "").trim();
    data.company.stateCode = stateCode;
    data.company.state = stateOption ? stateOption.dataset.state : data.company.state;
    data.company.gstFrequency = String(values.get("gstFrequency") || "Monthly");
    addAudit("UPDATE", "Company profile", "company", `Updated profile${previousName !== data.company.name ? ` · renamed ${previousName} to ${data.company.name}` : ""}`);
    persistWorkspace();
    render();
    toast("Company profile saved", "Historical voucher tax postings have not been recalculated.", "success");
  }

  function askAI(question) {
    const q = String(question || "").trim();
    if (!q) return;
    aiMessages.push({ role: "user", text: q, time: "Just now" });
    aiMessages.push({ role: "assistant", text: answerLocalQuestion(q), time: "Just now" });
    if (aiMessages.length > 18) aiMessages = aiMessages.slice(-18);
    render();
    const chat = document.getElementById("ai-chat-body");
    if (chat) chat.scrollTop = chat.scrollHeight;
  }

  function answerLocalQuestion(question) {
    const q = question.toLowerCase();
    const asOf = period.end;
    if (/cash|bank|liquid/.test(q)) {
      const cash = normalLedgerBalance(Engine.findLedger(data, "cash"), asOf);
      const bank = normalLedgerBalance(Engine.findLedger(data, "bank"), asOf);
      return `At ${dateLabel(asOf)}, the books show ${money(Engine.round2(cash + bank))} across cash and bank: ${money(cash)} cash and ${money(bank)} bank. Evidence: the Cash in Hand and Current Account ledger balances. Please reconcile the bank statement before relying on this figure.`;
    }
    if (/receivable|customer|collect|due from|outstanding/.test(q)) {
      const balances = getPartyBalances(asOf);
      const open = Engine.getOutstandingBills(data, asOf).filter(bill => bill.role === "customer");
      const overdue = open.filter(bill => bill.dueDate < asOf);
      return `Customer ledger balances total ${money(balances.receivables)} at ${dateLabel(asOf)}. The local FIFO bill view has ${open.length} open invoice/opening line(s), of which ${overdue.length} are past their stored due date. Evidence: party ledgers and voucher due dates; allocations are simplified and should be checked invoice by invoice.`;
    }
    if (/payable|supplier|owe|vendor/.test(q)) {
      const balances = getPartyBalances(asOf);
      const open = Engine.getOutstandingBills(data, asOf).filter(bill => bill.role === "supplier");
      return `Supplier ledger balances total ${money(balances.payables)} at ${dateLabel(asOf)}. The local FIFO bill view has ${open.length} open bill(s). Evidence: supplier ledgers and purchase/payment voucher dates; confirm vendor statements and bill-wise allocations.`;
    }
    if (/gst|tax|gstr|itc/.test(q)) {
      const gst = Engine.getTaxSummary(data, period.start, period.end);
      return `For ${dateLabel(period.start)} to ${dateLabel(period.end)}, sales vouchers carry ${money(gst.output.total)} output GST; purchase vouchers book ${money(gst.input.total)} input tax; the simple difference is ${money(gst.provisionalNet)}. Evidence: saved voucher tax breakdowns. This is not eligible ITC, a return liability or a filed return—reconcile GSTR-1/2B/IMS and current rules with a CA.`;
    }
    if (/stock|inventory|reorder|item/.test(q)) {
      const balances = Engine.getStockBalances(data, asOf);
      const low = data.items.filter(item => Number(item.reorderLevel || 0) > 0 && (balances.get(item.id)?.quantity || 0) <= Number(item.reorderLevel));
      const value = Engine.sum(Array.from(balances.values()).map(row => row.value));
      return `At ${dateLabel(asOf)}, the item register estimates stock value of ${money(value)}. ${low.length ? `${low.map(item => `${item.name} (${number(balances.get(item.id)?.quantity || 0, 2)} ${item.unit})`).join("; ")} ${low.length === 1 ? "is" : "are"} at/below the configured reorder point.` : "No items are at/below their configured reorder point."} Evidence: opening quantities and posted stock movements; compare with a physical count.`;
    }
    if (/trial|balanced|debit|credit/.test(q)) {
      const tb = Engine.getTrialBalance(data, asOf);
      const gap = Math.abs(tb.debitTotal - tb.creditTotal);
      return `At ${dateLabel(asOf)}, the trial balance has debits ${money(tb.debitTotal)} and credits ${money(tb.creditTotal)}. ${gap < 0.02 ? "The totals tie." : `The difference is ${money(gap)}.`} Evidence: all posted voucher lines. A balanced trial balance does not prove that every entry is correct or compliant.`;
    }
    if (/sale|revenue|turnover|income/.test(q)) {
      const activity = Engine.getLedgerActivity(data, "sales", period.start, period.end);
      const sales = activity.credit - activity.debit;
      return `Sales revenue posted in the selected period is ${money(sales)} across ${data.vouchers.filter(voucher => voucher.type === "Sales" && voucher.date >= period.start && voucher.date <= period.end).length} sales voucher(s). Evidence: Sales Revenue ledger credits less debits. This is not GST turnover certification.`;
    }
    if (/profit|loss|margin/.test(q)) {
      const pnl = Engine.getProfitAndLoss(data, period.start, period.end);
      return `The book-based P&L for the selected period shows income ${money(pnl.income)}, costs/expenses ${money(pnl.expenses)} and ${pnl.net >= 0 ? "net profit" : "net loss"} ${money(Math.abs(pnl.net))}. Evidence: income and expense ledger activity. Check accruals, depreciation, inventory count and year-end adjustments before using this result.`;
    }
    return `I can answer local questions about cash/bank, sales, profit, receivables, payables, stock, GST preview and trial-balance totals. I cannot infer statutory applicability or file a return. Your question was: “${question}”.`;
  }

  function toast(title, detail, kind) {
    const root = document.getElementById("toast-root");
    const node = document.createElement("div");
    node.className = `toast ${kind === "error" ? "error" : kind === "warning" ? "warning" : ""}`;
    node.innerHTML = `<span class="toast-icon">${kind === "error" ? "!" : kind === "warning" ? "⚠" : "✓"}</span><div><strong>${esc(title)}</strong><span>${esc(detail || "")}</span></div>`;
    root.appendChild(node);
    setTimeout(() => { node.style.opacity = "0"; node.style.transform = "translateY(5px)"; setTimeout(() => node.remove(), 220); }, 3400);
  }

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function csvCell(value) {
    const text = String(value == null ? "" : value);
    return `"${text.replace(/"/g, '""')}"`;
  }

  function exportVouchers() {
    const rows = getVoucherRows();
    const csv = [["Date", "Type", "Voucher no", "Party", "Reference", "Narration", "Taxable value", "Tax", "Total INR"], ...rows.map(voucher => [voucher.date, voucher.type, voucher.number, getPartyName(voucher.partyId), voucher.reference, voucher.narration, voucher.taxable || 0, voucher.tax || 0, voucher.total || 0])]
      .map(row => row.map(csvCell).join(",")).join("\r\n");
    downloadFile(`sutra-vouchers-${period.end}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
    toast("Voucher CSV exported", `${rows.length} visible vouchers included.`, "success");
  }

  function exportStock() {
    const balances = Engine.getStockBalances(data, period.end);
    const rows = [["Item", "HSN", "GST rate", "Quantity", "Unit", "Average cost INR", "Stock value INR"], ...(data.items || []).map(item => {
      const balance = balances.get(item.id) || { quantity: 0, averageCost: 0, value: 0 };
      return [item.name, item.hsn, item.gstRate, balance.quantity, item.unit, balance.averageCost, balance.value];
    })];
    downloadFile(`sutra-stock-${period.end}.csv`, `\uFEFF${rows.map(row => row.map(csvCell).join(",")).join("\r\n")}`, "text/csv;charset=utf-8");
    toast("Stock CSV exported", "The selected end-date valuation was included.", "success");
  }

  function exportGST() {
    const gst = Engine.getTaxSummary(data, period.start, period.end);
    const rows = [
      ["GST books preview", "Amount INR"], ["Period start", period.start], ["Period end", period.end],
      ["Outward taxable value", gst.salesTaxable], ["Output CGST", gst.output.cgst], ["Output SGST", gst.output.sgst], ["Output IGST", gst.output.igst], ["Output tax total", gst.output.total],
      ["Input CGST booked", gst.input.cgst], ["Input SGST booked", gst.input.sgst], ["Input IGST booked", gst.input.igst], ["Input tax booked total", gst.input.total], ["Provisional output less input", gst.provisionalNet],
      ["Status", "Preview only — not a return or ITC eligibility determination"]
    ];
    downloadFile(`sutra-gst-preview-${period.end}.csv`, `\uFEFF${rows.map(row => row.map(csvCell).join(",")).join("\r\n")}`, "text/csv;charset=utf-8");
    toast("GST preview exported", "The CSV is a books-side preview, not filing data.", "warning");
  }

  function reportCSVRows() {
    if (reportTab === "pnl") {
      const pnl = Engine.getProfitAndLoss(data, period.start, period.end);
      return [["Profit and Loss · books preview", "Amount INR"], ["Period", `${period.start} to ${period.end}`], ["Income", ""], ...pnl.rows.filter(row => row.ledger.nature === "income").map(row => [row.ledger.name, row.amount]), ["Total income", pnl.income], ["Costs and expenses", ""], ...pnl.rows.filter(row => row.ledger.nature === "expense").map(row => [row.ledger.name, row.amount]), ["Total costs and expenses", pnl.expenses], [pnl.net >= 0 ? "Net profit" : "Net loss", Math.abs(pnl.net)]];
    }
    if (reportTab === "bs") {
      const bs = Engine.getBalanceSheet(data, period.end);
      return [["Balance sheet · books preview", "Amount INR"], ["As at", period.end], ["Assets", ""], ...bs.asset.map(row => [row.ledger.name, row.amount]), ["Total assets", bs.totalAssets], ["Liabilities", ""], ...bs.liability.map(row => [row.ledger.name, row.amount]), ["Total liabilities", bs.totalLiabilities], ["Equity", ""], ...bs.equity.map(row => [row.ledger.name, row.amount]), ...(bs.priorProfit ? [["Prior years profit/(loss) carried forward", bs.priorProfit]] : []), ["Current year profit/(loss)", bs.profit], ["Total liabilities and equity", bs.totalLiabilitiesEquity], ["Difference", bs.difference]];
    }
    if (reportTab === "tb") {
      const tb = Engine.getTrialBalance(data, period.end);
      return [["Trial balance · books preview", "Group", "Debit INR", "Credit INR"], ["As at", period.end, "", ""], ...tb.rows.map(row => [row.ledger.name, row.ledger.group, row.debit, row.credit]), ["Totals", "", tb.debitTotal, tb.creditTotal]];
    }
    if (reportTab === "gst") {
      const gst = Engine.getTaxSummary(data, period.start, period.end);
      return [["GST summary · not a return", "Amount INR"], ["Output CGST", gst.output.cgst], ["Output SGST", gst.output.sgst], ["Output IGST", gst.output.igst], ["Output tax total", gst.output.total], ["Input CGST booked", gst.input.cgst], ["Input SGST booked", gst.input.sgst], ["Input IGST booked", gst.input.igst], ["Input tax booked total", gst.input.total], ["Provisional difference", gst.provisionalNet]];
    }
    const stock = Engine.getStockBalances(data, period.end);
    return [["Stock summary · books preview", "HSN", "Quantity", "Unit", "Average cost INR", "Value INR"], ...(data.items || []).map(item => { const balance = stock.get(item.id) || {}; return [item.name, item.hsn, balance.quantity || 0, item.unit, balance.averageCost || 0, balance.value || 0]; })];
  }

  function exportReport() {
    const rows = reportCSVRows();
    const csv = rows.map(row => row.map(csvCell).join(",")).join("\r\n");
    downloadFile(`sutra-${reportTab}-report-${period.end}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
    toast("Report CSV exported", `${reportTab.toUpperCase()} · ${period.start} to ${period.end}.`, "success");
  }

  function exportBackup() {
    const metadata = { exportedAt: new Date().toISOString(), application: "Sutra Books prototype", warning: "Fictional/demo or user-entered data. Not encrypted." };
    const payload = { ...data, backupMetadata: metadata };
    const stamp = localDateISO();
    downloadFile(`sutra-books-backup-${stamp}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
    toast("JSON backup downloaded", "Store it securely; this file is not encrypted.", "success");
  }

  function restoreBackupFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result || ""));
        Storage.restore(imported);
        data = Storage.load();
        period = getDefaultPeriod();
        route = "dashboard";
        render();
        toast("Backup restored", "Workspace loaded after schema and voucher-balance checks.", "success");
      } catch (error) {
        toast("Backup could not be restored", error.message || "Invalid JSON backup.", "error");
      }
      document.getElementById("restore-file").value = "";
    };
    reader.onerror = () => toast("Backup could not be read", "Try another JSON file.", "error");
    reader.readAsText(file);
  }

  function renderGlobalSearch(query) {
    const resultsRoot = document.getElementById("search-results");
    if (!resultsRoot) return;
    const q = String(query || "").trim().toLowerCase();
    if (!q) { resultsRoot.hidden = true; resultsRoot.innerHTML = ""; return; }
    const results = [];
    sortVouchersNewest(data.vouchers.filter(voucher => voucher.type !== "Opening" && [voucher.number, voucher.type, voucher.narration, voucher.reference, voucher.itemName, getPartyName(voucher.partyId)].some(value => String(value || "").toLowerCase().includes(q)))).slice(0, 5).forEach(voucher => results.push({ kind: "voucher", id: voucher.id, title: `${voucher.number} · ${voucher.type}`, detail: `${getPartyName(voucher.partyId)} · ${dateLabel(voucher.date)}`, amount: voucher.total }));
    data.ledgers.filter(ledger => ledger.name.toLowerCase().includes(q) || ledger.group.toLowerCase().includes(q)).slice(0, 4).forEach(ledger => results.push({ kind: "ledger", id: ledger.id, title: ledger.name, detail: `Ledger · ${ledger.group}`, amount: normalLedgerBalance(ledger, period.end) }));
    data.items.filter(item => item.name.toLowerCase().includes(q) || String(item.hsn || "").includes(q)).slice(0, 3).forEach(item => results.push({ kind: "item", id: item.id, title: item.name, detail: `Inventory · HSN ${item.hsn || "not set"}`, amount: Engine.getStockBalance(data, item.id, period.end).quantity }));
    resultsRoot.innerHTML = `<div class="search-results-head">${results.length ? `${results.length} local result${results.length === 1 ? "" : "s"}` : "No local results"}</div>${results.length ? results.map(result => `<button class="search-result" type="button" data-search-kind="${esc(result.kind)}" data-search-id="${esc(result.id)}"><span class="search-result-icon">${result.kind === "voucher" ? "▤" : result.kind === "ledger" ? "≡" : "◫"}</span><span class="search-result-copy"><strong>${esc(result.title)}</strong><span>${esc(result.detail)}</span></span><span class="search-result-amount">${result.kind === "item" ? `${number(result.amount, 2)} qty` : money(result.amount)}</span></button>`).join("") : `<div class="empty-state" style="padding:19px 10px">Nothing matched “${esc(query)}”.</div>`}`;
    resultsRoot.hidden = false;
  }

  function handleAction(button) {
    const action = button.dataset.action;
    if (action === "close-modal") closeModal();
    else if (action === "backdrop-close" && button.classList.contains("modal-backdrop")) closeModal();
    else if (action === "open-voucher") openVoucherModal(button.dataset.type || "Sales");
    else if (action === "voucher-detail") openVoucherDetail(button.dataset.id);
    else if (action === "open-ledger") openLedgerModal();
    else if (action === "open-party") openPartyModal();
    else if (action === "open-item") openItemModal();
    else if (action === "refresh-ai") { render(); toast("Book checks refreshed", "Rules evaluated against local records only.", "success"); }
    else if (action === "export-vouchers") exportVouchers();
    else if (action === "export-stock") exportStock();
    else if (action === "export-gst") exportGST();
    else if (action === "export-report") exportReport();
    else if (action === "export-backup") exportBackup();
    else if (action === "restore-backup") document.getElementById("restore-file").click();
    else if (action === "create-blank") openConfirmModal("blank");
    else if (action === "reset-demo") openConfirmModal("reset");
    else if (action === "confirm-blank") createBlankWorkspace();
    else if (action === "confirm-reset") resetDemoWorkspace();
  }

  document.addEventListener("click", event => {
    const target = event.target;
    const button = target.closest("button, .modal-backdrop");
    if (!button) {
      if (!target.closest(".global-search") && !target.closest(".search-results")) document.getElementById("search-results").hidden = true;
      return;
    }
    if (button.classList.contains("modal-backdrop") && target === button) { closeModal(); return; }
    if (button.dataset.searchKind) {
      const kind = button.dataset.searchKind;
      const id = button.dataset.searchId;
      document.getElementById("search-results").hidden = true;
      document.getElementById("global-search-input").value = "";
      if (kind === "voucher") openVoucherDetail(id);
      else if (kind === "ledger") { route = "ledgers"; ledgerQuery = Engine.findLedger(data, id)?.name || ""; render(); }
      else if (kind === "item") { route = "inventory"; render(); }
      return;
    }
    if (button.dataset.route) {
      if (button.dataset.reportTab) reportTab = button.dataset.reportTab;
      route = button.dataset.route;
      document.getElementById("sidebar").classList.remove("is-open");
      document.getElementById("sidebar-scrim").classList.remove("is-open");
      document.getElementById("search-results").hidden = true;
      render();
      return;
    }
    if (button.dataset.modalType) {
      document.getElementById("voucher-type").value = button.dataset.modalType;
      document.querySelectorAll(".voucher-type-choice").forEach(tab => {
        tab.classList.toggle("active", tab.dataset.modalType === button.dataset.modalType);
        tab.setAttribute("aria-selected", String(tab.dataset.modalType === button.dataset.modalType));
      });
      const date = document.getElementById("voucher-date")?.value || dateFieldValue();
      document.getElementById("voucher-number").value = Engine.getVoucherNumber(data, button.dataset.modalType, date);
      document.querySelector(".modal-head h2").textContent = `New ${button.dataset.modalType.toLowerCase()} voucher`;
      renderVoucherFields(button.dataset.modalType);
      return;
    }
    if (button.dataset.reportTab) {
      reportTab = button.dataset.reportTab;
      render();
      return;
    }
    if (button.dataset.question) { askAI(button.dataset.question); return; }
    if (button.id === "menu-toggle") {
      document.getElementById("sidebar").classList.add("is-open");
      document.getElementById("sidebar-scrim").classList.add("is-open");
      return;
    }
    if (button.id === "sidebar-close" || button.id === "sidebar-scrim") {
      document.getElementById("sidebar").classList.remove("is-open");
      document.getElementById("sidebar-scrim").classList.remove("is-open");
      return;
    }
    if (button.id === "period-trigger") { openPeriodModal(); return; }
    if (button.id === "top-new-voucher") { openVoucherModal("Sales"); return; }
    if (button.id === "sidebar-company-name" || button.closest(".company-switcher")) { route = "settings"; render(); return; }
    if (button.dataset.action) { handleAction(button); return; }
    if (button.classList.contains("report-tab")) { reportTab = button.dataset.reportTab || reportTab; render(); return; }
  });

  document.addEventListener("input", event => {
    const target = event.target;
    if (target.id === "global-search-input") { renderGlobalSearch(target.value); return; }
    if (target.id === "voucher-search-input") {
      voucherQuery = target.value;
      renderVoucherTableRows(getVoucherRows());
      return;
    }
    if (target.id === "ledger-search-input") {
      ledgerQuery = target.value;
      const cursor = target.selectionStart;
      const page = document.getElementById("page-content");
      page.innerHTML = renderLedgers();
      const next = document.getElementById("ledger-search-input");
      if (next) { next.focus(); next.setSelectionRange(cursor, cursor); }
      return;
    }
    if (["voucher-quantity", "voucher-unit-price", "voucher-amount", "voucher-item", "voucher-party"].includes(target.id)) updateVoucherPreview();
  });

  document.addEventListener("change", event => {
    const target = event.target;
    if (target.id === "voucher-type-filter") {
      voucherFilter = target.value;
      renderVoucherTableRows(getVoucherRows());
    } else if (["voucher-item", "voucher-party", "voucher-date"].includes(target.id)) {
      if (target.id === "voucher-item") {
        const item = Engine.findItem(data, target.value);
        const rate = document.getElementById("voucher-unit-price");
        const type = document.getElementById("voucher-type")?.value;
        if (item && rate && type) rate.value = type === "Sales" ? (item.sellingPrice || 0) : (item.openingCost || 0);
      }
      if (target.id === "voucher-date") {
        const type = document.getElementById("voucher-type")?.value;
        document.getElementById("voucher-number").value = Engine.getVoucherNumber(data, type, target.value);
      }
      updateVoucherPreview();
    }
  });

  document.addEventListener("submit", event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();
    try {
      if (form.id === "voucher-form") handleVoucherSubmit(form);
      else if (form.id === "period-form") handlePeriodSubmit(form);
      else if (form.id === "settings-form") handleSettingsSubmit(form);
      else if (form.id === "ledger-form") createLedger(form);
      else if (form.id === "party-form") createParty(form);
      else if (form.id === "item-form") createItem(form);
      else if (form.id === "ai-query-form") {
        const input = form.querySelector("#ai-query");
        const question = input.value.trim();
        if (question) askAI(question);
      }
    } catch (error) {
      toast("Could not complete that action", error.message || "Check the fields and try again.", "error");
    }
  });

  document.getElementById("restore-file").addEventListener("change", event => restoreBackupFile(event.target.files && event.target.files[0]));
  document.getElementById("sidebar-scrim").addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("is-open");
    document.getElementById("sidebar-scrim").classList.remove("is-open");
  });
  document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      document.getElementById("global-search-input").focus();
    }
    if (event.key === "Escape") {
      if (document.getElementById("modal-root").innerHTML) closeModal();
      document.getElementById("search-results").hidden = true;
      document.getElementById("sidebar").classList.remove("is-open");
      document.getElementById("sidebar-scrim").classList.remove("is-open");
    }
  });

  render();
})();
