"""
COOKED - Full Application Launcher
Starts both FastAPI Backend (port 8000) and Next.js Frontend (port 3000) concurrently.
Handles clean shutdown on Ctrl+C.
"""

import sys
import os
import subprocess
import time
import signal
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"

def main():
    print("=" * 65)
    print("  🚀 Starting COOKED EV Reinforcement Learning Platform")
    print("=" * 65)
    print(f"  📁 Root Directory:     {ROOT_DIR}")
    print(f"  🌐 Frontend URL:       http://localhost:3000")
    print(f"  ⚡ Backend API:        http://127.0.0.1:8000")
    print(f"  📚 Interactive Docs:   http://127.0.0.1:8000/docs")
    print("=" * 65)
    print("  Press Ctrl+C to terminate both servers gracefully.\n")

    # 1. Start FastAPI backend
    backend_cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "src.ev_charging_rl.api.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
        "--reload",
    ]
    print("▶ Starting FastAPI Backend on http://127.0.0.1:8000 ...")
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(ROOT_DIR),
    )

    # Short delay to allow backend socket binding
    time.sleep(1.5)

    # 2. Start Next.js frontend
    is_windows = os.name == "nt"
    npm_cmd = "npm.cmd" if is_windows else "npm"
    frontend_cmd = [npm_cmd, "run", "dev"]
    print("▶ Starting Next.js Frontend on http://localhost:3000 ...")
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=str(FRONTEND_DIR),
    )

    processes = [backend_proc, frontend_proc]

    def shutdown(sig=None, frame=None):
        print("\n🛑 Shutting down servers...")
        for p in processes:
            if p.poll() is None:
                try:
                    p.terminate()
                except Exception:
                    pass
        time.sleep(1)
        for p in processes:
            if p.poll() is None:
                try:
                    p.kill()
                except Exception:
                    pass
        print("✓ All processes stopped.")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, shutdown)

    try:
        while True:
            for p in processes:
                code = p.poll()
                if code is not None:
                    print(f"⚠ A process terminated with exit code {code}.")
                    shutdown()
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown()

if __name__ == "__main__":
    main()
