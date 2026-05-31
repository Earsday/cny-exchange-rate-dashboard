# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Setup & Running

```bash
pip install -r requirements.txt
python collect.py --backfill   # Initial data load (last 90 days)
uvicorn app:app --reload       # Start server at http://localhost:8000
python launch.py               # Start server and open browser in one step
```

**Collect today's rates only:**
```bash
python collect.py
python collect.py --workers 4 --days 30   # Custom parallelism / backfill window
```

## Architecture

Three-module Python backend with a vanilla JS frontend:

- **`app.py`** — FastAPI server. Initializes the DB on startup, serves the Classic UI at `GET /`, the Terminal UI at `GET /v2`, the Fiori UI at `GET /v3`, and exchange rate data at `GET /api/rates?base=&target=&from=&to=`. Also exposes `GET /api/date-range` (min/max dates), `POST /api/collect` (runs `collect.py --backfill`), `POST /api/chat` (proxies to LiteLLM), and `POST /api/models` (fetches available chat models from LiteLLM).
- **`collect.py`** — ETL script. Fetches rates from the `cdn.jsdelivr.net/@fawazahmed0/currency-api` free API with retry/fallback logic and ThreadPoolExecutor for parallel requests. Run standalone via CLI.
- **`db.py`** — SQLite layer (`rates.db`). Single table `exchange_rates(date, base_currency, target_currency, rate)` with a unique constraint on the triplet. Exposes `init_db()`, `insert_rate()`, `get_rates()`, `get_existing_pairs()`, `get_date_range()`.
- **`launch.py`** — convenience wrapper that starts uvicorn and opens the browser.

Three independent frontends, all using Chart.js from CDN with no build step:
- **Classic UI** (`templates/index.html` + `static/charts.js`) — served at `/`
- **Terminal UI** (`templates/index-v2.html` + `static/charts-v2.js`) — served at `/v2`
- **Fiori UI** (`templates/index-v3.html`) — served at `/v3`; self-contained single HTML file; uses SAP Horizon CSS design tokens (loaded via `<link>` from CDN) for SAP Fiori aesthetics; all chart/UI logic in inline vanilla JS (same pattern as V1/V2); themes switched by swapping the CSS `<link>` `href`

On load, each UI calls `/api/rates` in parallel for all 19 currency pairs and renders line charts.

The `dashboard()` route injects a UTC timestamp into the HTML (`{{charts_ts}}` placeholder) so `charts.js` is always loaded fresh (`?ts=2026-...`) without manual version bumping.

## Display Modes

The dashboard has two display modes toggled by the "Merged View" button:
- **Separate** (default): 19 individual charts, one per pair
- **Merged**: 3 multi-line charts grouped logically — Western (GBP/EUR/USD)->CNY, Cross Rates (GBP/EUR/USD), CNY Outbound (CNY->6 Asian currencies)

Mode state is held in `mergedMode` (bool) in `charts.js`. `renderChart()` handles single-line charts; `renderMergedChart()` handles multi-dataset charts with legend enabled.

The active mode is reflected in the URL hash (`#merged` / `#separate`) so refreshing the page restores the correct view. `toggleMode()` writes the hash; the init block reads it on load.

## Controls Bar Features

- **Quick-range buttons** — three groups: "All" (fetches min/max from `/api/date-range`); "In past" rolling windows (7D/1M/3M/6M/1Y); "Since" calendar-anchored ranges (This/Last week/month/year — all end at today)
- **Column picker** (1/2/3/4 cols) — sets `grid-template-columns` on all `.chart-grid` elements; destroys and re-renders charts to pick up new container width; 4 columns suits ultrawide monitors
- **Update offline data button** — calls `POST /api/collect` to backfill any missing data, then reloads charts
- **Export button** — dropdown: "Separate images" (one PNG per visible chart) or "Combined image" (stitches all visible canvases onto an offscreen canvas respecting current column layout). Both formats include chart titles drawn above each chart.
- **AI Chat button** — toggles the AI chat sidebar

All date helpers use `toLocalDate()` (local timezone) instead of `toISOString()` to avoid UTC day-shift issues.

## Chart Features

- Custom Chart.js plugin `minMaxPlugin` draws green/red badge labels at the max/min points. Badge positions are clamped within `chart.chartArea` and flip above/below if they would overflow.
- Custom Chart.js plugin `lineGlowPlugin` applies a canvas shadow glow to the hovered dataset in merged charts. Activated by setting `dataset._glowing = true` in the legend `onHover` callback and cleared in `onLeave`. Other datasets are unaffected.
- Custom Chart.js plugin `verticalLinePlugin` draws a dashed vertical crosshair at the hovered point using `chart.tooltip._active[0].element.x`.
- All charts use `aspectRatio: 1.618` (golden ratio) for consistent proportions across all three UIs.
- Each chart title shows the percentage change from the first to the last visible data point (e.g. `+1.23%` in green or `-0.45%` in red), computed by `pctSpan(data)` and appended to the title `<h2>` / `.chartTitle` element.
- `highlightExtremes()` outlines the highest (green) and lowest (red) percentage titles **per group**. Groups are determined by `.chart-section-divider` / `.chartSectionDivider` elements in the DOM — cards between two dividers form one group.
- `CHART_META` map (top of `charts.js`) holds `label` (English), `labelZh` (Simplified Chinese), and `labelZht` (Traditional Chinese) for all 22 chart IDs (19 separate + 3 merged). `populateCheckboxes()` picks the correct label based on `currentLang` and preserves existing checkbox states on re-render. `applyLang()` calls `populateCheckboxes()` so labels update immediately on language switch.
- Charts support drag-and-drop reordering within the grid — cards swap DOM positions; Chart.js instances remain attached to their canvases so no re-render is needed. `initDragAndDrop()` clones each card to clear stale listeners, restores live canvases, then re-attaches listeners. Uses `dragenter`/`dragleave` with an enter-counter to handle child-element false-leaves. Card order is persisted to `localStorage` (`chartOrder_separate` / `chartOrder_merged`) and restored on load. A **"Reset order"** button appears in the controls bar when a custom order is active.
- AI chat responses are rendered as markdown via the `marked` library (CDN).

## i18n

- Three languages supported: English, Simplified Chinese (简体中文), and Traditional Chinese (繁體中文).
- Language buttons in the top-right of the title bar — active language is highlighted; others are clickable.
- Preference saved in `localStorage` under key `lang` (`en` / `zh` / `zht`).
- All translatable elements have `data-i18n` attributes. `applyLang()` in `charts.js` updates them plus dynamic strings (placeholders, button states).
- Translation map `I18N` at the top of `charts.js` — add keys to `en`, `zh`, and `zht` when adding new UI text.
- `dashboard()` in `app.py` reads `index.html` with `encoding="utf-8"` and returns `HTMLResponse` with `charset=utf-8` to avoid Chinese characters being garbled.

**Decision: i18n strings are kept inside `charts.js`, not in external `.properties` or `.json` files.** Rationale: the project has no build step, the string count is small (~50 keys), and externalizing would require async fetching with added complexity (flash of untranslated text, fetch-before-render sequencing). Revisit if a fourth language is added or the string count grows significantly.

**Known limitation: `<input type="date">` display format follows OS/browser locale, not the page language.** Chromium-based browsers respect `document.documentElement.lang` (`zh-CN` / `zh-TW` / `en-US`) set dynamically in `applyLang()`, switching the display to `YYYY/MM/DD` in Chinese mode. Firefox always uses OS locale regardless. As a workaround, the date field labels include the expected format: "From (MM/DD/YYYY)" in English and "开始（月/日/年）" in Chinese.

## Themes

Both UIs support multiple visual themes, selectable from a picker in the title bar. The active theme is stored in `localStorage` and restored on page load.

- **Classic UI** (`v1theme`): Classic Blue (default), Midnight, Rose. Implemented via CSS custom properties on `:root` with `body.theme-midnight` / `body.theme-rose` overrides. Chart.js colors updated via `applyV1ChartTheme(name)`.
- **Terminal UI** (`v2theme`): Amber Terminal (default), Arctic, Emerald Night. Same CSS variable approach with `body.theme-arctic` / `body.theme-emerald`. Chart.js colors updated via `applyThemeToCharts(name)`.
- **Fiori UI** (`v3theme`): SAP Horizon (default), Morning Horizon (dark), High Contrast Black. Theme switching swaps two `<link>` tag `href` values pointing to the corresponding SAP Horizon CSS on the OpenUI5 CDN (`sdk.openui5.org/resources/...` — no version pin, always resolves to latest).

Chart line colours intentionally avoid red and green families (reserved for min/max badge labels from `minMaxPlugin`).

## AI Chat Sidebar

- Toggled via the "AI Chat" button in the controls bar; can be moved left/right.
- **Resizable**: a 5px drag handle on the inner edge allows resizing between 15% and 50% of viewport width. The width is stored as a fraction in `localStorage` (`sidebarWidthFraction`) so it scales proportionally on browser window resize and persists across page loads. A **"Reset size"** button appears in the sidebar header when a custom width is active. Charts in `#mainArea` call `c.resize()` on drag end to reflow correctly.
- **CSS fix**: `.chart-card` has `min-width: 0` to allow CSS grid cells to shrink below canvas content size — without this, charts don't resize when the sidebar opens.
- Settings (LiteLLM base URL, API key, model) stored in browser `localStorage` only — never sent to the server except as pass-through in request bodies.
- Default base URL: `http://localhost:6655/litellm`
- **Load models**: clicking "Load" in the Settings modal calls `POST /api/models`, which tries `GET /v1/model/info` then `GET /model/info` on the LiteLLM proxy and returns only models with `mode === "chat"`.
- "Include charts" checkboxes (all unchecked by default) control which chart data is sent as context with each message. "All" / "None" buttons toggle all at once.
- Chat input and Send button are disabled until all three settings are saved.
- Sending posts to `POST /api/chat` with conversation history, selected chart data, and date range. The backend builds a system prompt with the rate data and forwards to LiteLLM `/chat/completions`.

## Currency Pairs

The app tracks CNY-centric and other pairs, organised into 4 groups displayed as labelled sections in the UI:

- **CNY Inbound**: GBP, EUR, USD, ILS -> CNY
- **CNY Outbound**: CNY -> JPY, KRW, TWD, INR, RUB, HKD, UAH
- **Western Cross Rates**: GBP -> EUR, GBP -> USD, EUR -> USD, USD -> JPY, USD -> TWD
- **Crypto**: BTC -> USD, CNY, EUR

To add a new pair, update the `PAIRS` list in `collect.py` and add a corresponding chart in `templates/index.html` / `static/charts.js` (Classic UI), `templates/index-v2.html` / `static/charts-v2.js` (Terminal UI), and `templates/index-v3.html` (Fiori UI).
