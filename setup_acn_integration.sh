#!/usr/bin/env bash
# =============================================================================
# setup_acn_integration.sh
#
# Adds the ACN-Data / ACN-Sim integration layer to the existing
# ev-charging-rl repo, plus the transformer constraint layer and
# ACNPortal-based baselines.
#
# Usage:
#   1. Copy this script into the ROOT of your ev-charging-rl repo
#      (same level as src/, data/, config/, etc.)
#   2. chmod +x setup_acn_integration.sh
#   3. ./setup_acn_integration.sh
#
# It is SAFE to re-run: existing files are never overwritten, only
# missing ones are created.
# =============================================================================

set -euo pipefail

ROOT="$(pwd)"
SRC="$ROOT/src/ev_charging_rl"

echo "==> Scaffolding ACN integration into: $ROOT"

# -----------------------------------------------------------------------
# Helper: create a file only if it doesn't already exist
# -----------------------------------------------------------------------
create_if_missing() {
  local filepath="$1"
  local content="$2"
  if [ -f "$filepath" ]; then
    echo "    [skip]   $filepath (already exists)"
  else
    mkdir -p "$(dirname "$filepath")"
    printf '%s' "$content" > "$filepath"
    echo "    [create] $filepath"
  fi
}

# =========================================================================
# 1. data/ additions — raw ACN-Data + processed distributions
# =========================================================================
echo ""
echo "-- data/ --"
mkdir -p "$ROOT/data/raw/acn_data"
mkdir -p "$ROOT/data/processed"
mkdir -p "$ROOT/data/synthetic"

create_if_missing "$ROOT/data/raw/acn_data/.gitkeep" ""

create_if_missing "$ROOT/data/processed/session_distributions.py" '"""
session_distributions.py

Fits arrival time, dwell time, and requested-energy distributions
from real ACN-Data sessions. These fitted distributions are what the
rural scenario generator (data/synthetic/rural_load_generator.py)
samples from, since ACN-Data itself reflects US campus charging
behavior, not rural/semi-urban India.

TODO:
- load_sessions(path) -> list[dict]
- fit_arrival_distribution(sessions) -> scipy distribution or histogram
- fit_dwell_time_distribution(sessions) -> scipy distribution
- fit_energy_requested_distribution(sessions) -> scipy distribution
- save_distributions(out_path) / load_distributions(path)
"""
'

create_if_missing "$ROOT/data/synthetic/rural_load_generator.py" '"""
rural_load_generator.py

Synthesizes/calibrates rural & semi-urban distribution transformer
load curves. ACN-Data has no transformer-side data, so this is built
independently -- e.g. seasonal + daily patterns with sharper evening
peaks and lower headroom than urban feeders, optionally calibrated
against any real DISCOM data you obtain.

TODO:
- generate_daily_load_curve(config) -> np.ndarray
- inject_stress_event(load_curve, kind="capacity_drop") -> np.ndarray
- generate_scenario(scenario_config) -> dict (load curve + metadata)
"""
'

# =========================================================================
# 2. src/ev_charging_rl/sim_adapter/ — bridges ACN-Sim into the project
# =========================================================================
echo ""
echo "-- src/ev_charging_rl/sim_adapter/ --"
mkdir -p "$SRC/sim_adapter"

create_if_missing "$SRC/sim_adapter/__init__.py" ""

create_if_missing "$SRC/sim_adapter/acn_data_loader.py" '"""
acn_data_loader.py

Pulls and parses real charging sessions from the ACN-Data API
(https://ev.caltech.edu/dataset) using acnportal'"'"'s data client,
and converts them into the session format used by
data/processed/session_distributions.py.

Reference: https://acnportal.readthedocs.io/en/latest/

TODO:
- fetch_sessions(site, start_date, end_date, api_token) -> list[dict]
- to_dataframe(sessions) -> pandas.DataFrame
- cache_to_disk(df, path)
"""
'

create_if_missing "$SRC/sim_adapter/acn_network_wrapper.py" '"""
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
'

create_if_missing "$SRC/sim_adapter/transformer_constraint.py" '"""
transformer_constraint.py

THE NOVEL LAYER — models the rural/semi-urban distribution
transformer that ACN-Sim itself has no concept of:
  - rated capacity + safety margin
  - thermal stress proxy (accumulated overload exposure)
  - stochastic "unreliable grid" capacity drops (brownouts,
    partial faults) to simulate blackout risk

This wraps around acn_network_wrapper.build_network() and enforces
an aggregate cap on top of whatever ACN-Sim'"'"'s own site/EVSE
constraints allow.

TODO:
- class TransformerConstraint:
    - __init__(self, rated_capacity_kw, safety_margin_pct)
    - available_headroom(self, current_load) -> float
    - update_stress(self, current_load, dt) -> float
    - maybe_trigger_capacity_drop(self, rng) -> float  # simulates instability
    - is_overloaded(self, current_load) -> bool
"""
'

# =========================================================================
# 3. decision_engine/ — only NEW files needed for ACN integration
#    (env.py, priority_engine/, rl_policy/ already exist per prior structure)
# =========================================================================
echo ""
echo "-- src/ev_charging_rl/decision_engine/ (integration hook) --"
mkdir -p "$SRC/decision_engine"

create_if_missing "$SRC/decision_engine/acn_env_adapter.py" '"""
acn_env_adapter.py

Adapter that lets decision_engine/env.py (the gymnasium.Env) drive
the ACN-Sim network via sim_adapter/acn_network_wrapper.py and
transformer_constraint.py, instead of a from-scratch simulator.

Keeps env.py itself framework-agnostic -- if ACN-Sim'"'"'s API changes,
only this adapter needs updating.

TODO:
- reset_episode(config) -> initial observation
- apply_action(action_vector) -> forwards to network + transformer,
  returns (obs, reward_components, done, info)
- get_observation_space_spec() -> dict describing obs shape/bounds
"""
'

# =========================================================================
# 4. baselines/ — ACNPortal Algorithm-compatible baselines
# =========================================================================
echo ""
echo "-- src/ev_charging_rl/baselines/ --"
mkdir -p "$SRC/baselines"

create_if_missing "$SRC/baselines/__init__.py" ""

create_if_missing "$SRC/baselines/fcfs.py" '"""
fcfs.py

First-come-first-served baseline, implemented as an
acnportal.algorithms.BaseAlgorithm subclass so it can run inside
ACN-Sim identically to the RL policy and other baselines.

TODO:
- class FCFSAlgorithm(BaseAlgorithm):
    - schedule(self, active_evs) -> dict[str, list[float]]
"""
'

create_if_missing "$SRC/baselines/static_priority.py" '"""
static_priority.py

Non-learned version of the multi-factor priority score (urgency,
remaining energy, flexibility, past delays, fairness debt), applied
greedily each timestep. This is the "smart but not adaptive"
baseline that RL needs to beat.

Implemented as an acnportal.algorithms.BaseAlgorithm subclass.

TODO:
- class StaticPriorityAlgorithm(BaseAlgorithm):
    - schedule(self, active_evs) -> dict[str, list[float]]
  (delegates scoring to decision_engine/priority_engine/priority_score.py)
"""
'

create_if_missing "$SRC/baselines/fixed_offpeak_schedule.py" '"""
fixed_offpeak_schedule.py

Naive heuristic baseline: full charge rate only during a fixed
off-peak window (e.g. 11pm-6am), zero otherwise. Represents what
many utilities already do today without any intelligence layer.

TODO:
- class FixedOffPeakAlgorithm(BaseAlgorithm):
    - schedule(self, active_evs) -> dict[str, list[float]]
"""
'

create_if_missing "$SRC/baselines/acnportal_reference_algos.py" '"""
acnportal_reference_algos.py

Thin import/config layer exposing ACNPortal'"'"'s own built-in
reference algorithms (e.g. uncontrolled charging, greedy/earliest-
deadline-first) so they can be run through the same evaluate.py
comparison harness as our custom baselines and RL policy.

Reference: https://acnportal.readthedocs.io/en/latest/

TODO:
- get_uncontrolled_algorithm() -> acnportal.algorithms.<...>
- get_earliest_deadline_first_algorithm() -> acnportal.algorithms.<...>
"""
'

# =========================================================================
# 5. scripts/ — new CLI entry points for ACN-Data pull
# =========================================================================
echo ""
echo "-- scripts/ --"
mkdir -p "$ROOT/scripts"

create_if_missing "$ROOT/scripts/pull_acn_data.py" '"""
pull_acn_data.py

CLI script to pull real sessions from the ACN-Data API and cache
them to data/raw/acn_data/, then fit and save distributions to
data/processed/ via session_distributions.py.

Usage:
    python scripts/pull_acn_data.py --site caltech --start 2023-01-01 --end 2023-06-01

TODO:
- argparse: --site, --start, --end, --api-token, --out
- calls sim_adapter.acn_data_loader.fetch_sessions(...)
- calls data.processed.session_distributions.fit_* and saves output
"""
'

# =========================================================================
# 6. requirements.txt — append ACN-related deps if not already present
# =========================================================================
echo ""
echo "-- requirements.txt --"
REQ_FILE="$ROOT/requirements.txt"
touch "$REQ_FILE"

add_requirement() {
  local pkg="$1"
  if grep -qi "^${pkg}" "$REQ_FILE" 2>/dev/null; then
    echo "    [skip]   $pkg (already in requirements.txt)"
  else
    echo "$pkg" >> "$REQ_FILE"
    echo "    [add]    $pkg"
  fi
}

add_requirement "acnportal"
add_requirement "pandas"
add_requirement "scipy"

echo ""
echo "==> Done. New/updated paths:"
echo "    data/raw/acn_data/"
echo "    data/processed/session_distributions.py"
echo "    data/synthetic/rural_load_generator.py"
echo "    src/ev_charging_rl/sim_adapter/"
echo "    src/ev_charging_rl/decision_engine/acn_env_adapter.py"
echo "    src/ev_charging_rl/baselines/"
echo "    scripts/pull_acn_data.py"
echo "    requirements.txt (updated)"
