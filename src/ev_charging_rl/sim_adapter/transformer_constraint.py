"""
transformer_constraint.py

THE NOVEL LAYER. ACN-Sim has no concept of an upstream, unreliable
distribution transformer -- it models EVSE/site-level current caps
only. This module models the rural/semi-urban transformer itself:
  - rated capacity + configurable safety margin
  - accumulated thermal stress (overload exposure over time)
  - stochastic capacity drops representing grid instability
    (brownouts, partial faults) -- this is what drives blackout risk

Usage pattern (each simulation timestep):
    headroom = transformer.available_headroom(background_load_kw)
    # ... RL policy + priority engine decide EV charging within headroom ...
    transformer.update_stress(total_load_kw, dt_hours)
    transformer.maybe_trigger_capacity_drop(rng)
"""

from dataclasses import dataclass, field


@dataclass
class TransformerState:
    rated_capacity_kw: float
    safety_margin_pct: float = 0.10          # reserve below rated capacity
    stress_accumulator: float = 0.0          # unitless, grows with sustained overload
    stress_decay_per_hour: float = 0.05      # how fast stress cools down when load drops
    capacity_drop_active: bool = False
    capacity_drop_remaining_hours: float = 0.0
    effective_capacity_kw: float = field(init=False)

    def __post_init__(self):
        self.effective_capacity_kw = self.rated_capacity_kw


class TransformerConstraint:
    """
    Wraps TransformerState with the operations the RL env, priority
    engine, and evaluation metrics all need.
    """

    def __init__(
        self,
        rated_capacity_kw: float,
        safety_margin_pct: float = 0.10,
        stress_overload_gain: float = 1.0,
        stress_decay_per_hour: float = 0.05,
        stress_overload_threshold: float = 1.0,   # fraction of safe capacity
        random_drop_prob_per_hour: float = 0.01,  # baseline instability rate
        random_drop_severity_range: tuple[float, float] = (0.15, 0.40),
        random_drop_duration_range_hours: tuple[float, float] = (0.5, 3.0),
    ):
        self.state = TransformerState(
            rated_capacity_kw=rated_capacity_kw,
            safety_margin_pct=safety_margin_pct,
        )
        self.stress_overload_gain = stress_overload_gain
        self.stress_decay_per_hour = stress_decay_per_hour
        self.stress_overload_threshold = stress_overload_threshold
        self.random_drop_prob_per_hour = random_drop_prob_per_hour
        self.random_drop_severity_range = random_drop_severity_range
        self.random_drop_duration_range_hours = random_drop_duration_range_hours

    @property
    def safe_capacity_kw(self) -> float:
        """Effective capacity minus safety margin -- the ceiling operators
        actually want to stay under, not the nameplate rating."""
        return self.state.effective_capacity_kw * (1 - self.state.safety_margin_pct)

    def available_headroom(self, background_load_kw: float) -> float:
        """
        Headroom available for EV charging this timestep, after
        accounting for non-EV background load (households, agri, etc.)
        and any active capacity-drop event.
        """
        headroom = self.safe_capacity_kw - background_load_kw
        return max(0.0, headroom)

    def is_overloaded(self, total_load_kw: float) -> bool:
        """True if total load (background + EV) exceeds safe capacity."""
        return total_load_kw > self.safe_capacity_kw

    def is_critically_overloaded(self, total_load_kw: float) -> bool:
        """True if load exceeds even the nameplate rating -- i.e. we've
        eaten through the entire safety margin. This is the threshold
        that should trigger emergency throttling regardless of fairness
        scores."""
        return total_load_kw > self.state.effective_capacity_kw

    def update_stress(self, total_load_kw: float, dt_hours: float) -> float:
        """
        Updates the accumulated thermal-stress proxy based on this
        timestep's load. Called once per simulation step.

        Returns the updated stress_accumulator value (higher = more
        cumulative strain on the transformer, useful as a reward
        penalty term and a monitoring metric).
        """
        load_fraction = total_load_kw / self.state.effective_capacity_kw if self.state.effective_capacity_kw > 0 else 0.0

        if load_fraction > self.stress_overload_threshold:
            overload_amount = load_fraction - self.stress_overload_threshold
            self.state.stress_accumulator += self.stress_overload_gain * overload_amount * dt_hours
        else:
            self.state.stress_accumulator = max(
                0.0,
                self.state.stress_accumulator - self.stress_decay_per_hour * dt_hours,
            )

        return self.state.stress_accumulator

    def maybe_trigger_capacity_drop(self, rng, dt_hours: float) -> bool:
        """
        Stochastically simulates grid instability: with some
        probability per hour, effective capacity drops for a random
        duration. Also handles recovery once an active drop expires.

        Call this once per timestep with a numpy Generator (rng) and
        the timestep duration in hours.

        Returns True if a NEW drop was triggered this step.
        """
        # Handle recovery of an existing drop first.
        if self.state.capacity_drop_active:
            self.state.capacity_drop_remaining_hours -= dt_hours
            if self.state.capacity_drop_remaining_hours <= 0:
                self.state.capacity_drop_active = False
                self.state.effective_capacity_kw = self.state.rated_capacity_kw
            return False

        # Otherwise, roll for a new drop this step.
        prob_this_step = self.random_drop_prob_per_hour * dt_hours
        if rng.random() < prob_this_step:
            severity = rng.uniform(*self.random_drop_severity_range)
            duration = rng.uniform(*self.random_drop_duration_range_hours)

            self.state.capacity_drop_active = True
            self.state.capacity_drop_remaining_hours = duration
            self.state.effective_capacity_kw = self.state.rated_capacity_kw * (1 - severity)
            return True

        return False

    def blackout_risk_score(self) -> float:
        """
        Simple composite risk indicator in [0, 1+], combining current
        stress level and whether a capacity drop is active. Useful as
        a dashboard metric and an additional reward-shaping term.
        """
        stress_component = min(1.0, self.state.stress_accumulator / 10.0)
        drop_component = 0.5 if self.state.capacity_drop_active else 0.0
        return min(1.0, stress_component + drop_component)

    def to_dict(self) -> dict:
        """Snapshot for logging/monitoring."""
        return {
            "rated_capacity_kw": self.state.rated_capacity_kw,
            "effective_capacity_kw": self.state.effective_capacity_kw,
            "safe_capacity_kw": self.safe_capacity_kw,
            "stress_accumulator": self.state.stress_accumulator,
            "capacity_drop_active": self.state.capacity_drop_active,
            "blackout_risk_score": self.blackout_risk_score(),
        }
