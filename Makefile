PYTHON := python3
VENV_DIR := .venv
VENV_PY := $(VENV_DIR)/bin/python

.PHONY: help setup run stop collect backfill backfill-30

help:
	@echo "Available targets:"
	@echo "  make setup       Create .venv and install requirements"
	@echo "  make run         Start the app and open browser"
	@echo "  make stop        Stop any process listening on port 8000"
	@echo "  make collect     Collect today's rates"
	@echo "  make backfill    Collect last 90 days"
	@echo "  make backfill-30 Collect last 30 days with 4 workers"

setup:
	$(PYTHON) -m venv $(VENV_DIR)
	$(VENV_PY) -m pip install --upgrade pip
	$(VENV_PY) -m pip install -r requirements.txt

run:
	@if lsof -iTCP:8000 -sTCP:LISTEN -n -P >/dev/null 2>&1; then \
		echo "Port 8000 is already in use. Run 'make stop' first or close the existing server."; \
		exit 1; \
	fi
	$(VENV_PY) launch.py

stop:
	@pids=$$(lsof -tiTCP:8000 -sTCP:LISTEN -n -P); \
	if [ -z "$$pids" ]; then \
		echo "No process is listening on port 8000."; \
	else \
		echo "Stopping process(es) on port 8000: $$pids"; \
		kill $$pids; \
	fi

collect:
	$(VENV_PY) collect.py

backfill:
	$(VENV_PY) collect.py --backfill

backfill-30:
	$(VENV_PY) collect.py --workers 4 --days 30