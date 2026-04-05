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

- **`app.py`** — FastAPI server. Initializes the DB on startup, serves the dashboard at `GET /` and exchange rate data at `GET /api/rates?base=&target=&from=&to=`. Also exposes `GET /api/date-range` (min/max dates), `POST /api/collect` (runs `collect.py --backfill`), `POST /api/chat` (proxies to LiteLLM), and `POST /api/models` (fetches available chat models from LiteLLM).
- **`collect.py`** — ETL script. Fetches rates from the `cdn.jsdelivr.net/@fawazahmed0/currency-api` free API with retry/fallback logic and ThreadPoolExecutor for parallel requests. Run standalone via CLI.
- **`db.py`** — SQLite layer (`rates.db`). Single table `exchange_rates(date, base_currency, target_currency, rate)` with a unique constraint on the triplet. Exposes `init_db()`, `insert_rate()`, `get_rates()`, `get_existing_pairs()`, `get_date_range()`.
- **`launch.py`** — convenience wrapper that starts uvicorn and opens the browser.

Frontend (`templates/index.html` + `static/charts.js`) uses Chart.js from CDN. No build step. No test suite. On load, `charts.js` calls `/api/rates` in parallel for all 12 currency pairs and renders line charts.

The `dashboard()` route injects a UTC timestamp into the HTML (`{{charts_ts}}` placeholder) so `charts.js` is always loaded fresh (`?ts=2026-...`) without manual version bumping.

## Display Modes

The dashboard has two display modes toggled by the "Merged View" button:
- **Separate** (default): 12 individual charts, one per pair
- **Merged**: 3 multi-line charts grouped logically — Western (GBP/EUR/USD)->CNY, Cross Rates (GBP/EUR/USD), CNY Outbound (CNY->6 Asian currencies)

Mode state is held in `mergedMode` (bool) in `charts.js`. `renderChart()` handles single-line charts; `renderMergedChart()` handles multi-dataset charts with legend enabled.

## Controls Bar Features

- **Quick-range buttons** — three groups: "All" (fetches min/max from `/api/date-range`); "In past" rolling windows (7D/1M/3M/6M/1Y); "Since" calendar-anchored ranges (This/Last week/month/year — all end at today)
- **Column picker** (1/2/3/4 cols) — sets `grid-template-columns` on all `.chart-grid` elements; destroys and re-renders charts to pick up new container width; 4 columns suits ultrawide monitors
- **Keep up-to-date button** — calls `POST /api/collect` to backfill any missing data, then reloads charts
- **Export button** — dropdown: "Separate images" (one PNG per visible chart) or "Combined image" (stitches all visible canvases onto an offscreen canvas respecting current column layout). Both formats include chart titles drawn above each chart.
- **AI Chat button** — toggles the AI chat sidebar

All date helpers use `toLocalDate()` (local timezone) instead of `toISOString()` to avoid UTC day-shift issues.

## Chart Features

- Custom Chart.js plugin `minMaxPlugin` draws green/red badge labels at the max/min points. Badge positions are clamped within `chart.chartArea` and flip above/below if they would overflow.
- `CHART_META` map (top of `charts.js`) holds `label` (English) and `labelZh` (Chinese) for all 15 chart IDs (12 separate + 3 merged). `populateCheckboxes()` picks the correct label based on `currentLang` and preserves existing checkbox states on re-render. `applyLang()` calls `populateCheckboxes()` so labels update immediately on language switch.
- Charts support drag-and-drop reordering within the grid — cards swap DOM positions; Chart.js instances remain attached to their canvases so no re-render is needed. `initDragAndDrop()` clones each card to clear stale listeners, restores live canvases, then re-attaches listeners. Uses `dragenter`/`dragleave` with an enter-counter to handle child-element false-leaves. Card order is persisted to `localStorage` (`chartOrder_separate` / `chartOrder_merged`) and restored on load. A **"Reset order"** button appears in the controls bar when a custom order is active.
- AI chat responses are rendered as markdown via the `marked` library (CDN).

## i18n

- Two languages supported: English and Simplified Chinese (简体中文).
- Language links in the top-right of the title bar — active language is non-clickable; inactive is an underlined link.
- Preference saved in `localStorage` under key `lang`.
- All translatable elements have `data-i18n` attributes. `applyLang()` in `charts.js` updates them plus dynamic strings (placeholders, button states).
- Translation map `I18N` at the top of `charts.js` — add keys to both `en` and `zh` when adding new UI text.
- `dashboard()` in `app.py` reads `index.html` with `encoding="utf-8"` and returns `HTMLResponse` with `charset=utf-8` to avoid Chinese characters being garbled.

**Decision: i18n strings are kept inside `charts.js`, not in external `.properties` or `.json` files.** Rationale: the project has no build step, the string count is small (~50 keys), and externalizing would require async fetching with added complexity (flash of untranslated text, fetch-before-render sequencing). Revisit if a third language is added or the string count grows significantly.

**Known limitation: `<input type="date">` display format follows OS/browser locale, not the page language.** Chromium-based browsers respect `document.documentElement.lang` (`zh-CN` / `en-US`) set dynamically in `applyLang()`, switching the display to `YYYY/MM/DD` in Chinese mode. Firefox always uses OS locale regardless. As a workaround, the date field labels include the expected format: "From (MM/DD/YYYY)" in English and "开始（月/日/年）" in Chinese.

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

The app tracks CNY-centric pairs:

- Inbound to CNY: GBP, EUR, USD -> CNY
- Cross rates: GBP -> EUR, GBP -> USD, EUR -> USD
- Outbound from CNY: CNY -> JPY, KRW, TWD, INR, RUB, HKD

To add a new pair, update the `PAIRS` list in `collect.py` and add a corresponding chart in `templates/index.html` / `static/charts.js`.
