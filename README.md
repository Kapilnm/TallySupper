# Sutra Books (TallySupper prototype)

An original offline-first Indian accounting prototype. It is **not** a TallyPrime/BUSY clone, a production accounting system, a GST/TDS calculator or a filing tool.

## Run it

1. Open the repository folder.
2. Double-click `index.html` (or open it in a current desktop browser).
3. No install, build step, account, CDN or internet connection is required.

The files are intentionally linked from `index.html` as local classic scripts and CSS so a browser can load them from disk. A browser may restrict or clear `file://` local storage; the app reports when storage appears temporary. Use **Settings & data → Download JSON backup** before closing or changing devices.

To serve the same static files locally instead, run `python3 -m http.server 8000` from this folder and open `http://localhost:8000`. This is an optional local development method, not a dependency.

## What is inside

- `index.html` — app shell and entry point.
- `styles.css` — responsive, offline UI styling.
- `src/data.js` — fictional sample company and books.
- `src/engine.js` — double-entry postings, inventory, balance and report calculations.
- `src/storage.js` — schema check, browser-local persistence and backup/restore.
- `src/app.js` — dashboard, vouchers, ledgers, inventory, GST/TDS preview, reports, local assistant and settings.
- `docs/research-and-product-design.md` — product study, research notes, product requirements, architecture and prototype boundaries.
- `docs/compliance-matrix.md` — dated India compliance discovery map and production release gates.

## Prototype safety

The first load contains fictional demo records. They are prominently marked **not for filing**. “Sutra Assist” uses deterministic browser-local checks only; it is not a generative model and does not send data anywhere. GST screens are previews, TDS/TCS rules are unconfigured, and there are no portal, bank, e-invoice or e-way bill integrations.

The browser stores data in localStorage, which is not encrypted or designed as a durable multi-user ledger. Export a backup and keep it secure. Use **Settings & data → Create blank workspace** to discard sample books before entering your own chart of accounts. Do not use the prototype as the sole record of a real business.

See the two documents under `docs/` for the research findings, source links, legal caveats and recommended next development phases. No study material attachment was present in the repository when this first pass was built; attach it later to map its topics against the specification.
