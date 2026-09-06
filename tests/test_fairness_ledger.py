"""Unit tests for FairnessLedger cross-session fairness tracking."""

import pytest
from ev_charging_rl.decision_engine.priority_engine.fairness_ledger import FairnessLedger


def test_fairness_ledger_accrual_and_decay():
    ledger = FairnessLedger(decay_per_session=0.05)

    # Initially 0
    assert ledger.get_debt_score("driver_1") == 0.0

    # Incur delay and shortfall
    ledger.record_session_outcome(
        driver_id="driver_1",
        delay_hours=2.0,
        shortfall_kwh=5.0,
        guaranteed_min_kwh=20.0,
        accepted_delay_voluntarily=False,
    )
    debt1 = ledger.get_debt_score("driver_1")
    assert debt1 > 0.0

    # Next session with voluntary delay -> earns credits and lowers debt
    ledger.record_session_outcome(
        driver_id="driver_1",
        delay_hours=1.0,
        shortfall_kwh=0.0,
        guaranteed_min_kwh=20.0,
        accepted_delay_voluntarily=True,
    )
    debt2 = ledger.get_debt_score("driver_1")
    assert debt2 < debt1


def test_fleet_debt_variance():
    ledger = FairnessLedger()
    ledger.record_session_outcome("d1", delay_hours=4.0, shortfall_kwh=10.0, guaranteed_min_kwh=20.0)
    ledger.record_session_outcome("d2", delay_hours=0.0, shortfall_kwh=0.0, guaranteed_min_kwh=20.0)
    variance = ledger.fleet_debt_variance()
    assert variance > 0.0
