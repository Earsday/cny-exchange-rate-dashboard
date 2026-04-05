"""
FastAPI backend — serves exchange rate data and the dashboard.

Usage:
    uvicorn app:app --reload
    Then open http://localhost:8000
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from db import init_db, get_rates, get_date_range
from typing import Optional, List, Dict, Any
import subprocess
import sys
from datetime import datetime, timezone
import requests as http_requests

app = FastAPI(title="Currency Tracker")
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.on_event("startup")
def startup():
    init_db()


@app.get("/", response_class=HTMLResponse)
def dashboard():
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    html = (Path(__file__).parent / "templates" / "index.html").read_text(encoding="utf-8")
    return HTMLResponse(content=html.replace("{{charts_ts}}", ts), media_type="text/html; charset=utf-8")


@app.post("/api/collect")
def collect():
    collect_script = Path(__file__).parent / "collect.py"
    result = subprocess.run([sys.executable, str(collect_script), "--backfill"], capture_output=True, text=True)
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
