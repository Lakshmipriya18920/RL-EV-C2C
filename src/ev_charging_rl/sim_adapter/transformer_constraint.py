"""
transformer_constraint.py

THE NOVEL LAYER — models the rural/semi-urban distribution
transformer that ACN-Sim itself has no concept of:
  - rated capacity + safety margin
  - thermal stress proxy (accumulated overload exposure)
  - stochastic "unreliable grid" capacity drops (brownouts,
    partial faults) to simulate blackout risk

This wraps around acn_network_wrapper.build_network() and enforces
an aggregate cap on top of whatever ACN-Sim's own site/EVSE
constraints allow.

TODO:
- class TransformerConstraint:
    - __init__(self, rated_capacity_kw, safety_margin_pct)
    - available_headroom(self, current_load) -> float
    - update_stress(self, current_load, dt) -> float
    - maybe_trigger_capacity_drop(self, rng) -> float  # simulates instability
    - is_overloaded(self, current_load) -> bool
"""
