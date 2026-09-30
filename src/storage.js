/* Versioned local-only workspace persistence and JSON backup/restore. */
(function () {
  const STORAGE_KEY = "sutra-books.workspace.v1";
  let memoryCache = null;
  let storageMode = "checking";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getDemo() {
    if (!window.SutraDemo) throw new Error("The demo workspace is not available.");
    return clone(window.SutraDemo);
  }

  function getLocalStorage() {
    try {
      const storage = window.localStorage;
      const probeKey = `${STORAGE_KEY}.probe`;
      storage.setItem(probeKey, "1");
      storage.removeItem(probeKey);
      return storage;
    } catch (error) {
      return null;
    }
  }

  function load() {
    if (memoryCache) return clone(memoryCache);
    const storage = getLocalStorage();
    if (!storage) {
      storageMode = "temporary";
      memoryCache = getDemo();
      return clone(memoryCache);
    }
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) {
        storageMode = "local";
        memoryCache = getDemo();
        save(memoryCache);
        return clone(memoryCache);
      }
      const parsed = JSON.parse(raw);
      validateWorkspace(parsed);
      storageMode = "local";
      memoryCache = parsed;
      return clone(parsed);
    } catch (error) {
      storageMode = "recovery";
      memoryCache = getDemo();
      return clone(memoryCache);
    }
  }

  function validateWorkspace(data) {
    if (!data || typeof data !== "object") throw new Error("Backup is not an object.");
    if (Number(data.schemaVersion) !== 1) throw new Error("This backup version is not supported by this prototype.");
    if (!data.company || !Array.isArray(data.ledgers) || !Array.isArray(data.parties) || !Array.isArray(data.items) || !Array.isArray(data.vouchers)) {
      throw new Error("Backup is missing required company, ledger, party, item or voucher data.");
    }
    const ledgerIds = new Set(data.ledgers.map(ledger => ledger.id));
    const voucherIds = new Set();
    (data.vouchers || []).forEach(voucher => {
      if (!voucher || !voucher.id || !Array.isArray(voucher.lines)) throw new Error("Backup contains an invalid voucher.");
      if (voucherIds.has(voucher.id)) throw new Error("Backup contains duplicate voucher identifiers.");
      voucherIds.add(voucher.id);
      let debit = 0;
      let credit = 0;
      voucher.lines.forEach(line => {
        if (!ledgerIds.has(line.ledgerId)) throw new Error(`Voucher ${voucher.number || "(unnumbered)"} refers to a missing ledger.`);
        const dr = Number(line.debit || 0);
        const cr = Number(line.credit || 0);
        if (!Number.isFinite(dr) || !Number.isFinite(cr) || dr < 0 || cr < 0 || (dr > 0 && cr > 0)) {
          throw new Error(`Voucher ${voucher.number || "(unnumbered)"} has an invalid debit/credit line.`);
        }
        debit += dr;
        credit += cr;
      });
      if (Math.abs(debit - credit) > 0.011) throw new Error(`Voucher ${voucher.number || "(unnumbered)"} is not balanced.`);
    });
    return true;
  }

  function save(data) {
    validateWorkspace(data);
    memoryCache = clone(data);
    const storage = getLocalStorage();
    if (!storage) {
      storageMode = "temporary";
      return { ok: true, persistent: false };
    }
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(data));
      storageMode = "local";
      return { ok: true, persistent: true };
    } catch (error) {
      storageMode = "temporary";
      return { ok: true, persistent: false, error };
    }
  }

  function reset() {
    memoryCache = getDemo();
    const storage = getLocalStorage();
    if (!storage) {
      storageMode = "temporary";
      return { ok: true, persistent: false };
    }
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(memoryCache));
      storageMode = "local";
      return { ok: true, persistent: true };
    } catch (error) {
      storageMode = "temporary";
      return { ok: true, persistent: false, error };
    }
  }

  function restore(data) {
    validateWorkspace(data);
    return save(data);
  }

  function getStatus() {
    if (storageMode === "checking") getLocalStorage();
    if (storageMode === "local") return { mode: "local", label: "Saved on this device" };
    if (storageMode === "recovery") return { mode: "recovery", label: "Demo workspace loaded · import a backup" };
    return { mode: "temporary", label: "Temporary session · export a backup before closing" };
  }

  window.SutraStorage = { load, save, reset, restore, validateWorkspace, getStatus };
})();
