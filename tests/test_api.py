"""Unit tests for FastAPI REST Endpoints."""

import pytest
from fastapi.testclient import TestClient
from ev_charging_rl.api.main import app

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_list_scenarios_endpoint():
    response = client.get("/api/scenarios")
    assert response.status_code == 200
    scenarios = response.json()
    assert isinstance(scenarios, list)
    assert len(scenarios) > 0


def test_simulate_compare_endpoint():
    payload = {
        "ev_count": 6,
        "transformer_capacity_kw": 100.0,
        "base_load_kw": 50.0,
        "charging_power_kw": 7.4,
        "battery_capacity_kwh": 50.0,
        "target_soc": 0.85,
        "duration_hours": 4,
        "time_step_minutes": 15,
        "outage_threshold_loading_percent": 115.0,
        "critical_duration_steps": 3,
        "seed": 42,
    }
    response = client.post("/api/simulation/compare", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "baseline" in data
    assert "rl" in data
    assert len(data["timestamps"]) == 16
    assert len(data["baseline"]["transformer_loading_percent"]) == 16
    assert len(data["rl"]["transformer_loading_percent"]) == 16
    assert "metrics" in data["baseline"]
    assert "metrics" in data["rl"]
