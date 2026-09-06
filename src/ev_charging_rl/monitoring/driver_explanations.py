"""Explainability & Driver Narrative Generator for EV Charging Actions."""

from typing import Dict, List, Any


class DriverExplanationGenerator:
    """Translates grid events and RL charging decisions into plain-English driver explanations."""

    @staticmethod
    def generate_step_explanation(
        step: int,
        timestamp: str,
        trafo_load_kw: float,
        trafo_loading_percent: float,
        trafo_cap_kw: float,
        throttled_evs: List[str],
        paused_evs: List[str],
    ) -> str:
        if trafo_loading_percent > 100.0:
            return (
                f"[{timestamp}] CRITICAL GRID EVENT: Transformer load reached {trafo_load_kw:.1f} kW "
                f"({trafo_loading_percent:.1f}% capacity). RL intervention paused {len(paused_evs)} EVs "
                f"and throttled {len(throttled_evs)} EVs to prevent thermal protection trip."
            )
        elif trafo_loading_percent > 85.0:
            return (
                f"[{timestamp}] HIGH LOAD WARNING: Transformer at {trafo_loading_percent:.1f}% capacity. "
                f"RL shifted charging rates for {', '.join(throttled_evs) if throttled_evs else 'active EVs'} "
                f"to maintain safe headroom."
            )
        else:
            return f"[{timestamp}] Grid operating normally ({trafo_loading_percent:.1f}% load). Standard charging profiles active."
