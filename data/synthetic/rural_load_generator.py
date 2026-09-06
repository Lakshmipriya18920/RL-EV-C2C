"""
rural_load_generator.py

Synthesizes/calibrates rural & semi-urban distribution transformer
load curves. ACN-Data has no transformer-side data, so this is built
independently -- e.g. seasonal + daily patterns with sharper evening
peaks and lower headroom than urban feeders, optionally calibrated
against any real DISCOM data you obtain.

TODO:
- generate_daily_load_curve(config) -> np.ndarray
- inject_stress_event(load_curve, kind="capacity_drop") -> np.ndarray
- generate_scenario(scenario_config) -> dict (load curve + metadata)
"""
