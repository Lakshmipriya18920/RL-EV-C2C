"""
session_distributions.py

Fits arrival-time, dwell-time, and requested-energy distributions from
real ACN-Data sessions (loaded via sim_adapter/acn_data_loader.py).

These fitted distributions are the DEMAND-SIDE prior that the rural
scenario generator (data/synthetic/rural_load_generator.py) samples
from -- since ACN-Data reflects US campus/office charging behavior,
not rural/semi-urban India, we treat it as a *shape* prior (how
peaked is arrival time, how long do people dwell, how much energy do
they typically want) rather than literal ground truth.
"""

import json
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats


def load_sessions(csv_path: str) -> pd.DataFrame:
    """Loads a cached sessions CSV produced by acn_data_loader.cache_to_disk()."""
    df = pd.read_csv(csv_path, parse_dates=[
        "connection_time", "disconnect_time", "requested_departure"
    ])
    return df


def fit_arrival_distribution(df: pd.DataFrame) -> dict:
    """
    Fits a distribution to arrival hour-of-day (0-24, wraps around midnight).
    Uses a von Mises (circular normal) fit since arrival time is cyclic.
    """
    hours = df["arrival_hour_of_day"].dropna().values
    radians = (hours / 24.0) * 2 * np.pi

    kappa, loc, scale = stats.vonmises.fit(radians, fscale=1)

    return {
        "type": "vonmises",
        "kappa": float(kappa),
        "loc": float(loc),
        "n_samples": int(len(hours)),
    }


def fit_dwell_time_distribution(df: pd.DataFrame) -> dict:
    """
    Fits a lognormal distribution to dwell time (hours plugged in).
    Lognormal is a common good fit for charging-session durations
    since dwell times are strictly positive and right-skewed.
    """
    dwell = df["dwell_time_hours"].dropna()
    dwell = dwell[(dwell > 0) & (dwell < 48)]  # filter obvious data errors

    shape, loc, scale = stats.lognorm.fit(dwell, floc=0)

    return {
        "type": "lognorm",
        "shape": float(shape),
        "loc": float(loc),
        "scale": float(scale),
        "n_samples": int(len(dwell)),
    }


def fit_energy_requested_distribution(df: pd.DataFrame) -> dict:
    """
    Fits a gamma distribution to energy delivered/requested (kWh).
    Falls back to kwh_delivered if kwh_requested is mostly missing,
    since many real sessions don't have an explicit user-entered
    request.
    """
    col = "kwh_requested" if df["kwh_requested"].notna().mean() > 0.3 else "kwh_delivered"
    energy = df[col].dropna()
    energy = energy[energy > 0]

    shape, loc, scale = stats.gamma.fit(energy, floc=0)

    return {
        "type": "gamma",
        "source_column": col,
        "shape": float(shape),
        "loc": float(loc),
        "scale": float(scale),
        "n_samples": int(len(energy)),
    }


def fit_all(df: pd.DataFrame) -> dict:
    """Convenience wrapper -- fits all three distributions at once."""
    return {
        "arrival": fit_arrival_distribution(df),
        "dwell_time": fit_dwell_time_distribution(df),
        "energy_requested": fit_energy_requested_distribution(df),
    }


def save_distributions(distributions: dict, out_path: str) -> None:
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(distributions, f, indent=2)
    print(f"[info] Saved fitted distributions to {out_path}")


def load_distributions(path: str) -> dict:
    with open(path, "r") as f:
        return json.load(f)


def sample_arrival_hour(distribution: dict, n: int, rng: np.random.Generator) -> np.ndarray:
    """Draws n arrival hours (0-24) from a fitted von Mises distribution."""
    radians = stats.vonmises.rvs(
        kappa=distribution["kappa"], loc=distribution["loc"],
        size=n, random_state=rng,
    )
    hours = (radians / (2 * np.pi)) * 24.0
    return np.mod(hours, 24.0)


def sample_dwell_time(distribution: dict, n: int, rng: np.random.Generator) -> np.ndarray:
    """Draws n dwell times (hours) from a fitted lognormal distribution."""
    return stats.lognorm.rvs(
        distribution["shape"], loc=distribution["loc"], scale=distribution["scale"],
        size=n, random_state=rng,
    )


def sample_energy_requested(distribution: dict, n: int, rng: np.random.Generator) -> np.ndarray:
    """Draws n requested-energy values (kWh) from a fitted gamma distribution."""
    return stats.gamma.rvs(
        distribution["shape"], loc=distribution["loc"], scale=distribution["scale"],
        size=n, random_state=rng,
    )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Fit distributions from cached ACN-Data sessions")
    parser.add_argument("--sessions_csv", required=True, help="Path to cached sessions CSV")
    parser.add_argument("--out", default="data/processed/fitted_distributions.json")
    args = parser.parse_args()

    sessions_df = load_sessions(args.sessions_csv)
    fitted = fit_all(sessions_df)
    save_distributions(fitted, args.out)
