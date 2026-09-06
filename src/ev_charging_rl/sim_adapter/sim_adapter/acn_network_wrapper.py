"""
acn_network_wrapper.py

Wraps acnportal.acnsim's ChargingNetwork / EVSE / Simulator so the
rest of the project (decision_engine, baselines) interacts with one
stable interface, insulated from ACN-Sim API changes across versions.

NOTE: ACNPortal's exact class names/signatures have shifted slightly
across releases. This wrapper targets the documented stable API
(acnportal.acnsim.ChargingNetwork, acnportal.acnsim.models.EVSE,
acnportal.acnsim.Simulator). Verify against your installed version
with `pip show acnportal` and the matching docs version if you hit
import errors.
"""

from dataclasses import dataclass

try:
    from acnportal import acnsim
    from acnportal.acnsim.network import ChargingNetwork
    from acnportal.acnsim.models.evse import get_evse_by_type
except ImportError as e:
    raise ImportError(
        "acnportal is not installed. Run: pip install acnportal"
    ) from e


@dataclass
class NetworkConfig:
    num_evses: int = 20
    evse_type: str = "AeroVironment"   # ACNPortal built-in EVSE type; see acnsim.models.evse
    voltage: float = 240.0             # volts, used for current<->power conversion
    max_current_per_evse: float = 32.0  # amps


def build_network(config: NetworkConfig) -> ChargingNetwork:
    """
    Constructs an ACN-Sim ChargingNetwork with `config.num_evses` EVSEs.
    No site-wide capacity constraint is added here on purpose --
    the transformer-level constraint is layered on top separately by
    transformer_constraint.py, since it represents a DIFFERENT
    physical thing (upstream transformer) than ACN-Sim's native
    site/EVSE-level constraints.
    """
    network = ChargingNetwork()

    for i in range(config.num_evses):
        evse_id = f"EVSE-{i:03d}"
        evse = get_evse_by_type(evse_id, config.evse_type)
        network.register_evse(evse, config.voltage, phase_angle=0)

    return network


def get_current_load_kw(network: ChargingNetwork, current_amps_per_evse: dict) -> float:
    """
    Converts a dict of {evse_id: current_amps} pilot signals into
    total aggregate kW draw, using the network's registered voltage
    per EVSE.

    Args:
        network: the ChargingNetwork
        current_amps_per_evse: {evse_id: amps} -- e.g. output of a
            schedule() call from an Algorithm

    Returns:
        total load in kW
    """
    total_kw = 0.0
    for evse_id, amps in current_amps_per_evse.items():
        voltage = network._voltages.get(evse_id, 240.0)  # fallback if not found
        total_kw += (amps * voltage) / 1000.0
    return total_kw


def active_ev_summary(active_evs: list) -> list[dict]:
    """
    Converts ACN-Sim's active EV objects (as passed into an
    Algorithm.schedule() call) into plain dicts with the fields our
    RL env and priority engine need: SOC, remaining energy needed,
    time until departure.

    Each EV object from acnsim exposes (per ACNPortal docs):
        ev.session_id, ev.station_id, ev.arrival, ev.departure,
        ev.requested_energy, ev.energy_delivered, ev.remaining_demand
    """
    summary = []
    for ev in active_evs:
        remaining_kwh = getattr(ev, "remaining_demand", None)
        if remaining_kwh is None:
            remaining_kwh = max(
                0.0, getattr(ev, "requested_energy", 0.0) - getattr(ev, "energy_delivered", 0.0)
            )

        summary.append({
            "session_id": ev.session_id,
            "station_id": ev.station_id,
            "arrival": ev.arrival,
            "departure": ev.departure,
            "requested_energy_kwh": getattr(ev, "requested_energy", None),
            "energy_delivered_kwh": getattr(ev, "energy_delivered", 0.0),
            "remaining_energy_kwh": remaining_kwh,
        })
    return summary
