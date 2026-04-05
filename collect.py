"""
Fetches daily exchange rates from cdn.jsdelivr.net/gh/fawazahmed0/currency-api
and stores them in SQLite. Supports a wide range of currencies including TWD and RUB.

Usage:
    python collect.py              # fetch today's rates
    python collect.py --backfill   # fetch last 90 days of historical data
"""

import argparse
import time
import requests
from datetime import date, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from db import init_db, insert_rate, get_existing_pairs

# API: https://github.com/fawazahmed0/exchange-api (free, no key)
CDN_URL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{date}/v1/currencies/{currency}.json"
FALLBACK_URL = "https://{date}.currency-api.pages.dev/v1/currencies/{currency}.json"

# Currency pairs: base -> list of targets
PAIRS = {
    "GBP": ["CNY", "EUR", "USD"],
    "EUR": ["CNY", "USD"],
    "USD": ["CNY"],
    "CNY": ["JPY", "KRW", "TWD", "INR", "RUB", "HKD"],
}

# Number of parallel threads
MAX_WORKERS = 5
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds between retries


def fetch_one(fetch_date: str, base: str, targets: list):
    """Fetch rates for one base currency on one date. Returns list of (date, base, target, rate)."""
    currency = base.lower()
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            url = CDN_URL.format(date=fetch_date, currency=currency)
            resp = requests.get(url, timeout=10)
            if resp.status_code != 200:
                url = FALLBACK_URL.format(date=fetch_date, currency=currency)
                resp = requests.get(url, timeout=10)
            if resp.status_code != 200:
                print(f"  [WARN] Failed to fetch {base} rates for {fetch_date}: {resp.status_code}")
                return []
            data = resp.json()
            actual_date = data.get("date", fetch_date)
            rates = data.get(currency, {})
            results = []
            for target in targets:
                rate = rates.get(target.lower())
                if rate is None:
                    print(f"  [WARN] {target} not found for {base} on {actual_date}")
                    continue
                results.append((actual_date, base, target, rate))
            return results
        except Exception as e:
            if attempt < MAX_RETRIES:
                delay = RETRY_DELAY ** attempt
                print(f"  [WARN] {base} on {fetch_date} attempt {attempt} failed ({type(e).__name__}: {e}), retrying in {delay}s...")
                time.sleep(delay)
            else:
                print(f"  [ERROR] {base} on {fetch_date} failed after {MAX_RETRIES} attempts ({type(e).__name__}: {e})")
                return []


def fetch_rates_for_date(fetch_date: str):
    """Fetch all configured base currencies for a date in parallel, skipping already-stored pairs."""
    existing = get_existing_pairs(fetch_date)
    tasks = []
    for base, targets in PAIRS.items():
        missing = [t for t in targets if (base, t) not in existing]
        if missing:
            tasks.append((fetch_date, base, missing))
    if not tasks:
        return
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(fetch_one, d, b, t): (d, b) for d, b, t in tasks}
        for future in as_completed(futures):
            for actual_date, base, target, rate in future.result():
                insert_rate(actual_date, base, target, rate)
                print(f"  {actual_date}: {base} -> {target} = {rate}")


def backfill(days: int = 90):
    today = date.today()
    all_dates = [(today - timedelta(days=i)).isoformat() for i in range(days, -1, -1)]

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(fetch_rates_for_date, d): d for d in all_dates}
        completed = 0
        for future in as_completed(futures):
            completed += 1
            try:
                future.result()
                print(f"[{completed}/{len(all_dates)}] Done {futures[future]}")
            except Exception as e:
                print(f"[{completed}/{len(all_dates)}] FAILED {futures[future]}: {e}")


def fetch_today():
    today = date.today().isoformat()
    print(f"Fetching rates for {today}...")
    fetch_rates_for_date(today)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Collect currency exchange rates")
    parser.add_argument("--backfill", action="store_true", help="Fetch last 90 days")
    parser.add_argument("--days", type=int, default=90, help="Number of days to backfill")
    parser.add_argument("--workers", type=int, default=MAX_WORKERS, help="Number of parallel threads")
    args = parser.parse_args()

    MAX_WORKERS = args.workers
    init_db()
    if args.backfill:
        backfill(args.days)
    else:
        fetch_today()

    print("Done.")
