"""Multi-Objective Reward Function Formulation for EV Charging Load Balancing.

This reward function balances:
- Positive: Delivered charging energy, EV target completion bonus.
- Negative: Transformer overload, simulated outage catastrophe, voltage violations, urgent charging delays.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
import numpy as np
from ..data_layer.ev_fleet_state import EVState
from ..sensing.transformer_sensor import PowerFlowResult


@dataclass
class RewardComponents:
    total_reward: float
    r_energy: float
    r_complete: float
    p_overload: float
    p_outage: float
    p_voltage: float
    p_delay: float


class EVChargingRewardEngine:
    """Calculates granular, explainable multi-term rewards for the RL agent."""

    def __init__(
        self,
        w_energy: float = 2.0,
        w_complete: float = 15.0,
        w_overload: float = 5.0,
        w_outage: float = 150.0,
        w_voltage: float = 10.0,
        w_delay: float = 1.5,
        w_action_smooth: float = 0.1,
        **kwargs,
    ):
        self.w_energy = w_energy
        self.w_complete = w_complete
        self.w_overload = w_overload
        self.w_outage = w_outage
        self.w_voltage = w_voltage
        self.w_delay = w_delay
        self.w_action_smooth = w_action_smooth

    def calculate(
        self,
        power_flow: PowerFlowResult,
        fleet: List[EVState],
        is_outage: bool,
        current_step: int,
        dt_hours: float,
    ) -> RewardComponents:
        # 1. Energy Delivery Reward: Normalized by battery capacity
        r_energy = 0.0
        r_complete = 0.0
        p_delay = 0.0

        for ev in fleet:
            if ev.is_connected:
                # Reward actual charging progress if needed
                if ev.actual_power_kw > 0 and ev.current_soc < ev.target_soc:
                    energy_fraction = (ev.actual_power_kw * dt_hours) / ev.battery_capacity_kwh
                    r_energy += energy_fraction

                # Completion bonus if target SOC reached
                if ev.is_completed and ev.current_soc >= ev.target_soc:
                    r_complete += 1.0

                # Delay penalty: EV is held back (action == 0 or 1) while departure is near and target not reached
                if ev.current_soc < ev.target_soc and ev.current_action < 2:
                    time_to_dep = max(1, ev.departure_step - current_step)
                    urgency = (ev.target_soc - ev.current_soc) / float(time_to_dep)
                    p_delay += float(urgency)

        # 2. Transformer Overload Penalty: Quadratic above 100%
        loading = power_flow.transformer_loading_percent
        if loading > 100.0:
            excess_fraction = (loading - 100.0) / 100.0
            p_overload = float(excess_fraction ** 2 * 10.0)
        else:
            p_overload = 0.0

        # 3. Simulated Outage Penalty: Catastrophic one-time / persistent penalty
        p_outage = 1.0 if is_outage else 0.0

        # 4. Bus Voltage Violation Penalty (<0.95 or >1.05 pu)
        p_voltage = 0.0
        for v in power_flow.bus_voltages_pu.values():
            if v < 0.95:
                p_voltage += (0.95 - v) * 10.0
            elif v > 1.05:
                p_voltage += (v - 1.05) * 10.0

        # Combine weighted terms
        total = (
            self.w_energy * r_energy
            + self.w_complete * r_complete
            - self.w_overload * p_overload
            - self.w_outage * p_outage
            - self.w_voltage * p_voltage
            - self.w_delay * p_delay
        )

        return RewardComponents(
            total_reward=float(total),
            r_energy=float(r_energy),
            r_complete=float(r_complete),
            p_overload=float(p_overload),
            p_outage=float(p_outage),
            p_voltage=float(p_voltage),
            p_delay=float(p_delay),
        )
