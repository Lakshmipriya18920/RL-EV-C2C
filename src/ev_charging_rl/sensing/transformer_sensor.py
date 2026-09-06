"""Transformer and Distribution Power Grid Simulation Layer using pandapower.

Models a realistic 11 kV / 0.4 kV radial low-voltage distribution network with:
- External MV grid connection (Slack bus)
- 11/0.4 kV distribution transformer (configurable kVA)
- Low voltage main feeder and branch lines
- Household residential base load
- Individual EV charging station connection buses
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandapower as pp


@dataclass
class PowerFlowResult:
    converged: bool
    transformer_loading_percent: float
    transformer_p_kw: float
    transformer_q_kvar: float
    min_bus_voltage_pu: float
    max_bus_voltage_pu: float
    bus_voltages_pu: Dict[int, float]
    total_active_loss_kw: float


class DistributionGridNetwork:
    """Realistic low-voltage distribution network modeled with pandapower."""

    def __init__(
        self,
        transformer_capacity_kva: float = 100.0,
        nominal_voltage_kv: float = 0.4,
        substation_voltage_kv: float = 11.0,
        power_factor: float = 0.95,
        num_ev_chargers: int = 10,
    ):
        self.transformer_capacity_kva = transformer_capacity_kva
        self.nominal_voltage_kv = nominal_voltage_kv
        self.substation_voltage_kv = substation_voltage_kv
        self.power_factor = power_factor
        self.num_ev_chargers = num_ev_chargers

        # Compute reactive power multiplier based on power factor: tan(acos(pf))
        self.q_multiplier = float(np.tan(np.arccos(np.clip(power_factor, 0.5, 1.0))))

        self.net: Optional[pp.pandapowerNet] = None
        self.base_load_idx: Optional[int] = None
        self.ev_load_indices: List[int] = []
        self.trafo_idx: Optional[int] = None

        self._build_network()

    def _build_network(self) -> None:
        """Constructs the pandapower network topology."""
        net = pp.create_empty_network(name="Neighborhood_LV_Grid")

        # 1. Medium Voltage Substation Bus (11 kV)
        b_mv = pp.create_bus(net, vn_kv=self.substation_voltage_kv, name="MV_Substation_Bus")
        pp.create_ext_grid(net, bus=b_mv, vm_pu=1.0, name="External_MV_Grid")

        # 2. Low Voltage Transformer Secondary Bus (0.4 kV)
        b_lv_main = pp.create_bus(net, vn_kv=self.nominal_voltage_kv, name="LV_Main_Bus")

        # 3. Distribution Transformer (11/0.4 kV)
        sn_mva = self.transformer_capacity_kva / 1000.0
        self.trafo_idx = pp.create_transformer_from_parameters(
            net,
            hv_bus=b_mv,
            lv_bus=b_lv_main,
            sn_mva=sn_mva,
            vn_hv_kv=self.substation_voltage_kv,
            vn_lv_kv=self.nominal_voltage_kv,
            vkr_percent=1.5,
            vk_percent=4.0,
            pfe_kw=0.2,
            i0_percent=0.4,
            name="Neighborhood_Distribution_Transformer",
        )

        # 4. Household Base Load Bus & Load element
        b_houses = pp.create_bus(net, vn_kv=self.nominal_voltage_kv, name="Residential_Houses_Bus")
        pp.create_line(
            net,
            from_bus=b_lv_main,
            to_bus=b_houses,
            length_km=0.08,
            std_type="NAYY 4x50 SE",
            name="Feeder_Houses",
        )
        self.base_load_idx = pp.create_load(
            net,
            bus=b_houses,
            p_mw=0.0,
            q_mvar=0.0,
            name="Residential_Base_Load",
        )

        # 5. EV Charging Hub Bus and Individual Charger Buses
        b_ev_hub = pp.create_bus(net, vn_kv=self.nominal_voltage_kv, name="EV_Charging_Hub_Bus")
        pp.create_line(
            net,
            from_bus=b_lv_main,
            to_bus=b_ev_hub,
            length_km=0.05,
            std_type="NAYY 4x150 SE",
            name="Feeder_EV_Hub",
        )

        self.ev_load_indices = []
        for i in range(self.num_ev_chargers):
            b_ev = pp.create_bus(net, vn_kv=self.nominal_voltage_kv, name=f"EV_Charger_Bus_{i+1}")
            pp.create_line(
                net,
                from_bus=b_ev_hub,
                to_bus=b_ev,
                length_km=0.02 + 0.005 * i,
                std_type="NAYY 4x50 SE",
                name=f"Branch_EV_{i+1}",
            )
            load_idx = pp.create_load(
                net,
                bus=b_ev,
                p_mw=0.0,
                q_mvar=0.0,
                name=f"EV_Charger_Load_{i+1}",
            )
            self.ev_load_indices.append(load_idx)

        self.net = net

    def run_power_flow(
        self,
        base_load_kw: float,
        ev_charging_kw_list: List[float],
    ) -> PowerFlowResult:
        """Applies loads and executes non-linear AC power flow calculation."""
        if self.net is None:
            self._build_network()

        # Update Residential Base Load
        p_base_mw = max(0.0, float(base_load_kw)) / 1000.0
        q_base_mvar = p_base_mw * self.q_multiplier
        self.net.load.at[self.base_load_idx, "p_mw"] = p_base_mw
        self.net.load.at[self.base_load_idx, "q_mvar"] = q_base_mvar

        # Update EV Charging Loads
        for i, load_idx in enumerate(self.ev_load_indices):
            kw = float(ev_charging_kw_list[i]) if i < len(ev_charging_kw_list) else 0.0
            p_ev_mw = max(0.0, kw) / 1000.0
            q_ev_mvar = p_ev_mw * self.q_multiplier
            self.net.load.at[load_idx, "p_mw"] = p_ev_mw
            self.net.load.at[load_idx, "q_mvar"] = q_ev_mvar

        # Run AC power flow with Newton-Raphson, fallback to BFS if needed
        converged = True
        try:
            pp.runpp(self.net, algorithm="nr", max_iteration=25, numba=False)
        except Exception:
            try:
                pp.runpp(self.net, algorithm="bfs", max_iteration=30, numba=False)
            except Exception:
                converged = False

        if converged:
            trafo_loading = float(self.net.res_trafo.at[self.trafo_idx, "loading_percent"])
            trafo_p_mw = float(self.net.res_trafo.at[self.trafo_idx, "p_hv_mw"])
            trafo_q_mvar = float(self.net.res_trafo.at[self.trafo_idx, "q_hv_mvar"])
            min_v = float(self.net.res_bus["vm_pu"].min())
            max_v = float(self.net.res_bus["vm_pu"].max())
            line_loss_mw = float(self.net.res_line["pl_mw"].sum()) if "pl_mw" in self.net.res_line.columns else 0.0
            trafo_loss_mw = float(self.net.res_trafo["pl_mw"].sum()) if "pl_mw" in self.net.res_trafo.columns else 0.0
            total_loss_kw = (line_loss_mw + trafo_loss_mw) * 1000.0
            # Power flow divergence fallback: estimate from active power sum
            total_p_kw = base_load_kw + sum(ev_charging_kw_list)
            trafo_loading = (total_p_kw / (self.transformer_capacity_kva * self.power_factor)) * 100.0
            trafo_p_mw = total_p_kw / 1000.0
            trafo_q_mvar = trafo_p_mw * self.q_multiplier
            min_v = max(0.70, 1.0 - (trafo_loading / 100.0) * 0.1)
            max_v = 1.0
            bus_v = {0: 1.0, 1: min_v}
            total_loss_kw = total_p_kw * 0.03

        return PowerFlowResult(
            converged=converged,
            transformer_loading_percent=trafo_loading,
            transformer_p_kw=trafo_p_mw * 1000.0,
            transformer_q_kvar=trafo_q_mvar * 1000.0,
            min_bus_voltage_pu=min_v,
            max_bus_voltage_pu=max_v,
            bus_voltages_pu=bus_v,
            total_active_loss_kw=total_loss_kw,
        )
