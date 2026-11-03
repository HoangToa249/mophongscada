import React, { useState } from 'react';
import { ElectricState } from '../types';

interface LtUcRoomScadaDiagramProps {
  state: ElectricState;
  isEditMode: boolean;
  theme?: 'light' | 'dark';
  onConfigClick: (id: string, name: string, type: 'BREAKER' | 'TRANSFORMER') => void;
  onBreakerClick?: (id: string) => void;
}

export const LtUcRoomScadaDiagram: React.FC<LtUcRoomScadaDiagramProps> = ({ state, isEditMode, theme = 'dark', onConfigClick, onBreakerClick }) => {
  const [expandedFeederId, setExpandedFeederId] = useState<string | null>(null);
  
  const getStatusColor = (id: string) => {
    const breaker = state.breakers[id];
    if (!breaker) return "#ef4444"; 
    if (breaker.status === 'CLOSED') return "#ef4444"; 
    if (breaker.status === 'TRIP') return "#f59e0b"; 
    return "#10b981"; 
  };

  // --- LOGIC XỬ LÝ CLICK ---
  const handleElementClick = (e: React.MouseEvent, id: string, label: string) => {
    e.stopPropagation();
    if (isEditMode) {
      onConfigClick(id, label, 'BREAKER');
    } else {
      setExpandedFeederId(expandedFeederId === id ? null : id);
      onBreakerClick?.(id);
    }
  };

  // --- COMPONENT HIỂN THỊ NĂNG LƯỢNG RÚT GỌN ---
  const MiniEnergyTable = ({ 
    x, y, id, align = 'start', theme = 'dark'
  }: { 
    x: number, y: number, id: string, align?: 'start' | 'end', theme?: 'light' | 'dark'
  }) => {
    const isExpanded = expandedFeederId === id;
    if (!isExpanded) return null;

    const b = state.breakers?.[id];
    if (!b) return null;

    const getValue = (param: string) => {
      switch (param) {
        case 'i1': return b.currents?.[0]?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) || '0.0';
        case 'i2': return b.currents?.[1]?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) || '0.0';
        case 'i3': return b.currents?.[2]?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) || '0.0';
        case 'v1': return b.voltages?.[0]?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0';
        case 'v2': return b.voltages?.[1]?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0';
        case 'v3': return b.voltages?.[2]?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0';
        case 'kw': return b.powerKW?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) || '0.0';
        case 'freq': return b.frequency?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
        case 'pf': return b.powerFactor?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
        case 'kwh': return b.energyKWH?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0';
        default: return '0.0';
      }
    };

    const tableWidth = 220;
    const tableHeight = 180;
    const startX = align === 'start' ? x : x - tableWidth;
    const startY = y - (tableHeight / 2);

    return (
      <g transform={`translate(${startX}, ${startY})`} className="cursor-pointer transition-all duration-300" onClick={(e) => { e.stopPropagation(); setExpandedFeederId(expandedFeederId === id ? null : id); }}>
        <rect 
          x="0" y="0" width={tableWidth} height={tableHeight} rx="5" 
          fill={theme === 'light' ? "#f1f5f9" : "#020617"} stroke={theme === 'light' ? "#cbd5e1" : "#ffffff"} strokeWidth="1.5" 
          style={{ filter: theme === 'light' ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' : 'drop-shadow(0 10px 20px rgba(0,0,0,0.8))' }}
        />
        <rect x="0" y="0" width={tableWidth} height="16" rx="5" fill="#991b1b" />
        <text x="10" y="12" className="text-[14px] font-black fill-white pointer-events-none uppercase tracking-tighter">
          {id}
        </text>
        
        <g transform="translate(10, 33)">
           {[
             { l: 'A', v: getValue('i1'), c: '#f59e0b' },
             { l: 'B', v: getValue('i2'), c: '#10b981' },
             { l: 'C', v: getValue('i3'), c: '#ef4444' }
           ].map((p, i) => (
             <g key={p.l} transform={`translate(${i * 68}, 6)`}>
                <rect x="0" y="-6" width="2" height="10" fill={p.c} rx="1" />
                <text x="5" y="4" className={`text-[14px] font-semibold ${theme === 'light' ? 'fill-slate-800' : 'fill-white'}`} style={{ fontFamily: 'monospace' }}>{p.v}</text>
                <text x="12" y="-10" className="text-[11px] font-bold fill-slate-500" textAnchor="start">{p.l}</text>
             </g>
           ))}
        </g>
        <g transform="translate(10, 80)" className="animate-in fade-in duration-300">
           <path d="M 0,-20 L 200,-20" stroke="#1e293b" strokeWidth="2" />
           <g transform="translate(0, 5)">
             <text x="0" y="0" className="text-[15px] font-semibold fill-yellow-400" style={{ fontFamily: 'monospace' }}>{getValue('v1')}</text>
             <text x="68" y="0" className="text-[15px] font-semibold fill-emerald-400" style={{ fontFamily: 'monospace' }}>{getValue('v2')}</text>
             <text x="136" y="0" className="text-[15px] font-semibold fill-rose-400" style={{ fontFamily: 'monospace' }}>{getValue('v3')}</text>
           </g>
           <path d="M 0,20 L 200,20" stroke={theme === 'light' ? "#cbd5e1" : "#1e293b"} strokeWidth="2" />
           <g transform="translate(0, 40)">
              <text x="0" y="0" className={`text-[12px] font-bold ${theme === 'light' ? 'fill-slate-500' : 'fill-slate-400'}`}>POWER</text>
              <text x="200" y="0" className="text-[15px] font-semibold fill-cyan-400" textAnchor="end" style={{ fontFamily: 'monospace' }}>{getValue('kw')} <tspan className="text-[10px] fill-slate-500">kW</tspan></text>
           </g>
           <g transform="translate(0, 60)">
              <text x="0" y="0" className={`text-[12px] font-bold ${theme === 'light' ? 'fill-slate-500' : 'fill-slate-400'}`}>TOTAL</text>
              <text x="200" y="0" className="text-[15px] font-semibold fill-indigo-400" textAnchor="end" style={{ fontFamily: 'monospace' }}>{getValue('kwh')} <tspan className="text-[10px] fill-slate-500">kWh</tspan></text>
           </g>
           <g transform="translate(0, 80)">
              <text x="0" y="0" className={`text-[12px] font-bold ${theme === 'light' ? 'fill-slate-500' : 'fill-slate-400'}`}>PF/Hz</text>
              <text x="200" y="0" className={`text-[15px] font-semibold ${theme === 'light' ? 'fill-slate-700' : 'fill-slate-300'}`} textAnchor="end" style={{ fontFamily: 'monospace' }}>{getValue('pf')}/{getValue('freq')}</text>
           </g>
         </g>
      </g>
    );
  };

  // --- UI SYMBOLS ---
  const Earth = ({ x, y }: { x: number, y: number }) => (
    <g transform={`translate(${x}, ${y})`}>
      <line x1="-50" y1="0" x2="0" y2="0" stroke="#94a3b8" strokeWidth="2"/>
      <line x1="0" y1="0" x2="0" y2="20" stroke="#94a3b8" strokeWidth="2"/>
      <line x1="-12" y1="20" x2="12" y2="20" stroke="#94a3b8" strokeWidth="2"/>
      <line x1="-8" y1="26" x2="8" y2="26" stroke="#94a3b8" strokeWidth="2"/>
      <line x1="-4" y1="32" x2="4" y2="32" stroke="#94a3b8" strokeWidth="2"/>
    </g>
  );

  const Relay = ({ x, y }: { x: number, y: number }) => (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-40" y="-20" width="70" height="40" fill={theme === 'light' ? '#f8fafc' : '#151b26'} stroke="#f59e0b" strokeWidth="2.5" rx="6"/>
      <text x="-5" y="-5" fill={theme === 'light' ? '#334155' : '#cbd5e1'} fontSize="19" fontWeight="900" textAnchor="middle">50/51</text>
      <line x1="-30" y1="2" x2="25" y2="0" stroke="#f59e0b" strokeWidth="1" opacity="0.5"/>
      <text x="-5" y="15" fill={theme === 'light' ? '#334155' : '#cbd5e1'} fontSize="16" fontWeight="900" textAnchor="middle">50/51N</text>
    </g>
  );

  const Transformer = ({ x, y, label }: { x: number, y: number, label: string }) => (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx="0" cy="-22" r="22" fill="none" stroke="#ef4444" strokeWidth="4"/>
      <circle cx="0" cy="10" r="22" fill="none" stroke="#ef4444" strokeWidth="4"/>
      <polygon points="0,-32 -12,-12 12,-12" fill="none" stroke="#ef4444" strokeWidth="2.5"/>
      <path d="M 12 6 L 0 18 M -12 6 L 0 18 L 0 30" fill="none" stroke="#ef4444" strokeWidth="3"/>
      <text x="-65" y="-5" fill="#ef4444" fontSize="54" fontWeight="900" textAnchor="end">{label}</text>
    </g>
  );

  const ACB = ({ id, x, y, rotate = 0, label }: { id: string, x: number, y: number, rotate?: number, label?: string }) => (
    <g transform={`translate(${x}, ${y}) rotate(${rotate})`} 
       className="cursor-pointer group"
       onClick={(e) => handleElementClick(e, id, label || id)}>
      <path d="M -12 14 L 0 4 L 12 14 M -12 4 L 0 -6 L 12 4 M 0 4 L 0 28" fill="none" stroke={getStatusColor(id)} strokeWidth="4"/>
      <path d="M -12 65 L 0 75 L 12 65 M -12 75 L 0 85 L 12 75 M 0 75 L 0 55 L -15 35" fill="none" stroke={getStatusColor(id)} strokeWidth="4"/>
      {label && <text x={rotate === 90 ? -40 : 15} y={rotate === 90 ? -35 : 55} fill="#cbd5e1" fontSize={rotate === 90 ? 36 : 36} fontWeight="500" textAnchor={rotate === 90 ? "middle" : "start"} transform={rotate === 90 ? "rotate(-90)" : ""} className="group-hover:fill-indigo-400">{label}</text>}
      {isEditMode && <rect x="-30" y="-15" width="60" height="110" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeDasharray="4 4" rx="8" />}
    </g>
  );

  const FEEDER_COORDS: Record<string, {x: number, y: number, align: 'start'|'end'}> = {
    "NDT_CH_01": { "x": 550, "y": 580, "align": "start" },
    "NDT_CDWP_01": { "x": 550, "y": 780, "align": "start" },
    "NDT_SCHWP_01": { "x": 550, "y": 980, "align": "start" },
    "NDT_CT_02": { "x": 550, "y": 1180, "align": "start" },
    "NDT_PCHWP_02": { "x": 550, "y": 1380, "align": "start" },
    "NDT_SCHWP_04": { "x": 550, "y": 1580, "align": "start" },
    "NDT_CT_01": { "x": 350, "y": 680, "align": "end" },
    "NDT_PCHWP_01": { "x": 350, "y": 880, "align": "end" },
    "NDT_CH_02": { "x": 350, "y": 1080, "align": "end" },
    "NDT_CDWP_02": { "x": 350, "y": 1280, "align": "end" },
    "AHF_UC01": { "x": 350, "y": 1480, "align": "end" },
    "QTX1C_UC01": { "x": 350, "y": 1680, "align": "end" },

    "NDT_CH_03": { "x": 1250, "y": 560, "align": "end" },
    "NDT_CDWP_03": { "x": 1250, "y": 740, "align": "end" },
    "NDT_SCHWP_02": { "x": 1250, "y": 920, "align": "end" },
    "NDT_CT_05": { "x": 1250, "y": 1100, "align": "end" },
    "2FPS_HYD_01": { "x": 1250, "y": 1280, "align": "end" },
    "FPS_HYD_JP2": { "x": 1250, "y": 1460, "align": "end" },
    "AHF_UC02": { "x": 1250, "y": 1640, "align": "end" },
    "NSB_UC_ME_01": { "x": 1250, "y": 1820, "align": "end" },
    "DWP_02": { "x": 1250, "y": 2000, "align": "end" },
    "QTX2C_UC02": { "x": 1250, "y": 2080, "align": "end" },
    "NDT_SUMP_P_5": { "x": 1450, "y": 520, "align": "start" },
    "NDT_CT_03": { "x": 1450, "y": 680, "align": "start" },
    "NDT_PCHWP_03": { "x": 1450, "y": 840, "align": "start" },
    "NDT_CH_05": { "x": 1450, "y": 1000, "align": "start" },
    "FPS_HYD_01": { "x": 1450, "y": 1160, "align": "start" },
    "FPS_HYD_JP1": { "x": 1450, "y": 1320, "align": "start" },
    "DWP_01": { "x": 1450, "y": 1480, "align": "start" },
    "NSB_UC_LP_01": { "x": 1450, "y": 1640, "align": "start" },
    "NDT_SUMP_P_3": { "x": 1450, "y": 1800, "align": "start" },
    "NDT_STD_P_1" : { "x": 1450, "y": 2040, "align": "start" },

    "NDT_CH_04": { "x": 2090, "y": 500, "align": "end" },
    "XLNT_GD2": { "x": 2090, "y": 620, "align": "end" },
    "MWP_01": { "x": 2090, "y": 740, "align": "end" },
    "MWP_02": { "x": 2090, "y": 860, "align": "end" },
    "NDT_CDWP_04": { "x": 2090, "y": 980, "align": "end" },
    "NDT_PCHWP_04": { "x": 2090, "y": 1100, "align": "end" },
    "QTX3C_UC03": { "x": 2090, "y": 1220, "align": "end" },
    "NDT_CDWP_05": { "x": 2090, "y": 1340, "align": "end" },
    "NDT_PCHWP_05": { "x": 2090, "y": 1460, "align": "end" },
    "KHO_BAN_HAM": { "x": 2090, "y": 1580, "align": "end" },
    "FUEL_PUMP_GENERATOR": { "x": 2090, "y": 1700, "align": "end" },
    "STORAGE_K": { "x": 2090, "y": 1820, "align": "end" },
    "FPS_SPK_01": { "x": 2490, "y": 500, "align": "start" },
    "FPS_SPK_02": { "x": 2490, "y": 620, "align": "start" },
    "FPS_SPK_JP1": { "x": 2490, "y": 740, "align": "start" },
    "FPS_SPK_JP2": { "x": 2490, "y": 860, "align": "start" },
    "FPS_WT_P1": { "x": 2490, "y": 980, "align": "start" },
    "FPS_WT_P2": { "x": 2490, "y": 1100, "align": "start" },
    "FPS_WT_JP1": { "x": 2490, "y": 1220, "align": "start" },
    "FPS_WT_JP2": { "x": 2490, "y": 1340, "align": "start" },
    "NDT_STP_P_2": { "x": 2490, "y": 1460, "align": "start" },
    "NDT_SUMP_P_4": { "x": 2490, "y": 1580, "align": "start" },
    "NDT_SUMP_P_6": { "x": 2490, "y": 1700, "align": "start" },
    "SPARE_UC03": { "x": 2490, "y": 1820, "align": "start" }
  };

  const MCB = ({ id, x, y, type = 1, label }: { id: string, x: number, y: number, type?: 1 | 2, label: string }) => {
    const color = getStatusColor(id);
    return (
      <g transform={`translate(${x}, ${y})`} 
         className="cursor-pointer group"
         onClick={(e) => handleElementClick(e, id, label)}>
        <line x1="-7" y1="-7" x2="7" y2="7" stroke={color} strokeWidth="5"/>
        <line x1="7" y1="-7" x2="-7" y2="7" stroke={color} strokeWidth="5"/>
        {type === 1 ? (
          <g>
            <path d="M 0 15 L 25 0 L 70 0" stroke={color} strokeWidth="4" fill="none"/>
            <text x="80" y="30" fill="#cbd5e1" fontSize="32" fontWeight="900" textAnchor="start" className="group-hover:fill-indigo-400 uppercase tracking-tight">{label}</text>
          </g>
        ) : (
          <g>
            <path d="M 0 15 L -25 0 L -70 0" stroke={color} strokeWidth="4" fill="none"/>
            <text x="-80" y="30" fill="#cbd5e1" fontSize="32" fontWeight="900" textAnchor="end" className="group-hover:fill-indigo-400 uppercase tracking-tight">{label}</text>
          </g>
        )}
        {isEditMode && <rect x={type === 1 ? -15 : -45} y="-20" width="60" height="50" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" strokeDasharray="3 3" rx="4" />}
      </g>
    );
  };

  const MeterGroup = ({ x, y, id }: { x: number, y: number, id: string }) => {
    const b = state.breakers[id];
    return (
      <g transform={`translate(${x}, ${y})`}>
        <circle cx="0" cy="0" r="14" fill="none" stroke="#ef4444" strokeWidth="3.5"/>
        <path d="M14,0 L110,0 L110,-85 M0,30 L145,30 L145,-110" stroke="#ef4444" fill="none" strokeWidth="3"/>
        <g transform="translate(80, -100)">
           <circle cx="30" cy="0" r="16" fill={theme === 'light' ? '#f8fafc' : '#151b26'} stroke="#10b981" strokeWidth="3.5"/>
           <text x="30" y="6" fill={theme === 'light' ? '#2563eb' : '#60a5fa'} fontSize="20" fontWeight="900" textAnchor="middle">A</text>
        </g>
        <g transform="translate(140, -100)">
           <circle cx="5" cy="0" r="16" fill={theme === 'light' ? '#f8fafc' : '#151b26'} stroke="#f59e0b" strokeWidth="3.5"/>
           <text x="5" y="6" fill={theme === 'light' ? '#dc2626' : '#ef4444'} fontSize="20" fontWeight="900" textAnchor="middle">V</text>
           <g transform="translate(20, 0)">
              <text fontSize="25" fontWeight="900" fill="#cbd5e1" fontFamily="monospace">
                {b?.voltages?.[0]?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}V
              </text>
           </g>
        </g>
        <text x="-80" y="15" fill="#94a3b8" fontSize="28" fontWeight="900">CTx3</text>
      </g>
    );
  };

  const IncomingHeader = ({ x, y, id, tLabel, arrowLabel }: { x: number, y: number, id: string, tLabel: string, arrowLabel: string }) => (
    <g transform={`translate(${x}, ${y})`}>
      <polygon points="300,30 260,80 340,80" fill="#38bdf8" stroke="#0ea5e9" strokeWidth="2"/>
      <text x="400" y="85" fill="#38bdf8" fontSize="72" fontWeight="500" textAnchor="middle">{arrowLabel}</text>
      <path d="M 300 80 L 300 117 M 300 172 L 300 302 M 300 368 L 300 450" stroke="#ef4444" strokeWidth="4" />
      <Transformer x="300" y="165" label={tLabel} />
      <Earth x="373" y="170" />
      <g transform="translate(0, -240)"><MeterGroup x="300" y="470" id={id} /></g>
      <polyline points="284,420 160,420" stroke="#ef4444" strokeWidth="4"/>
      <Relay x={172} y={420} />
      <ACB id={id} x={300} y={295} label={`52${tLabel}`} />
      <circle cx="300" cy="420" r="14" fill="none" stroke="#ef4444" strokeWidth="3.5"/>
      <text x="325" y="425" fill="#94a3b8" fontSize="28" fontWeight="900">CTx4</text>
    </g>
  );

  return (
    <div className={`absolute inset-0 overflow-auto ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'} block text-center p-0`} onClick={() => setExpandedFeederId(null)}>
      <svg viewBox="-200 0 3300 2250" className={`max-w-full max-h-full ${theme === 'light' ? 'bg-white shadow-sm border border-slate-200' : 'bg-[#090d16] shadow-inner'} select-none`}>
        <style>{`
          text { fill: ${theme === 'light' ? '#0f172a' : '#cbd5e1'}; }
          text[fill="#000000"] { fill: ${theme === 'light' ? '#000000' : '#cbd5e1'}; }
          text[fill="#0f172a"] { fill: ${theme === 'light' ? '#000000' : '#cbd5e1'}; }
          text[fill="#0b1120"] { fill: ${theme === 'light' ? '#000000' : '#cbd5e1'}; }
          text[fill="#808080"] { fill: ${theme === 'light' ? '#334155' : '#808080'}; }
          text[fill="#ffffff"], text[fill="white"] { fill: ${theme === 'light' ? '#0f172a' : '#ffffff'}; }
          text[fill="#cbd5e1"] { fill: ${theme === 'light' ? '#0f172a' : '#cbd5e1'}; }
          
          line[stroke="#94a3b8"], path[stroke="#94a3b8"], rect[stroke="#94a3b8"], polyline[stroke="#94a3b8"], circle[stroke="#94a3b8"] { stroke: ${theme === 'light' ? '#475569' : '#94a3b8'}; }
          line[stroke="#475569"], path[stroke="#475569"], rect[stroke="#475569"], polyline[stroke="#475569"] { stroke: ${theme === 'light' ? '#1e293b' : '#475569'}; }
          
          .symbol-bg { fill: ${theme === 'light' ? '#f8fafc' : '#151b26'}; }
        `}</style>
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill={theme === 'light' ? '#e2e8f0' : '#1e293b'}/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* --- SECTION LABELS --- */}
        <text x="80" y="100" fill="#94a3b8" fontSize="30" fontWeight="900" textAnchor="middle">UC01</text>
        <text x="1150" y="80" fill="#94a3b8" fontSize="30" fontWeight="900" textAnchor="middle">UC02</text>
        <text x="2750" y="80" fill="#94a3b8" fontSize="30" fontWeight="900" textAnchor="middle">UC03</text>

        {/* --- MAIN BUSBARS --- */}
        <path d="M 100 450 L 780 450 M 880 450 L 1750 450" stroke="#ef4444" strokeWidth="8" fill="none" strokeLinecap="square" />
        <path d="M 1880 450 L 2600 450" stroke="#ef4444" strokeWidth="8" fill="none" strokeLinecap="square" />
        
        {/* --- UC01 DISTRIBUTION --- */}
        <IncomingHeader x={50} y={0} id="52T1" tLabel="T1" arrowLabel="431" />
        <g transform="translate(60, 0)">
           <path d="M 300 450 L 300 1850" stroke="#ef4444" strokeWidth="6" />
           {[
             { y: 580, id: "NDT_CH_01", l: "NDT-CH-01" },
             { y: 780, id: "NDT_CDWP_01", l: "NDT-CDWP-01" },
             { y: 980, id: "NDT_SCHWP_01", l: "NDT-SCHWP-01" },
             { y: 1180, id: "NDT_CT_02", l: "NDT-CT-02" },
             { y: 1380, id: "NDT_PCHWP_02", l: "NDT-PCHWP-02" },
             { y: 1580, id: "KHO_BAN_HAM", l: "KHO BÁN HẦM" }
           ].map(f => (
             <g key={f.id}><path d={`M 300 ${f.y} L 400 ${f.y} M 460 ${f.y} L 650 ${f.y} M 618 ${f.y-6} L 650 ${f.y} L 618 ${f.y+6} ` } stroke="#ef4444" strokeWidth="3.5"/><MCB id={f.id} x={400} y={f.y} label={f.l}/></g>
           ))}
           {[
             { y: 680, id: "NDT_CT_01", l: "NDT-CT-01" },
             { y: 880, id: "NDT_PCHWP_01", l: "NDT-PCHWP-01" },
             { y: 1080, id: "NDT_CH_02", l: "NDT-CH-02" },
             { y: 1280, id: "NDT_CDWP_02", l: "NDT-CDWP-02" },
             { y: 1480, id: "AHF_UC01", l: "AHF_UC01" },
             { y: 1680, id: "QTX1C_UC01", l: "Tủ bù UC01" }
           ].map(f => (
             <g key={f.id}><path d={`M 300 ${f.y} L 200 ${f.y} M 140 ${f.y} L -20 ${f.y} M 10 ${f.y-6} L -20 ${f.y} L 10 ${f.y+6}`} stroke="#ef4444" strokeWidth="3.5"/><MCB id={f.id} x={200} y={f.y} type={2} label={f.l}/></g>
           ))}
        </g>

        {/* --- UC02 DISTRIBUTION --- */}
        <IncomingHeader x={1050} y={0} id="52T17" tLabel="T17" arrowLabel="447" />
        <g transform="translate(1050, 0)">
           <path d="M 300 450 L 300 2200" stroke="#ef4444" strokeWidth="6" />
           <g transform="translate(-160, 0)">
              {[
                { y: 560, id: "NDT_CH_03", l: "NDT-CH-03" },
                { y: 740, id: "NDT_CDWP_03", l: "NDT-CDWP-03" },
                { y: 920, id: "NDT_SCHWP_02", l: "NDT-SCHWP-02" },
                { y: 1100, id: "NDT_CT_05", l: "NDT-CT-05" },
                { y: 1280, id: "2FPS_HYD_01", l: "2FPS-HYD-01" },
                { y: 1460, id: "FPS_HYD_JP2", l: "FPS-HYD-JP2" },
                { y: 1640, id: "AHF_UC02", l: "AHF_UC02" },
                { y: 1820, id: "NSB_UC_ME_01", l: "NSB_UC_ME_01" },
                { y: 2000, id: "DWP_02", l: "BƠM CẤP NƯỚC 2" },
                { y: 2180, id: "QTX2C_UC02", l: "Tủ tụ bù UC02" }
              ].map(f => (
                <g key={f.id}><path d={`M 460 ${f.y} L 360 ${f.y} M 300 ${f.y} L 120 ${f.y} M 150 ${f.y-6} L 120 ${f.y} L 150 ${f.y+6} `} stroke="#ef4444" strokeWidth="3.5"/><MCB id={f.id} x={360} y={f.y} type={2} label={f.l}/></g>
              ))}
              {[
                { y: 520, id: "NDT_SUMP_P_5", l: "NDT_SUMP_P_5" },
                { y: 680, id: "NDT_CT_03", l: "NDT-CT-03" },
                { y: 840, id: "NDT_PCHWP_03", l: "NDT-PCHWP-03" },
                { y: 1000, id: "NDT_CH_05", l: "NDT-CH-05" },
                { y: 1160, id: "FPS_HYD_01", l: "FPS-HYD-01" },
                { y: 1320, id: "FPS_HYD_JP1", l: "FPS-HYD-JP1" },
                { y: 1480, id: "DWP_01", l: "DWP-01" },
                { y: 1640, id: "NDT_SUMP_P_3", l: "NDT_SUMP_P_3" },
                { y: 1800, id: "NSB_UC_LP_01", l: "NSB-UC-LP/01" },
                { y: 1960, id: "NDT_STD_P_1", l: "XLNT" }
              ].map(f => (
                <g key={f.id}><path d={`M 460 ${f.y} L 560 ${f.y} M 620 ${f.y} L 820 ${f.y} M 790 ${f.y-6} L 820 ${f.y} L 790 ${f.y+6}`} stroke="#ef4444" strokeWidth="3.5"/><MCB id={f.id} x={560} y={f.y} label={f.l}/></g>
              ))}
           </g>
        </g>

        {/* BUS TIE */}
        <ACB id="52B3" x={870} y={450} rotate={90} label="52B3" />

        {/* --- UC03 DISTRIBUTION --- */}
        <IncomingHeader x={2190} y={0} id="52T3" tLabel="T3" arrowLabel="433" />
        <g transform="translate(2190, 0)">
           <path d="M -100 120 L 60 120 L 60 156 M 60 244 L 60 265 L 130 265 L 130 285 M 130 370 L 130 390 L 300 390 M -50 110 L -30 120 L -50 130 M -30 110 L -10 120 L -30 130 M 60 265 L 0 265 L 0 285 M 0 370 L 0 390 L -130 390 M -220 390 L -480 390 L -480 450" stroke="#FF0000" strokeWidth="4.5" fill="none" />
           <text x="-150" y="160" fill="#38bdf8" fontSize="30" fontWeight="900">From MF D1</text>
           <ACB id="52S6" x={60} y={160} label="52S6" />
           <ACB id="52S7" x={130} y={288} label="52S7" />
           <ACB id="52S8" x={0} y={288} label="52S8" />
           <ACB id="52S9" x="-135" y={390} rotate={90} label="52S9" />

           <path d="M 200 450 L 200 1850" stroke="#ef4444" strokeWidth="7" />
           <path d="M 280 450 L 280 1850" stroke="#ef4444" strokeWidth="7" />
           
           <g transform="translate(-500, -250)">
              {[
                { y: 750, id: "NDT_CH_04", l: "CHILLER 4" },
                { y: 870, id: "NDT_CT_04", l: "THÁP GIẢI NHIỆT 4" },
                { y: 990, id: "MWP_01", l: "MWP-01" },
                { y: 1110, id: "MWP_02", l: "MWP-02" },
                { y: 1230, id: "NDT_CDWP_04", l: "BƠM THÁP 4" },
                { y: 1350, id: "NDT_PCHWP_04", l: "BƠM SƠ CẤP 4" },
                { y: 1470, id: "QTX3C_UC03", l: "Tủ tụ bù UC03" },
                { y: 1590, id: "NDT_CDWP_05", l: "BƠM THÁP 5" },
                { y: 1710, id: "NDT_PCHWP_05", l: "BƠM SƠ CẤP 5" },
                { y: 1830, id: "NDT_SCHWP_04", l: "NDT-SCHWP-04" },
                { y: 1950, id: "FUEL_PUMP_GENERATOR", l: "FUEL-PUMP" },
                { y: 2070, id: "STORAGE_K", l: "STORAGE-K" }
              ].map(f => (
                <g key={f.id}><path d={`M 700 ${f.y} L 600 ${f.y} M 540 ${f.y} L 360 ${f.y} M 390 ${f.y-6} L 360 ${f.y} L 390 ${f.y+6}`} stroke="#ef4444" strokeWidth="4"/><MCB id={f.id} x={600} y={f.y} type={2} label={f.l}/></g>
              ))}
           </g>
           <g transform="translate(-420, -250)">
              {[
                { y: 750, id: "FPS_SPK_01", l: "FPS-SPK-01" },
                { y: 870, id: "XLNT_GD2", l: "XLNT_GĐ2" },
                { y: 990, id: "FPS_SPK_JP1", l: "FPS-SPK-JP1" },
                { y: 1110, id: "FPS_SPK_JP2", l: "FPS-SPK-JP2" },
                { y: 1230, id: "FPS_WT_P1", l: "FPS-WT-P1" },
                { y: 1350, id: "FPS_WT_P2", l: "FPS-WT-P2" },
                { y: 1470, id: "FPS_WT_JP1", l: "FPS-WT-JP1" },
                { y: 1590, id: "FPS_WT_JP2", l: "FPS-WT-JP2" },
                { y: 1710, id: "NDT_STP_P_2", l: "BƠM NƯỚC CẤP 01" },
                { y: 1830, id: "NDT_SUMP_P_4", l: "NDT-SUMP-P-4" },
                { y: 1950, id: "NDT_SUMP_P_6", l: "NDT-SUMP-P-6" },
                { y: 2070, id: "FPS_SPK_02", l: "FPS_SPK_02" }
              ].map(f => (
                <g key={f.id}><path d={`M 700 ${f.y} L 800 ${f.y} M 860 ${f.y} L 1040 ${f.y} M 1010 ${f.y-6} L 1040 ${f.y} L 1010 ${f.y+6}`} stroke="#ef4444" strokeWidth="4"/><MCB id={f.id} x={800} y={f.y} label={f.l}/></g>
              ))}
           </g>
        </g>
        
        {/* EXPANDED ENERGY TABLES (Topmost layer) */}
        <g className="transition-all duration-300 drop-shadow-2xl">
          {expandedFeederId && FEEDER_COORDS[expandedFeederId] && (
            <MiniEnergyTable
              id={expandedFeederId}
              x={FEEDER_COORDS[expandedFeederId].align === 'start' ? FEEDER_COORDS[expandedFeederId].x + 80 : FEEDER_COORDS[expandedFeederId].x - 80}
              y={FEEDER_COORDS[expandedFeederId].y + 15}
              align={FEEDER_COORDS[expandedFeederId].align}
              theme={theme}
            />
          )}
        </g>
      </svg>
    </div>
  );
};
