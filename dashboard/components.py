from pydantic import BaseModel
from typing import List


class EVRequest(BaseModel):
    ev_id: str
    battery_level: float
    target_level: float
    max_charging_rate: float


class ChargingRequest(BaseModel):
    transformer_capacity: float
    current_load: float
    evs: List[EVRequest]