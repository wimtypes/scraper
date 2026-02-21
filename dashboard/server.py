#!/usr/bin/env python3
"""
dashboard/server.py
Simple HTTP server that:
  1. Serves the dashboard (index.html, style.css, app.js) as static files
  2. Exposes GET /api/articles — triggers scraper & returns JSON
  3. Exposes POST /api/refresh  — force re-scrape (clears cooldown)

Run with: python dashboard/server.py
"""

import json
import os
import sys
import shutil
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse

# ── Paths ────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
DASHBOARD_DIR = Path(__file__).parent
TMP_DIR = ROOT / ".tmp"
ARTICLES_FILE = TMP_DIR / "articles.json"
TOOLS_DIR = ROOT / "tools"

PORT = 8765


# ── Handler ───────────────────────────────────────────────────────────────────
class DashboardHandler(SimpleHTTPRequestHandler):
    """Serves static files from dashboard/ and handles /api/* routes."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DASHBOARD_DIR), **kwargs)

    def log_message(self, format, *args):
        print(f"  [{self.address_string()}] {format % args}")

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == "/api/articles":
            self._handle_articles()
        else:
            # Serve static files
            super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/refresh":
            self._handle_force_refresh()
        else:
            self.send_error(404)

    def _run_scraper(self, force: bool = False):
        """Run tools/scrape.py. If force=True, delete cached file first."""
        if force and ARTICLES_FILE.exists():
            ARTICLES_FILE.unlink()
            print("🗑️  Cache cleared for force refresh.")

        scraper_path = TOOLS_DIR / "scrape.py"
        import subprocess
        print(f"Executing: {sys.executable} {scraper_path}")
        result = subprocess.run([sys.executable, str(scraper_path)], capture_output=True, text=True, encoding="utf-8", errors="replace")
        
        if result.returncode != 0:
            print(f"❌ Scraper failed with exit code {result.returncode}")
            print("STDOUT:", result.stdout)
            print("STDERR:", result.stderr)
            return False
            
        return True

    def _handle_articles(self):
        """GET /api/articles — trigger scraper if needed, return JSON."""
        self._add_cors_headers()
        success = self._run_scraper()

        if not success or not ARTICLES_FILE.exists():
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Scraper failed"}).encode())
            return

        data = json.loads(ARTICLES_FILE.read_text(encoding="utf-8"))
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _handle_force_refresh(self):
        """POST /api/refresh — force re-scrape ignoring cooldown."""
        self._add_cors_headers()
        success = self._run_scraper(force=True)

        if not success or not ARTICLES_FILE.exists():
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Scraper failed"}).encode())
            return

        data = json.loads(ARTICLES_FILE.read_text(encoding="utf-8"))
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _add_cors_headers(self):
        pass  # CORS not needed for local server


# ── Entry Point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    print(f"\n🚀 AI Pulse Dashboard Server")
    print(f"   Serving: {DASHBOARD_DIR}")
    print(f"   URL:     http://localhost:{PORT}")
    print(f"   API:     http://localhost:{PORT}/api/articles")
    print(f"\n   Press Ctrl+C to stop.\n")

    server = HTTPServer(("localhost", PORT), DashboardHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped.")
