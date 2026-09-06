"""First-Come First-Served / Uncontrolled EV Charging Baseline."""

from typing import List
import numpy as np
from ..data_layer.ev_fleet_state import EVState


class FCFSController:
    """Uncontrolled charging baseline: Every connected EV charges immediately at full rated power."""

    def __init__(self, num_evs: int = 10):
        self.num_evs = num_evs

    def compute_actions(self, fleet: List[EVState]) -> np.ndarray:
        actions = np.zeros(self.num_evs, dtype=int)
        for i, ev in enumerate(fleet):
            if ev.is_connected and ev.current_soc < ev.target_soc:
                actions[i] = 2  # Charge at maximum power
            else:
                actions[i] = 0
        return actions
