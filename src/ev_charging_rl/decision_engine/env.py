"""Gymnasium Environment for EV Charging Load Balancing on Distribution Grids."""

from typing import Any, Dict, List, Optional, Tuple, Union
import gymnasium as gym
from gymnasium import spaces
import numpy as np

from ..sensing.transformer_sensor import DistributionGridNetwork, PowerFlowResult
from ..data_layer.grid_state_store import TransformerThermalFailureModel, GridTransformerState
from ..data_layer.ev_fleet_state import EVState
from ..data_layer.data_generator import BaseLoadGenerator, EVFleetGenerator
from .reward import EVChargingRewardEngine, RewardComponents


class EVChargingGridEnv(gym.Env):
    """Gymnasium environment modeling EV charging scheduling on an LV distribution transformer."""

    metadata = {"render_modes": ["human"]}

    def __init__(
        self,
        num_evs: int = 10,
        transformer_capacity_kva: float = 100.0,
        nominal_voltage_kv: float = 0.4,
        charging_power_rated_kw: float = 7.4,
        charging_power_reduced_kw: float = 3.7,
        battery_capacity_kwh: float = 50.0,
        target_soc: float = 0.85,
        total_steps: int = 32,
        time_step_minutes: int = 15,
        base_load_peak_kw: float = 60.0,
        base_load_trough_kw: float = 35.0,
        outage_threshold_loading: float = 115.0,
        critical_duration_steps: int = 3,
        reward_weights: Optional[Dict[str, float]] = None,
        custom_base_load: Optional[np.ndarray] = None,
    ):
        super().__init__()

        self.num_evs = num_evs
        self.transformer_capacity_kva = transformer_capacity_kva
        self.nominal_voltage_kv = nominal_voltage_kv
        self.charging_power_rated_kw = charging_power_rated_kw
        self.charging_power_reduced_kw = charging_power_reduced_kw
        self.battery_capacity_kwh = battery_capacity_kwh
        self.target_soc = target_soc
        self.total_steps = total_steps
        self.time_step_minutes = time_step_minutes
        self.dt_hours = time_step_minutes / 60.0
        self.base_load_peak_kw = base_load_peak_kw
        self.base_load_trough_kw = base_load_trough_kw
        self.outage_threshold_loading = outage_threshold_loading
        self.critical_duration_steps = critical_duration_steps
        self.custom_base_load = custom_base_load

        # Initialize Subsystems
        self.grid = DistributionGridNetwork(
            transformer_capacity_kva=transformer_capacity_kva,
            nominal_voltage_kv=nominal_voltage_kv,
            num_ev_chargers=num_evs,
        )

        self.failure_model = TransformerThermalFailureModel(
            overload_threshold_loading=100.0,
            critical_threshold_loading=outage_threshold_loading,
            critical_duration_limit_steps=critical_duration_steps,
        )

        reward_kwargs = reward_weights or {}
        self.reward_engine = EVChargingRewardEngine(**reward_kwargs)

        # Action Space: MultiDiscrete of size num_evs, with 3 actions each {0: Off, 1: Reduced, 2: Full}
        self.action_space = spaces.MultiDiscrete([3] * self.num_evs)

        # Observation Space:
        # [0] = Normalized Step (t / T)
        # [1] = Normalized Base Load (P_base / P_trafo_cap)
        # [2] = Previous Transformer Loading (Loading% / 100.0)
        # [3] = Overload Stress Accumulator (stress / critical_duration)
        # For each EV i in [0..num_evs-1]:
        #   [4 + 4*i + 0] = Current SOC
        #   [4 + 4*i + 1] = Remaining Needed SOC (Target - Current)
        #   [4 + 4*i + 2] = Remaining Dwell Time fraction
        #   [4 + 4*i + 3] = Is Connected (0.0 or 1.0)
        obs_dim = 4 + 4 * self.num_evs
        self.observation_space = spaces.Box(
            low=0.0,
            high=5.0,
            shape=(obs_dim,),
            dtype=np.float32,
        )

        # Episode runtime state
        self.current_step: int = 0
        self.base_load_curve: np.ndarray = np.zeros(self.total_steps)
        self.fleet: List[EVState] = []
        self.last_power_flow: Optional[PowerFlowResult] = None

    def reset(
        self,
        seed: Optional[int] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        super().reset(seed=seed)
        self.current_step = 0
        self.failure_model.reset()

        # Generate base load profile for this episode
        if self.custom_base_load is not None and len(self.custom_base_load) == self.total_steps:
            self.base_load_curve = self.custom_base_load.copy()
        else:
            self.base_load_curve = BaseLoadGenerator.generate_evening_peak_curve(
                total_steps=self.total_steps,
                time_step_minutes=self.time_step_minutes,
                peak_kw=self.base_load_peak_kw,
                trough_kw=self.base_load_trough_kw,
                seed=seed,
            )

        # Generate EV fleet for this episode
        self.fleet = EVFleetGenerator.generate_fleet(
            num_evs=self.num_evs,
            total_steps=self.total_steps,
            battery_capacity_kwh=self.battery_capacity_kwh,
            rated_power_kw=self.charging_power_rated_kw,
            reduced_power_kw=self.charging_power_reduced_kw,
            target_soc=self.target_soc,
            seed=seed,
        )

        # Update initial connection status
        for ev in self.fleet:
            ev.update_connection(self.current_step)

        # Initial power flow (all EVs idle)
        initial_base_kw = float(self.base_load_curve[0])
        self.last_power_flow = self.grid.run_power_flow(
            base_load_kw=initial_base_kw,
            ev_charging_kw_list=[0.0] * self.num_evs,
        )

        obs = self._get_observation()
        info = self._get_info()
        return obs, info

    def step(self, action: Union[np.ndarray, List[int]]) -> Tuple[np.ndarray, float, bool, bool, Dict[str, Any]]:
        action_array = np.array(action, dtype=int).flatten()

        # 1. Update EV Connections for current step
        for ev in self.fleet:
            ev.update_connection(self.current_step)

        # 2. Apply charging actions to EVs (subject to grid operational status)
        grid_available = not self.failure_model.is_outage_tripped
        ev_kw_list: List[float] = []

        for i, ev in enumerate(self.fleet):
            a = int(action_array[i]) if i < len(action_array) else 0
            actual_kw = ev.apply_charge(a, self.dt_hours, grid_available=grid_available)
            ev_kw_list.append(actual_kw)

        # 3. Base load for this step
        current_base_kw = float(self.base_load_curve[self.current_step]) if self.current_step < len(self.base_load_curve) else 0.0

        # 4. pandapower AC Power Flow
        if grid_available:
            self.last_power_flow = self.grid.run_power_flow(
                base_load_kw=current_base_kw,
                ev_charging_kw_list=ev_kw_list,
            )
        else:
            # Grid offline: 0 kW power delivered
            self.last_power_flow = PowerFlowResult(
                converged=True,
                transformer_loading_percent=0.0,
                transformer_p_kw=0.0,
                transformer_q_kvar=0.0,
                min_bus_voltage_pu=0.0,
                max_bus_voltage_pu=0.0,
                bus_voltages_pu={0: 0.0},
                total_active_loss_kw=0.0,
            )

        # 5. Update Transformer Failure / Outage Model
        grid_state = self.failure_model.update(
            loading_percent=self.last_power_flow.transformer_loading_percent,
            step=self.current_step,
        )

        # 6. Calculate Reward
        reward_comp = self.reward_engine.calculate(
            power_flow=self.last_power_flow,
            fleet=self.fleet,
            is_outage=self.failure_model.is_outage_tripped,
            current_step=self.current_step,
            dt_hours=self.dt_hours,
        )

        # 7. Advance Step
        self.current_step += 1
        terminated = (self.current_step >= self.total_steps) or self.failure_model.is_outage_tripped
        truncated = False

        obs = self._get_observation()
        info = self._get_info(reward_comp=reward_comp)

        return obs, reward_comp.total_reward, terminated, truncated, info

    def _get_observation(self) -> np.ndarray:
        obs = np.zeros(self.observation_space.shape[0], dtype=np.float32)

        # Global features
        obs[0] = float(self.current_step) / float(max(1, self.total_steps))
        base_kw = float(self.base_load_curve[min(self.current_step, len(self.base_load_curve) - 1)])
        obs[1] = base_kw / float(self.transformer_capacity_kva)
        obs[2] = (self.last_power_flow.transformer_loading_percent if self.last_power_flow else 0.0) / 100.0
        obs[3] = self.failure_model.accumulated_stress_steps / float(self.critical_duration_steps)

        # Per-EV features
        for i, ev in enumerate(self.fleet):
            base_idx = 4 + 4 * i
            obs[base_idx + 0] = float(ev.current_soc)
            obs[base_idx + 1] = max(0.0, float(ev.target_soc - ev.current_soc))
            time_left = max(0, ev.departure_step - self.current_step)
            obs[base_idx + 2] = float(time_left) / float(max(1, self.total_steps))
            obs[base_idx + 3] = 1.0 if ev.is_connected else 0.0

        return np.clip(obs, 0.0, 5.0)

    def _get_info(self, reward_comp: Optional[RewardComponents] = None) -> Dict[str, Any]:
        loading = self.last_power_flow.transformer_loading_percent if self.last_power_flow else 0.0
        trafo_p = self.last_power_flow.transformer_p_kw if self.last_power_flow else 0.0
        min_v = self.last_power_flow.min_bus_voltage_pu if self.last_power_flow else 1.0
        total_ev_kw = sum(ev.actual_power_kw for ev in self.fleet)

        ev_info = [
            {
                "ev_id": ev.ev_id,
                "soc": round(float(ev.current_soc), 4),
                "visual_state": ev.visual_state.value,
                "power_kw": round(float(ev.actual_power_kw), 2),
                "is_connected": ev.is_connected,
                "is_completed": ev.is_completed,
                "energy_delivered_kwh": round(float(ev.energy_delivered_kwh), 3),
            }
            for ev in self.fleet
        ]

        info = {
            "step": self.current_step,
            "transformer_loading_percent": round(loading, 2),
            "transformer_load_kw": round(trafo_p, 2),
            "ev_total_load_kw": round(total_ev_kw, 2),
            "min_bus_voltage_pu": round(min_v, 4),
            "grid_state": self.failure_model.current_state.value,
            "is_outage_tripped": self.failure_model.is_outage_tripped,
            "ev_states": ev_info,
        }

        if reward_comp:
            info["reward_breakdown"] = {
                "total": round(reward_comp.total_reward, 3),
                "r_energy": round(reward_comp.r_energy, 3),
                "r_complete": round(reward_comp.r_complete, 3),
                "p_overload": round(reward_comp.p_overload, 3),
                "p_outage": round(reward_comp.p_outage, 3),
                "p_voltage": round(reward_comp.p_voltage, 3),
                "p_delay": round(reward_comp.p_delay, 3),
            }

        return info
