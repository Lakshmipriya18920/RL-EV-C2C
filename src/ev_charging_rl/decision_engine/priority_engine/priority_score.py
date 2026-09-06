"""
priority_score.py

Computes a per-EV priority score each timestep from five factors:
  1. departure urgency     -- how soon do they need to leave
  2. remaining energy need -- how much charge do they still need
  3. flexibility           -- how much slack time they have relative
                               to how long a full charge would take
  4. past delays           -- how much they've already been throttled
                               this session (session-level, not persistent)
  5. fairness debt         -- persistent, cross-session debt/credit
                               from fairness_ledger.py

This is intentionally simple and fully deterministic/transparent --
it is NOT learned, so every delayed driver can be shown exactly which
factor(s) drove their score (see monitoring/driver_explanations.py).
"""

from dataclasses import dataclass


@dataclass
class PriorityWeights:
    urgency: float = 0.35
    remaining_energy: float = 0.20
    flexibility: float = 0.15
    past_delay: float = 0.10
    fairness_debt: float = 0.20


@dataclass
class EVPriorityInput:
    session_id: str
    hours_until_departure: float
    remaining_energy_kwh: float
    max_charge_rate_kw: float
    session_delay_hours_so_far: float = 0.0
    fairness_debt_score: float = 0.0   # from fairness_ledger.py, typically 0-1


def _urgency_component(ev: EVPriorityInput) -> float:
    """Higher score for less time remaining. Normalized with a soft cap
    at 12 hours out (beyond that, urgency is effectively zero)."""
    horizon_hours = 12.0
    hours_left = max(0.0, ev.hours_until_departure)
    return max(0.0, 1.0 - min(hours_left, horizon_hours) / horizon_hours)


def _remaining_energy_component(ev: EVPriorityInput, fleet_max_kwh: float) -> float:
    """Higher score for EVs needing more energy, normalized against
    the largest remaining-energy need in the current fleet so it's
    always in [0, 1] regardless of battery size mix."""
    if fleet_max_kwh <= 0:
        return 0.0
    return min(1.0, ev.remaining_energy_kwh / fleet_max_kwh)


def _flexibility_component(ev: EVPriorityInput) -> float:
    """
    Time required to finish at max rate, vs. time actually available.
    LOW flexibility (barely enough time) should INCREASE priority, so
    this component is inverted: score = 1 - slack_ratio.
    """
    if ev.max_charge_rate_kw <= 0:
        return 1.0  # can't charge at all -- treat as maximally inflexible/urgent

    time_needed_hours = ev.remaining_energy_kwh / ev.max_charge_rate_kw
    time_available_hours = max(0.01, ev.hours_until_departure)

    slack_ratio = max(0.0, (time_available_hours - time_needed_hours) / time_available_hours)
    return 1.0 - min(1.0, slack_ratio)


def _past_delay_component(ev: EVPriorityInput, max_observed_delay_hours: float = 4.0) -> float:
    """Higher score for EVs already delayed longer THIS session
    (separate from the persistent cross-session fairness ledger)."""
    return min(1.0, ev.session_delay_hours_so_far / max_observed_delay_hours)


def compute_priority_score(
    ev: EVPriorityInput,
    fleet_max_remaining_kwh: float,
    weights: PriorityWeights | None = None,
) -> dict:
    """
    Returns a dict with the overall score AND each component, so the
    breakdown can be surfaced directly to drivers via
    monitoring/driver_explanations.py -- this is the transparency
    mechanism the fairness pitch depends on.
    """
    weights = weights or PriorityWeights()

    components = {
        "urgency": _urgency_component(ev),
        "remaining_energy": _remaining_energy_component(ev, fleet_max_remaining_kwh),
        "flexibility": _flexibility_component(ev),
        "past_delay": _past_delay_component(ev),
        "fairness_debt": min(1.0, max(0.0, ev.fairness_debt_score)),
    }

    weighted = {
        "urgency": components["urgency"] * weights.urgency,
        "remaining_energy": components["remaining_energy"] * weights.remaining_energy,
        "flexibility": components["flexibility"] * weights.flexibility,
        "past_delay": components["past_delay"] * weights.past_delay,
        "fairness_debt": components["fairness_debt"] * weights.fairness_debt,
    }

    total_score = sum(weighted.values())

    return {
        "session_id": ev.session_id,
        "total_score": total_score,
        "raw_components": components,
        "weighted_components": weighted,
        "dominant_factor": max(weighted, key=weighted.get),
    }


def rank_fleet(
    evs: list[EVPriorityInput],
    weights: PriorityWeights | None = None,
) -> list[dict]:
    """Scores and sorts an entire fleet, highest priority first."""
    fleet_max_remaining = max((ev.remaining_energy_kwh for ev in evs), default=0.0)

    scored = [
        compute_priority_score(ev, fleet_max_remaining, weights)
        for ev in evs
    ]
    return sorted(scored, key=lambda s: s["total_score"], reverse=True)
