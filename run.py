"""
COOKED - Full Application Launcher
Starts both FastAPI Backend (port 8000) and Next.js Frontend (port 3000) concurrently.
Handles clean port checking, automatic zombie process clearing, and graceful shutdown.
"""

import sys
import os
import subprocess
import time
import signal
import urllib.request
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"


def free_ports(*ports: int) -> None:
    """Detect and kill any orphan processes occupying the target ports."""
    is_windows = os.name == "nt"
    for port in ports:
        try:
            if is_windows:
                # Query netstat for listening PID on this port
                cmd = f'netstat -ano | findstr ":{port} "'
                out = subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.DEVNULL)
                for line in out.strip().splitlines():
                    parts = line.split()
                    if len(parts) >= 5 and "LISTENING" in parts:
                        pid = parts[-1]
                        if pid.isdigit() and int(pid) != os.getpid():
                            print(f"  [CLEAN] Port {port} occupied by PID {pid}. Terminating process tree...")
                            subprocess.run(
                                ["taskkill", "/F", "/T", "/PID", pid],
                                stdout=subprocess.DEVNULL,
                                stderr=subprocess.DEVNULL,
                            )
            else:
                out = subprocess.check_output(f"lsof -ti :{port}", shell=True, text=True, stderr=subprocess.DEVNULL)
                for pid in out.strip().splitlines():
                    if pid.isdigit() and int(pid) != os.getpid():
                        os.kill(int(pid), signal.SIGKILL)
        except Exception:
            pass


def wait_for_service(url: str, name: str, timeout: int = 15) -> bool:
    """Poll URL until ready or timeout."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=1) as resp:
                if resp.status in (200, 404):
                    return True
        except Exception:
            time.sleep(0.4)
    return False


def main():
    print("=" * 65)
    print("  [*] Starting COOKED EV Reinforcement Learning Platform")
    print("=" * 65)
    print(f"  [DIR]  Root Directory:     {ROOT_DIR}")
    print(f"  [WEB]  Frontend URL:       http://localhost:3000")
    print(f"  [API]  Backend API:        http://127.0.0.1:8000")
    print(f"  [DOC]  Interactive Docs:   http://127.0.0.1:8000/docs")
    print("=" * 65)

    # 1. Clean up stale ports first
    print("  [>] Checking port availability...")
    free_ports(8000, 3000)
    time.sleep(0.5)

    is_windows = os.name == "nt"
    processes = []

    # 2. Start FastAPI backend
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
    print("[>] Launching FastAPI Backend on http://127.0.0.1:8000 ...")
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(ROOT_DIR),
    )
    processes.append(backend_proc)

    # 3. Start Next.js frontend
    npm_cmd = "npm.cmd" if is_windows else "npm"
    frontend_cmd = [npm_cmd, "run", "dev"]
    print("[>] Launching Next.js Frontend on http://localhost:3000 ...")
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=str(FRONTEND_DIR),
    )
    processes.append(frontend_proc)

    def shutdown(sig=None, frame=None):
        print("\n[STOP] Shutting down servers gracefully...")
        for p in processes:
            if p and p.poll() is None:
                if is_windows:
                    try:
                        subprocess.run(
                            ["taskkill", "/F", "/T", "/PID", str(p.pid)],
                            stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL,
                        )
                    except Exception:
                        pass
                else:
                    try:
                        p.terminate()
                    except Exception:
                        pass
        time.sleep(0.5)
        for p in processes:
            if p and p.poll() is None:
                try:
                    p.kill()
                except Exception:
                    pass
        print("[OK] All processes stopped cleanly.")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, shutdown)

    print("\n  [+] Platform active! Press Ctrl+C to terminate both servers.\n")

    try:
        while True:
            for p in processes:
                code = p.poll()
                if code is not None:
                    print(f"[!] A process terminated with exit code {code}.")
                    shutdown()
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown()


if __name__ == "__main__":
    main()

