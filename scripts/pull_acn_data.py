"""
pull_acn_data.py

CLI to pull real sessions from the ACN-Data API, cache them, and fit
arrival/dwell/energy distributions for the rural scenario generator.

Usage:
    python scripts/pull_acn_data.py \\
        --site caltech \\
        --start 2023-01-01 \\
        --end 2023-06-01 \\
        --api-token YOUR_TOKEN_HERE

Get a token at: https://ev.caltech.edu/register.html
"""

import argparse
import sys
from pathlib import Path

# Allow running this script directly from repo root without installing the package.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from ev_charging_rl.sim_adapter.acn_data_loader import (
    fetch_sessions,
    to_dataframe,
    cache_to_disk,
    cache_raw_json,
)


def main():
    parser = argparse.ArgumentParser(description="Pull and cache ACN-Data sessions")
    parser.add_argument("--site", required=True, help="e.g. caltech, jpl, office_01")
    parser.add_argument("--start", required=True, help="ISO date, e.g. 2023-01-01")
    parser.add_argument("--end", required=True, help="ISO date, e.g. 2023-06-01")
    parser.add_argument("--api-token", required=True, help="Your ACN-Data API token")
    parser.add_argument(
        "--out",
        default=None,
        help="Output path prefix (default: data/raw/acn_data/<site>_<start>_<end>)",
    )
    parser.add_argument(
        "--fit-distributions",
        action="store_true",
        help="Also fit and save distributions after pulling data",
    )
    args = parser.parse_args()

    out_prefix = args.out or f"data/raw/acn_data/{args.site}_{args.start}_{args.end}"

    sessions = fetch_sessions(
        site=args.site,
        start=args.start,
        end=args.end,
        api_token=args.api_token,
    )

    if not sessions:
        print("[warn] No sessions returned -- check your date range/site/token.")
        return

    cache_raw_json(sessions, out_prefix + "_raw.json")

    df = to_dataframe(sessions)
    cache_to_disk(df, out_prefix)

    if args.fit_distributions:
        # Imported here so this script works even if scipy isn't installed
        # and --fit-distributions wasn't requested.
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "data" / "processed"))
        from session_distributions import fit_all, save_distributions  # type: ignore

        distributions = fit_all(df)
        save_distributions(distributions, "data/processed/fitted_distributions.json")
        print("[info] Distributions fitted and saved.")

    print(f"[done] {len(sessions)} sessions pulled for site='{args.site}'.")


if __name__ == "__main__":
    main()
