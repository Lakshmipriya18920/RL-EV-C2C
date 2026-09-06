"""
acn_data_loader.py

Pulls and parses real charging sessions from the ACN-Data API
(https://ev.caltech.edu/dataset) using acnportal's data client,
and converts them into the session format used by
data/processed/session_distributions.py.

Reference: https://acnportal.readthedocs.io/en/latest/

TODO:
- fetch_sessions(site, start_date, end_date, api_token) -> list[dict]
- to_dataframe(sessions) -> pandas.DataFrame
- cache_to_disk(df, path)
"""
