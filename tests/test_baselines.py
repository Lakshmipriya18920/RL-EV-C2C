"""Unit tests for baseline controllers."""

import numpy as np
from ev_charging_rl.data_layer.ev_fleet_state import EVState
from ev_charging_rl.baselines.fcfs import FCFSController
from ev_charging_rl.baselines.static_priority import StaticPriorityController


def test_fcfs_controller():
    fcfs = FCFSController(num_evs=2)
    fleet = [
        EVState(
            ev_id="EV-1",
            arrival_step=0,
            departure_step=10,
            battery_capacity_kwh=50.0,
            target_soc=0.8,
            initial_soc=0.3,
            current_soc=0.3,
            rated_power_kw=7.4,
            reduced_power_kw=3.7,
            is_connected=True,
        ),
        EVState(
            ev_id="EV-2",
            arrival_step=5,
            departure_step=15,
            battery_capacity_kwh=50.0,
            target_soc=0.8,
            initial_soc=0.4,
            current_soc=0.4,
            rated_power_kw=7.4,
            reduced_power_kw=3.7,
            is_connected=False,
        ),
    ]

    actions = fcfs.compute_actions(fleet)
    assert actions[0] == 2  # Connected EV charges at max
    assert actions[1] == 0  # Disconnected EV idle
