"""Evaluation & Comparative Benchmarking Script: Baseline vs RL Policy."""

import os
import argparse
import yaml
import numpy as np
from ev_charging_rl.decision_engine.env import EVChargingGridEnv
from ev_charging_rl.baselines.fcfs import FCFSController
from ev_charging_rl.decision_engine.rl_policy.ppo_agent import PPOAgentWrapper


def evaluate_scenario(
    scenario_path: str = "config/scenarios/high_ev_penetration.yaml",
    model_path: str = "models/checkpoints/ppo_ev_balancer.zip",
    seed: int = 100,
):
    print(f"\n=======================================================")
    print(f" EVALUATING SCENARIO: {scenario_path}")
    print(f"=======================================================")

    with open(scenario_path, "r") as f:
        sc = yaml.safe_load(f)

    # 1. Initialize Baseline Environment
    env_base = EVChargingGridEnv(
        num_evs=sc["ev_count"],
        transformer_capacity_kva=sc["transformer_capacity_kva"],
        charging_power_rated_kw=sc["charging_power_kw"],
        battery_capacity_kwh=sc["battery_capacity_kwh"],
        target_soc=sc["target_soc"],
        total_steps=sc["duration_hours"] * int(60 / sc["time_step_minutes"]),
        time_step_minutes=sc["time_step_minutes"],
        base_load_peak_kw=sc.get("base_load_peak_kw", 60.0),
        outage_threshold_loading=sc["outage_threshold_loading"],
        critical_duration_steps=sc["critical_duration_steps"],
    )

    # 2. Run Baseline (Uncontrolled FCFS)
    fcfs = FCFSController(num_evs=sc["ev_count"])
    obs_base, _ = env_base.reset(seed=seed)
    term_base = False
    
    base_trafo_peaks = []
    base_loadings = []
    base_outage = False
    base_overloads = 0
    base_volt_viols = 0

    while not term_base:
        actions = fcfs.compute_actions(env_base.fleet)
        obs_base, _, term_base, _, info = env_base.step(actions)
        loading = info["transformer_loading_percent"]
        trafo_kw = info["transformer_load_kw"]
        min_v = info["min_bus_voltage_pu"]

        base_trafo_peaks.append(trafo_kw)
        base_loadings.append(loading)
        if loading > 100.0:
            base_overloads += 1
        if min_v < 0.95:
            base_volt_viols += 1
        if info["is_outage_tripped"]:
            base_outage = True

    base_energy_delivered = sum(ev.energy_delivered_kwh for ev in env_base.fleet)
    base_target_energy = sum(
        max(0.0, ev.target_soc - ev.initial_soc) * ev.battery_capacity_kwh for ev in env_base.fleet
    )
    base_satisfaction = (base_energy_delivered / max(1e-5, base_target_energy)) * 100.0

    # 3. Run RL Policy (if trained model exists, else heuristic fallback)
    env_rl = EVChargingGridEnv(
        num_evs=sc["ev_count"],
        transformer_capacity_kva=sc["transformer_capacity_kva"],
        charging_power_rated_kw=sc["charging_power_kw"],
        battery_capacity_kwh=sc["battery_capacity_kwh"],
        target_soc=sc["target_soc"],
        total_steps=sc["duration_hours"] * int(60 / sc["time_step_minutes"]),
        time_step_minutes=sc["time_step_minutes"],
        base_load_peak_kw=sc.get("base_load_peak_kw", 60.0),
        outage_threshold_loading=sc["outage_threshold_loading"],
        critical_duration_steps=sc["critical_duration_steps"],
    )

    has_model = os.path.exists(model_path)
    if has_model:
        agent = PPOAgentWrapper(model_path=model_path)
    else:
        print(f"[Notice] Model {model_path} not found. Running with greedy smart controller.")

    obs_rl, _ = env_rl.reset(seed=seed)
    term_rl = False
    rl_trafo_peaks = []
    rl_loadings = []
    rl_outage = False
    rl_overloads = 0
    rl_volt_viols = 0

    while not term_rl:
        if has_model:
            actions = agent.predict(obs_rl, deterministic=True)
        else:
            # Simple capacity-aware heuristic
            actions = np.zeros(sc["ev_count"], dtype=int)
            curr_base = env_rl.base_load_curve[min(env_rl.current_step, len(env_rl.base_load_curve)-1)]
            headroom = max(0.0, (sc["transformer_capacity_kva"] * 0.90) - curr_base)
            used = 0.0
            for i, ev in enumerate(env_rl.fleet):
                if ev.is_connected and ev.current_soc < ev.target_soc:
                    if used + sc["charging_power_kw"] <= headroom:
                        actions[i] = 2
                        used += sc["charging_power_kw"]
                    elif used + (sc["charging_power_kw"] * 0.5) <= headroom:
                        actions[i] = 1
                        used += sc["charging_power_kw"] * 0.5

        obs_rl, _, term_rl, _, info_rl = env_rl.step(actions)
        loading = info_rl["transformer_loading_percent"]
        trafo_kw = info_rl["transformer_load_kw"]
        min_v = info_rl["min_bus_voltage_pu"]

        rl_trafo_peaks.append(trafo_kw)
        rl_loadings.append(loading)
        if loading > 100.0:
            rl_overloads += 1
        if min_v < 0.95:
            rl_volt_viols += 1
        if info_rl["is_outage_tripped"]:
            rl_outage = True

    rl_energy_delivered = sum(ev.energy_delivered_kwh for ev in env_rl.fleet)
    rl_target_energy = sum(
        max(0.0, ev.target_soc - ev.initial_soc) * ev.battery_capacity_kwh for ev in env_rl.fleet
    )
    rl_satisfaction = (rl_energy_delivered / max(1e-5, rl_target_energy)) * 100.0

    # 4. Print Comparison Table
    print("\n--- COMPARATIVE RESULTS ---")
    print(f"{'Metric':<35} | {'Baseline (Uncontrolled)':<24} | {'RL Load-Balancer':<20}")
    print("-" * 88)
    print(f"{'Peak Transformer Load (kW)':<35} | {max(base_trafo_peaks):<24.2f} | {max(rl_trafo_peaks):<20.2f}")
    print(f"{'Max Transformer Loading (%)':<35} | {max(base_loadings):<24.2f} | {max(rl_loadings):<20.2f}")
    print(f"{'Overload Timesteps (>100%)':<35} | {base_overloads:<24d} | {rl_overloads:<20d}")
    print(f"{'Simulated Outage Occurred':<35} | {str(base_outage):<24} | {str(rl_outage):<20}")
    print(f"{'Voltage Violations (<0.95 pu)':<35} | {base_volt_viols:<24d} | {rl_volt_viols:<20d}")
    print(f"{'Total Delivered Energy (kWh)':<35} | {base_energy_delivered:<24.2f} | {rl_energy_delivered:<20.2f}")
    print(f"{'Target Satisfaction Rate (%)':<35} | {base_satisfaction:<24.1f} | {rl_satisfaction:<20.1f}")
    print("=======================================================\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate Baseline vs RL")
    parser.add_argument("--scenario", type=str, default="config/scenarios/high_ev_penetration.yaml")
    parser.add_argument("--model", type=str, default="models/checkpoints/ppo_ev_balancer.zip")
    args = parser.parse_args()

    evaluate_scenario(scenario_path=args.scenario, model_path=args.model)
