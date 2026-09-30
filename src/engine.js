/* Core bookkeeping rules: canonical double-entry postings, balances, stock and report helpers. */
(function () {
  const round2 = value => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  const sum = values => round2(values.reduce((total, value) => total + Number(value || 0), 0));
  const validIsoDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
    const date = new Date(`${value}T12:00:00`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const normalizePeriod = (start, end) => ({ start, end });
  const addDays = (iso, days) => {
    const date = new Date(`${iso}T12:00:00`);
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  };
  const moneyLine = (ledgerId, debit, credit) => ({ ledgerId, debit: round2(debit), credit: round2(credit) });
  const typePrefix = { Sales: "S", Purchase: "P", Receipt: "R", Payment: "PAY", Journal: "J" };

  function findLedger(data, id) {
    return (data.ledgers || []).find(ledger => ledger.id === id);
  }

  function findParty(data, id) {
    return (data.parties || []).find(party => party.id === id);
  }

  function findItem(data, id) {
    return (data.items || []).find(item => item.id === id);
  }

  function getVoucherNumber(data, type, date) {
    const prefix = typePrefix[type] || "V";
    const year = String(date || new Date().toISOString().slice(0, 10)).slice(2, 4);
    const numbers = (data.vouchers || [])
      .filter(voucher => voucher.type === type && String(voucher.number || "").startsWith(`${prefix}-${year}`))
      .map(voucher => Number(String(voucher.number).slice(-3)))
      .filter(Number.isFinite);
    const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
    return `${prefix}-${year}${String(next).padStart(3, "0")}`;
  }

  function validateLines(lines) {
    const clean = (lines || []).filter(line => line && (Number(line.debit) || Number(line.credit)));
    if (clean.length < 2) throw new Error("A voucher needs at least two accounting lines.");
    if (clean.some(line => !line.ledgerId || !Number.isFinite(Number(line.debit)) || !Number.isFinite(Number(line.credit)) || Number(line.debit) < 0 || Number(line.credit) < 0)) {
      throw new Error("One or more accounting lines are incomplete or invalid.");
    }
    if (clean.some(line => Number(line.debit) > 0 && Number(line.credit) > 0)) {
      throw new Error("A line cannot have both a debit and a credit amount.");
    }
    const debit = sum(clean.map(line => line.debit));
    const credit = sum(clean.map(line => line.credit));
    if (Math.abs(debit - credit) > 0.01) throw new Error(`This voucher is out of balance by ₹${Math.abs(debit - credit).toFixed(2)}.`);
    return clean.map(line => moneyLine(line.ledgerId, line.debit, line.credit));
  }

  function getStockBalances(data, asOf) {
    const balances = new Map();
    (data.items || []).forEach(item => {
      const quantity = Number(item.openingQty || 0);
      balances.set(item.id, {
        itemId: item.id,
        quantity,
        value: round2(quantity * Number(item.openingCost || 0)),
        averageCost: Number(item.openingCost || 0)
      });
    });
    const movements = (data.vouchers || [])
      .filter(voucher => voucher.date && (!asOf || voucher.date <= asOf))
      .flatMap(voucher => (voucher.stockMoves || []).map(move => ({ ...move, date: voucher.date, voucherId: voucher.id })))
      .sort((a, b) => a.date.localeCompare(b.date) || a.voucherId.localeCompare(b.voucherId));
    movements.forEach(move => {
      const balance = balances.get(move.productId);
      if (!balance) return;
      const quantity = Number(move.qty || 0);
      const unitCost = Number(move.unitCost || 0);
      if (quantity > 0) {
        balance.quantity += quantity;
        balance.value = round2(balance.value + quantity * unitCost);
      } else if (quantity < 0) {
        const outQty = Math.abs(quantity);
        balance.quantity -= outQty;
        balance.value = round2(balance.value - outQty * unitCost);
      }
      if (Math.abs(balance.quantity) < 0.000001) balance.quantity = 0;
      if (Math.abs(balance.value) < 0.01) balance.value = 0;
      balance.averageCost = balance.quantity > 0 ? round2(balance.value / balance.quantity) : 0;
    });
    return balances;
  }

  function getStockBalance(data, itemId, asOf) {
    const balance = getStockBalances(data, asOf).get(itemId);
    return balance || { itemId, quantity: 0, value: 0, averageCost: 0 };
  }

  function getLedgerNet(data, ledgerId, asOf) {
    let debit = 0;
    let credit = 0;
    (data.vouchers || []).forEach(voucher => {
      if (asOf && voucher.date > asOf) return;
      (voucher.lines || []).forEach(line => {
        if (line.ledgerId !== ledgerId) return;
        debit += Number(line.debit || 0);
        credit += Number(line.credit || 0);
      });
    });
    return { debit: round2(debit), credit: round2(credit), net: round2(debit - credit) };
  }

  function getLedgerActivity(data, ledgerId, start, end) {
    let debit = 0;
    let credit = 0;
    (data.vouchers || []).forEach(voucher => {
      if (start && voucher.date < start) return;
      if (end && voucher.date > end) return;
      (voucher.lines || []).forEach(line => {
        if (line.ledgerId !== ledgerId) return;
        debit += Number(line.debit || 0);
        credit += Number(line.credit || 0);
      });
    });
    return { debit: round2(debit), credit: round2(credit), net: round2(debit - credit) };
  }

  function naturalBalance(ledger, net) {
    if (!ledger) return round2(net);
    return round2(["asset", "expense"].includes(ledger.nature) ? net : -net);
  }

  function getTrialBalance(data, asOf) {
    const rows = (data.ledgers || []).map(ledger => {
      const balance = getLedgerNet(data, ledger.id, asOf).net;
      return {
        ledger,
        debit: balance > 0 ? round2(balance) : 0,
        credit: balance < 0 ? round2(Math.abs(balance)) : 0,
        net: balance
      };
    }).filter(row => row.debit || row.credit);
    return {
      rows,
      debitTotal: sum(rows.map(row => row.debit)),
      creditTotal: sum(rows.map(row => row.credit))
    };
  }

  function getProfitAndLoss(data, start, end) {
    const rows = (data.ledgers || [])
      .filter(ledger => ["income", "expense"].includes(ledger.nature))
      .map(ledger => {
        const activity = getLedgerActivity(data, ledger.id, start, end);
        return { ledger, amount: Math.max(0, naturalBalance(ledger, activity.net)), activity };
      })
      .filter(row => row.amount > 0.005)
      .sort((a, b) => a.ledger.name.localeCompare(b.ledger.name));
    const income = sum(rows.filter(row => row.ledger.nature === "income").map(row => row.amount));
    const expenses = sum(rows.filter(row => row.ledger.nature === "expense").map(row => row.amount));
    return { rows, income, expenses, net: round2(income - expenses) };
  }

  function getFiscalYearStart(asOf) {
    const date = new Date(`${asOf}T12:00:00`);
    const year = date.getUTCMonth() >= 3 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
    return `${year}-04-01`;
  }

  function getBalanceSheet(data, asOf) {
    const fiscalStart = getFiscalYearStart(asOf);
    const groups = { asset: [], liability: [], equity: [] };
    (data.ledgers || []).forEach(ledger => {
      if (!groups[ledger.nature]) return;
      const net = getLedgerNet(data, ledger.id, asOf).net;
      const amount = naturalBalance(ledger, net);
      if (Math.abs(amount) > 0.005) groups[ledger.nature].push({ ledger, amount });
    });
    groups.asset.sort((a, b) => a.ledger.name.localeCompare(b.ledger.name));
    groups.liability.sort((a, b) => a.ledger.name.localeCompare(b.ledger.name));
    groups.equity.sort((a, b) => a.ledger.name.localeCompare(b.ledger.name));
    const profit = getProfitAndLoss(data, fiscalStart, asOf).net;
    const priorDates = (data.vouchers || []).map(voucher => voucher.date).filter(date => date < fiscalStart).sort();
    const priorProfit = priorDates.length ? getProfitAndLoss(data, priorDates[0], addDays(fiscalStart, -1)).net : 0;
    const totalAssets = sum(groups.asset.map(row => row.amount));
    const totalLiabilities = sum(groups.liability.map(row => row.amount));
    const totalEquity = sum(groups.equity.map(row => row.amount)) + priorProfit + profit;
    return {
      ...groups,
      profit,
      priorProfit: round2(priorProfit),
      totalAssets,
      totalLiabilities,
      totalEquity: round2(totalEquity),
      totalLiabilitiesEquity: round2(totalLiabilities + totalEquity),
      difference: round2(totalAssets - totalLiabilities - totalEquity),
      fiscalStart
    };
  }

  function getTaxSummary(data, start, end) {
    const summary = {
      salesTaxable: 0, purchaseTaxable: 0,
      output: { cgst: 0, sgst: 0, igst: 0, total: 0 },
      input: { cgst: 0, sgst: 0, igst: 0, total: 0 },
      salesCount: 0, purchaseCount: 0
    };
    (data.vouchers || []).forEach(voucher => {
      if (voucher.date < start || voucher.date > end) return;
      if (!["Sales", "Purchase"].includes(voucher.type)) return;
      const destination = voucher.type === "Sales" ? summary.output : summary.input;
      const tax = voucher.taxBreakdown || {};
      destination.cgst += Number(tax.cgst || 0);
      destination.sgst += Number(tax.sgst || 0);
      destination.igst += Number(tax.igst || 0);
      destination.total += Number(tax.total || 0);
      if (voucher.type === "Sales") {
        summary.salesCount += 1;
        summary.salesTaxable += Number(voucher.taxable || 0);
      } else {
        summary.purchaseCount += 1;
        summary.purchaseTaxable += Number(voucher.taxable || 0);
      }
    });
    Object.keys(summary.output).forEach(key => { summary.output[key] = round2(summary.output[key]); });
    Object.keys(summary.input).forEach(key => { summary.input[key] = round2(summary.input[key]); });
    summary.salesTaxable = round2(summary.salesTaxable);
    summary.purchaseTaxable = round2(summary.purchaseTaxable);
    summary.provisionalNet = round2(summary.output.total - summary.input.total);
    return summary;
  }

  function getOutstandingBills(data, asOf) {
    const parties = new Map((data.parties || []).map(party => [party.id, party]));
    const bills = [];
    const vouchers = (data.vouchers || [])
      .filter(voucher => !asOf || voucher.date <= asOf)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number));
    const applyPayment = (partyId, role, amount) => {
      let remaining = Number(amount || 0);
      const eligibleTypes = role === "customer" ? ["Sales", "Opening"] : ["Purchase", "Opening"];
      const candidates = bills
        .filter(bill => bill.partyId === partyId && bill.role === role && eligibleTypes.includes(bill.sourceType) && bill.openAmount > 0)
        .sort((a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number));
      candidates.forEach(bill => {
        if (remaining <= 0.005) return;
        const applied = Math.min(bill.openAmount, remaining);
        bill.openAmount = round2(bill.openAmount - applied);
        remaining = round2(remaining - applied);
      });
    };

    vouchers.forEach(voucher => {
      if (voucher.type === "Opening") {
        (voucher.openingBills || []).forEach((bill, index) => {
          const party = parties.get(bill.partyId);
          bills.push({
            id: `${voucher.id}-${index}`, partyId: bill.partyId, partyName: party ? party.name : "Opening balance",
            role: bill.role, number: "Opening balance", date: voucher.date, dueDate: bill.dueDate || voucher.date,
            sourceType: "Opening", amount: Number(bill.amount || 0), openAmount: Number(bill.amount || 0)
          });
        });
      } else if (["Sales", "Purchase"].includes(voucher.type) && voucher.partyId) {
        const party = parties.get(voucher.partyId);
        const role = voucher.type === "Sales" ? "customer" : "supplier";
        bills.push({
          id: voucher.id, partyId: voucher.partyId, partyName: party ? party.name : "Unknown party", role,
          number: voucher.number, date: voucher.date, dueDate: voucher.dueDate || addDays(voucher.date, 30),
          sourceType: voucher.type, amount: Number(voucher.total || 0), openAmount: Number(voucher.total || 0)
        });
      } else if (voucher.type === "Receipt" && voucher.partyId) {
        applyPayment(voucher.partyId, "customer", voucher.total || 0);
      } else if (voucher.type === "Payment" && voucher.partyId) {
        applyPayment(voucher.partyId, "supplier", voucher.total || 0);
      }
    });
    return bills.filter(bill => bill.openAmount > 0.005);
  }

  function createVoucher(data, input) {
    const type = input.type;
    const date = String(input.date || "");
    if (!validIsoDate(date)) throw new Error("Enter a valid voucher date.");
    if (!typePrefix[type]) throw new Error("Choose a supported voucher type.");
    const narration = String(input.narration || "").trim();
    const reference = String(input.reference || "").trim();
    const id = `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    let voucher;

    if (["Sales", "Purchase"].includes(type)) {
      const party = findParty(data, input.partyId);
      const item = findItem(data, input.itemId);
      if (!party) throw new Error("Choose a customer or supplier.");
      if ((type === "Sales" && party.role !== "customer") || (type === "Purchase" && party.role !== "supplier")) {
        throw new Error(type === "Sales" ? "Sales vouchers need a customer." : "Purchase vouchers need a supplier.");
      }
      if (!item) throw new Error("Choose an inventory item.");
      const quantity = Number(input.quantity);
      const unitPrice = Number(input.unitPrice);
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Quantity must be greater than zero.");
      if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error("Enter a valid unit price.");
      const taxable = round2(quantity * unitPrice);
      const interstate = Boolean(party.stateCode && data.company.stateCode && party.stateCode !== data.company.stateCode);
      const taxTotal = round2(taxable * Number(item.gstRate || 0) / 100);
      const cgst = interstate ? 0 : round2(taxTotal / 2);
      const sgst = interstate ? 0 : round2(taxTotal - cgst);
      const igst = interstate ? taxTotal : 0;
      const tax = { cgst, sgst, igst, total: round2(cgst + sgst + igst) };
      const total = round2(taxable + tax.total);
      const stockBefore = getStockBalance(data, item.id, date);
      const dueDate = addDays(date, Number(party.paymentDays || 30));
      const lines = [];
      let stockMoves = [];
      let unitCost = 0;
      if (type === "Sales") {
        if (stockBefore.quantity + 0.000001 < quantity) {
          throw new Error(`Not enough ${item.name} in stock. Available: ${stockBefore.quantity} ${item.unit}.`);
        }
        unitCost = Number(stockBefore.averageCost || item.openingCost || 0);
        const cost = round2(quantity * unitCost);
        lines.push(moneyLine(party.ledgerId, total, 0));
        if (cost) lines.push(moneyLine("cogs", cost, 0));
        lines.push(moneyLine("sales", 0, taxable));
        if (cgst) lines.push(moneyLine("gst-out-cgst", 0, cgst));
        if (sgst) lines.push(moneyLine("gst-out-sgst", 0, sgst));
        if (igst) lines.push(moneyLine("gst-out-igst", 0, igst));
        if (cost) lines.push(moneyLine("inventory", 0, cost));
        stockMoves = [{ productId: item.id, qty: -quantity, unitCost }];
      } else {
        unitCost = unitPrice;
        lines.push(moneyLine("inventory", taxable, 0));
        if (cgst) lines.push(moneyLine("gst-in-cgst", cgst, 0));
        if (sgst) lines.push(moneyLine("gst-in-sgst", sgst, 0));
        if (igst) lines.push(moneyLine("gst-in-igst", igst, 0));
        lines.push(moneyLine(party.ledgerId, 0, total));
        stockMoves = [{ productId: item.id, qty: quantity, unitCost }];
      }
      voucher = {
        id, type, number: getVoucherNumber(data, type, date), date, dueDate,
        partyId: party.id, itemId: item.id, itemName: item.name, quantity, unit: item.unit,
        unitPrice, unitCost, gstRate: Number(item.gstRate || 0), taxType: interstate ? "IGST" : "CGST + SGST",
        taxBreakdown: tax, taxable, tax: tax.total, total, reference, narration,
        lines, stockMoves, status: "Posted"
      };
    } else if (["Receipt", "Payment"].includes(type)) {
      const amount = Number(input.amount);
      const accountId = input.accountId;
      const party = input.partyId ? findParty(data, input.partyId) : null;
      const ledgerId = party ? party.ledgerId : input.ledgerId;
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be greater than zero.");
      if (!findLedger(data, accountId) || !["cash", "bank"].includes(accountId)) throw new Error("Choose Cash or Bank as the settlement account.");
      if (!findLedger(data, ledgerId)) throw new Error("Choose the counter-ledger for this voucher.");
      if (type === "Receipt") {
        voucher = { id, type, number: getVoucherNumber(data, type, date), date, dueDate: "", partyId: party ? party.id : "", accountId, reference, narration, taxable: 0, tax: 0, total: round2(amount), lines: [moneyLine(accountId, amount, 0), moneyLine(ledgerId, 0, amount)], stockMoves: [], status: "Posted" };
      } else {
        voucher = { id, type, number: getVoucherNumber(data, type, date), date, dueDate: "", partyId: party ? party.id : "", accountId, reference, narration, taxable: 0, tax: 0, total: round2(amount), lines: [moneyLine(ledgerId, amount, 0), moneyLine(accountId, 0, amount)], stockMoves: [], status: "Posted" };
      }
    } else if (type === "Journal") {
      const debitLedgerId = input.debitLedgerId;
      const creditLedgerId = input.creditLedgerId;
      const amount = Number(input.amount);
      if (!findLedger(data, debitLedgerId) || !findLedger(data, creditLedgerId)) throw new Error("Choose both a debit and a credit ledger.");
      if (debitLedgerId === creditLedgerId) throw new Error("Debit and credit ledgers must be different.");
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be greater than zero.");
      voucher = { id, type, number: getVoucherNumber(data, type, date), date, dueDate: "", partyId: "", reference, narration, taxable: 0, tax: 0, total: round2(amount), lines: [moneyLine(debitLedgerId, amount, 0), moneyLine(creditLedgerId, 0, amount)], stockMoves: [], status: "Posted" };
    } else {
      throw new Error("That voucher type is not available in this prototype.");
    }

    voucher.lines = validateLines(voucher.lines);
    voucher.postedAt = new Date().toISOString();
    data.vouchers.push(voucher);
    data.auditLog = data.auditLog || [];
    data.auditLog.push({
      id: `audit-${id}`, at: voucher.postedAt, action: "POST", entity: "Voucher", entityId: id,
      summary: `${type} ${voucher.number} posted`, actor: "Local user"
    });
    return clone(voucher);
  }

  function getMonthlySeries(data, start, end) {
    const first = new Date(`${start}T12:00:00`);
    const last = new Date(`${end}T12:00:00`);
    if (!validIsoDate(start) || !validIsoDate(end) || first > last) return [];
    const cursor = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1, 12));
    const lastMonth = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), 1, 12));
    const series = [];
    while (cursor <= lastMonth) {
      const monthStart = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}-01`;
      const next = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1, 12));
      const monthEnd = new Date(next.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const rangeStart = monthStart < start ? start : monthStart;
      const rangeEnd = monthEnd > end ? end : monthEnd;
      const pnl = getProfitAndLoss(data, rangeStart, rangeEnd);
      const label = cursor.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" });
      series.push({ label, income: pnl.income, expenses: pnl.expenses });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return series.slice(-6);
  }

  function assessBooks(data, asOf) {
    const findings = [];
    const trial = getTrialBalance(data, asOf);
    if (Math.abs(trial.debitTotal - trial.creditTotal) > 0.01) {
      findings.push({ level: "critical", title: "Trial balance does not tie", detail: `Debit and credit totals differ by ₹${Math.abs(trial.debitTotal - trial.creditTotal).toFixed(2)}. Review postings before relying on reports.`, evidence: "Trial balance" });
    }
    const stock = getStockBalances(data, asOf);
    (data.items || []).forEach(item => {
      const balance = stock.get(item.id);
      if (balance && Number(item.reorderLevel || 0) > 0 && balance.quantity <= Number(item.reorderLevel)) {
        findings.push({ level: "watch", title: `${item.name} is at/below reorder point`, detail: `${balance.quantity} ${item.unit} on hand; configured reorder point is ${item.reorderLevel} ${item.unit}.`, evidence: "Inventory master" });
      }
      if (!item.hsn) findings.push({ level: "review", title: `${item.name} has no HSN/SAC`, detail: "Check classification before using this item on a GST document.", evidence: "Inventory master" });
    });
    const openBills = getOutstandingBills(data, asOf);
    const overdue = openBills.filter(bill => bill.dueDate < asOf);
    const overdueByParty = new Map();
    overdue.forEach(bill => {
      const current = overdueByParty.get(bill.partyId) || { name: bill.partyName, amount: 0, count: 0, oldest: bill.dueDate };
      current.amount = round2(current.amount + bill.openAmount);
      current.count += 1;
      if (bill.dueDate < current.oldest) current.oldest = bill.dueDate;
      overdueByParty.set(bill.partyId, current);
    });
    Array.from(overdueByParty.values()).sort((a, b) => b.amount - a.amount).slice(0, 3).forEach(row => {
      findings.push({ level: "watch", title: `${row.name} has overdue open bills`, detail: `${row.count} open document(s), about ₹${row.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}; oldest due ${row.oldest}. Allocation is FIFO and should be checked against bill-wise records.`, evidence: "Local bill ageing" });
    });
    const duplicateMap = new Map();
    (data.vouchers || []).filter(voucher => voucher.type !== "Opening" && voucher.date <= asOf).forEach(voucher => {
      const key = `${voucher.type}|${voucher.partyId}|${Number(voucher.total || 0).toFixed(2)}|${voucher.date}`;
      const list = duplicateMap.get(key) || [];
      list.push(voucher);
      duplicateMap.set(key, list);
    });
    duplicateMap.forEach(list => {
      if (list.length > 1) findings.push({ level: "review", title: "Possible duplicate voucher", detail: `${list.map(row => row.number).join(" and ")} share a type, party, date and total. Confirm they are separate transactions.`, evidence: "Voucher pattern check" });
    });
    if (data.settings && data.settings.tdsConfigured === false) {
      findings.push({ level: "review", title: "TDS rule profile is not configured", detail: "This workspace will not calculate withholding. Confirm the governing Act, section/table item, threshold and payee facts with a tax professional.", evidence: "Tax setup" });
    }
    if (!findings.length) findings.push({ level: "good", title: "No high-priority local checks found", detail: "This is not a tax, audit or compliance clearance. Review source documents and portal data as usual.", evidence: "Local rule checks" });
    return findings;
  }

  window.SutraEngine = {
    round2,
    sum,
    clone,
    validIsoDate,
    addDays,
    findLedger,
    findParty,
    findItem,
    getVoucherNumber,
    validateLines,
    getStockBalances,
    getStockBalance,
    getLedgerNet,
    getLedgerActivity,
    naturalBalance,
    getTrialBalance,
    getProfitAndLoss,
    getFiscalYearStart,
    getBalanceSheet,
    getTaxSummary,
    getOutstandingBills,
    createVoucher,
    getMonthlySeries,
    assessBooks
  };
})();
