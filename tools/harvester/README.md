# Framer Component Harvester (Archived Tooling)

> **Important Deployment Notice**: This tool is an automated Playwright crawler. It is designed to be executed **strictly on local machines or private dedicated virtual machines**. **DO NOT RUN this script on shared cloud spaces such as Hugging Face Spaces**, as continuous headless browser scraping triggers automated abuse filters and cloud provider suspensions.

---

## 🛠 What It Does
- Multi-feed indexing from Framer community endpoints.
- Isolated tab navigation (`domcontentloaded` + circuit breaker timeouts).
- Clipboard token unbundling and sourcemap extraction.
- Automatic standalone `.tsx` component generation and SQLite logging.

---

## 🚀 Running Locally
```bash
# 1. Install dependencies
pip install playwright
playwright install chromium

# 2. Run harvester
python master_harvester.py
```
Outputs are written to `components/<category>/<slug>.tsx`.
