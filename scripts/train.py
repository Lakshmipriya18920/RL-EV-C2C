"""Training script for PPO Load-Balancing Policy on EV Charging Grid."""

import os
import argparse
import yaml
from ev_charging_rl.decision_engine.env import EVChargingGridEnv
from ev_charging_rl.decision_engine.rl_policy.ppo_agent import PPOAgentWrapper


def train_model(
    config_path: str = "config/default.yaml",
    reward_config_path: str = "config/reward_weights.yaml",
    total_timesteps: int = 15000,
    n_epochs: int = 10,
    output_path: str = "models/checkpoints/ppo_ev_balancer.zip",
):
    print(f"Loading configuration from {config_path}...")
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)

    with open(reward_config_path, "r") as f:
        reward_config = yaml.safe_load(f)

    grid_cfg = config["grid"]
    ev_cfg = config["ev"]
    outage_cfg = config["outage_model"]
    sim_cfg = config["simulation"]

    print("Initializing pandapower EV Charging Environment...")
    env = EVChargingGridEnv(
        num_evs=ev_cfg["default_count"],
        max_evs=20,
        transformer_capacity_kva=grid_cfg["transformer_capacity_kva"],
        nominal_voltage_kv=grid_cfg["nominal_voltage_kv"],
        charging_power_rated_kw=ev_cfg["charger_rated_power_kw"],
        charging_power_reduced_kw=ev_cfg["charger_reduced_power_kw"],
        battery_capacity_kwh=ev_cfg["battery_capacity_kwh"],
        target_soc=ev_cfg["target_soc_default"],
        total_steps=sim_cfg["total_steps"],
        time_step_minutes=sim_cfg["time_step_minutes"],
        outage_threshold_loading=outage_cfg["critical_threshold_loading"],
        critical_duration_steps=outage_cfg["critical_duration_limit_steps"],
        reward_weights=reward_config.get("weights", {}),
    )

    print(f"Creating PPO Agent (Action Space: {env.action_space}, Obs Space: {env.observation_space.shape})...")
    agent = PPOAgentWrapper(
        env=env,
        learning_rate=3e-4,
        n_steps=256,
        batch_size=64,
        n_epochs=n_epochs,
        gamma=0.99,
        verbose=1,
    )

    print(f"Starting training for {total_timesteps} timesteps (PPO n_epochs={n_epochs})...")
    agent.train(total_timesteps=total_timesteps)

    print(f"Saving trained model checkpoint to {output_path}...")
    agent.save(output_path)
    print("Training finished successfully!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train PPO EV Load-Balancing Policy")
    parser.add_argument("--timesteps", type=int, default=None, help="Total training timesteps")
    parser.add_argument("--epochs", type=int, default=None, help="Number of training rollout iterations / epochs (1 iteration = 256 timesteps = 8 episodes)")
    parser.add_argument("--n_epochs", type=int, default=10, help="PPO surrogate loss optimization epochs per rollout update")
    parser.add_argument("--output", type=str, default="models/checkpoints/ppo_ev_balancer.zip", help="Output model path")
    args = parser.parse_args()

    n_steps = 256
    if args.epochs is not None and args.timesteps is None:
        total_timesteps = args.epochs * n_steps
        print(f"Configured training for {args.epochs} epochs/iterations -> {total_timesteps} timesteps ({total_timesteps // 32} episodes).")
    elif args.timesteps is not None:
        total_timesteps = args.timesteps
    else:
        total_timesteps = 15000

    train_model(
        total_timesteps=total_timesteps,
        n_epochs=args.n_epochs,
        output_path=args.output,
    )
