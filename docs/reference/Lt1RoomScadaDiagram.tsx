import React, { useState } from 'react';
import { ElectricState } from '../types';
import { AlertTriangle } from 'lucide-react';

interface Lt1RoomScadaDiagramProps {
  state: ElectricState;
  isEditMode?: boolean;
  theme?: 'light' | 'dark';
  onConfigClick?: (id: string, name: string, type: 'BREAKER' | 'TRANSFORMER') => void;
}

const COLOR_RED = "#ef4444";
const COLOR_GREEN = "#22c55e";
const COLOR_TRIP = "#eab308";
const COLOR_UNKNOWN = "#94a3b8";

  const MiniEnergyTable = ({ 
    x, y, id, state, isExpanded, onToggle, align = 'start', theme = 'dark' 
  }: { 
    x: number, y: number, id: string, state: ElectricState, isExpanded: boolean, onToggle: () => void, align?: 'start' | 'end', theme?: 'light' | 'dark'
  }) => {
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
      <g transform={`translate(${startX}, ${startY})`} className="cursor-pointer transition-all duration-300" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
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

export const Lt1RoomScadaDiagram: React.FC<Lt1RoomScadaDiagramProps> = ({ 
  state, 
  isEditMode = false,
  theme = 'dark',
  onConfigClick 
}) => {
  const [expandedFeederId, setExpandedFeederId] = useState<string | null>(null);

  const getStatusColor = (id: string) => {
    const status = state.breakers?.[id]?.status || 'UNKNOWN';
    if (status === 'CLOSED') return COLOR_RED;
    if (status === 'OPEN') return COLOR_GREEN;
    if (status === 'TRIP') return COLOR_TRIP;
    return COLOR_UNKNOWN;
  };

  const isTrip = (id: string) => state.breakers?.[id]?.status === 'TRIP';

  const BreakerStatus = ({ id, x, y, size = 20 }: { id: string, x: number, y: number, size?: number }) => {
    const tripped = isTrip(id);
    const isClosed = state.breakers?.[id]?.status === 'CLOSED';
    
    return (
      <g 
        transform={`translate(${x}, ${y})`} 
        className={`cursor-pointer transition-all duration-300 ${isClosed ? 'breaker-closed drop-shadow-lg' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (isEditMode) onConfigClick?.(id, id, 'BREAKER');
          else setExpandedFeederId(expandedFeederId === id ? null : id);
        }}
        style={{ transformOrigin: 'center' }}
      >
        <rect x={-size} y={-size} width={size*2} height={size*2} fill="transparent" />
        {tripped && (
          <g transform="translate(0, 25)" className="animate-bounce">
            <circle r="12" fill={COLOR_TRIP} stroke="#fff" strokeWidth="1.5" className="animate-pulse" />
            <text y="5" textAnchor="middle" fill="#fff" fontWeight="900" fontSize="21">!</text>
          </g>
        )}
        {isEditMode && (
          <circle cx={size} cy={-size} r="6" fill="#3b82f6" stroke="#fff" strokeWidth="2" className="animate-ping" />
        )}
      </g>
    );
  };

  const leftFeeders = [ 
    { id: "MCB_LC1", y: 0, label: "LC1", type: 'mcb1' },
    { id: "MCB_UPS_EQPT", y: 110, label: "ESB-UPS-EQPT", type: 'mcb1' },
    { id: "MCB_ATS_PTB04", y: 165, label: "TO ATS NMB-PTB-04", type: 'mcb2' },
    { id: "MCB_LC3", y: 55, label: "LC3", type: 'mcb2' },
    { id: "MCB_LIFT01", y: 220, label: "LIFT 01", type: 'mcb1' },
    { id: "MCB_LIFT02", y: 275, label: "LIFT 02", type: 'mcb2' },
    { id: "MCB_ME01", y: 330, label: "NSB-1ST-ME-01", type: 'mcb1' },
    { id: "MCB_PLB01", y: 385, label: "NSB-PLB-01", type: 'mcb2' },
    { id: "MCB_GH01", y: 440, label: "GH-01", type: 'mcb1' },
    { id: "AHF_PTB01", y: 495, label: "AHF_PTB01", type: 'mcb2' },
    { id: "MCB_LIFT05", y: 550, label: "LIFT 05", type: 'mcb1' },
    { id: "OG1", y: 605, label: "OG1", type: 'mcb2' },
    { id: "QTX1C_LT1", y: 660, label: "TỦ BÙ PTB01", type: 'mcb1' },
    { id: "AUTOGRILL_2ND_2AB", y: 715, label: "AUTOGRILL 2AB-2ND", type: 'mcb2' },
    { id: "NHA_KINH", y: 770, label: "Quảng trường nhà kính", type: 'mcb1' },
  ];

  const rightFeeders = [
    { id: "MCB_LC2", y: 0, label: "LC2", type: 'mcb2' },
    { id: "MCB_LC4", y: 55, label: "LC4", type: 'mcb1' },
    { id: "MCB_BHS01", y: 110, label: "NISOL-BHS-01.1", type: 'mcb2' },
    { id: "MCB_BHS02", y: 165, label: "NISOL-BHS-01.2", type: 'mcb1' },
    { id: "MCB_BHS03", y: 220, label: "NISOL-BHS-01.3", type: 'mcb2' },
    { id: "MCB_BHS04", y: 275, label: "NISOL-BHS-01.4", type: 'mcb1' },
    { id: "MCB_LIFT03", y: 330, label: "EISOL LIFT 03", type: 'mcb2' },
    { id: "MCB_LIFT04", y: 385, label: "EISOL LIFT 04", type: 'mcb1' },
    { id: "MCB_BHS_CTII", y: 440, label: "NISOL BHS CTII", type: 'mcb2' },
    { id: "MCB_GH02", y: 495, label: "GH-02", type: 'mcb1' },
    { id: "MCB_MDB01", y: 550, label: "MDB01", type: 'mcb2' },
    { id: "MCB_SERVICE_LIFT1", y: 605, label: "SERVICE_LIFT 1", type: 'mcb1' },
    { id: "AHF_PTB02", y: 770, label: "AHF_PTB02", type: 'mcb2' },
    { id: "QTX2C_LT1", y: 715, label: "Tủ Bù PTB02", type: 'mcb1' },
    { id: "MCB_BIN01", y: 825, label: "NDB-BIN-01", type: 'mcb1' }
  ];

  return (
    <div className={`absolute inset-0 ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'} overflow-auto block text-center p-4`} onClick={() => setExpandedFeederId(null)}>
      <svg viewBox="0 60 1920 2090" className={`w-[64%] h-auto mx-auto min-w-[768px] ${theme === 'light' ? 'bg-white shadow-sm border border-slate-200' : 'bg-[#090d16] shadow-[0_0_50px_rgba(0,0,0,0.5)]'} rounded-lg font-['Inter'] select-none`}>
        <style>{`
          text { fill: ${theme === 'light' ? '#0f172a' : '#cbd5e1'}; }
          text[fill="#000000"] { fill: ${theme === 'light' ? '#000000' : '#cbd5e1'}; }
          text[fill="#0f172a"] { fill: ${theme === 'light' ? '#000000' : '#cbd5e1'}; }
          text[fill="#0b1120"] { fill: ${theme === 'light' ? '#000000' : '#cbd5e1'}; }
          text[fill="#808080"] { fill: ${theme === 'light' ? '#334155' : '#808080'}; }
          
          line[stroke="#94a3b8"], path[stroke="#94a3b8"], rect[stroke="#94a3b8"], polyline[stroke="#94a3b8"], circle[stroke="#94a3b8"] { stroke: ${theme === 'light' ? '#475569' : '#94a3b8'}; }
          line[stroke="#475569"], path[stroke="#475569"], rect[stroke="#475569"], polyline[stroke="#475569"] { stroke: ${theme === 'light' ? '#1e293b' : '#475569'}; }
          
          .symbol-bg { fill: ${theme === 'light' ? '#f8fafc' : '#151b26'}; }
          .symbol-text { fill: ${theme === 'light' ? '#334155' : '#cbd5e1'}; }
          .symbol-text-a { fill: ${theme === 'light' ? '#2563eb' : '#60a5fa'}; }
          .symbol-text-v { fill: ${theme === 'light' ? '#dc2626' : '#ef4444'}; }
          .breaker-closed {
            filter: drop-shadow(0 0 8px currentColor);
          }
        `}</style>
        <defs>
          <pattern id="dotGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#1e293b" />
          </pattern>
          <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <g id="acb_symbol">
            <path d="M -8 10 L 0 4 L 8 10 M -8 4 L 0 -2 L 8 4 M 0 4 L 0 20" fill="none" stroke="currentColor" strokeWidth="2.5"/>
            <path d="M -8 50 L 0 56 L 8 50 M -8 56 L 0 62 L 8 56 M 0 56 L 0 42 L -10 25" fill="none" stroke="currentColor" strokeWidth="2.5"/>
          </g>
          <g id="mcb_symbol">
            <line x1="-3" y1="-3" x2="3" y2="3" stroke="currentColor" strokeWidth="2.5"/>
            <line x1="3" y1="-3" x2="-3" y2="3" stroke="currentColor" strokeWidth="2.5"/>
            <path d="M 0 10 L 16 0 L 20 0" fill="none" stroke="currentColor" strokeWidth="2"/>
          </g>
          <g id="mcb_symbol_rev">
            <line x1="-3" y1="-3" x2="3" y2="3" stroke="currentColor" strokeWidth="2.5"/>
            <line x1="3" y1="-3" x2="-3" y2="3" stroke="currentColor" strokeWidth="2.5"/>
            <path d="M 0 10 L -16 0 L -20 0" fill="none" stroke="currentColor" strokeWidth="2"/>
          </g>
          <g id="transformer_lt"><circle cx="0" cy="-18" r="15" fill="none" stroke="#FF0000" strokeWidth="2"/><circle cx="0" cy="6" r="15" fill="none" stroke="#FF0000" strokeWidth="2"/><polygon points="0,-28 -8,-12 8,-12" fill="none" stroke="#FF0000" strokeWidth="2"/><path d="M 8 3 L 0 10 M -8 3 L 0 10 L 0 18" fill="none" stroke="#FF0000" strokeWidth="2"/></g>
          <g id="ct_lt"><circle cx="0" cy="0" r="8" fill="none" stroke="#FF0000" strokeWidth="2"/></g>
          <g id="meter_A_lt"><circle cx="0" cy="0" r="9" className="symbol-bg" stroke="#10b981" strokeWidth="2"/><text x="0" y="4" className="symbol-text-a" fontSize="16" textAnchor="middle" fontWeight="bold">A</text></g>
          <g id="meter_V_lt"><circle cx="0" cy="0" r="9" className="symbol-bg" stroke="#f59e0b" strokeWidth="2"/><text x="0" y="4" className="symbol-text-v" fontSize="16" textAnchor="middle" fontWeight="bold">V</text></g>
          <g id="relay_lt"><rect x="-25" y="-20" width="50" height="40" className="symbol-bg" stroke="#f59e0b" strokeWidth="1.5" rx="3"/><text x="0" y="-4" className="symbol-text" fontSize="17" textAnchor="middle">50/51</text><line x1="-18" y1="0" x2="18" y2="0" stroke="#f59e0b" strokeWidth="1" opacity="0.5"/><text x="0" y="10" className="symbol-text" fontSize="15" textAnchor="middle">50/51N</text></g>
          <g id="earth_lt"><line x1="-40" y1="0" x2="0" y2="0" stroke="#94a3b8" strokeWidth="1"/><line x1="0" y1="0" x2="0" y2="15" stroke="#94a3b8" strokeWidth="1"/><line x1="-9" y1="15" x2="9" y2="15" stroke="#94a3b8" strokeWidth="1"/><line x1="-6" y1="20" x2="6" y2="20" stroke="#94a3b8" strokeWidth="1"/><line x1="-3" y1="25" x2="3" y2="25" stroke="#94a3b8" strokeWidth="1"/></g>
     
        </defs>
	<g id="ct_lt"><circle cx="530" cy="236" r="8" fill="none" stroke="#FF0000" strokeWidth="2"/></g> 
	<g id="ct_lt"><circle cx="1550" cy="236" r="8" fill="none" stroke="#FF0000" strokeWidth="2"/></g>
        {/* HEADER */}
   
        

        {/* SWITCHBOARDS BOXES */}
       
        <text x="40" y="80" fill="#FF0000" fontSize="21" fontWeight="semibold">NMB-PTB-01</text>
        <text x="1880" y="80" fill="#ffee00" fontSize="21" fontWeight="semibold" textAnchor="end">NMB-PTB-02</text>

        {/* BUSBARS */}
        <path d="M 480 450 L 988 450 M 1050 450 L 1500 450" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" fill="none" className="flow-active drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />

        {/* LEFT AREA */}
        <g transform="translate(180, 0)">
           <polygon points="300,80 285,105 315,105" fill="#2E9AFE" />
           <text x="340" y="85" fill="#000000" fontSize="48" fontWeight="bold" textAnchor="middle">441</text>
           <path d="M 300 105 L 300 117 M 300 172 L 300 302 M 300 368 L 300 1400" stroke="#ef4444" strokeWidth="2" fill="none" className="flow-active drop-shadow-md" />
           
           <use href="#transformer_lt" x="300" y="150" />
           <use href="#earth_lt" x="355" y="155" />
           <g transform="translate(260, 180)" textAnchor="end">
              <text x="10" y="-20" fill="#FF0000" fontSize="40" fontWeight="bold">T11</text>
           </g>
           
           <path d="M -70 120 L 60 120 L 60 210 M 60 270 L 60 295 L 130 295 L 130 310 M 130 370 L 130 390 L 300 390 M 100 295 L 0 295 L 0 310 M 0 370 L 0 390" stroke="#ef4444" strokeWidth="2" fill="none" className="flow-active drop-shadow-md" />
           <path d="M -50 110 L -30 120 L -50 130 M -30 110 L -10 120 L -30 130" stroke="#ef4444" strokeWidth="2" fill="none" className="flow-active drop-shadow-md" />
           <path d="M 8 380 L 0 390 L -8 380" stroke="#ef4444" strokeWidth="2" fill="none" className="flow-active drop-shadow-md" />
           <text x="-130" y="155" fill="#2E9AFE" fontSize="32" fontWeight="bold">From MF D2</text>
           <text x="-60" y="420" fill="#2E9AFE" fontSize="32" fontWeight="bold">To LT2 Room</text>

           <g color={getStatusColor('52S3')}>
              <use href="#acb_symbol" x="60" y="210" />
              <text x="70" y="245" fill="#000000" fontSize="36" fontWeight="bold">52S3</text>
              <BreakerStatus id="52S3" x="60" y="240" />
           </g>
           <g color={getStatusColor('52S1')}>
              <use href="#acb_symbol" x="130" y="310" />
              <text x="140" y="345" fill="#000000" fontSize="36" fontWeight="bold">52S1</text>
              <BreakerStatus id="52S1" x="130" y="340" />
           </g>
           <g color={getStatusColor('52S4')}>
              <use href="#acb_symbol" x="0" y="310" />
              <text x="-20" y="345" fill="#000000" fontSize="36" fontWeight="bold" textAnchor="end">52S4</text>
              <BreakerStatus id="52S4" x="0" y="340" />
           </g>
           
           <g color={getStatusColor('52T11')}>
              <use href="#acb_symbol" x="300" y="305" />
              <g transform="translate(360, 340)">
                <text x="-50" y="0" fill="#000000" fontSize="36" fontWeight="bold">52T11</text>
              </g>
              <BreakerStatus id="52T11" x="300" y="335" />
           </g>

           <g transform="translate(0, -210)">
              <use href="#ct_lt" x="300" y="470" />
              <path d="M308,470 L350,470 L350,456 M350,438 L350,420 M300,485 L380,485 L380,405" stroke="#FF0000" fill="none" />
              <use href="#meter_A_lt" x="350" y="415" />
              <use href="#meter_V_lt" x="380" y="415" />
           </g>
           <use href="#relay_lt" x="230" y="430" />
	   <use href="#ct_lt" x="300" y="420" />
	   <path d="M 292,420 L255,420" stroke="#FF0000" fill="none" />
           <g transform="translate(100,0)">
              <path d="M 440 450 L 440 380 M 440 360 L 440 300 L 580 300 L 580 360 M 580 380 L 580 420 L 660 420 L 660 260 M 510 300 L 510 260 M 440 368 L 570 368" stroke="#ef4444" strokeWidth="2" fill="none" className="flow-active drop-shadow-md" />
              <path d="M 499 360 L 512 360 L 506 376 Z" fill="#FF0000" />
              <g color={getStatusColor('QM1')}><use href="#mcb_symbol" x="350" y="450" transform="rotate(90, 440, 450)" /><BreakerStatus id="QM1" x="430" y="405" size={14} /></g>
              <g color={getStatusColor('QM2')}><use href="#mcb_symbol" x="580" y="360" transform="rotate(90, 580, 360)" /><BreakerStatus id="QM2" x="580" y="370" size={14} /></g>
              <text x="485" y="348" fill="#000000" fontWeight="bold" fontSize="26">ATS</text>
	      <text x="350" y="388" fill="#000000" fontSize="32" fontWeight="bold">QM1</text>
	      <text x="590" y="388" fill="#000000" fontSize="32" fontWeight="bold">QM2</text>
              <rect x="450" y="233" width="120" height="25" fill="none" stroke="#2E9AFE" strokeWidth="1.8" rx="3" />
              <text x="510" y="253" fill="#000000" fontSize="26" fontWeight="bold" textAnchor="middle">UPS LTG</text>
              <rect x="610" y="233" width="100" height="25" fill="none" stroke="#2E9AFE" strokeWidth="1.8" rx="3" />
              <text x="660" y="253" fill="#000000" fontSize="26" fontWeight="bold" textAnchor="middle">PTB 04</text>
           </g>
        </g>

        {/* RIGHT AREA */}
        <g transform="translate(1200, 0)">
           <polygon points="300,80 285,105 315,105" fill="#2E9AFE" />
           <text x="340" y="85" fill="#0f172a" fontSize="48" fontWeight="bold" textAnchor="middle">435</text>
           <path d="M 300 105 L 300 117 M 300 172 L 300 302 M 300 368 L 300 1600" stroke="#ef4444" strokeWidth="2" fill="none" className="flow-active drop-shadow-md" />
           <use href="#transformer_lt" x="300" y="150" />
           <use href="#earth_lt" x="355" y="155" />
           <g transform="translate(280, 160)" textAnchor="end">
              <text x="0" y="0" fill="#FF0000" fontSize="40" fontWeight="bold">T5</text>
           </g>
           
           <g color={getStatusColor('52T5')}>
              <use href="#acb_symbol" x="300" y="305" />
              <g transform="translate(320, 340)">
                <text x="0" y="0" fill="#000000" fontSize="36" fontWeight="bold">52T5</text>
              </g>
              <BreakerStatus id="52T5" x="300" y="335" />
           </g>

           <g transform="translate(0, -210)">
              <use href="#ct_lt" x="300" y="470" />
              <path d="M308,470 L350,470 L350,456 M350,438 L350,420 M300,485 L380,485 L380,405" stroke="#FF0000" fill="none" />
              <use href="#meter_A_lt" x="350" y="415" />
              <use href="#meter_V_lt" x="380" y="415" />
           </g>
           <use href="#relay_lt" x="390" y="410" />
	   <use href="#ct_lt" x="300" y="410" />
	   <path d="M308,410 L365,410" stroke="#FF0000" fill="none" /> 
        </g>

        {/* BUS TIE 52B1 */}
        <g transform="translate(1020, 460) rotate(90)">
           <g color={getStatusColor('52B1')}>
              <use href="#acb_symbol" x="0" y="0" transform="translate(-8, -30)" />
           </g>
           <g transform="translate(50, -10) rotate(-90)" textAnchor="middle">
              <text x="-10" y="-20" fill="#000000" fontSize="36" fontWeight="bold">52B1</text>
           </g>
           <BreakerStatus id="52B1" x="0" y="0" />
        </g>
        {/* FEEDER LINES & NAMES */}
        <g transform="translate(180, 500)">
          {leftFeeders.map((f) => (
            <g 
              key={`f-l-${f.id}`} 
              transform={`translate(300, ${f.y})`}
              className="cursor-pointer group"
              onClick={(e) => { e.stopPropagation(); setExpandedFeederId(expandedFeederId === f.id ? null : f.id); }}
            >
              <path d={f.type === 'mcb1' ? "M 0 0 L 50 0 M 70 0 L 130 0" : "M 0 0 L -50 0 M -70 0 L -130 0"} stroke="#ef4444" strokeWidth="2" fill="none" className="flow-active drop-shadow-md" />
              <g color={getStatusColor(f.id)}><use href={f.type === 'mcb1' ? "#mcb_symbol" : "#mcb_symbol_rev"} x={f.type === 'mcb1' ? 50 : -50} y={0} /></g>
              <text x={f.type === 'mcb1' ? 140 : -140} y={8} fill="#000000" fontSize="32" fontWeight="black" textAnchor={f.type === 'mcb1' ? "start" : "end"}>{f.label}</text>
              <BreakerStatus id={f.id} x={f.type === 'mcb1' ? 60 : -60} y={0} size={12} />
            </g>
          ))}
        </g>

        <g transform="translate(1500, 500)">
          {rightFeeders.map((f) => (
            <g 
              key={`f-r-${f.id}`} 
              transform={`translate(0, ${f.y})`}
              className="cursor-pointer group"
              onClick={(e) => { e.stopPropagation(); setExpandedFeederId(expandedFeederId === f.id ? null : f.id); }}
            >
              <path d={f.type === 'mcb1' ? "M 0 0 L 50 0 M 70 0 L 130 0" : "M 0 0 L -50 0 M -70 0 L -130 0"} stroke="#ef4444" strokeWidth="2" fill="none" className="flow-active drop-shadow-md" />
              <g color={getStatusColor(f.id)}><use href={f.type === 'mcb1' ? "#mcb_symbol" : "#mcb_symbol_rev"} x={f.type === 'mcb1' ? 50 : -50} y={0} /></g>
              <text x={f.type === 'mcb1' ? 140 : -140} y={8} fill="#000000" fontSize="32" fontWeight="black" textAnchor={f.type === 'mcb1' ? "start" : "end"}>{f.label}</text>
              <BreakerStatus id={f.id} x={f.type === 'mcb1' ? 60 : -60} y={0} size={12} />
            </g>
          ))}
        </g>

        <g 
          transform="translate(1500, 465)"
          className="cursor-pointer group"
          onClick={(e) => { e.stopPropagation(); setExpandedFeederId(expandedFeederId === 'MCB_PLB02' ? null : 'MCB_PLB02'); }}
        >
           <path d="M 0 0 L 50 0 M 70 0 L 130 0" stroke="#ef4444" strokeWidth="2" fill="none" className="flow-active drop-shadow-md" />
           <g color={getStatusColor('MCB_PLB02')}><use href="#mcb_symbol" x="50" y={0} /></g>
           <text x="140" y="8" fill="#000000" fontSize="32" fontWeight="black">NSB-PLB-02</text>
           <BreakerStatus id="MCB_PLB02" x="60" y="0" size={12} />
        </g>
        <g 
          transform="translate(1500, 1155)"
          className="cursor-pointer group"
          onClick={(e) => { e.stopPropagation(); setExpandedFeederId(expandedFeederId === 'MCB_GND_ME01' ? null : 'MCB_GND_ME01'); }}
        >
           <path d="M 0 0 L -50 0 M -70 0 L -130 0" stroke="#ef4444" strokeWidth="2" fill="none" className="flow-active drop-shadow-md" />
           <g color={getStatusColor('MCB_GND_ME01')}><use href="#mcb_symbol_rev" x="-50" y={0} /></g>
           <text x="-140" y="8" fill="#000000" fontSize="32" fontWeight="black" textAnchor="end">NSB-GND-ME-01</text>
           <BreakerStatus id="MCB_GND_ME01" x="-60" y="0" size={12} />
        </g>

        {/* ENERGY TABLES LAYER */}
        <g transform="translate(180, 500)">
          {/* LEFT — luôn hiển thị dạng thu gọn, ấn để mở rộng */}
          {leftFeeders.map(f => (
              <MiniEnergyTable
                key={`t-l-final-${f.id}`}
                x={f.type === 'mcb1' ? 440 : 160}
                y={f.y + 15}
                id={f.id}
                state={state}
                align={f.type === 'mcb1' ? 'start' : 'end'}
                isExpanded={expandedFeederId === f.id}
                onToggle={() => setExpandedFeederId(expandedFeederId === f.id ? null : f.id)}
                theme={theme}
              />
            ))}
        </g>

        <g transform="translate(1500, 500)">
          {/* RIGHT — luôn hiển thị dạng thu gọn, ấn để mở rộng */}
          {rightFeeders.map(f => (
              <MiniEnergyTable
                key={`t-r-final-${f.id}`}
                x={f.type === 'mcb1' ? 140 : -140}
                y={f.y + 15}
                id={f.id}
                state={state}
                align={f.type === 'mcb1' ? 'start' : 'end'}
                isExpanded={expandedFeederId === f.id}
                onToggle={() => setExpandedFeederId(expandedFeederId === f.id ? null : f.id)}
                theme={theme}
              />
            ))}
        </g>

<g transform="translate(1500, 0)">
  {/* Các feeder đặc biệt */}
  <MiniEnergyTable
    x={140}
    y={460}
    id="MCB_PLB02"
    state={state}
    isExpanded={expandedFeederId === 'MCB_PLB02'}
    onToggle={() => setExpandedFeederId(expandedFeederId === 'MCB_PLB02' ? null : 'MCB_PLB02')}
    theme={theme}
  />

  <MiniEnergyTable
    x={-140}
    y={1170}
    id="MCB_GND_ME01"
    state={state}
    align="end"
    isExpanded={expandedFeederId === 'MCB_GND_ME01'}
    onToggle={() => setExpandedFeederId(expandedFeederId === 'MCB_GND_ME01' ? null : 'MCB_GND_ME01')}
    theme={theme}
  />
</g>

      </svg>
    </div>
  );
};
