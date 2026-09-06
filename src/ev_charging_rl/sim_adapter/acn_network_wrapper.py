"""
acn_network_wrapper.py

Wraps acnportal.acnsim ChargingNetwork / EVSE / Battery so the rest
of the project interacts with a single, stable interface regardless
of ACN-Sim version changes. This is the seam between our RL env and
the ACN-Sim physics engine.

TODO:
- build_network(config) -> acnportal.acnsim.ChargingNetwork
- add_evse(network, evse_id, evse_type)
- step_network(network, schedule) -> observations dict
- get_current_load(network) -> float (aggregate current/power draw)
"""
