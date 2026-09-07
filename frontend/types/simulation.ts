export interface SimulationRequest {
  scenario_name?: string;
  ev_count: number;
  transformer_capacity_kw: number;
  base_load_kw: number;
  charging_power_kw: number;
  battery_capacity_kwh: number;
  target_soc: number;
  duration_hours: number;
  time_step_minutes: number;
  outage_threshold_loading_percent: number;
  critical_duration_steps: number;
  seed: number;
}

export interface EVStateSeries {
  ev_id: string;
  soc_series: number[];
  state_series: string[];
  power_kw_series: number[];
}

export interface MetricsResponse {
  peak_load_kw: number;
  max_loading_percent: number;
  overload_timesteps: number;
  outage_occurred: boolean;
  outage_step: number | null;
  total_energy_delivered_kwh: number;
  target_energy_kwh: number;
  satisfaction_percent: number;
  voltage_violations_count: number;
  min_voltage_pu: number;
}

export interface EpisodeSimulationResponse {
  timestamps: string[];
  total_load_kw: number[];
  transformer_loading_percent: number[];
  ev_load_kw: number[];
  base_load_kw: number[];
  min_bus_voltage_pu: number[];
  transformer_state: string[];
  ev_states: EVStateSeries[];
  metrics: MetricsResponse;
}

export interface ComparisonSimulationResponse {
  timestamps: string[];
  baseline: EpisodeSimulationResponse;
  rl: EpisodeSimulationResponse;
}

export type SimulationMode = "compare" | "baseline" | "rl";

export interface VoiceCallRequest {
  phone_number: string;
  station_id: string;
  trigger_reason: string;
  current_soc?: number;
  target_soc?: number;
  trafo_loading?: number;
}

export interface VoiceCallResponse {
  success: boolean;
  simulated: boolean;
  status: string;
  call_sid?: string;
  to_phone: string;
  station_id: string;
  agent_id?: string;
  message: string;
  prompt_context?: string;
  error?: string;
}

