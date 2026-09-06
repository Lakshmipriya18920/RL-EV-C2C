"""Grid State Store & Inverse-Time Thermal Failure / Outage Model.

Tracks transformer loading history, calculates accumulated thermal stress,
and enforces simulated protection trip / outage states.
"""

from enum import Enum
from typing import Dict, List, Any


class GridTransformerState(str, Enum):
    NORMAL = "NORMAL"
    HIGH_LOAD = "HIGH_LOAD"
    OVERLOAD = "OVERLOAD"
    CRITICAL = "CRITICAL"
    SIMULATED_OUTAGE = "SIMULATED_OUTAGE"


class TransformerThermalFailureModel:
    """Models thermal stress accumulation and simulated outage trips for distribution transformers."""

    def __init__(
        self,
        warning_threshold_loading: float = 85.0,
        overload_threshold_loading: float = 100.0,
        critical_threshold_loading: float = 115.0,
        instantaneous_trip_loading: float = 150.0,
        critical_duration_limit_steps: int = 3,
        cooling_recovery_rate: float = 0.5,
    ):
        self.warning_threshold_loading = warning_threshold_loading
        self.overload_threshold_loading = overload_threshold_loading
        self.critical_threshold_loading = critical_threshold_loading
        self.instantaneous_trip_loading = instantaneous_trip_loading
        self.critical_duration_limit_steps = critical_duration_limit_steps
        self.cooling_recovery_rate = cooling_recovery_rate

        self.accumulated_stress_steps: float = 0.0
        self.current_state: GridTransformerState = GridTransformerState.NORMAL
        self.is_outage_tripped: bool = False
        self.outage_step: Optional[int] = None
        self.history: List[Dict[str, Any]] = []

    def reset(self) -> None:
        """Resets the failure accumulator to pristine condition."""
        self.accumulated_stress_steps = 0.0
        self.current_state = GridTransformerState.NORMAL
        self.is_outage_tripped = False
        self.outage_step = None
        self.history.clear()

    def update(self, loading_percent: float, step: int) -> GridTransformerState:
        """Updates thermal stress accumulator and determines transformer operating state."""
        if self.is_outage_tripped:
            self.current_state = GridTransformerState.SIMULATED_OUTAGE
            self.history.append({
                "step": step,
                "loading_percent": loading_percent,
                "stress_steps": self.accumulated_stress_steps,
                "state": self.current_state.value,
                "tripped": True,
            })
            return self.current_state

        # Check for instantaneous catastrophic trip
        if loading_percent >= self.instantaneous_trip_loading:
            self.is_outage_tripped = True
            self.outage_step = step
            self.current_state = GridTransformerState.SIMULATED_OUTAGE
            self.history.append({
                "step": step,
                "loading_percent": loading_percent,
                "stress_steps": self.accumulated_stress_steps,
                "state": self.current_state.value,
                "tripped": True,
            })
            return self.current_state

        # Determine instantaneous category
        if loading_percent >= self.critical_threshold_loading:
            # Overload rate proportional to excess loading above critical
            stress_increment = 1.0 + (loading_percent - self.critical_threshold_loading) / 20.0
            self.accumulated_stress_steps += stress_increment
            if self.accumulated_stress_steps >= self.critical_duration_limit_steps:
                self.is_outage_tripped = True
                self.outage_step = step
                self.current_state = GridTransformerState.SIMULATED_OUTAGE
            else:
                self.current_state = GridTransformerState.CRITICAL
        elif loading_percent >= self.overload_threshold_loading:
            self.accumulated_stress_steps += 0.5
            if self.accumulated_stress_steps >= self.critical_duration_limit_steps:
                self.is_outage_tripped = True
                self.outage_step = step
                self.current_state = GridTransformerState.SIMULATED_OUTAGE
            else:
                self.current_state = GridTransformerState.OVERLOAD
        elif loading_percent >= self.warning_threshold_loading:
            self.accumulated_stress_steps = max(0.0, self.accumulated_stress_steps - self.cooling_recovery_rate * 0.5)
            self.current_state = GridTransformerState.HIGH_LOAD
        else:
            self.accumulated_stress_steps = max(0.0, self.accumulated_stress_steps - self.cooling_recovery_rate)
            self.current_state = GridTransformerState.NORMAL

        self.history.append({
            "step": step,
            "loading_percent": loading_percent,
            "stress_steps": self.accumulated_stress_steps,
            "state": self.current_state.value,
            "tripped": self.is_outage_tripped,
        })
        return self.current_state
