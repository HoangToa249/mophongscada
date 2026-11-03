"""Educational balanced, steady-state AC load flow. No connections to real PLCs."""
from dataclasses import dataclass, field
import math

import pandapower as pp
from pandapower.auxiliary import LoadflowNotConverged


FEEDERS = [
    ("LT1", "Lộ LT1 · 443", 1.2, 0.35),
    ("LT2", "Lộ LT2 · 437", 1.0, 0.3),
    ("UC", "Tự dùng · 431", 0.6, 0.18),
]


@dataclass
class Simulator:
    closed: dict = field(default_factory=lambda: {key: True for key, *_ in FEEDERS})
    faults: set = field(default_factory=set)
    load_factor: float = 1.0

    def command(self, target: str, action: str):
        if target not in self.closed:
            raise ValueError("Không tìm thấy máy cắt")
        if action not in ("open", "close"):
            raise ValueError("Lệnh không hợp lệ")
        if action == "close" and target in self.faults:
            raise ValueError("Liên động: phải cô lập và xác nhận xử lý sự cố trước khi đóng điện")
        self.closed[target] = action == "close"

    def inject_fault(self, target):
        if target not in self.closed:
            raise ValueError("Không tìm thấy lộ")
        self.faults.add(target)
        self.closed[target] = False  # protection trip, not a short-circuit calculation

    def clear_fault(self, target):
        if target not in self.faults:
            raise ValueError("Lộ không có sự cố cần xử lý")
        if self.closed[target]:
            raise ValueError("Phải cắt máy cắt trước khi xử lý")
        self.faults.remove(target)

    def solve(self):
        net = pp.create_empty_network(f_hz=50)
        source = pp.create_bus(net, vn_kv=22, name="Nguồn 22 kV")
        pp.create_ext_grid(net, source, vm_pu=1.0)
        bus = pp.create_bus(net, vn_kv=0.4, name="Thanh cái 0.4 kV")
        transformer = pp.create_transformer_from_parameters(
            net, source, bus, sn_mva=4, vn_hv_kv=22, vn_lv_kv=0.4,
            vk_percent=6, vkr_percent=1, pfe_kw=4, i0_percent=0.2)
        indices = {}
        for key, name, p, q in FEEDERS:
            end = pp.create_bus(net, vn_kv=0.4, name=name)
            line = pp.create_line_from_parameters(net, bus, end, length_km=0.05,
                r_ohm_per_km=0.035, x_ohm_per_km=0.025, c_nf_per_km=0,
                max_i_ka=2.5, name=key)
            pp.create_switch(net, bus, line, et="l", closed=self.closed[key])
            pp.create_load(net, end, p_mw=p*self.load_factor, q_mvar=q*self.load_factor)
            indices[key] = (end, line)
        try:
            pp.runpp(net, algorithm="nr", numba=False, check_connectivity=True)
        except LoadflowNotConverged:
            return {"status": "collapse", "message": "SYSTEM COLLAPSE: trào lưu không hội tụ",
                    "feeders": [], "alarms": ["Không hội tụ — hãy giảm tải"],
                    "served_percent": 0, "p_mw": 0, "q_mvar": 0,
                    "transformer_loading_percent": 0, "bus_vm_pu": 0}
        def finite(value):
            return round(float(value), 5) if math.isfinite(float(value)) else 0.0
        feeders, alarms = [], []
        for key, name, p, q in FEEDERS:
            end, line = indices[key]
            voltage = finite(net.res_bus.at[end, "vm_pu"])
            loading = finite(net.res_line.at[line, "loading_percent"])
            fault = key in self.faults
            energized = voltage > 0
            if fault:
                alarms.append(f"{key}: bảo vệ tác động, sự cố chưa được xử lý")
            elif not energized:
                alarms.append(f"{key}: mất điện")
            elif voltage < 0.95 or voltage > 1.05:
                alarms.append(f"{key}: điện áp ngoài giới hạn ({voltage:.3f} p.u.)")
            if loading > 100:
                alarms.append(f"{key}: quá tải {loading:.1f}%")
            feeders.append({"id": key, "name": name, "closed": self.closed[key],
                "fault": fault, "energized": energized, "vm_pu": voltage,
                "p_mw": finite(net.res_line.at[line, "p_from_mw"]),
                "q_mvar": finite(net.res_line.at[line, "q_from_mvar"]),
                "i_ka": finite(net.res_line.at[line, "i_ka"]), "loading_percent": loading})
        trafo_loading = finite(net.res_trafo.at[transformer, "loading_percent"])
        if trafo_loading > 100:
            alarms.append(f"MBA T1 quá tải {trafo_loading:.1f}%")
        served = sum(p for key, _, p, _ in FEEDERS if self.closed[key]) / sum(p for _, _, p, _ in FEEDERS)*100
        return {"status": "normal" if not alarms else "alarm", "feeders": feeders,
            "alarms": alarms, "bus_vm_pu": finite(net.res_bus.at[bus, "vm_pu"]),
            "p_mw": finite(net.res_ext_grid.p_mw.sum()),
            "q_mvar": finite(net.res_ext_grid.q_mvar.sum()),
            "transformer_loading_percent": trafo_loading, "served_percent": round(served, 1)}
