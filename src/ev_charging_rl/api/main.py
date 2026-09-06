"""FastAPI Backend Application for EV Charging RL Load-Balancing Simulation."""

import os
from typing import Any, Dict, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yaml

from ..control.charge_rate_allocator import SimulationOrchestrator
from .schemas import (
    SimulationRequest,
    EpisodeSimulationResponse,
    ComparisonSimulationResponse,
)

app = FastAPI(
    title="EV Charging RL Load-Balancing API",
    description="Interactive Distribution Grid Simulation & Reinforcement Learning Load-Balancing API",
    version="0.1.0",
)

# Enable CORS for Next.js Frontend (Vercel & localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = SimulationOrchestrator(
    model_checkpoint_path=os.environ.get("MODEL_CHECKPOINT_PATH", "models/checkpoints/ppo_ev_balancer.zip")
)


@app.get("/api/health")
def health_check() -> Dict[str, str]:
    return {"status": "healthy", "service": "ev-charging-rl-backend"}


@app.get("/api/scenarios")
def list_scenarios() -> List[Dict[str, Any]]:
    scenarios_dir = "config/scenarios"
    scenarios = []
    if os.path.exists(scenarios_dir):
        for f in os.listdir(scenarios_dir):
            if f.endswith(".yaml") or f.endswith(".yml"):
                p = os.path.join(scenarios_dir, f)
                try:
                    with open(p, "r") as sc_file:
                        data = yaml.safe_load(sc_file)
                        scenarios.append(data)
                except Exception:
                    pass
    return scenarios


@app.post("/api/simulation/baseline", response_model=EpisodeSimulationResponse)
def simulate_baseline(req: SimulationRequest) -> Dict[str, Any]:
    try:
        config_dict = req.model_dump()
        result = orchestrator.run_episode(config=config_dict, mode="baseline", seed=req.seed)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")


@app.post("/api/simulation/rl", response_model=EpisodeSimulationResponse)
def simulate_rl(req: SimulationRequest) -> Dict[str, Any]:
    try:
        config_dict = req.model_dump()
        result = orchestrator.run_episode(config=config_dict, mode="rl", seed=req.seed)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")


@app.post("/api/simulation/compare", response_model=ComparisonSimulationResponse)
def simulate_compare(req: SimulationRequest) -> Dict[str, Any]:
    try:
        config_dict = req.model_dump()
        result = orchestrator.run_comparison(config=config_dict, seed=req.seed)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")
