"""
acn_env_adapter.py

Adapter that lets decision_engine/env.py (the gymnasium.Env) drive
the ACN-Sim network via sim_adapter/acn_network_wrapper.py and
transformer_constraint.py, instead of a from-scratch simulator.

Keeps env.py itself framework-agnostic -- if ACN-Sim's API changes,
only this adapter needs updating.

TODO:
- reset_episode(config) -> initial observation
- apply_action(action_vector) -> forwards to network + transformer,
  returns (obs, reward_components, done, info)
- get_observation_space_spec() -> dict describing obs shape/bounds
"""
