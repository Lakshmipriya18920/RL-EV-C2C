"""FastAPI Backend Application for EV Charging RL Load-Balancing Simulation."""

import os
from typing import Any, Dict, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yaml

from ..control.charge_rate_allocator import SimulationOrchestrator
from ..voice.voice_agent_service import VoiceAgentDispatcher
from .schemas import (
    SimulationRequest,
    EpisodeSimulationResponse,
    ComparisonSimulationResponse,
    VoiceCallRequest,
    VoiceCallResponse,
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


voice_dispatcher = VoiceAgentDispatcher()


@app.post("/api/charging/optimize")
def optimize_charging(data: Dict[str, Any]) -> Dict[str, Any]:
    """Single-step EV load balancing recommendation endpoint."""
    trafo_cap = float(data.get("transformer_capacity", 100.0))
    curr_load = float(data.get("current_load", 0.0))
    evs = data.get("evs", [])

    available_capacity = max(0.0, trafo_cap - curr_load)
    ev_count = max(len(evs), 1)
    equal_share = available_capacity / ev_count

    results = []
    for ev in evs:
        max_rate = float(ev.get("max_charging_rate", 7.4))
        rec_rate = min(max_rate, equal_share)
        results.append({
            "ev_id": ev.get("ev_id", "EV-1"),
            "battery_level": float(ev.get("battery_level", 0.5)),
            "recommended_charging_rate": round(max(rec_rate, 0.0), 2),
        })

    return {
        "available_transformer_capacity": available_capacity,
        "charging_recommendations": results,
    }


@app.get("/api/voice/signed-url")
def get_voice_signed_url() -> Dict[str, Any]:
    """Generates a signed WebRTC/WebSocket URL for in-browser live conversation with ElevenLabs Agent."""
    return voice_dispatcher.get_signed_url()


@app.post("/api/voice/dispatch-call", response_model=VoiceCallResponse)
def dispatch_voice_call(req: VoiceCallRequest) -> Dict[str, Any]:
    """Dispatches an automated voice call via ElevenLabs Conversational AI."""
    result = voice_dispatcher.dispatch_call(
        to_phone=req.phone_number,
        station_id=req.station_id,
        trigger_reason=req.trigger_reason,
        current_soc=req.current_soc,
        target_soc=req.target_soc,
        trafo_loading=req.trafo_loading,
    )
    return result


