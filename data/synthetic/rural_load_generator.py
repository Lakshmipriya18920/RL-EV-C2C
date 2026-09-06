"""
rural_load_generator.py

Synthesizes rural / semi-urban distribution-transformer background
load (i.e. non-EV household + agricultural + commercial draw). This
has NO ACN-Data equivalent -- ACN-Data is EV-session-only -- so it is
built independently, using a configurable seasonal + daily pattern
calibrated to look like a stressed rural feeder: lower headroom,
sharper evening peaks, and occasional capacity-drop events.
"""

from dataclasses import dataclass, field

import numpy as np


@dataclass
class RuralLoadConfig:
    rated_capacity_kw: float = 100.0        # transformer nameplate rating
    baseline_load_frac: float = 0.35        # daytime baseline as fraction of rating
    evening_peak_frac: float = 0.85         # evening peak as fraction of rating
    morning_peak_frac: float = 0.55         # secondary morning peak (agri pumps etc.)
    evening_peak_hour: float = 19.5         # 7:30 PM
    morning_peak_hour: float = 7.0          # 7:00 AM
    noise_std_frac: float = 0.04            # random household-level noise
    timestep_minutes: int = 15
    seed: int | None = None


def _gaussian_bump(hours: np.ndarray, center: float, width: float, height: float) -> np.ndarray:
    """A smooth daily load bump centered at `center` hour, wrapped for 24h cyclicity."""
    diff = np.minimum(np.abs(hours - center), 24 - np.abs(hours - center))
    return height * np.exp(-0.5 * (diff / width) ** 2)


def generate_daily_load_curve(config: RuralLoadConfig) -> dict:
    """
    Generates one day's synthetic transformer load curve.

    Returns:
        dict with:
            "timestamps_hours": np.ndarray of hour-of-day for each timestep
            "load_kw": np.ndarray of background (non-EV) load in kW
            "rated_capacity_kw": float
    """
    rng = np.random.default_rng(config.seed)

    n_steps = int(24 * 60 / config.timestep_minutes)
    hours = np.linspace(0, 24, n_steps, endpoint=False)

    baseline = config.baseline_load_frac * config.rated_capacity_kw

    evening_bump = _gaussian_bump(
        hours, config.evening_peak_hour, width=1.8,
        height=(config.evening_peak_frac - config.baseline_load_frac) * config.rated_capacity_kw,
    )
    morning_bump = _gaussian_bump(
        hours, config.morning_peak_hour, width=1.2,
        height=(config.morning_peak_frac - config.baseline_load_frac) * config.rated_capacity_kw,
    )

    noise = rng.normal(
        loc=0.0,
        scale=config.noise_std_frac * config.rated_capacity_kw,
        size=n_steps,
    )

    load_kw = baseline + evening_bump + morning_bump + noise
    load_kw = np.clip(load_kw, a_min=0.0, a_max=None)

    return {
        "timestamps_hours": hours,
        "load_kw": load_kw,
        "rated_capacity_kw": config.rated_capacity_kw,
    }


def inject_stress_event(
    load_curve: dict,
    kind: str = "capacity_drop",
    start_hour: float = 18.0,
    duration_hours: float = 2.0,
    severity_frac: float = 0.3,
    seed: int | None = None,
) -> dict:
    """
    Injects a grid-instability event into an existing load curve.

    kind:
        "capacity_drop" -- effective rated capacity temporarily reduced
                            (simulates partial fault / brownout risk)
        "demand_spike"  -- background load temporarily increases
                            (simulates e.g. irrigation pump surge)

    Returns a NEW dict (does not mutate the input) with an added
    "effective_capacity_kw" array reflecting the event, and a
    "stress_event" metadata block.
    """
    hours = load_curve["timestamps_hours"]
    load_kw = load_curve["load_kw"].copy()
    rated = load_curve["rated_capacity_kw"]

    effective_capacity = np.full_like(hours, rated, dtype=float)

    in_window = (hours >= start_hour) & (hours < start_hour + duration_hours)

    if kind == "capacity_drop":
        effective_capacity[in_window] *= (1 - severity_frac)
    elif kind == "demand_spike":
        load_kw[in_window] += severity_frac * rated
    else:
        raise ValueError(f"Unknown stress event kind: {kind}")

    return {
        "timestamps_hours": hours,
        "load_kw": load_kw,
        "rated_capacity_kw": rated,
        "effective_capacity_kw": effective_capacity,
        "stress_event": {
            "kind": kind,
            "start_hour": start_hour,
            "duration_hours": duration_hours,
            "severity_frac": severity_frac,
        },
    }


def generate_scenario(scenario_name: str, config: RuralLoadConfig | None = None) -> dict:
    """
    Named scenario presets matching config/scenarios/*.yaml.
    Extend this as you add more scenario YAML files.
    """
    config = config or RuralLoadConfig()
    base = generate_daily_load_curve(config)

    if scenario_name == "normal_day":
        return base
    elif scenario_name == "transformer_stressed":
        return inject_stress_event(base, kind="capacity_drop",
                                    start_hour=18.0, duration_hours=3.0, severity_frac=0.35)
    elif scenario_name == "high_ev_penetration":
        # Background load unchanged here -- EV load itself is added
        # later by the Gym env; this scenario just flags a config
        # difference in EV fleet size, handled upstream in env.py.
        return base
    elif scenario_name == "outage_prone":
        return inject_stress_event(base, kind="capacity_drop",
                                    start_hour=19.0, duration_hours=4.0, severity_frac=0.5)
    else:
        raise ValueError(f"Unknown scenario: {scenario_name}")


if __name__ == "__main__":
    cfg = RuralLoadConfig(seed=42)
    curve = generate_scenario("transformer_stressed", cfg)
    print(f"Generated {len(curve['load_kw'])} timesteps")
    print(f"Peak load: {curve['load_kw'].max():.1f} kW "
          f"(rated: {curve['rated_capacity_kw']:.1f} kW)")
    print(f"Stress event: {curve['stress_event']}")
