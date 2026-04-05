import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "rates.db"


def get_connection():
    return sqlite3.connect(DB_PATH)


def init_db():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS exchange_rates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                base_currency TEXT NOT NULL,
                target_currency TEXT NOT NULL,
                rate REAL NOT NULL,
                UNIQUE(date, base_currency, target_currency)
            )
        """)
        conn.commit()


def insert_rate(date: str, base: str, target: str, rate: float):
    with get_connection() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO exchange_rates (date, base_currency, target_currency, rate)
            VALUES (?, ?, ?, ?)
        """, (date, base, target, rate))
        conn.commit()


def get_existing_pairs(date: str) -> set:
    """Return a set of (base, target) tuples already stored for the given date."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT base_currency, target_currency FROM exchange_rates WHERE date = ?",
            (date,)
        ).fetchall()
    return {(base, target) for base, target in rows}


def get_date_range():
    """Return (min_date, max_date) across all stored rates."""
    with get_connection() as conn:
        row = conn.execute("SELECT MIN(date), MAX(date) FROM exchange_rates").fetchone()
    return row[0], row[1]


def get_rates(base: str, target: str, from_date: str = None, to_date: str = None):
    query = """
        SELECT date, rate FROM exchange_rates
        WHERE base_currency = ? AND target_currency = ?
    """
    params = [base, target]
    if from_date:
        query += " AND date >= ?"
        params.append(from_date)
    if to_date:
        query += " AND date <= ?"
        params.append(to_date)
    query += " ORDER BY date ASC"

    with get_connection() as conn:
        rows = conn.execute(query, params).fetchall()
    return rows
