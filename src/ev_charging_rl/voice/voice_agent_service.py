"""Voice Agent Dispatcher integrating ElevenLabs Conversational AI (ElevenAgents) with Twilio."""

import os
import json
import logging
from typing import Any, Dict, Optional
import urllib.request
import urllib.error

from pathlib import Path

logger = logging.getLogger("ev_charging_rl.voice")

# Load .env file if present
env_file = Path(__file__).resolve().parents[3] / ".env"
if env_file.exists():
    try:
        with open(env_file, "r", encoding="utf-8") as ef:
            for line in ef:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip()
                    if k not in os.environ and v:
                        os.environ[k] = v
    except Exception as e:
        logger.warning(f"Could not read .env file: {e}")



class VoiceAgentDispatcher:
    """Dispatches outbound phone calls to EV drivers via Twilio & ElevenLabs Conversational AI."""

    def __init__(
        self,
        elevenlabs_api_key: Optional[str] = None,
        elevenlabs_agent_id: Optional[str] = None,
        twilio_account_sid: Optional[str] = None,
        twilio_auth_token: Optional[str] = None,
        twilio_phone_number: Optional[str] = None,
    ):
        self.elevenlabs_api_key = elevenlabs_api_key or os.environ.get("ELEVENLABS_API_KEY", "")
        self.elevenlabs_agent_id = elevenlabs_agent_id or os.environ.get("ELEVENLABS_AGENT_ID", "")
        self.twilio_account_sid = twilio_account_sid or os.environ.get("TWILIO_ACCOUNT_SID", "")
        self.twilio_auth_token = twilio_auth_token or os.environ.get("TWILIO_AUTH_TOKEN", "")
        self.twilio_phone_number = twilio_phone_number or os.environ.get("TWILIO_PHONE_NUMBER", "")

    def is_configured(self) -> bool:
        """Returns True if ElevenLabs agent ID is present."""
        return bool(self.elevenlabs_agent_id)

    def get_signed_url(self) -> Dict[str, Any]:
        """Fetches a secure signed WebRTC/WebSocket URL for in-browser live voice calling."""
        agent_id = self.elevenlabs_agent_id or "7401m1ya3xa5eghsnj7nav4x4kxr"
        if not self.elevenlabs_api_key:
            return {
                "signed_url": None,
                "agent_id": agent_id,
                "simulated": True,
            }

        url = f"https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id={agent_id}"
        req = urllib.request.Request(
            url,
            headers={"xi-api-key": self.elevenlabs_api_key},
            method="GET",
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                return {
                    "signed_url": data.get("signed_url"),
                    "agent_id": agent_id,
                    "simulated": False,
                }
        except Exception as e:
            logger.warning(f"Failed to fetch signed URL from ElevenLabs ({e}), falling back to direct agent session.")
            return {
                "signed_url": None,
                "agent_id": agent_id,
                "simulated": False,
                "error": str(e),
            }


    def dispatch_call(
        self,
        to_phone: str,
        station_id: str,
        trigger_reason: str,
        current_soc: float = 0.45,
        target_soc: float = 0.85,
        trafo_loading: float = 108.5,
    ) -> Dict[str, Any]:
        """
        Dispatches an automated voice call to the driver.
        If live credentials are present, calls via Twilio / ElevenLabs API.
        Otherwise, returns a simulated success response for local developer environments.
        """
        prompt_context = (
            f"COOKED Grid Notification: EV at Station {station_id} has been temporarily throttled/paused. "
            f"Reason: {trigger_reason}. "
            f"Current battery state: {int(current_soc * 100)}%, target: {int(target_soc * 100)}%. "
            f"Transformer load: {trafo_loading:.1f}%. "
            f"Reassure driver that their scheduled departure target will be safely completed."
        )

        if not self.is_configured():
            logger.info(
                f"[SIMULATED VOICE CALL] To: {to_phone} | Station: {station_id} | Reason: {trigger_reason}"
            )
            return {
                "success": True,
                "simulated": True,
                "status": "queued",
                "call_sid": f"SIM_CALL_{abs(hash(to_phone + station_id)) % 10000000}",
                "to_phone": to_phone,
                "station_id": station_id,
                "agent_id": self.elevenlabs_agent_id or "demo-elevenlabs-agent",
                "message": f"Simulated voice call queued for {to_phone} (Station {station_id}).",
                "prompt_context": prompt_context,
            }

        # Live Twilio & ElevenLabs Dispatch
        try:
            from twilio.rest import Client

            twilio_client = Client(self.twilio_account_sid, self.twilio_auth_token)

            # TwiML Media Stream connecting to ElevenLabs Conversational WebSocket
            twiml_instructions = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Connecting you to COOKED Autonomous Grid Dispatcher.</Say>
    <Connect>
        <Stream url="wss://api.elevenlabs.io/v1/convai/conversation?agent_id={self.elevenlabs_agent_id}">
            <Parameter name="station_id" value="{station_id}" />
            <Parameter name="current_soc" value="{current_soc}" />
            <Parameter name="target_soc" value="{target_soc}" />
            <Parameter name="reason" value="{trigger_reason}" />
        </Stream>
    </Connect>
</Response>"""

            call = twilio_client.calls.create(
                twiml=twiml_instructions,
                to=to_phone,
                from_=self.twilio_phone_number,
            )

            return {
                "success": True,
                "simulated": False,
                "status": call.status,
                "call_sid": call.sid,
                "to_phone": to_phone,
                "station_id": station_id,
                "agent_id": self.elevenlabs_agent_id,
                "message": f"Outbound call initiated to {to_phone} via Twilio SID {call.sid}.",
                "prompt_context": prompt_context,
            }

        except Exception as e:
            logger.error(f"Failed to dispatch live phone call: {e}")
            return {
                "success": False,
                "simulated": False,
                "status": "error",
                "error": str(e),
                "to_phone": to_phone,
                "station_id": station_id,
                "message": f"Voice dispatch failed: {str(e)}",
            }
