"""CLI tool to execute named simulation scenarios and output JSON reports."""

import os
import json
import argparse
import yaml
from ev_charging_rl.control.charge_rate_allocator import SimulationOrchestrator


def run_named_scenario(
    scenario_name: str = "high_ev_penetration",
    output_dir: str = "results/reports",
    model_checkpoint: str = "models/checkpoints/ppo_ev_balancer.zip",
):
    scenario_file = f"config/scenarios/{scenario_name}.yaml"
    if not os.path.exists(scenario_file):
        raise FileNotFoundError(f"Scenario file '{scenario_file}' not found.")

    with open(scenario_file, "r") as f:
        config = yaml.safe_load(f)

    print(f"\n=======================================================")
    print(f" RUNNING SCENARIO: {scenario_name.upper()}")
    print(f" Description: {config.get('description', '')}")
    print(f"=======================================================")

    orchestrator = SimulationOrchestrator(model_checkpoint_path=model_checkpoint)
    result = orchestrator.run_comparison(config=config, seed=42)

    os.makedirs(output_dir, exist_ok=True)
    report_file = os.path.join(output_dir, f"{scenario_name}_comparison.json")
    with open(report_file, "w") as f:
        json.dump(result, f, indent=2)

    base_m = result["baseline"]["metrics"]
    rl_m = result["rl"]["metrics"]

    print(f"\n--- RESULTS SUMMARY ---")
    print(f"{'Metric':<35} | {'Baseline (Uncontrolled)':<24} | {'RL Load-Balancer':<20}")
    print("-" * 88)
    print(f"{'Peak Transformer Load (kW)':<35} | {base_m['peak_load_kw']:<24.2f} | {rl_m['peak_load_kw']:<20.2f}")
    print(f"{'Max Transformer Loading (%)':<35} | {base_m['max_loading_percent']:<24.2f} | {rl_m['max_loading_percent']:<20.2f}")
    print(f"{'Overload Steps (>100%)':<35} | {base_m['overload_timesteps']:<24d} | {rl_m['overload_timesteps']:<20d}")
    print(f"{'Simulated Outage Tripped':<35} | {str(base_m['outage_occurred']):<24} | {str(rl_m['outage_occurred']):<20}")
    print(f"{'Total Delivered Energy (kWh)':<35} | {base_m['total_energy_delivered_kwh']:<24.2f} | {rl_m['total_energy_delivered_kwh']:<20.2f}")
    print(f"{'Satisfaction Rate (%)':<35} | {base_m['satisfaction_percent']:<24.1f} | {rl_m['satisfaction_percent']:<20.1f}")
    print(f"\nFull time-series JSON saved to: {report_file}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run named EV charging simulation scenario")
    parser.add_argument("--scenario", type=str, default="high_ev_penetration", help="Scenario name (e.g. normal_day, high_ev_penetration, transformer_stressed, outage_prone)")
    parser.add_argument("--model", type=str, default="models/checkpoints/ppo_ev_balancer.zip", help="PPO model checkpoint path")
    args = parser.parse_args()

    run_named_scenario(scenario_name=args.scenario, model_checkpoint=args.model)
