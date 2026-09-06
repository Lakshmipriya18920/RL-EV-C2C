"""
acn_data_loader.py

Pulls real EV charging sessions from the ACN-Data API
(https://ev.caltech.edu/dataset) using ACNPortal's data client,
and converts them into a flat pandas.DataFrame that the rest of
the project (session_distributions.py) can consume.

Get an API token by registering at https://ev.caltech.edu/register.html

NOTE: The exact class/method names below follow ACNPortal's documented
data-client API (acnportal.acndata.DataClient). If your installed
acnportal version differs slightly, check `acnportal.acndata` docs --
the shape of returned session dicts is stable, but method signatures
have shifted across versions.
"""

import json
import time
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd

try:
    from acnportal.acndata import DataClient
except ImportError as e:
    raise ImportError(
        "acnportal is not installed. Run: pip install acnportal"
    ) from e


# Known public ACN-Data sites as of ACNPortal docs.
KNOWN_SITES = ["caltech", "jpl", "office_01"]


def _fetch_chunk(client: "DataClient", site: str, start_dt: datetime, end_dt: datetime, timeseries: bool, retries: int = 3) -> list:
    """Fetch a single date chunk with exponential-backoff retries."""
    for attempt in range(retries):
        try:
            sessions = list(client.get_sessions_by_time(
                site=site,
                start=start_dt,
                end=end_dt,
                timeseries=timeseries,
            ))
            return sessions
        except Exception as e:
            wait = 2 ** attempt
            print(f"[warn] Attempt {attempt + 1}/{retries} failed ({e.__class__.__name__}). Retrying in {wait}s...")
            time.sleep(wait)
    print(f"[error] All {retries} attempts failed for chunk {start_dt.date()} → {end_dt.date()}. Skipping.")
    return []


def fetch_sessions(
    site: str,
    start: str,
    end: str,
    api_token: str,
    timeseries: bool = False,
    chunk_days: int = 30,
) -> list[dict]:
    """
    Fetch raw charging sessions from the ACN-Data API in monthly chunks
    to avoid mid-stream connection resets on large date ranges.

    Args:
        site: one of KNOWN_SITES (e.g. "caltech")
        start: ISO date string, e.g. "2019-01-01"
        end: ISO date string, e.g. "2020-01-01"
        api_token: your ACN-Data API token
        timeseries: if True, also pulls per-session power timeseries
        chunk_days: number of days per request (default 30 to avoid timeouts)

    Returns:
        List of session dicts as returned by the ACN-Data API.
    """
    if site not in KNOWN_SITES:
        print(f"[warn] '{site}' is not in the known site list {KNOWN_SITES}. Proceeding anyway.")

    client = DataClient(api_token=api_token)

    start_dt = datetime.fromisoformat(start)
    end_dt = datetime.fromisoformat(end)

    all_sessions: list[dict] = []
    chunk_start = start_dt

    while chunk_start < end_dt:
        chunk_end = min(chunk_start + timedelta(days=chunk_days), end_dt)
        print(f"[info] Fetching {site}: {chunk_start.date()} -> {chunk_end.date()} ...")
        chunk = _fetch_chunk(client, site, chunk_start, chunk_end, timeseries)
        all_sessions.extend(chunk)
        print(f"[info]   {len(chunk)} sessions (total so far: {len(all_sessions)})")
        chunk_start = chunk_end
        # Small polite delay between requests
        time.sleep(0.5)

    print(f"[info] Fetched {len(all_sessions)} sessions total for site='{site}' between {start} and {end}")
    return all_sessions


def to_dataframe(sessions: list[dict]) -> pd.DataFrame:
    """
    Converts raw ACN-Data session dicts into a clean, flat DataFrame
    with the fields our simulation actually needs.
    """
    rows = []
    for s in sessions:
        connection_time = s.get("connectionTime")
        disconnect_time = s.get("disconnectTime")
        kwh_delivered = s.get("kWhDelivered")

        # userInputs sometimes contains a requested departure/energy;
        # not every session has this, so guard against missing data.
        user_inputs = s.get("userInputs") or [{}]
        requested_kwh = user_inputs[0].get("kWhRequested")
        requested_departure = user_inputs[0].get("requestedDeparture")

        rows.append({
            "session_id": s.get("sessionID"),
            "site_id": s.get("siteID"),
            "station_id": s.get("stationID"),
            "connection_time": connection_time,
            "disconnect_time": disconnect_time,
            "kwh_delivered": kwh_delivered,
            "kwh_requested": requested_kwh,
            "requested_departure": requested_departure,
        })

    df = pd.DataFrame(rows)

    # Parse timestamps
    for col in ["connection_time", "disconnect_time", "requested_departure"]:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce")

    # Derived fields used downstream by session_distributions.py
    if "connection_time" in df.columns and "disconnect_time" in df.columns:
        df["dwell_time_hours"] = (
            (df["disconnect_time"] - df["connection_time"]).dt.total_seconds() / 3600
        )
        df["arrival_hour_of_day"] = df["connection_time"].dt.hour + (
            df["connection_time"].dt.minute / 60
        )

    return df


def cache_to_disk(df: pd.DataFrame, out_path: str) -> None:
    """Saves the parsed DataFrame as both CSV (human-readable) and
    Parquet (fast reload) into data/raw/acn_data/."""
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out.with_suffix(".csv"), index=False)
    try:
        df.to_parquet(out.with_suffix(".parquet"), index=False)
    except ImportError:
        print("[warn] pyarrow/fastparquet not installed -- skipped .parquet cache, "
              "CSV cache saved fine.")
    print(f"[info] Cached {len(df)} sessions to {out.with_suffix('.csv')}")


def cache_raw_json(sessions: list[dict], out_path: str) -> None:
    """Also keep the untouched raw JSON in case schema fields are needed later."""
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w") as f:
        json.dump(sessions, f, default=str, indent=2)
    print(f"[info] Raw JSON cached to {out}")
