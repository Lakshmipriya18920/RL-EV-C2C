"""
acn_env_adapter.py

Bridges decision_engine/env.py (the gymnasium.Env) to:
  - sim_adapter/acn_network_wrapper.py (ACN-Sim physics)
  - sim_adapter/transformer_constraint.py (our novel grid layer)
  - priority_engine/ (fairness scoring, used to translate an RL
    "total budget" action into a concrete per-EV schedule)

Keeping this as a separate adapter means env.py itself never imports
acnportal directly -- if ACN-Sim's API changes, only this file needs
updating.
"""

from dataclasses import dataclass

import numpy as np

from ..sim_adapter.acn_network_wrapper import (
    NetworkConfig,
    build_network,
    active_ev_summary,
)
from ..sim_adapter.transformer_constraint import TransformerConstraint
from .priority_engine.priority_score import EVPriorityInput, PriorityWeights, rank_fleet
from .priority_engine.fairness_ledger import FairnessLedger


@dataclass
class ACNEnvAdapterConfig:
    network_config: NetworkConfig
    rated_capacity_kw: float = 100.0
    safety_margin_pct: float = 0.10
    timestep_minutes: int = 15
    voltage: float = 240.0


class ACNEnvAdapter:
    """
    One instance of this per Gym episode. Call reset_episode() at the
    start of each episode, then apply_action() once per timestep.
    """

    def __init__(self, config: ACNEnvAdapterConfig, fairness_ledger: FairnessLedger | None = None):
        self.config = config
        self.fairness_ledger = fairness_ledger or FairnessLedger()
        self.network = None
        self.transformer = None
        self.rng = np.random.default_rng()
        self._current_time_hours = 0.0

    def reset_episode(self, background_load_curve: dict, seed: int | None = None) -> dict:
        """
        Starts a new episode.

        Args:
            background_load_curve: output of
                data/synthetic/rural_load_generator.generate_scenario()
            seed: optional RNG seed for reproducibility

        Returns:
            initial observation dict
        """
        self.rng = np.random.default_rng(seed)
        self.network = build_network(self.config.network_config)
        self.transformer = TransformerConstraint(
            rated_capacity_kw=self.config.rated_capacity_kw,
            safety_margin_pct=self.config.safety_margin_pct,
        )
        self._background_load_curve = background_load_curve
        self._current_time_hours = 0.0
        self._step_index = 0

        return self._build_observation(active_evs=[])

    def apply_action(self, total_power_budget_kw: float, active_evs: list) -> tuple[dict, dict, bool, dict]:
        """
        Applies one RL step.

        Args:
            total_power_budget_kw: the RL policy's chosen "safe power
                to release this timestep" -- this is the RL action.
            active_evs: currently plugged-in EV objects/summaries for
                this timestep (from the underlying ACN-Sim simulator
                or a synthetic fleet generator).

        Returns:
            (observation, reward_components, done, info)
        """
        dt_hours = self.config.timestep_minutes / 60.0
        background_kw = self._current_background_load_kw()

        # Never let the RL-chosen budget exceed actual physical headroom --
        # this is a hard safety clamp, not something the policy can violate.
        physical_headroom_kw = self.transformer.available_headroom(background_kw)
        safe_budget_kw = min(max(0.0, total_power_budget_kw), physical_headroom_kw)

        # Convert budget to an amps ceiling and let the priority engine
        # decide the per-EV split -- this is the RL/rules-engine split
        # described in the architecture: RL sets the envelope, the
        # priority engine allocates within it.
        budget_amps = (safe_budget_kw * 1000.0) / self.config.voltage
        allocation = self._allocate_by_priority(active_evs, budget_amps)

        total_ev_load_kw = sum(
            (amps * self.config.voltage) / 1000.0 for amps in allocation.values()
        )
        total_load_kw = background_kw + total_ev_load_kw

        stress = self.transformer.update_stress(total_load_kw, dt_hours)
        drop_triggered = self.transformer.maybe_trigger_capacity_drop(self.rng, dt_hours)
        overloaded = self.transformer.is_overloaded(total_load_kw)

        self._current_time_hours += dt_hours
        self._step_index += 1
        done = self._current_time_hours >= 24.0

        obs = self._build_observation(active_evs)
        reward_components = {
            "overload_penalty": -10.0 if overloaded else 0.0,
            "stress_level": stress,
            "unmet_energy_kwh": self._compute_unmet_energy(active_evs, allocation, dt_hours),
            "fairness_variance": self.fairness_ledger.fleet_debt_variance(),
        }
        info = {
            "transformer_state": self.transformer.to_dict(),
            "capacity_drop_triggered": drop_triggered,
            "allocation_amps": allocation,
            "background_load_kw": background_kw,
            "total_load_kw": total_load_kw,
        }

        return obs, reward_components, done, info

    def _allocate_by_priority(self, active_evs: list, budget_amps: float) -> dict:
        if not active_evs:
            return {}

        priority_inputs = [
            EVPriorityInput(
                session_id=ev["session_id"],
                hours_until_departure=ev.get("hours_until_departure", 4.0),
                remaining_energy_kwh=ev.get("remaining_energy_kwh", 0.0),
                max_charge_rate_kw=ev.get("max_charge_rate_kw", 7.2),
                fairness_debt_score=self.fairness_ledger.get_debt_score(ev["session_id"]),
            )
            for ev in active_evs
        ]
        ranked = rank_fleet(priority_inputs)

        remaining_amps = budget_amps
        allocation = {}
        ev_by_id = {ev["session_id"]: ev for ev in active_evs}

        for scored in ranked:
            ev = ev_by_id[scored["session_id"]]
            max_rate_amps = (ev.get("max_charge_rate_kw", 7.2) * 1000.0) / self.config.voltage
            given = min(max_rate_amps, remaining_amps)
            given = max(0.0, given)
            allocation[ev["session_id"]] = given
            remaining_amps -= given

        return allocation

    def _compute_unmet_energy(self, active_evs: list, allocation: dict, dt_hours: float) -> float:
        unmet = 0.0
        for ev in active_evs:
            amps = allocation.get(ev["session_id"], 0.0)
            delivered_kwh = (amps * self.config.voltage / 1000.0) * dt_hours
            shortfall = max(0.0, ev.get("remaining_energy_kwh", 0.0) - delivered_kwh)
            unmet += shortfall
        return unmet

    def _current_background_load_kw(self) -> float:
        hours = self._background_load_curve["timestamps_hours"]
        loads = self._background_load_curve["load_kw"]
        idx = min(self._step_index, len(loads) - 1)
        return float(loads[idx])

    def _build_observation(self, active_evs: list) -> dict:
        return {
            "time_hours": self._current_time_hours,
            "background_load_kw": self._current_background_load_kw(),
            "transformer": self.transformer.to_dict() if self.transformer else {},
            "active_evs": active_evs,
            "num_active_evs": len(active_evs),
        }
