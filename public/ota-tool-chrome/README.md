# Open Thermal AI — tool chrome

Shared **disclaimer** + **close button** for calculator apps on `*.openthermalai.com`.

## Assets

| File | Role |
|------|------|
| `ota-tool-chrome.css` | Fixed close control + footer disclaimer styles |
| `ota-tool-chrome.js` | Mount chrome; close fallback; hide legacy duplicate notices |

Published on the main site after deploy:

- `https://www.openthermalai.com/tool-chrome/ota-tool-chrome.css`
- `https://www.openthermalai.com/tool-chrome/ota-tool-chrome.js`

Each tool repo should also vendor a copy under `./ota-tool-chrome/` (offline / deploy-root relative paths).

## Inject into tool `index.html`

```html
<link rel="stylesheet" href="./ota-tool-chrome/ota-tool-chrome.css">
<script
  src="./ota-tool-chrome/ota-tool-chrome.js"
  defer
  data-ota-hub="https://www.openthermalai.com/tools.html"
></script>
```

Optional mount slot (otherwise appended to `body`):

```html
<div data-ota-disclaimer></div>
```

Mark old in-app disclaimer blocks so they are hidden after chrome mounts:

```html
<p data-ota-legacy-disclaimer>...</p>
```

## Close behaviour

1. `window.close()`
2. If still open: `history.back()` when `history.length > 1`
3. Else navigate to `data-ota-hub` (default tools page)

Existing `#closeButton` / `#close-app-btn` are reused (no second floating button).

## Brand / legal copy

Aligned with main-site `SUMMARY_ZH` / `SUMMARY_EN` in `src/siteSectionDisclaimer.js` (brand **Open Thermal AI**).

## Batch apply

From `personal-website`:

```bash
node scripts/batch-tool-chrome.mjs
node scripts/batch-tool-chrome.mjs --pilot   # mc, ba, euc only
node scripts/batch-tool-chrome.mjs --dry-run
```
