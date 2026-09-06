"""Static Priority and Off-Peak Heuristic Baseline Controllers."""

from typing import List
import numpy as np
from ..data_layer.ev_fleet_state import EVState


class StaticPriorityController:
    """Greedy priority allocator based on lowest SOC and nearest departure within transformer headroom."""

    def __init__(
        self,
        num_evs: int = 10,
        transformer_capacity_kva: float = 100.0,
        rated_power_kw: float = 7.4,
    ):
        self.num_evs = num_evs
        self.transformer_capacity_kva = transformer_capacity_kva
        self.rated_power_kw = rated_power_kw

    def compute_actions(
        self,
        fleet: List[EVState],
        current_base_load_kw: float,
        current_step: int,
    ) -> np.ndarray:
        actions = np.zeros(self.num_evs, dtype=int)
        available_headroom_kw = max(0.0, (self.transformer_capacity_kva * 0.90) - current_base_load_kw)

        # Sort active EVs by urgency = (target_soc - soc) / (departure - current_step)
        active_evs = []
        for i, ev in enumerate(fleet):
            if ev.is_connected and ev.current_soc < ev.target_soc:
                time_to_dep = max(1, ev.departure_step - current_step)
                urgency = (ev.target_soc - ev.current_soc) / float(time_to_dep)
                active_evs.append((urgency, i, ev))

        active_evs.sort(key=lambda x: x[0], reverse=True)

        allocated_kw = 0.0
        for urgency, idx, ev in active_evs:
            if allocated_kw + self.rated_power_kw <= available_headroom_kw:
                actions[idx] = 2
                allocated_kw += self.rated_power_kw
            elif allocated_kw + (self.rated_power_kw * 0.5) <= available_headroom_kw:
                actions[idx] = 1
                allocated_kw += self.rated_power_kw * 0.5
            else:
                actions[idx] = 0

        return actions


class FixedOffPeakController:
    """Delays EV charging until after the evening peak window (e.g., after step 16)."""

    def __init__(self, num_evs: int = 10, offpeak_start_step: int = 16):
        self.num_evs = num_evs
        self.offpeak_start_step = offpeak_start_step

    def compute_actions(self, fleet: List[EVState], current_step: int) -> np.ndarray:
        actions = np.zeros(self.num_evs, dtype=int)
        if current_step >= self.offpeak_start_step:
            for i, ev in enumerate(fleet):
                if ev.is_connected and ev.current_soc < ev.target_soc:
                    actions[i] = 2
        return actions
