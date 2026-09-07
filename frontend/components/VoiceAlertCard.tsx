"use client";

import React, { useState, useCallback } from "react";
import { PhoneCall, PhoneOff, Mic, MicOff, Volume2, Sparkles, AlertTriangle, ShieldCheck, Radio } from "lucide-react";
import { useConversation, ConversationProvider } from "@elevenlabs/react";

interface VoiceAlertCardProps {
  currentStationId?: string;
  isOverloaded?: boolean;
  isPaused?: boolean;
  trafoLoading?: number;
}

function VoiceAlertInner({
  currentStationId = "Station 1",
  isOverloaded = false,
  isPaused = false,
  trafoLoading = 108.5,
}: VoiceAlertCardProps) {
  const [selectedStation, setSelectedStation] = useState<string>(currentStationId);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      setErrorMessage(null);
      console.log("ElevenLabs Live Voice Agent Connected.");
    },
    onDisconnect: () => {
      console.log("ElevenLabs Live Voice Agent Disconnected.");
    },
    onMessage: (msg: any) => {
      if (typeof msg === "string") {
        setLastMessage(msg);
      } else if (msg?.message) {
        setLastMessage(msg.message);
      }
    },
    onError: (err: any) => {
      console.error("ElevenLabs Conversation Error:", err);
      const errStr = typeof err === "string" ? err : err?.message || JSON.stringify(err);
      setErrorMessage(`Connection notice: ${errStr}`);
    },
  });

  const isConnected = conversation.status === "connected";
  const isConnecting = conversation.status === "connecting";

  const handleStartCall = useCallback(async () => {
    setErrorMessage(null);
    try {
      // Request mic permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Fetch signed URL from backend (or fallback to public agent ID)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      let signedUrl: string | undefined;
      let agentId = "7401m1ya3xa5eghsnj7nav4x4kxr";

      try {
        const res = await fetch(`${backendUrl}/api/voice/signed-url`);
        if (res.ok) {
          const data = await res.json();
          signedUrl = data.signed_url || undefined;
          agentId = data.agent_id || agentId;
        }
      } catch (err) {
        console.warn("Backend signed-url route unavailable, using direct agent session:", err);
      }

      const reason = isOverloaded
        ? `Transformer overload peak-shaving (${trafoLoading.toFixed(1)}% load)`
        : isPaused
        ? "Charging throttled to prevent grid trip"
        : "Standard grid balancing update";

      if (signedUrl) {
        await conversation.startSession({
          signedUrl: signedUrl,
          dynamicVariables: {
            station_id: selectedStation,
            current_soc: "45%",
            target_soc: "85%",
            reason: reason,
          },
        });
      } else {
        await conversation.startSession({
          agentId: agentId,
          dynamicVariables: {
            station_id: selectedStation,
            current_soc: "45%",
            target_soc: "85%",
            reason: reason,
          },
        });
      }
    } catch (err: any) {
      console.error("Failed to start voice call:", err);
      setErrorMessage(err.message || "Microphone access denied or connection error.");
    }
  }, [conversation, selectedStation, isOverloaded, isPaused, trafoLoading]);

  const handleEndCall = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (err) {
      console.error("Failed to end call:", err);
    }
  }, [conversation]);

  return (
    <div className="w-full rounded-[24px] bg-[#fcfcfc] dark:bg-[#111116] border border-black/[0.08] dark:border-white/[0.08] p-6 shadow-sm transition-all relative overflow-hidden">
      {/* Glowing Orb effect when active */}
      {isConnected && (
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-500/15 dark:bg-purple-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center space-x-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${
              isConnected
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse"
                : "bg-purple-500/10 dark:bg-purple-400/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
            }`}
          >
            {isConnected ? <Radio className="h-5 w-5 animate-pulse" /> : <PhoneCall className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm sm:text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
                ElevenLabs In-Browser Live Voice Agent
              </h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono border transition-all ${
                  isConnected
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold animate-pulse"
                    : isConnecting
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20"
                }`}
              >
                {isConnected
                  ? conversation.isSpeaking
                    ? "Agent Speaking..."
                    : "Agent Listening..."
                  : isConnecting
                  ? "Connecting WebRTC..."
                  : "ElevenAgents Ready"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Live two-way microphone conversation with your AI Grid Dispatcher (Zero phone setup required)
            </p>
          </div>
        </div>

        {/* Live Audio Indicator */}
        {isConnected && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Active Live Audio</span>
          </div>
        )}
      </div>

      {/* Control Actions & Station Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-5 items-center">
        {/* Station Select */}
        <div className="sm:col-span-4 space-y-1.5">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Target EV Stall Notification
          </label>
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            disabled={isConnected || isConnecting}
            className="w-full rounded-xl bg-white dark:bg-[#0c0c10] border border-black/[0.08] dark:border-white/[0.1] px-3.5 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 disabled:opacity-60"
          >
            {Array.from({ length: 20 }, (_, i) => `Station ${i + 1}`).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Status / Call Description */}
        <div className="sm:col-span-4 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
          {isConnected ? (
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span>Speaking to Driver at {selectedStation}</span>
            </div>
          ) : (
            <span>Agent ID: 7401m1ya3xa5eghsnj7nav4x4kxr</span>
          )}
        </div>

        {/* Action Button: Start or End Live Call */}
        <div className="sm:col-span-4 flex items-center justify-end space-x-2">
          {isConnected ? (
            <button
              onClick={handleEndCall}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white px-5 py-2.5 text-xs sm:text-sm font-medium transition-all shadow-sm hover:shadow-md"
            >
              <PhoneOff className="h-4 w-4" />
              <span>End Voice Call</span>
            </button>
          ) : (
            <button
              onClick={handleStartCall}
              disabled={isConnecting}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-98 text-white px-5 py-2.5 text-xs sm:text-sm font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50"
            >
              {isConnecting ? (
                <span className="flex items-center space-x-2">
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </span>
              ) : (
                <>
                  <PhoneCall className="h-4 w-4" />
                  <span>Start Live Voice Call</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Real-time Speaking Animated Soundwave when Connected */}
      {isConnected && (
        <div className="mt-5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] p-4 flex flex-col items-center justify-center space-y-3">
          <div className="flex items-center space-x-1.5 h-8">
            {[40, 75, 100, 60, 90, 45, 80, 60, 30].map((height, i) => (
              <span
                key={i}
                style={{
                  height: conversation.isSpeaking ? `${height}%` : "20%",
                  transition: "height 0.15s ease",
                }}
                className={`w-1 rounded-full ${
                  conversation.isSpeaking ? "bg-purple-500 animate-pulse" : "bg-zinc-400 dark:bg-zinc-600"
                }`}
              />
            ))}
          </div>

          <div className="text-center">
            <p className="text-xs font-semibold text-zinc-900 dark:text-white">
              {conversation.isSpeaking ? "ElevenLabs AI Agent is speaking..." : "Listening to your microphone..."}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-sans">
              Speak naturally into your microphone to ask the agent about charging rates, dwell times, or grid safety.
            </p>
          </div>
        </div>
      )}

      {/* Error Notice */}
      {errorMessage && (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs text-amber-700 dark:text-amber-300 flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function VoiceAlertCard(props: VoiceAlertCardProps) {
  return (
    <ConversationProvider>
      <VoiceAlertInner {...props} />
    </ConversationProvider>
  );
}

