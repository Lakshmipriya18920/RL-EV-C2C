from fastapi import FastAPI
from dashboard.components import ChargingRequest

app = FastAPI(
    title="EV Charging RL Backend",
    description="Backend API for EV charging load balancing"
)


@app.get("/")
def home():
    return {
        "message": "EV Charging RL Backend is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "EV Charging RL Backend"
    }


@app.post("/api/charging/optimize")
def optimize_charging(data: ChargingRequest):

    available_capacity = (
        data.transformer_capacity - data.current_load
    )

    results = []

    for ev in data.evs:

        recommended_rate = min(
            ev.max_charging_rate,
            available_capacity / max(len(data.evs), 1)
        )

        results.append({
            "ev_id": ev.ev_id,
            "battery_level": ev.battery_level,
            "recommended_charging_rate": round(
                max(recommended_rate, 0), 2
            )
        })

    return {
        "available_transformer_capacity": available_capacity,
        "charging_recommendations": results
    }