"""Unit tests for priority score computation and fleet ranking."""

import pytest
from ev_charging_rl.decision_engine.priority_engine.priority_score import (
    EVPriorityInput,
    compute_priority_score,
    rank_fleet,
)


def test_compute_priority_score_urgency():
    ev_urgent = EVPriorityInput(
        session_id="s1",
        hours_until_departure=1.0,
        remaining_energy_kwh=20.0,
        max_charge_rate_kw=7.4,
    )
    ev_relaxed = EVPriorityInput(
        session_id="s2",
        hours_until_departure=10.0,
        remaining_energy_kwh=20.0,
        max_charge_rate_kw=7.4,
    )
    score_urgent = compute_priority_score(ev_urgent, fleet_max_remaining_kwh=20.0)
    score_relaxed = compute_priority_score(ev_relaxed, fleet_max_remaining_kwh=20.0)

    assert score_urgent["total_score"] > score_relaxed["total_score"]


def test_rank_fleet():
    evs = [
        EVPriorityInput(session_id="s1", hours_until_departure=8.0, remaining_energy_kwh=10.0, max_charge_rate_kw=7.4),
        EVPriorityInput(session_id="s2", hours_until_departure=1.0, remaining_energy_kwh=25.0, max_charge_rate_kw=7.4),
    ]
    ranked = rank_fleet(evs)
    assert ranked[0]["session_id"] == "s2"
