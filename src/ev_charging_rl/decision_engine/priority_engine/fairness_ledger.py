"""
fairness_ledger.py

Tracks each driver's fairness debt/credit across sessions (days), so
the SAME driver isn't repeatedly disadvantaged. When a driver is
delayed or doesn't reach their guaranteed minimum charge, they accrue
debt, which raises their priority score in future sessions
(see priority_score.py's fairness_debt component). Drivers who accept
a delay without complaint (or who consistently have flexible
schedules) can be granted credits as an incentive mechanism.

Persisted as JSON so it survives across simulation episodes / days,
and so it CAN be inspected directly by a driver-facing app for
transparency.
"""

import json
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class DriverRecord:
    driver_id: str
    debt_score: float = 0.0             # 0 = neutral, higher = owed more priority
    total_sessions: int = 0
    total_delay_hours: float = 0.0
    total_shortfall_kwh: float = 0.0    # energy below guaranteed minimum, ever
    credits_earned: float = 0.0         # from voluntarily accepting delays
    history: list[dict] = field(default_factory=list)


class FairnessLedger:
    """
    In-memory ledger with JSON persistence. One instance covers one
    neighborhood/transformer's driver population.
    """

    def __init__(self, decay_per_session: float = 0.05):
        """
        decay_per_session: debt slowly decays each session even
        without new delays, so debt reflects a rolling recent history
        rather than an ever-growing lifetime total.
        """
        self._records: dict[str, DriverRecord] = {}
        self.decay_per_session = decay_per_session

    def _get_or_create(self, driver_id: str) -> DriverRecord:
        if driver_id not in self._records:
            self._records[driver_id] = DriverRecord(driver_id=driver_id)
        return self._records[driver_id]

    def get_debt_score(self, driver_id: str) -> float:
        """Returns the current debt score, used directly as the
        fairness_debt_score input to priority_score.compute_priority_score()."""
        return self._get_or_create(driver_id).debt_score

    def record_session_outcome(
        self,
        driver_id: str,
        delay_hours: float,
        shortfall_kwh: float,
        guaranteed_min_kwh: float,
        accepted_delay_voluntarily: bool = False,
    ) -> None:
        """
        Call once at the end of each charging session to update the
        driver's standing.

        Args:
            delay_hours: how long charging was throttled/paused this session
            shortfall_kwh: energy short of what they actually needed
                           (0 if they got everything they needed)
            guaranteed_min_kwh: the minimum charge this system promises;
                                 used to flag SLA violations distinctly
            accepted_delay_voluntarily: True if the driver opted into
                                         flexible/delayed charging (earns
                                         credit rather than pure debt)
        """
        record = self._get_or_create(driver_id)

        # Apply gentle decay of existing debt before adding new debt,
        # so old grievances fade rather than accumulating forever.
        record.debt_score = max(0.0, record.debt_score - self.decay_per_session)

        # Debt accrual: weighted combination of delay length and
        # shortfall severity relative to their guaranteed minimum.
        delay_debt = min(0.5, delay_hours / 8.0)  # cap contribution from delay alone
        shortfall_ratio = (shortfall_kwh / guaranteed_min_kwh) if guaranteed_min_kwh > 0 else 0.0
        shortfall_debt = min(0.5, shortfall_ratio)

        if accepted_delay_voluntarily:
            # Voluntary acceptance converts what would be debt into credit instead.
            credit_gain = (delay_debt + shortfall_debt) * 0.5
            record.credits_earned += credit_gain
            record.debt_score = max(0.0, record.debt_score - credit_gain * 0.5)
        else:
            record.debt_score = min(1.0, record.debt_score + delay_debt + shortfall_debt)

        record.total_sessions += 1
        record.total_delay_hours += delay_hours
        record.total_shortfall_kwh += shortfall_kwh

        record.history.append({
            "session_number": record.total_sessions,
            "delay_hours": delay_hours,
            "shortfall_kwh": shortfall_kwh,
            "accepted_voluntarily": accepted_delay_voluntarily,
            "debt_score_after": record.debt_score,
        })

    def sla_violation_rate(self, driver_id: str) -> float:
        """Fraction of past sessions where the driver got less than
        their guaranteed minimum -- a key trust/compliance metric."""
        record = self._get_or_create(driver_id)
        if record.total_sessions == 0:
            return 0.0
        violations = sum(1 for h in record.history if h["shortfall_kwh"] > 0)
        return violations / record.total_sessions

    def fleet_debt_variance(self) -> float:
        """
        Variance of debt scores across all tracked drivers -- the key
        fleet-wide fairness metric. Low variance = no one is
        chronically losing out relative to others.
        """
        if not self._records:
            return 0.0
        scores = [r.debt_score for r in self._records.values()]
        mean = sum(scores) / len(scores)
        return sum((s - mean) ** 2 for s in scores) / len(scores)

    def save(self, path: str) -> None:
        out = Path(path)
        out.parent.mkdir(parents=True, exist_ok=True)
        serializable = {
            driver_id: {
                "driver_id": r.driver_id,
                "debt_score": r.debt_score,
                "total_sessions": r.total_sessions,
                "total_delay_hours": r.total_delay_hours,
                "total_shortfall_kwh": r.total_shortfall_kwh,
                "credits_earned": r.credits_earned,
                "history": r.history,
            }
            for driver_id, r in self._records.items()
        }
        with open(out, "w") as f:
            json.dump(serializable, f, indent=2)

    @classmethod
    def load(cls, path: str, decay_per_session: float = 0.05) -> "FairnessLedger":
        ledger = cls(decay_per_session=decay_per_session)
        p = Path(path)
        if not p.exists():
            return ledger
        with open(p, "r") as f:
            raw = json.load(f)
        for driver_id, data in raw.items():
            ledger._records[driver_id] = DriverRecord(**data)
        return ledger
