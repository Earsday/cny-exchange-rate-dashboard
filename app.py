"""
FastAPI backend — serves exchange rate data and the dashboard.

Usage:
    uvicorn app:app --reload
    Then open http://localhost:8000
"""

from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from db import init_db, get_rates, get_date_range
from typing import Optional, List, Dict, Any
import subprocess
import sys
import time
import logging
from datetime import datetime, timezone
import requests as http_requests

app = FastAPI(title="Currency Tracker")
app.mount("/static", StaticFiles(directory="static"), name="static")

_access_log = logging.getLogger("app.access")


_ANSI_RESET  = "\033[0m"
_ANSI_CYAN   = "\033[36m"   # fast   < 100 ms
_ANSI_YELLOW = "\033[33m"   # slow   100 ms – 1 s
_ANSI_RED    = "\033[31m"   # very slow  ≥ 1 s


def _fmt_elapsed(seconds: float) -> str:
    """Format elapsed time with a unit and ANSI colour based on speed tier."""
    # Choose colour: cyan < 100 ms, yellow < 1 s, red ≥ 1 s
    if seconds < 0.1:
        color = _ANSI_CYAN
    elif seconds < 1.0:
        color = _ANSI_YELLOW
    else:
        color = _ANSI_RED

    us = seconds * 1_000_000
    if us < 1_000:                          # < 1 ms  → µs
        text = f"{us:.0f} µs"
    else:
        ms = seconds * 1_000
        if ms < 1_000:                      # < 1 s   → ms
            text = f"{ms:.3f} ms"
        elif seconds < 60:                  # < 1 min → s
            text = f"{seconds:.3f} s"
        else:                               # ≥ 1 min → min
            text = f"{seconds / 60:.3f} min"

    return f"{color}{text}{_ANSI_RESET}"


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = time.perf_counter() - start
    path = request.url.path
    if request.url.query:
        path += f"?{request.url.query}"
    _access_log.info(
        '%s:%s "%s %s HTTP/1.1" %s  %s',
        request.client.host,
        request.client.port,
        request.method,
        path,
        response.status_code,
        _fmt_elapsed(elapsed),
    )
    return response


@app.on_event("startup")
def startup():
    init_db()
    # Suppress uvicorn's built-in access log — our middleware handles it
    logging.getLogger("uvicorn.access").disabled = True
    # Log a one-line legend explaining response-time colour tiers
    _log = logging.getLogger("uvicorn.error")
    _log.info(
        "Response time colours: %s< 100ms%s or %s100ms ~ 1s%s or %s≥ 1s%s",
        _ANSI_CYAN,   _ANSI_RESET,
        _ANSI_YELLOW, _ANSI_RESET,
        _ANSI_RED,    _ANSI_RESET,
    )


@app.get("/", response_class=HTMLResponse)
def dashboard():
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    html = (Path(__file__).parent / "templates" / "index.html").read_text(encoding="utf-8")
    return HTMLResponse(content=html.replace("{{charts_ts}}", ts), media_type="text/html; charset=utf-8")


@app.post("/api/collect")
def collect(body: Dict[str, Any] = {}):
    collect_script = Path(__file__).parent / "collect.py"
    cmd = [sys.executable, str(collect_script), "--backfill"]
    from_date = (body or {}).get("from_date")
    if from_date:
        cmd += ["--from-date", from_date]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return {"ok": result.returncode == 0, "output": result.stdout + result.stderr}


@app.post("/api/chat")
def chat(body: Dict[str, Any]):
    base_url = body.get("base_url", "http://localhost:6655").rstrip("/")
    api_key  = body.get("api_key", "")
    model    = body.get("model", "claude-sonnet")
    messages = body.get("messages", [])
    data     = body.get("data", [])
    from_date = body.get("from_date", "")
    to_date   = body.get("to_date", "")

    pair_names = [d["pair"] for d in data]
    data_lines = []
    for d in data:
        dates, rates = d.get("dates", []), d.get("rates", [])
        rows = ", ".join(f"{dt}:{r:.4f}" for dt, r in zip(dates, rates) if isinstance(r, (int, float)))
        data_lines.append(f"{d['pair']}: {rows}")

    system_prompt = (
        f"You are a financial data analyst assistant. "
        f"You have access to exchange rate data for the period {from_date} to {to_date}. "
        f"Currency pairs available: {', '.join(pair_names)}.\n"
        f"Rate data (date:rate):\n" + "\n".join(data_lines) + "\n\n"
        f"Answer questions about trends, highs/lows, comparisons, and near-future outlook based on the data provided."
    )

    payload = {
        "model": model,
        "messages": [{"role": "system", "content": system_prompt}] + messages,
    }
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    try:
        resp = http_requests.post(f"{base_url}/chat/completions", json=payload, headers=headers, timeout=60)
        resp.raise_for_status()
        result = resp.json()
        reply = result["choices"][0]["message"]["content"]
    except http_requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"LiteLLM request failed: {e}")
    except (KeyError, IndexError) as e:
        raise HTTPException(status_code=502, detail=f"Unexpected response from LiteLLM: {e}")
    return {"reply": reply}


@app.post("/api/models")
def models(body: Dict[str, Any]):
    base_url = body.get("base_url", "http://localhost:6655").rstrip("/")
    api_key  = body.get("api_key", "")
    headers  = {"Authorization": f"Bearer {api_key}"}
    try:
        for path in ("/v1/model/info", "/model/info"):
            resp = http_requests.get(f"{base_url}{path}", headers=headers, timeout=15)
            if resp.status_code == 200:
                return resp.json()
    except http_requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Could not reach LiteLLM: {e}")
    raise HTTPException(status_code=502, detail="Could not fetch models (tried /v1/model/info and /model/info)")


@app.get("/api/date-range")
def date_range():
    min_date, max_date = get_date_range()
    return {"min": min_date, "max": max_date}


@app.get("/api/rates")
def rates(
    base: str = Query(..., description="Base currency, e.g. USD"),
    target: str = Query(..., description="Target currency, e.g. CNY"),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
):
    rows = get_rates(base, target, from_date, to_date)
    return {
        "base": base,
        "target": target,
        "data": [{"date": r[0], "rate": r[1]} for r in rows],
    }
