"""
Launch the Currency Tracker: starts the uvicorn server and opens the browser.
Run with: python launch.py
"""

import logging
import threading
import webbrowser
from datetime import datetime
import uvicorn

HOST = "127.0.0.1"
PORT = 8000
URL = f"http://{HOST}:{PORT}"


# ANSI colour codes matching uvicorn's default colour scheme
_LEVEL_COLORS = {
    "DEBUG":    "\033[36m",   # cyan
    "INFO":     "\033[32m",   # green
    "WARNING":  "\033[33m",   # yellow
    "ERROR":    "\033[31m",   # red
    "CRITICAL": "\033[31;1m", # bold red
}
_RESET = "\033[0m"


class _MicrosecondFormatter(logging.Formatter):
    """Formats log records as: YYYY-MM-DD HH:MM:SS.ffffff  LEVEL    message"""
    def formatTime(self, record, datefmt=None):  # noqa: N802
        return datetime.fromtimestamp(record.created).strftime("%Y-%m-%d %H:%M:%S.%f")

    def format(self, record):
        record.asctime = self.formatTime(record)
        color = _LEVEL_COLORS.get(record.levelname, "")
        level = f"{color}{record.levelname:<8}{_RESET}" if color else f"{record.levelname:<8}"
        return f"{record.asctime}  {level} {record.getMessage()}"


def _make_log_config():
    fmt = _MicrosecondFormatter()
    handler = logging.StreamHandler()
    handler.setFormatter(fmt)
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access", "app.access"):
        log = logging.getLogger(name)
        log.handlers = [handler]
        log.propagate = False
        log.setLevel(logging.INFO)
    # Return None — we configure loggers directly; uvicorn will skip its own setup
    # when log_config=None but we pre-configured the loggers above.
    return None

if __name__ == "__main__":
    _make_log_config()  # pre-configure uvicorn loggers with microsecond formatter
    # Open browser shortly after server starts
    threading.Timer(1.5, lambda: webbrowser.open(URL)).start()
    uvicorn.run("app:app", host=HOST, port=PORT, log_config=None)
