"""EV Fleet State and Battery Dynamic Management."""

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class EVVisualState(str, Enum):
    WAITING = "WAITING"
    REDUCED = "REDUCED"
    CHARGING = "CHARGING"
    FULLY_CHARGED = "FULLY_CHARGED"
    DISCONNECTED = "DISCONNECTED"


@dataclass
class EVState:
    ev_id: str
    arrival_step: int
    departure_step: int
    battery_capacity_kwh: float
    target_soc: float
    initial_soc: float
    current_soc: float
    rated_power_kw: float
    reduced_power_kw: float
    current_action: int = 0  # 0: Off, 1: Reduced, 2: Full
    actual_power_kw: float = 0.0
    energy_delivered_kwh: float = 0.0
    is_connected: bool = False
    is_completed: bool = False

    @property
    def remaining_energy_needed_kwh(self) -> float:
        """Returns the energy needed to reach target SOC."""
        needed_soc = max(0.0, self.target_soc - self.current_soc)
        return needed_soc * self.battery_capacity_kwh

    @property
    def visual_state(self) -> EVVisualState:
        """Derives frontend visual state."""
        if not self.is_connected:
            return EVVisualState.DISCONNECTED
        if self.current_soc >= self.target_soc:
            return EVVisualState.FULLY_CHARGED
        if self.actual_power_kw >= self.rated_power_kw * 0.8:
            return EVVisualState.CHARGING
        if self.actual_power_kw > 0.0:
            return EVVisualState.REDUCED
        return EVVisualState.WAITING

    def update_connection(self, current_step: int) -> bool:
        """Updates whether the EV is currently parked at the charging station."""
        self.is_connected = (self.arrival_step <= current_step < self.departure_step)
        if not self.is_connected:
            self.actual_power_kw = 0.0
            self.current_action = 0
        return self.is_connected

    def apply_charge(self, action: int, dt_hours: float, grid_available: bool = True) -> float:
        """Applies charging action and updates SOC."""
        if not self.is_connected or not grid_available or self.current_soc >= 1.0:
            self.actual_power_kw = 0.0
            self.current_action = 0
            return 0.0

        self.current_action = action
        if action == 2:
            target_kw = self.rated_power_kw
        elif action == 1:
            target_kw = self.reduced_power_kw
        else:
            target_kw = 0.0

        # Prevent overcharging beyond target or 100% capacity
        max_deliverable_energy = (1.0 - self.current_soc) * self.battery_capacity_kwh
        requested_energy = target_kw * dt_hours
        actual_energy = min(requested_energy, max_deliverable_energy)

        self.actual_power_kw = (actual_energy / dt_hours) if dt_hours > 0 else 0.0
        self.energy_delivered_kwh += actual_energy
        self.current_soc = min(1.0, self.current_soc + actual_energy / self.battery_capacity_kwh)

        if self.current_soc >= self.target_soc:
            self.is_completed = True

        return self.actual_power_kw
