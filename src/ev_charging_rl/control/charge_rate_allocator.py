"""Simulation Orchestrator & Multi-Scenario Execution Engine."""

import os
from typing import Any, Dict, List, Optional
import numpy as np
from ..decision_engine.env import EVChargingGridEnv
from ..baselines.fcfs import FCFSController
from ..decision_engine.rl_policy.ppo_agent import PPOAgentWrapper
from ..monitoring.metrics import MetricsCalculator


class SimulationOrchestrator:
    """Runs complete end-to-end episodes for Baseline, RL, or Comparison modes."""

    def __init__(self, model_checkpoint_path: str = "models/checkpoints/ppo_ev_balancer.zip"):
        self.model_checkpoint_path = model_checkpoint_path
        self._cached_agent: Optional[PPOAgentWrapper] = None

    def _get_agent(self) -> Optional[PPOAgentWrapper]:
        if self._cached_agent is None and os.path.exists(self.model_checkpoint_path):
            try:
                self._cached_agent = PPOAgentWrapper(model_path=self.model_checkpoint_path)
            except Exception as e:
                print(f"[Warning] Failed to load PPO checkpoint: {e}")
                self._cached_agent = None
        return self._cached_agent

    def run_episode(
        self,
        config: Dict[str, Any],
        mode: str = "baseline",  # "baseline" or "rl"
        seed: int = 42,
    ) -> Dict[str, Any]:
        ev_count = int(config.get("ev_count", 10))
        trafo_cap = float(config.get("transformer_capacity_kw", config.get("transformer_capacity_kva", 100.0)))
        charging_power = float(config.get("charging_power_kw", 7.4))
        battery_cap = float(config.get("battery_capacity_kwh", 50.0))
        target_soc = float(config.get("target_soc", 0.85))
        duration_hours = int(config.get("duration_hours", 8))
        time_step_min = int(config.get("time_step_minutes", 15))
        base_load_peak = float(config.get("base_load_kw", config.get("base_load_peak_kw", 60.0)))
        outage_thresh = float(config.get("outage_threshold_loading_percent", config.get("outage_threshold_loading", 115.0)))
        critical_duration = int(config.get("critical_duration_steps", 3))

        total_steps = duration_hours * (60 // time_step_min)

        env = EVChargingGridEnv(
            num_evs=ev_count,
            transformer_capacity_kva=trafo_cap,
            charging_power_rated_kw=charging_power,
            charging_power_reduced_kw=charging_power * 0.5,
            battery_capacity_kwh=battery_cap,
            target_soc=target_soc,
            total_steps=total_steps,
            time_step_minutes=time_step_min,
            base_load_peak_kw=base_load_peak,
            outage_threshold_loading=outage_thresh,
            critical_duration_steps=critical_duration,
        )

        obs, info = env.reset(seed=seed)

        # Time labels generation (e.g. 17:00, 17:15 ...)
        start_hour = 17
        time_labels = []
        for s in range(total_steps):
            total_mins = start_hour * 60 + s * time_step_min
            h = (total_mins // 60) % 24
            m = total_mins % 60
            time_labels.append(f"{h:02d}:{m:02d}")

        # Series logs
        total_load_series: List[float] = []
        trafo_loading_series: List[float] = []
        ev_load_series: List[float] = []
        base_load_series: List[float] = []
        min_v_series: List[float] = []
        trafo_state_series: List[str] = []
        ev_snapshots: Dict[str, Dict[str, List[Any]]] = {
            ev.ev_id: {"soc": [], "state": [], "power_kw": []} for ev in env.fleet
        }

        fcfs = FCFSController(num_evs=ev_count)
        agent = self._get_agent() if mode == "rl" else None

        terminated = False
        step_idx = 0

        while not terminated and step_idx < total_steps:
            if mode == "baseline":
                action = fcfs.compute_actions(env.fleet)
            else:
                if agent is not None:
                    action = agent.predict(obs, deterministic=True)
                else:
                    # Fallback capacity-aware heuristic if no model checkpoint exists
                    action = np.zeros(ev_count, dtype=int)
                    curr_base = float(env.base_load_curve[min(env.current_step, len(env.base_load_curve) - 1)])
                    headroom = max(0.0, (trafo_cap * 0.92) - curr_base)
                    used = 0.0
                    for i, ev in enumerate(env.fleet):
                        if ev.is_connected and ev.current_soc < ev.target_soc:
                            if used + charging_power <= headroom:
                                action[i] = 2
                                used += charging_power
                            elif used + (charging_power * 0.5) <= headroom:
                                action[i] = 1
                                used += charging_power * 0.5

            obs, reward, terminated, truncated, info = env.step(action)

            total_load_series.append(info["transformer_load_kw"])
            trafo_loading_series.append(info["transformer_loading_percent"])
            ev_load_series.append(info["ev_total_load_kw"])
            base_load_series.append(round(float(env.base_load_curve[min(step_idx, len(env.base_load_curve) - 1)]), 2))
            min_v_series.append(info["min_bus_voltage_pu"])
            trafo_state_series.append(info["grid_state"])

            for ev_info in info["ev_states"]:
                eid = ev_info["ev_id"]
                ev_snapshots[eid]["soc"].append(ev_info["soc"])
                ev_snapshots[eid]["state"].append(ev_info["visual_state"])
                ev_snapshots[eid]["power_kw"].append(ev_info["power_kw"])

            step_idx += 1

        # Pad remaining steps if outage terminated episode early
        while step_idx < total_steps:
            total_load_series.append(0.0)
            trafo_loading_series.append(0.0)
            ev_load_series.append(0.0)
            base_load_series.append(0.0)
            min_v_series.append(1.0)
            trafo_state_series.append("SIMULATED_OUTAGE")
            for eid in ev_snapshots:
                last_soc = ev_snapshots[eid]["soc"][-1] if ev_snapshots[eid]["soc"] else 0.0
                ev_snapshots[eid]["soc"].append(last_soc)
                ev_snapshots[eid]["state"].append("DISCONNECTED")
                ev_snapshots[eid]["power_kw"].append(0.0)
            step_idx += 1

        metrics = MetricsCalculator.calculate(
            load_series_kw=total_load_series,
            loading_series_percent=trafo_loading_series,
            min_voltage_series_pu=min_v_series,
            outage_tripped=env.failure_model.is_outage_tripped,
            outage_step=env.failure_model.outage_step,
            fleet_states=env.fleet,
        )

        formatted_ev_states = [
            {
                "ev_id": eid,
                "soc_series": ev_snapshots[eid]["soc"],
                "state_series": ev_snapshots[eid]["state"],
                "power_kw_series": ev_snapshots[eid]["power_kw"],
            }
            for eid in ev_snapshots
        ]

        return {
            "timestamps": time_labels,
            "total_load_kw": total_load_series,
            "transformer_loading_percent": trafo_loading_series,
            "ev_load_kw": ev_load_series,
            "base_load_kw": base_load_series,
            "min_bus_voltage_pu": min_v_series,
            "transformer_state": trafo_state_series,
            "ev_states": formatted_ev_states,
            "metrics": metrics.to_dict(),
        }

    def run_comparison(self, config: Dict[str, Any], seed: int = 42) -> Dict[str, Any]:
        baseline_res = self.run_episode(config=config, mode="baseline", seed=seed)
        rl_res = self.run_episode(config=config, mode="rl", seed=seed)

        return {
            "timestamps": baseline_res["timestamps"],
            "baseline": baseline_res,
            "rl": rl_res,
        }
