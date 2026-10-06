"""Evaluation Metrics Computation for Baseline vs RL Simulation Runs."""

from dataclasses import dataclass, asdict
from typing import Dict, List, Any, Optional
import numpy as np


@dataclass
class SimulationMetricsSummary:
    peak_load_kw: float
    max_loading_percent: float
    overload_timesteps: int
    outage_occurred: bool
    outage_step: Optional[int]
    total_energy_delivered_kwh: float
    target_energy_kwh: float
    satisfaction_percent: float
    voltage_violations_count: int
    min_voltage_pu: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class MetricsCalculator:
    """Calculates comprehensive grid and fleet KPIs for an episode."""

    @staticmethod
    def calculate(
        load_series_kw: List[float],
        loading_series_percent: List[float],
        min_voltage_series_pu: List[float],
        outage_tripped: bool,
        outage_step: Optional[int],
        fleet_states: List[Any],
    ) -> SimulationMetricsSummary:
        peak_kw = float(max(load_series_kw)) if load_series_kw else 0.0
        max_loading = float(max(loading_series_percent)) if loading_series_percent else 0.0
        overload_count = sum(1 for l in loading_series_percent if l > 100.0)
        voltage_viols = sum(1 for v in min_voltage_series_pu if v < 0.95 or v > 1.05)
        min_v = float(min(min_voltage_series_pu)) if min_voltage_series_pu else 1.0

        # Only count EVs that actually had a chance to connect (energy_delivered > 0
        # OR their arrival window overlapped with the episode). This prevents outage
        # early-termination from tanking satisfaction with "never arrived" EVs.
        connected_evs = [ev for ev in fleet_states if ev.energy_delivered_kwh > 0 or ev.arrival_step == 0]
        if not connected_evs:
            connected_evs = list(fleet_states)  # fallback: use all if none delivered

        total_delivered = sum(ev.energy_delivered_kwh for ev in connected_evs)
        total_target = sum(
            max(0.0, ev.target_soc - ev.initial_soc) * ev.battery_capacity_kwh for ev in connected_evs
        )
        satisfaction = (total_delivered / max(1e-5, total_target)) * 100.0

        return SimulationMetricsSummary(
            peak_load_kw=round(peak_kw, 2),
            max_loading_percent=round(max_loading, 2),
            overload_timesteps=overload_count,
            outage_occurred=outage_tripped,
            outage_step=outage_step,
            total_energy_delivered_kwh=round(total_delivered, 2),
            target_energy_kwh=round(total_target, 2),
            satisfaction_percent=round(satisfaction, 1),
            voltage_violations_count=voltage_viols,
            min_voltage_pu=round(min_v, 4),
        )
