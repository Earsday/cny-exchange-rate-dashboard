# CNY Exchange Rate Dashboard

**English** | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

A self-hosted web dashboard for tracking CNY-centric exchange rates with interactive charts, AI-powered analysis, and trilingual (English / 简体中文 / 繁體中文) support.

## Features

- **19 currency pairs** tracked daily — GBP/EUR/USD/ILS to CNY, cross rates (GBP/EUR/USD, USD/JPY, USD/TWD), CNY outbound to JPY/KRW/TWD/INR/RUB/HKD/UAH, and BTC cross pairs
- **Interactive charts** with min/max labels, crosshair tooltips, and drag-and-drop reordering
- **Two display modes** — Separate (19 individual charts) or Merged (3 grouped multi-line charts)
- **Flexible time ranges** — rolling windows (7D/1M/3M/6M/1Y), calendar-anchored (this/last week/month/year), or all available data
- **Column layout picker** — 1, 2, 3, or 4 columns
- **Export** — individual chart PNGs or a single combined image, both with chart titles included
- **AI chat sidebar** — ask questions about the displayed data, powered by a self-hosted LiteLLM proxy; resizable and moveable left/right
- **Theme picker** — multiple visual themes per UI, persisted in `localStorage`
- **Trilingual UI** — English, Simplified Chinese (简体中文), and Traditional Chinese (繁體中文)
- **Two UIs** — Classic (`/`) and Terminal (`/v2`), with navigation links between them
- **No build step** — vanilla JS + Chart.js from CDN

## Screenshots

**Separate View** — 19 individual charts displayed in a grid, each tracking one currency pair. The AI chat sidebar is open on the right, showing a fluctuation analysis summary with min/max/range table and key findings.

![Separate View](pictures/CNY%20Exchange%20Rate%20Dashboard%20-%20Separate%20View.en-US.png)

**Merged View** — 3 grouped multi-line charts (Western→CNY, CNY Outbound, Cross Rates) for easy side-by-side comparison within each group. The AI chat sidebar highlights the largest and smallest fluctuations across all pairs.

![Merged View](pictures/CNY%20Exchange%20Rate%20Dashboard%20-%20Merged%20View.en-US.png)

## Requirements

- Python 3.9+
- pip packages: `fastapi`, `uvicorn`, `requests`

```bash
pip install -r requirements.txt
```

## Quick Start

```bash
# 1. Collect historical data (last 90 days)
python collect.py --backfill

# 2. Start the server and open the browser
python launch.py
```

Or start the server manually:

```bash
uvicorn app:app --reload
# Open http://localhost:8000
# Terminal UI at http://localhost:8000/v2
```

## Data Collection

Rates are fetched from the [fawazahmed0 currency API](https://github.com/fawazahmed0/exchange-api) — free, no API key required.

```bash
python collect.py                        # Today's rates only
python collect.py --backfill             # Last 90 days
python collect.py --backfill --days 365  # Custom backfill window
python collect.py --workers 8            # Custom parallelism
```

The collector skips pairs already stored in the database, so it's safe to re-run at any time.

## AI Chat Setup

The AI chat sidebar requires a self-hosted [LiteLLM proxy](https://docs.litellm.ai/docs/proxy/quick_start).

1. Click **AI Chat** in the dashboard toolbar to open the sidebar
2. Click **Settings** in the sidebar header
3. Enter your LiteLLM base URL (default: `http://localhost:6655/litellm`), API key, then click **Load** to fetch available models
4. Select a model and click **Save**
5. Check the charts you want to include as context, then ask a question

Credentials are stored in browser `localStorage` only and are never persisted server-side beyond the proxied request.

## Currency Pairs

| Group | Pairs |
|---|---|
| Inbound to CNY | GBP, EUR, USD, ILS -> CNY |
| Cross rates | GBP -> EUR, GBP -> USD, EUR -> USD, USD -> JPY, USD -> TWD |
| Outbound from CNY | CNY -> JPY, KRW, TWD, INR, RUB, HKD, UAH |
| Crypto | BTC -> USD, CNY, EUR |

To add a new pair, update `PAIRS` in `collect.py` and add the corresponding chart card in `templates/index.html` / `static/charts.js` (Classic UI) and `templates/index-v2.html` / `static/charts-v2.js` (Terminal UI).

## Project Structure

```
app.py                # FastAPI server & API routes
collect.py            # ETL: fetches and stores daily rates
db.py                 # SQLite layer (rates.db)
launch.py             # Starts server and opens browser
templates/
  index.html          # Classic UI
  index-v2.html       # Terminal UI
static/
  charts.js           # Classic UI: chart logic, i18n, AI chat
  charts-v2.js        # Terminal UI: chart logic, i18n, AI chat
```
