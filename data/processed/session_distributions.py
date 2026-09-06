"""
session_distributions.py

Fits arrival time, dwell time, and requested-energy distributions
from real ACN-Data sessions. These fitted distributions are what the
rural scenario generator (data/synthetic/rural_load_generator.py)
samples from, since ACN-Data itself reflects US campus charging
behavior, not rural/semi-urban India.

TODO:
- load_sessions(path) -> list[dict]
- fit_arrival_distribution(sessions) -> scipy distribution or histogram
- fit_dwell_time_distribution(sessions) -> scipy distribution
- fit_energy_requested_distribution(sessions) -> scipy distribution
- save_distributions(out_path) / load_distributions(path)
"""
