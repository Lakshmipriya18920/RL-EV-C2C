"""Data Generator for Residential Transformer Base Loads & EV Fleet Arrivals."""

from typing import List, Optional, Union
import numpy as np
import pandas as pd
from .ev_fleet_state import EVState


class BaseLoadGenerator:
    """Generates realistic time-varying residential base load curves."""

    @staticmethod
    def generate_evening_peak_curve(
        total_steps: int = 32,
        time_step_minutes: int = 15,
        peak_kw: float = 60.0,
        trough_kw: float = 35.0,
        noise_std_kw: float = 1.5,
        seed: Optional[int] = None,
    ) -> np.ndarray:
        """Generates an 8-hour evening load curve (e.g. 17:00 to 01:00) with a peak around 19:30-20:30."""
        rng = np.random.default_rng(seed)
        time_hours = np.linspace(0, total_steps * (time_step_minutes / 60.0), total_steps)

        # Gaussian peak centered at 3 hours into simulation (e.g. 20:00)
        peak_center = 3.0
        peak_width = 1.6
        peak_shape = np.exp(-0.5 * ((time_hours - peak_center) / peak_width) ** 2)

        curve = trough_kw + (peak_kw - trough_kw) * peak_shape
        noise = rng.normal(0, noise_std_kw, size=total_steps)
        curve = np.clip(curve + noise, 0.0, peak_kw * 1.5)
        return curve

    @staticmethod
    def load_from_csv(file_path: str, column_name: str = "base_load_kw", resample_steps: int = 32) -> np.ndarray:
        """Loads historical transformer load data from CSV and resamples to simulation steps."""
        df = pd.read_csv(file_path)
        if column_name not in df.columns:
            raise ValueError(f"Column '{column_name}' not found in {file_path}")
        raw_vals = df[column_name].values
        # Resample / interpolate to match requested number of steps
        old_indices = np.linspace(0, 1, len(raw_vals))
        new_indices = np.linspace(0, 1, resample_steps)
        resampled = np.interp(new_indices, old_indices, raw_vals)
        return np.maximum(0.0, resampled)


class EVFleetGenerator:
    """Generates synthetic EV arrivals, battery parameters, and charging demands."""

    @staticmethod
    def generate_fleet(
        num_evs: int = 10,
        total_steps: int = 32,
        battery_capacity_kwh: float = 50.0,
        rated_power_kw: float = 7.4,
        reduced_power_kw: float = 3.7,
        target_soc: float = 0.85,
        min_initial_soc: float = 0.20,
        max_initial_soc: float = 0.50,
        seed: Optional[int] = None,
    ) -> List[EVState]:
        rng = np.random.default_rng(seed)
        fleet: List[EVState] = []
        dt_hours = (total_steps and 15) / 60.0  # assume 15-min steps unless overridden

        for i in range(num_evs):
            arrival = int(rng.integers(0, max(1, total_steps // 3)))
            initial_soc = float(rng.uniform(min_initial_soc, max_initial_soc))
            bat_cap = float(rng.uniform(battery_capacity_kwh * 0.9, battery_capacity_kwh * 1.1))

            # Minimum dwell to physically deliver the target energy at rated power
            energy_needed_kwh = max(0.0, target_soc - initial_soc) * bat_cap
            min_steps_physics = int(np.ceil(energy_needed_kwh / (rated_power_kw * dt_hours)))
            min_steps_physics = max(min_steps_physics, 4)  # always allow at least 4 steps

            remaining = total_steps - arrival
            min_dwell = min(max(min_steps_physics, 6), remaining)  # respect episode length
            max_dwell = max(min_dwell + 1, remaining + 1)
            dwell = int(rng.integers(min_dwell, max_dwell))
            departure = min(total_steps, arrival + dwell)

            ev = EVState(
                ev_id=f"EV-{i+1:02d}",
                arrival_step=arrival,
                departure_step=departure,
                battery_capacity_kwh=bat_cap,
                target_soc=target_soc,
                initial_soc=initial_soc,
                current_soc=initial_soc,
                rated_power_kw=rated_power_kw,
                reduced_power_kw=reduced_power_kw,
            )
            fleet.append(ev)

        return fleet
