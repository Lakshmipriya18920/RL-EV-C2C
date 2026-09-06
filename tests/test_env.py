"""Unit tests for pandapower grid simulation and Gymnasium environment."""

import pytest
import numpy as np
from ev_charging_rl.sensing.transformer_sensor import DistributionGridNetwork
from ev_charging_rl.data_layer.grid_state_store import TransformerThermalFailureModel, GridTransformerState
from ev_charging_rl.decision_engine.env import EVChargingGridEnv


def test_grid_network_power_flow():
    """Verifies that pandapower creates the distribution grid and calculates valid power flow."""
    grid = DistributionGridNetwork(
        transformer_capacity_kva=100.0,
        nominal_voltage_kv=0.4,
        num_ev_chargers=6,
    )
    res = grid.run_power_flow(
        base_load_kw=40.0,
        ev_charging_kw_list=[7.4, 7.4, 3.7, 0.0, 7.4, 0.0],
    )
    assert res.converged is True
    assert res.transformer_loading_percent > 0.0
    assert 0.85 <= res.min_bus_voltage_pu <= 1.05
    assert res.transformer_p_kw > 40.0


def test_transformer_outage_transition():
    """Verifies inverse-time thermal failure progression to simulated outage."""
    model = TransformerThermalFailureModel(
        warning_threshold_loading=85.0,
        overload_threshold_loading=100.0,
        critical_threshold_loading=115.0,
        critical_duration_limit_steps=3,
    )
    assert model.current_state == GridTransformerState.NORMAL

    # Step 1: Normal load
    s1 = model.update(70.0, step=0)
    assert s1 == GridTransformerState.NORMAL

    # Step 2: High load
    s2 = model.update(90.0, step=1)
    assert s2 == GridTransformerState.HIGH_LOAD

    # Step 3: Critical overload step 1 (115% loading, stress = 1.0)
    s3 = model.update(115.0, step=2)
    assert s3 == GridTransformerState.CRITICAL
    assert not model.is_outage_tripped

    # Step 4: Critical overload step 2 (stress = 2.0)
    s4 = model.update(115.0, step=3)
    assert s4 == GridTransformerState.CRITICAL
    assert not model.is_outage_tripped

    # Step 5: Critical overload step 3 (stress = 3.0 -> Trip!)
    s5 = model.update(115.0, step=4)
    assert s5 == GridTransformerState.SIMULATED_OUTAGE
    assert model.is_outage_tripped is True


def test_gymnasium_env_lifecycle():
    """Verifies reset, step, observation dimensions, and termination behavior."""
    env = EVChargingGridEnv(
        num_evs=4,
        transformer_capacity_kva=80.0,
        total_steps=8,
    )
    obs, info = env.reset(seed=123)
    assert obs.shape == (4 + 4 * 4,)
    assert info["step"] == 0
    assert "transformer_loading_percent" in info

    # Step with full charging
    action = np.array([2, 2, 2, 2])
    next_obs, reward, terminated, truncated, info = env.step(action)
    assert next_obs.shape == obs.shape
    assert isinstance(reward, float)
    assert not truncated

    # Run remaining steps
    for _ in range(7):
        if terminated:
            break
        _, _, terminated, _, _ = env.step(action)
