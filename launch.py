"""
Launch the Currency Tracker: starts the uvicorn server and opens the browser.
Run with: python launch.py
"""

import subprocess
import sys
import time
import webbrowser
from pathlib import Path

HOST = "127.0.0.1"
PORT = 8000
URL = f"http://{HOST}:{PORT}"

if __name__ == "__main__":
    server = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app:app", "--host", HOST, "--port", str(PORT)],
        cwd=Path(__file__).parent,
    )
    time.sleep(1.5)  # wait for server to be ready
    webbrowser.open(URL)
    try:
        server.wait()
    except KeyboardInterrupt:
        server.terminate()
