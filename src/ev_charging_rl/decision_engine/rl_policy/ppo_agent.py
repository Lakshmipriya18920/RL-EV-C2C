"""Stable-Baselines3 PPO Agent Training & Inference Wrapper for EV Load Balancing."""

import os
from typing import Any, Dict, Optional, Tuple, Union
import numpy as np
try:
    from stable_baselines3 import PPO
    from stable_baselines3.common.callbacks import BaseCallback
    HAS_SB3 = True
except Exception:
    PPO = None
    BaseCallback = object
    HAS_SB3 = False

from ..env import EVChargingGridEnv


class PPOAgentWrapper:
    """Wrapper around Stable-Baselines3 PPO for training and fast deterministic inference."""

    def __init__(
        self,
        env: Optional[EVChargingGridEnv] = None,
        model_path: Optional[str] = None,
        learning_rate: float = 3e-4,
        n_steps: int = 256,
        batch_size: int = 64,
        n_epochs: int = 10,
        gamma: float = 0.99,
        gae_lambda: float = 0.95,
        clip_range: float = 0.2,
        ent_coef: float = 0.01,
        verbose: int = 1,
        seed: int = 42,
    ):
        self.env = env
        self.model_path = model_path
        self.model: Optional[PPO] = None

        if model_path and os.path.exists(model_path):
            self.load(model_path)
        elif env is not None:
            self.model = PPO(
                policy="MlpPolicy",
                env=env,
                learning_rate=learning_rate,
                n_steps=n_steps,
                batch_size=batch_size,
                n_epochs=n_epochs,
                gamma=gamma,
                gae_lambda=gae_lambda,
                clip_range=clip_range,
                ent_coef=ent_coef,
                verbose=verbose,
                seed=seed,
            )

    def train(self, total_timesteps: int = 20000, callback: Optional[BaseCallback] = None) -> None:
        """Trains the PPO agent on the environment."""
        if self.model is None:
            raise ValueError("No model or environment initialized for training.")
        self.model.learn(total_timesteps=total_timesteps, callback=callback)

    def save(self, path: str) -> None:
        """Saves trained model weights."""
        if self.model is None:
            raise ValueError("No model available to save.")
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        self.model.save(path)

    def load(self, path: str) -> None:
        """Loads pre-trained weights from disk."""
        if not HAS_SB3 or PPO is None:
            raise RuntimeError("Stable-Baselines3 / PyTorch is unavailable.")
        self.model = PPO.load(path)

    def predict(self, observation: np.ndarray, deterministic: bool = True) -> np.ndarray:
        """Runs fast inference to obtain charging action vector."""
        if self.model is None:
            raise ValueError("Model is not initialized.")
        action, _ = self.model.predict(observation, deterministic=deterministic)
        return action
