"""
Capture CLIMASCOPE Climate Map Screenshots using Headless Microsoft Edge
"""

import os
import sys
import time
import subprocess
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
import uvicorn

EDGE_EXE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

sys.path.insert(0, BACKEND_DIR)
from app.main import app as fastapi_app

class CustomHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIST, **kwargs)

    def log_message(self, format, *args):
        pass

def start_backend():
    config = uvicorn.Config(fastapi_app, host="127.0.0.1", port=8000, log_level="warning")
    server = uvicorn.Server(config)
    thread = threading.Thread(target=server.run)
    thread.daemon = True
    thread.start()
    return server

def start_frontend(port):
    server = HTTPServer(('127.0.0.1', port), CustomHandler)
    thread = threading.Thread(target=server.serve_forever)
    thread.daemon = True
    thread.start()
    return server

def capture(url, out_path, delay=6):
    args = [
        EDGE_EXE,
        "--headless=new",
        "--hide-scrollbars",
        "--window-size=1600,1000",
        "--enable-webgl",
        "--ignore-certificate-errors",
        f"--virtual-time-budget={delay * 1000}",
        f"--screenshot={out_path}",
        url
    ]
    print(f"Capturing: {url} -> {os.path.basename(out_path)}")
    proc = subprocess.run(args, capture_output=True, timeout=40)
    print(f"Saved: {out_path} (exists: {os.path.exists(out_path)}, size: {os.path.getsize(out_path) if os.path.exists(out_path) else 0} bytes)")

def main():
    if not os.path.exists(EDGE_EXE):
        print(f"Edge binary not found at {EDGE_EXE}")
        return

    print("Starting FastAPI backend on port 8000...")
    backend = start_backend()

    port = 5218
    print(f"Starting static frontend on port {port}...")
    frontend = start_frontend(port)
    time.sleep(3)

    screenshots = [
        ("climascope-map-all-zones.png", f"http://127.0.0.1:{port}/?tab=climate-map&inspector=false"),
        ("climascope-map-critical-zone.png", f"http://127.0.0.1:{port}/?tab=climate-map&inspector=true"),
        ("climascope-map-basemap-satellite.png", f"http://127.0.0.1:{port}/?tab=climate-map&basemap=satellite"),
        ("climascope-map-basemap-streets.png", f"http://127.0.0.1:{port}/?tab=climate-map&basemap=streets"),
    ]

    for filename, url in screenshots:
        out_path = os.path.join(OUTPUT_DIR, filename)
        capture(url, out_path, delay=6)

    frontend.shutdown()
    backend.should_exit = True
    print("Screenshot capture sequence finished successfully.")

if __name__ == "__main__":
    main()
