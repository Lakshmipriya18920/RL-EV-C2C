"""Pydantic Request and Response Schemas for EV Charging Simulation REST API."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SimulationRequest(BaseModel):
    scenario_name: Optional[str] = Field(default=None, description="Preset scenario name (optional)")
    ev_count: int = Field(default=10, ge=1, le=20, description="Number of EV chargers (1-20)")
    transformer_capacity_kw: float = Field(default=100.0, gt=0, description="Transformer rated capacity in kW/kVA")
    base_load_kw: float = Field(default=60.0, ge=0, description="Peak residential base load in kW")
    charging_power_kw: float = Field(default=7.4, gt=0, description="EV charging rated power in kW")
    battery_capacity_kwh: float = Field(default=50.0, gt=0, description="EV battery capacity in kWh")
    target_soc: float = Field(default=0.85, ge=0.1, le=1.0, description="Target state of charge (0.1 - 1.0)")
    duration_hours: int = Field(default=8, ge=1, le=24, description="Simulation duration in hours")
    time_step_minutes: int = Field(default=15, ge=1, le=60, description="Timestep resolution in minutes")
    outage_threshold_loading_percent: float = Field(default=115.0, gt=50.0, description="Overload percentage triggering outage timer")
    critical_duration_steps: int = Field(default=3, ge=1, description="Consecutive critical steps before trip")
    seed: int = Field(default=42, description="Random seed for deterministic reproducibility")


class EVStateSeries(BaseModel):
    ev_id: str
    soc_series: List[float]
    state_series: List[str]
    power_kw_series: List[float]


class MetricsResponse(BaseModel):
    peak_load_kw: float
    max_loading_percent: float
    overload_timesteps: int
    outage_occurred: bool
    outage_step: Optional[int]
    total_energy_delivered_kwh: float
    target_energy_kwh: float
    satisfaction_percent: float
    voltage_violations_count: int
    min_voltage_pu: float


class EpisodeSimulationResponse(BaseModel):
    timestamps: List[str]
    total_load_kw: List[float]
    transformer_loading_percent: List[float]
    ev_load_kw: List[float]
    base_load_kw: List[float]
    min_bus_voltage_pu: List[float]
    transformer_state: List[str]
    ev_states: List[EVStateSeries]
    metrics: MetricsResponse


class ComparisonSimulationResponse(BaseModel):
    timestamps: List[str]
    baseline: EpisodeSimulationResponse
    rl: EpisodeSimulationResponse
