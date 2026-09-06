# Reinforcement Learning for EV Charging Load-Balancing on Unreliable Grids (RL-EV-C2C)

An interactive simulation and reinforcement learning framework for scheduling EV charging on low-voltage distribution transformers in unreliable and rural/semi-urban grids.

## Features
- **Power Grid Simulation**: High-fidelity AC power flow modeled using `pandapower` (11/0.4 kV radial feeder, line constraints, bus voltage profiles).
- **Transformer Thermal & Outage Dynamics**: Inverse-time thermal stress accumulator with realistic trip thresholds (`NORMAL` → `HIGH_LOAD` → `OVERLOAD` → `CRITICAL` → `SIMULATED_OUTAGE`).
- **Gymnasium Custom Environment**: `EVChargingGridEnv` with multi-term reward formulation for peak shaving, outage prevention, voltage constraint compliance, and driver satisfaction.
- **ACN-Data & Synthetic Load Integration**: Support for Caltech/JPL ACN EV session datasets, synthetic rural load generators, and real distribution transformer base-load curves.
- **FastAPI REST Service**: Endpoints for running baseline vs RL simulations, scenario comparisons, and real-time frontend visualization.
- **Interactive Web Dashboard**: Synchronized grid topology, animated EV charging states, and time-series load curves.
