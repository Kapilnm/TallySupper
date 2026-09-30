/*
 * Demo book seed for Sutra Books.
 * Every name and transaction below is fictional. No network data is used.
 */
(function () {
  const company = {
    name: "Aarohan Office Supplies",
    legalForm: "Private limited company · demo profile",
    gstin: "DEMO ONLY",
    pan: "DEMO ONLY",
    state: "Maharashtra",
    stateCode: "27",
    gstFrequency: "Monthly",
    fyStart: "2026-04-01",
    address: "Pune, Maharashtra · Sample workspace",
    currency: "INR",
    isDemo: true
  };

  const ledgers = [
    { id: "cash", name: "Cash in Hand", group: "Cash & cash equivalents", nature: "asset", system: true },
    { id: "bank", name: "Current Account · 4042", group: "Cash & cash equivalents", nature: "asset", system: true },
    { id: "inventory", name: "Inventory on Hand", group: "Current assets", nature: "asset", system: true },
    { id: "gst-in-cgst", name: "Input CGST", group: "GST input credit · review", nature: "asset", system: true },
    { id: "gst-in-sgst", name: "Input SGST", group: "GST input credit · review", nature: "asset", system: true },
    { id: "gst-in-igst", name: "Input IGST", group: "GST input credit · review", nature: "asset", system: true },
    { id: "gst-out-cgst", name: "Output CGST", group: "GST payable", nature: "liability", system: true },
    { id: "gst-out-sgst", name: "Output SGST", group: "GST payable", nature: "liability", system: true },
    { id: "gst-out-igst", name: "Output IGST", group: "GST payable", nature: "liability", system: true },
    { id: "tds-payable", name: "TDS payable · setup required", group: "Statutory liabilities", nature: "liability", system: true },
    { id: "sales", name: "Sales Revenue", group: "Operating income", nature: "income", system: true },
    { id: "cogs", name: "Cost of Goods Sold", group: "Direct costs", nature: "expense", system: true },
    { id: "rent", name: "Rent Expense", group: "Indirect expenses", nature: "expense", system: false },
    { id: "salary", name: "Salaries & Wages", group: "Indirect expenses", nature: "expense", system: false },
    { id: "utilities", name: "Utilities", group: "Indirect expenses", nature: "expense", system: false },
    { id: "bank-charges", name: "Bank Charges", group: "Indirect expenses", nature: "expense", system: false },
    { id: "capital", name: "Owner's Capital", group: "Equity", nature: "equity", system: true },
    { id: "retained", name: "Retained Earnings", group: "Equity", nature: "equity", system: true },
    { id: "ledger-cedar", name: "Cedar & Co.", group: "Trade receivables", nature: "asset", partyId: "cedar", system: true },
    { id: "ledger-neem", name: "Neem Retail Pvt Ltd", group: "Trade receivables", nature: "asset", partyId: "neem", system: true },
    { id: "ledger-pravaah", name: "Pravaah Traders", group: "Trade payables", nature: "liability", partyId: "pravaah", system: true },
    { id: "ledger-kuber", name: "Kuber Paper House", group: "Trade payables", nature: "liability", partyId: "kuber", system: true }
  ];

  const parties = [
    { id: "cedar", ledgerId: "ledger-cedar", name: "Cedar & Co.", role: "customer", gstin: "DEMO · 27 state", state: "Maharashtra", stateCode: "27", paymentDays: 30 },
    { id: "neem", ledgerId: "ledger-neem", name: "Neem Retail Pvt Ltd", role: "customer", gstin: "DEMO · 29 state", state: "Karnataka", stateCode: "29", paymentDays: 30 },
    { id: "pravaah", ledgerId: "ledger-pravaah", name: "Pravaah Traders", role: "supplier", gstin: "DEMO · 27 state", state: "Maharashtra", stateCode: "27", paymentDays: 30 },
    { id: "kuber", ledgerId: "ledger-kuber", name: "Kuber Paper House", role: "supplier", gstin: "DEMO · 24 state", state: "Gujarat", stateCode: "24", paymentDays: 30 }
  ];

  const items = [
    { id: "paper-a4", name: "A4 Copier Paper", hsn: "480256", gstRate: 12, unit: "Ream", openingQty: 240, openingCost: 210, sellingPrice: 320, reorderLevel: 380 },
    { id: "notebook", name: "Classic Notebook", hsn: "482010", gstRate: 12, unit: "Piece", openingQty: 500, openingCost: 80, sellingPrice: 120, reorderLevel: 300 },
    { id: "gel-pen", name: "Gel Pen Set", hsn: "960810", gstRate: 18, unit: "Set", openingQty: 450, openingCost: 48, sellingPrice: 75, reorderLevel: 160 },
    { id: "organizer", name: "Desk Organiser", hsn: "392610", gstRate: 18, unit: "Piece", openingQty: 150, openingCost: 200, sellingPrice: 310, reorderLevel: 50 },
    { id: "file-folder", name: "File Folder", hsn: "482030", gstRate: 12, unit: "Piece", openingQty: 800, openingCost: 24, sellingPrice: 38, reorderLevel: 240 },
    { id: "toner", name: "Printer Toner", hsn: "844399", gstRate: 18, unit: "Piece", openingQty: 100, openingCost: 450, sellingPrice: 650, reorderLevel: 35 }
  ];

  const round2 = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  const moneyLine = (ledgerId, debit, credit) => ({ ledgerId, debit: round2(debit || 0), credit: round2(credit || 0) });
  const taxSplit = (taxable, rate, interstate) => {
    const total = round2(taxable * Number(rate || 0) / 100);
    if (interstate) return { cgst: 0, sgst: 0, igst: total, total };
    const cgst = round2(total / 2);
    return { cgst, sgst: round2(total - cgst), igst: 0, total };
  };

  const vouchers = [];
  const openingLines = [
    moneyLine("cash", 50000, 0),
    moneyLine("bank", 425000, 0),
    moneyLine("ledger-cedar", 200000, 0),
    moneyLine("ledger-neem", 110000, 0),
    moneyLine("inventory", 206200, 0),
    moneyLine("gst-in-cgst", 12000, 0),
    moneyLine("gst-in-sgst", 12000, 0),
    moneyLine("ledger-pravaah", 0, 120000),
    moneyLine("ledger-kuber", 0, 75000),
    moneyLine("gst-out-cgst", 0, 9000),
    moneyLine("gst-out-sgst", 0, 9000),
    moneyLine("capital", 0, 802200)
  ];
  vouchers.push({
    id: "v-opening-2026", type: "Opening", number: "OB-2026-001", date: "2026-03-31", dueDate: "",
    partyId: "", reference: "Opening position", narration: "Fictional opening balances for the demo company.",
    taxable: 0, tax: 0, total: 0, lines: openingLines, stockMoves: [],
    openingBills: [
      { partyId: "cedar", role: "customer", amount: 200000, dueDate: "2026-04-30" },
      { partyId: "neem", role: "customer", amount: 110000, dueDate: "2026-04-30" },
      { partyId: "pravaah", role: "supplier", amount: 120000, dueDate: "2026-04-30" },
      { partyId: "kuber", role: "supplier", amount: 75000, dueDate: "2026-04-30" }
    ],
    status: "Posted"
  });

  function currentAverageCost(productId) {
    const item = items.find(row => row.id === productId);
    if (!item) return 0;
    let qty = Number(item.openingQty || 0);
    let value = qty * Number(item.openingCost || 0);
    const earlier = vouchers
      .filter(voucher => voucher.date >= "2026-04-01" && voucher.stockMoves && voucher.stockMoves.length)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number));
    earlier.forEach(voucher => voucher.stockMoves.forEach(move => {
      if (move.productId !== productId) return;
      const moveQty = Number(move.qty || 0);
      if (moveQty > 0) {
        value += moveQty * Number(move.unitCost || 0);
        qty += moveQty;
      } else if (moveQty < 0) {
        const outQty = Math.min(Math.abs(moveQty), qty);
        const avg = qty ? value / qty : 0;
        value -= outQty * avg;
        qty -= outQty;
      }
    }));
    return qty ? round2(value / qty) : Number(item.openingCost || 0);
  }

  function addSale(number, date, partyId, productId, qty, rate, narration) {
    const party = parties.find(row => row.id === partyId);
    const item = items.find(row => row.id === productId);
    const taxable = round2(qty * rate);
    const interstate = Boolean(party && party.stateCode !== company.stateCode);
    const tax = taxSplit(taxable, item.gstRate, interstate);
    const total = round2(taxable + tax.total);
    const cost = currentAverageCost(productId);
    const costTotal = round2(qty * cost);
    const lines = [
      moneyLine(party.ledgerId, total, 0),
      moneyLine("cogs", costTotal, 0),
      moneyLine("sales", 0, taxable)
    ];
    if (tax.cgst) lines.push(moneyLine("gst-out-cgst", 0, tax.cgst));
    if (tax.sgst) lines.push(moneyLine("gst-out-sgst", 0, tax.sgst));
    if (tax.igst) lines.push(moneyLine("gst-out-igst", 0, tax.igst));
    if (costTotal) lines.push(moneyLine("inventory", 0, costTotal));
    const dueDate = new Date(`${date}T12:00:00`);
    dueDate.setDate(dueDate.getDate() + party.paymentDays);
    vouchers.push({
      id: `v-${number.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, type: "Sales", number, date,
      dueDate: dueDate.toISOString().slice(0, 10), partyId, itemId: productId, itemName: item.name,
      quantity: qty, unit: item.unit, unitPrice: rate, unitCost: cost, gstRate: item.gstRate,
      taxType: interstate ? "IGST" : "CGST + SGST", taxBreakdown: tax, taxable, tax: tax.total, total,
      reference: "", narration, lines,
      stockMoves: [{ productId, qty: -qty, unitCost: cost }], status: "Posted"
    });
  }

  function addPurchase(number, date, partyId, productId, qty, rate, narration) {
    const party = parties.find(row => row.id === partyId);
    const item = items.find(row => row.id === productId);
    const taxable = round2(qty * rate);
    const interstate = Boolean(party && party.stateCode !== company.stateCode);
    const tax = taxSplit(taxable, item.gstRate, interstate);
    const total = round2(taxable + tax.total);
    const lines = [moneyLine("inventory", taxable, 0), moneyLine(party.ledgerId, 0, total)];
    if (tax.cgst) lines.push(moneyLine("gst-in-cgst", tax.cgst, 0));
    if (tax.sgst) lines.push(moneyLine("gst-in-sgst", tax.sgst, 0));
    if (tax.igst) lines.push(moneyLine("gst-in-igst", tax.igst, 0));
    const dueDate = new Date(`${date}T12:00:00`);
    dueDate.setDate(dueDate.getDate() + party.paymentDays);
    vouchers.push({
      id: `v-${number.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, type: "Purchase", number, date,
      dueDate: dueDate.toISOString().slice(0, 10), partyId, itemId: productId, itemName: item.name,
      quantity: qty, unit: item.unit, unitPrice: rate, unitCost: rate, gstRate: item.gstRate,
      taxType: interstate ? "IGST" : "CGST + SGST", taxBreakdown: tax, taxable, tax: tax.total, total,
      reference: "", narration, lines,
      stockMoves: [{ productId, qty, unitCost: rate }], status: "Posted"
    });
  }

  function addCashVoucher(type, number, date, partyId, ledgerId, accountId, amount, narration) {
    const party = parties.find(row => row.id === partyId);
    const counterLedgerId = party ? party.ledgerId : ledgerId;
    const lines = type === "Receipt"
      ? [moneyLine(accountId, amount, 0), moneyLine(counterLedgerId, 0, amount)]
      : [moneyLine(counterLedgerId, amount, 0), moneyLine(accountId, 0, amount)];
    vouchers.push({
      id: `v-${number.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, type, number, date, dueDate: "",
      partyId: partyId || "", accountId, reference: "", narration, taxable: 0, tax: 0, total: round2(amount),
      lines, stockMoves: [], status: "Posted"
    });
  }

  function addExpense(number, date, ledgerId, amount, narration) {
    vouchers.push({
      id: `v-${number.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, type: "Payment", number, date,
      dueDate: "", partyId: "", accountId: "bank", reference: "", narration, taxable: 0, tax: 0,
      total: round2(amount), lines: [moneyLine(ledgerId, amount, 0), moneyLine("bank", 0, amount)],
      stockMoves: [], status: "Posted"
    });
  }

  addSale("S-26001", "2026-04-06", "cedar", "notebook", 80, 120, "Classic notebooks · April supply");
  addPurchase("P-26001", "2026-04-08", "pravaah", "paper-a4", 100, 215, "A4 copier paper replenishment");
  addCashVoucher("Receipt", "R-26001", "2026-04-12", "cedar", "", "bank", 40000, "Part receipt against opening and sales balance");
  addCashVoucher("Payment", "PAY-26001", "2026-04-15", "pravaah", "", "bank", 25000, "Supplier settlement");
  addSale("S-26002", "2026-04-21", "neem", "gel-pen", 150, 75, "Gel pen sets · inter-state supply");
  addExpense("PAY-26002", "2026-04-25", "rent", 25000, "April office rent");
  addPurchase("P-26002", "2026-05-04", "kuber", "toner", 40, 460, "Printer toner replenishment");
  addSale("S-26003", "2026-05-10", "cedar", "organizer", 30, 310, "Desk organisers · local supply");
  addCashVoucher("Receipt", "R-26002", "2026-05-18", "neem", "", "bank", 20000, "Customer receipt");
  addExpense("PAY-26003", "2026-05-26", "rent", 25000, "May office rent");
  addExpense("PAY-26004", "2026-05-30", "salary", 88000, "May payroll settlement · demo posting");
  addSale("S-26004", "2026-06-05", "neem", "toner", 12, 650, "Printer toner · inter-state supply");
  addPurchase("P-26003", "2026-06-10", "kuber", "file-folder", 250, 25, "File folders · inter-state purchase");
  addCashVoucher("Receipt", "R-26003", "2026-06-18", "cedar", "", "bank", 60000, "Customer receipt");
  addCashVoucher("Payment", "PAY-26005", "2026-07-15", "kuber", "", "bank", 32000, "Supplier settlement");
  addSale("S-26005", "2026-07-03", "cedar", "file-folder", 150, 38, "File folders · local supply");
  addExpense("PAY-26006", "2026-07-31", "salary", 88000, "July payroll settlement · demo posting");
  addSale("S-26006", "2026-08-06", "neem", "paper-a4", 75, 320, "A4 copier paper · inter-state supply");
  addExpense("PAY-26007", "2026-08-15", "rent", 25000, "August office rent");
  addPurchase("P-26004", "2026-08-19", "pravaah", "paper-a4", 80, 218, "A4 copier paper replenishment");
  addSale("S-26007", "2026-09-03", "cedar", "notebook", 100, 120, "Classic notebooks · local supply");
  addCashVoucher("Receipt", "R-26004", "2026-09-12", "neem", "", "bank", 40000, "Customer receipt");
  addExpense("PAY-26008", "2026-09-17", "utilities", 5850, "Utilities · demo posting");
  addCashVoucher("Payment", "PAY-26009", "2026-09-20", "pravaah", "", "bank", 40000, "Supplier settlement");

  const auditLog = vouchers.map(voucher => ({
    id: `audit-${voucher.id}`,
    at: `${voucher.date}T12:00:00.000Z`,
    action: "POST",
    entity: "Voucher",
    entityId: voucher.id,
    summary: `${voucher.type} ${voucher.number} posted in fictional demo books`,
    actor: "Demo bookkeeper"
  }));

  window.SutraDemo = {
    schemaVersion: 1,
    company,
    ledgers,
    parties,
    items,
    vouchers,
    auditLog,
    settings: {
      currency: "INR",
      sampleWorkspace: true,
      localOnly: true,
      tdsConfigured: false,
      taxRulePackDate: "2026-09-30"
    }
  };
})();
