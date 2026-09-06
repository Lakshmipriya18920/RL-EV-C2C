"""
pull_acn_data.py

CLI script to pull real sessions from the ACN-Data API and cache
them to data/raw/acn_data/, then fit and save distributions to
data/processed/ via session_distributions.py.

Usage:
    python scripts/pull_acn_data.py --site caltech --start 2023-01-01 --end 2023-06-01

TODO:
- argparse: --site, --start, --end, --api-token, --out
- calls sim_adapter.acn_data_loader.fetch_sessions(...)
- calls data.processed.session_distributions.fit_* and saves output
"""
