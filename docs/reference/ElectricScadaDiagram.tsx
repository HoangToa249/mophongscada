import React, { useState } from 'react';
import { ElectricState } from '../types';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';

const SVG_WIDTH = 1900;
const SVG_HEIGHT = 950;
const COLOR_RED = "#d32f2f";
const COLOR_GREEN = "#2e7d32";

interface SubComponentProps {
  state: ElectricState;
  isEditMode: boolean;
  theme?: 'light' | 'dark';
  onConfigClick?: (id: string, name: string, type: 'BREAKER' | 'TRANSFORMER' | 'GENERATOR') => void;
  onBreakerClick?: (id: string) => void;
}

const c41Feeders = [
  { x: 100, id: "443", tId: "T13", htId: "52T13", load: "NMB-PTB-03" },
  { x: 240, id: "437", tId: "T7", htId: "52T7", load: "NMB-PTB-04" },
  { x: 380, id: "435", tId: "T5", htId: "52T5", load: "NMB-PTB-02" },
  { x: 520, id: "441", tId: "T11", htId: "52T11", load: "NMB-PTB-01" },
  { x: 720, id: "431", tId: "T1", htId: "52T1", load: "NMB-UC-01" },
  { x: 860, id: "447", tId: "T17", htId: "52T17", load: "NMB-UC-02" },
  { x: 1000, id: "433", tId: "T3", htId: "52T3", load: "NMB-UC-03" },
];

const c42Feeders = [
  { x: 1300, id: "432", tId: "T2", gId: "D1", htId: "52S5", mainHt: "602" },
  { x: 1500, id: "434", tId: "T4", gId: "D2", htId: "52S2", mainHt: "604" },
  { x: 1650, id: "436", tId: "T6", gId: "D3", mainHt: "606" },
  { x: 1800, id: "438", tId: "T8", gId: "D4", mainHt: "608" },
];

const getStatusColor = (state: ElectricState, id: string) => {
  const status = state.breakers?.[id]?.status || 'UNKNOWN';
  if (status === 'CLOSED') return COLOR_RED;
  if (status === 'OPEN') return COLOR_GREEN;
  if (status === 'TRIP') return "#f97316"; 
  return "#94a3b8";
};

const Breaker = ({ x, y, id, label, horizontal = false, state, isEditMode, theme, onConfigClick, onBreakerClick }: SubComponentProps & { x: number, y: number, id: string, label: string, horizontal?: boolean }) => {
  const breaker = state.breakers?.[id];
  const color = getStatusColor(state, id);
  const isClosed = breaker?.status === 'CLOSED';
  const localRemote = breaker?.localRemote;
  const earthSwitchStatus = breaker?.earthSwitchStatus;
  const isMvBreaker = ["471", "412", "443", "437", "435", "441", "431", "447", "433", "432", "434", "436", "438"].includes(id);
  
  return (
    <g 
      className={`${isEditMode ? 'cursor-help' : 'cursor-pointer'} transition-all duration-200`}
      onClick={() => isEditMode ? onConfigClick?.(id, label, 'BREAKER') : onBreakerClick?.(id)}
      transform={`translate(${x}, ${y}) ${horizontal ? 'rotate(90)' : ''}`}
    >
      <rect x="-7" y="-12" width="14" height="24" fill={color} stroke={isClosed ? "#b71c1c" : "#1b5e20"} strokeWidth="1" />
      <path d="M-4,-18 L0,-22 L4,-18 M-4,-22 L0,-26 L4,-22 M0,-22 L0,-12" fill="none" stroke={color} strokeWidth="1.2" />
      <path d="M-4,18 L0,22 L4,18 M-4,22 L0,26 L4,22 M0,26 L0,12" fill="none" stroke={color} strokeWidth="1.2" />

      {/* Local/Remote text */}
      {isMvBreaker && (
        <text 
          x={horizontal ? 0 : -14} 
          y={horizontal ? 22 : -16} 
          transform={horizontal ? "rotate(-90)" : ""} 
          className={`text-[12px] font-black pointer-events-none ${localRemote === 'REMOTE' ? 'fill-blue-400' : (localRemote === 'LOCAL' ? 'fill-amber-400' : 'fill-slate-600')}`}
          stroke="none"
          textAnchor={horizontal ? "start" : "end"}
        >
          {localRemote === 'REMOTE' ? '[R]' : (localRemote === 'LOCAL' ? '[L]' : '[L/R]')}
        </text>
      )}

      {/* Cảnh báo Remote cho nhóm C41 Feeders */}
      {["443", "437", "435", "441", "431", "447", "433"].includes(id) && localRemote === 'REMOTE' && (
        <g className="animate-pulse" transform={horizontal ? "translate(20, -15)" : "translate(15, -15)"}>
           <circle cx="0" cy="0" r="8" fill="#ef4444" />
           <text x="0" y="4" className="text-[12px] font-black fill-white pointer-events-none" textAnchor="middle">!</text>
        </g>
      )}

      {/* Cảnh báo Local cho nhóm C42 Feeders & Main/Tie */}
      {["432", "434", "436", "438", "471", "412"].includes(id) && localRemote === 'LOCAL' && (
        <g className="animate-pulse" transform={horizontal ? "translate(20, -15)" : "translate(15, -15)"}>
           <circle cx="0" cy="0" r="8" fill="#ef4444" />
           <text x="0" y="4" className="text-[12px] font-black fill-white pointer-events-none" textAnchor="middle">!</text>
        </g>
      )}

      <text x={horizontal ? 0 : -12} y={horizontal ? -20 : 4} transform={horizontal ? "rotate(-90)" : ""} className={`text-[20px] font-bold ${theme === 'light' ? 'fill-slate-700' : 'fill-slate-200'} pointer-events-none`}
        stroke="none"
        textAnchor={horizontal ? "middle" : "end"}>
        {label}
      </text>
      {isEditMode && (
        <g transform={horizontal ? "rotate(-90)" : ""}>
          <circle cx="12" cy="-12" r="6" fill="white" stroke="#3b82f6" strokeWidth="1" />
          <foreignObject x="9" y="-15" width="6" height="6"><Settings size={6} className="text-blue-500" /></foreignObject>
        </g>
      )}
    </g>
  );
};

const EnergyTable = ({ x, y, id, isRed = true, state, isEditMode, theme, onConfigClick, expanded, onToggle, expandLeft }: SubComponentProps & { x: number, y: number, id: string, isRed?: boolean, expanded: boolean, onToggle: () => void, expandLeft?: boolean }) => {
  const getValue = (param: string) => {
    const breaker = state.breakers?.[id];
    if (!breaker) return '0.0';

    switch (param) {
      case 'i1': return breaker.currents?.[0]?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
      case 'i2': return breaker.currents?.[1]?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
      case 'i3': return breaker.currents?.[2]?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
      case 'v1': return (breaker.voltages?.[0] !== undefined) ? breaker.voltages[0].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
      case 'v2': return (breaker.voltages?.[1] !== undefined) ? breaker.voltages[1].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
      case 'v3': return (breaker.voltages?.[2] !== undefined) ? breaker.voltages[2].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
      case 'freq': return breaker.frequency?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
      case 'pf': return breaker.powerFactor?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
      case 'kw': return breaker.powerKW?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
      case 'kwh': return breaker.energyKWH?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
      default: return '0.00';
    }
  };

  const tableWidth = expanded ? 190 : 100;
  const tableHeight = expanded ? 180 : 85;
  const xOffset = (expandLeft && expanded) ? -80 : 0;

  return (
    <g transform={`translate(${x + xOffset}, ${y})`} className="transition-all duration-300">
      <rect 
        x="0" y="0" width={tableWidth} height={tableHeight} rx="5" 
        fill={theme === 'light' ? "#f1f5f9" : "#020617"} stroke={expanded ? (theme === 'light' ? "#94a3b8" : "#ffffff") : (theme === 'light' ? "#cbd5e1" : "#334155")} strokeWidth={expanded ? "1.5" : "1"} 
        className="cursor-pointer"
        onClick={onToggle}
        style={{ filter: expanded ? 'drop-shadow(0 10px 20px rgba(0,0,0,0.8))' : 'none' }}
      />
      
      <rect 
        x="0" y="0" width={tableWidth} height="16" rx="5" 
        fill={isRed ? "#991b1b" : "#064e3b"} 
        className="cursor-pointer"
        onClick={(e) => {
          if (isEditMode) {
            e.stopPropagation();
            onConfigClick?.(id, `RELAY ${id}`, 'BREAKER');
          } else {
            onToggle();
          }
        }}
      />
      
      <text x="24" y="12" className="text-[14px] font-black fill-white pointer-events-none uppercase tracking-tighter">
        {expanded ? `RELAY ${id}` : id}
      </text>
      
      <g transform="translate(6, 33)">
         {expanded ? (
           [
             { l: 'A', v: getValue('i1'), c: '#f59e0b' },
             { l: 'B', v: getValue('i2'), c: '#10b981' },
             { l: 'C', v: getValue('i3'), c: '#ef4444' }
           ].map((p, i) => (
             <g key={p.l} transform={`translate(${i * 60}, 6)`}>
                <rect x="0" y="-6" width="2" height="10" fill={p.c} rx="1" />
                <text x="5" y="4" className={`text-[14px] font-semibold ${theme === 'light' ? 'fill-slate-800' : 'fill-white'}`} style={{ fontFamily: 'monospace' }}>{p.v}</text>
                <text x="12" y="-10" className="text-[11px] font-bold fill-slate-500" textAnchor="start">{p.l}</text>
             </g>
           ))
         ) : (
           [
             { l: 'A', v: getValue('i1'), c: '#f59e0b' },
             { l: 'B', v: getValue('i2'), c: '#10b981' },
             { l: 'C', v: getValue('i3'), c: '#ef4444' }
           ].map((p, i) => {
             const formattedV = p.v.endsWith('.0') ? p.v.slice(0, -2) : p.v;
             return (
               <g key={p.l} transform={`translate(0, ${i * 20})`}>
                  <rect x="0" y="-8" width="2" height="12" fill={p.c} rx="1" />
                  <text x="6" y="2" className={`text-[12px] font-black ${theme === 'light' ? 'fill-slate-800' : 'fill-white'}`} style={{ fontFamily: 'monospace' }}>
                    {p.l}: {formattedV} <tspan fontSize="9" fill="#64748b">A</tspan>
                  </text>
               </g>
             );
           })
         )}
      </g>

      {expanded && (
         <g transform="translate(6, 80)" className="animate-in fade-in duration-300">
           <path d="M 0,-20 L 178,-20" stroke="#1e293b" strokeWidth="2" />
           <g transform="translate(0, 5)">
             <text x="0" y="0" className="text-[15px] font-semibold fill-yellow-400" style={{ fontFamily: 'monospace' }}>{getValue('v1')}</text>
             <text x="60" y="0" className="text-[15px] font-semibold fill-emerald-400" style={{ fontFamily: 'monospace' }}>{getValue('v2')}</text>
             <text x="120" y="0" className="text-[15px] font-semibold fill-rose-400" style={{ fontFamily: 'monospace' }}>{getValue('v3')}</text>
           </g>
           <path d="M 0,20 L 178,20" stroke="#1e293b" strokeWidth="2" />
           <g transform="translate(0, 40)">
              <text x="0" y="0" className="text-[12px] font-bold fill-slate-400">POWER</text>
              <text x="160" y="0" className="text-[15px] font-semibold fill-cyan-400" textAnchor="end" style={{ fontFamily: 'monospace' }}>{getValue('kw')} <tspan className="text-[10px] fill-slate-500">kW</tspan></text>
           </g>
           <g transform="translate(0, 60)">
              <text x="0" y="0" className="text-[12px] font-bold fill-slate-400">TOTAL</text>
              <text x="160" y="0" className="text-[15px] font-semibold fill-indigo-400" textAnchor="end" style={{ fontFamily: 'monospace' }}>{getValue('kwh')} <tspan className="text-[10px] fill-slate-500">kWh</tspan></text>
           </g>
           <g transform="translate(0, 80)">
              <text x="0" y="0" className="text-[12px] font-bold fill-slate-400">PF/Hz</text>
              <text x="158" y="0" className="text-[15px] font-semibold fill-slate-300" textAnchor="end" style={{ fontFamily: 'monospace' }}>{getValue('pf')}/{getValue('freq')}</text>
           </g>
        </g>
      )}
    </g>
  );
};

const Transformer = ({ x, y, id, label, isRed = true, state, isEditMode, theme, onConfigClick }: SubComponentProps & { x: number, y: number, id: string, label: string, isRed?: boolean }) => {
  const color = isRed ? COLOR_RED : COLOR_GREEN;
  const transformer = state.transformers?.[id];
  
  const getTemp = (w: 'tempW1' | 'tempW2' | 'tempW3') => {
    if (!transformer) return '--';
    const val = transformer[w];
    return val !== undefined ? val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '--';
  };

  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx="0" cy="-9" r="12" fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx="0" cy="9" r="12" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M-5,-6 L5,-5 L0,-13 Z" fill="none" stroke={color} strokeWidth="1" />
      <path d="M0,9 L0,15 M0,9 L-5,4 M0,9 L5,4" fill="none" stroke={color} strokeWidth="1" />
      
      <g onClick={() => isEditMode && onConfigClick?.(id, label, 'TRANSFORMER')} className="cursor-pointer">
         <circle cx="-35" cy="0" r="15" fill={color} />
         <text x="-35" y="4" className="text-[12px] font-black fill-white" textAnchor="middle">{label}</text>
      </g>

      <g transform="translate(-70, 30)">
         <rect x="0" y="0" width="55" height="55" rx="3" fill={theme === 'light' ? "#f8fafc" : "#151b26"} stroke={theme === 'light' ? "#cbd5e1" : "#334155"} strokeWidth="1" />
         <text x="4" y="10" className="text-[11px] font-black fill-slate-500 uppercase">Temp °C</text>
         <text x="4" y="24" className={`text-[14px] font-bold ${theme === 'light' ? 'fill-slate-700' : 'fill-slate-300'}`}> <tspan className="fill-orange-500 font-semibold">{getTemp('tempW1')}</tspan></text>
         <text x="4" y="36" className={`text-[14px] font-bold ${theme === 'light' ? 'fill-slate-700' : 'fill-slate-300'}`}> <tspan className="fill-orange-500 font-semibold">{getTemp('tempW2')}</tspan></text>
         <text x="4" y="48" className={`text-[14px] font-bold ${theme === 'light' ? 'fill-slate-700' : 'fill-slate-300'}`}> <tspan className="fill-orange-500 font-semibold">{getTemp('tempW3')}</tspan></text>
      </g>
      <path d="M12,9 L25,9 L25,15 M18,15 L32,15 M20,18 L30,18 M22,21 L28,21" fill="none" stroke="#94a3b8" strokeWidth="1" />
    </g>
  );
};

const Disconnector = ({ x, y, horizontal = false, isOpen = true, color = "#94a3b8" }: { x: number, y: number, horizontal?: boolean, isOpen?: boolean, color?: string }) => (
  <g transform={`translate(${x}, ${y}) ${horizontal ? 'rotate(90)' : ''}`}>
    <path d="M0,-15 L0,-5 M0,5 L0,20" stroke={color} strokeWidth="1.2" />
    <line x1="0" y1="-5" x2={isOpen ? "8" : "0"} y2="5" stroke={color} strokeWidth="1.5" />
  </g>
);

const Ground = ({ x, y, color = "#94a3b8" }: { x: number, y: number, color?: string }) => (
  <g transform={`translate(${x}, ${y})`}>
    <path d="M0,0 L0,10 M-8,10 L8,10 M-5,13 L5,13 M-2,16 L2,16" fill="none" stroke={color} strokeWidth="1.2" />
  </g>
);

interface ElectricScadaDiagramProps {
  state: ElectricState;
  isEditMode?: boolean;
  theme?: 'dark' | 'light';
  onConfigClick?: (id: string, name: string, type: 'BREAKER' | 'TRANSFORMER' | 'GENERATOR') => void;
  onGeneratorClick?: (gId: string) => void;
  onNavigateToLt1?: () => void;
  onNavigateToLt2?: () => void;
  onNavigateToLtUc?: () => void;
  onNavigateToFuel?: () => void;
}

export const ElectricScadaDiagram: React.FC<ElectricScadaDiagramProps & { theme?: 'light' | 'dark' }> = ({ 
  state, 
  isEditMode = false,
  theme = 'dark',
  onBreakerClick,
  onConfigClick,
  onGeneratorClick,
  onNavigateToLt1,
  onNavigateToLt2,
  onNavigateToLtUc,
  onNavigateToFuel
}) => {
  const [expandedTables, setExpandedTables] = useState<string[]>([]);
  
  const toggleTable = (id: string) => {
    setExpandedTables(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const commonProps = { state, isEditMode, theme, onConfigClick, onBreakerClick: toggleTable };

  const getBreakerPosition = (id: string): {x: number, y: number, isRed: boolean} | null => {
    let f = c41Feeders.find(f => f.id === id);
    if (f) return { x: f.x + 12, y: 290, isRed: true };
    f = c41Feeders.find(f => f.htId === id);
    if (f) return { x: f.x - 20, y: 600, isRed: true };

    f = c42Feeders.find(f => f.id === id);
    if (f) return { x: f.x - 25, y: 290, isRed: false };
    f = c42Feeders.find(f => f.htId === id);
    if (f) return { x: f.x - 20, y: 640, isRed: false };
    f = c42Feeders.find(f => f.mainHt === id);
    if (f) return { x: f.x - 20, y: 770, isRed: false };

    const bottomLinks: Record<string, {x: number, y: number}> = {
      '52B2': {x: 170, y: 720}, '52B1': {x: 450, y: 720}, '52B3': {x: 790, y: 720},
      '52S10': {x: 308, y: 670}, '52S1': {x: 575, y: 670}, '52S4': {x: 640, y: 670},
      '52S9': {x: 920, y: 670}, '52S7': {x: 1055, y: 670}, '52S8': {x: 1120, y: 670},
      '52S6': {x: 1190, y: 670}, '52S3': {x: 1410, y: 670}
    };
    if (bottomLinks[id]) return { x: bottomLinks[id].x, y: bottomLinks[id].y, isRed: false };
    
    if (id === '471') return { x: 320, y: 155, isRed: true };
    if (id === '412') return { x: 1060, y: 235, isRed: false };

    return null;
  };

  const renderEnergyTable = (id: string, x: number, y: number, isRed: boolean) => {
    return (
      <EnergyTable 
        key={`table-${id}`} 
        x={x} 
        y={y} 
        id={id} 
        isRed={isRed}
        state={state}
        isEditMode={isEditMode}
        theme={theme}
        onConfigClick={onConfigClick}
        expanded={true}
        onToggle={() => toggleTable(id)}
        expandLeft={x > 1200}
      />
    );
  };

  return (
    <div className={`w-full h-full ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'} overflow-auto flex items-center justify-center p-4 select-none`}>
      <svg viewBox={`0 40 ${SVG_WIDTH} ${SVG_HEIGHT - 40}`} className={`max-w-full h-auto ${theme === 'light' ? 'bg-white border border-slate-200' : 'bg-[#090d16]'} shadow-2xl rounded-sm`}>
        <style>{`
          line[stroke="#94a3b8"], path[stroke="#94a3b8"], rect[stroke="#94a3b8"], polyline[stroke="#94a3b8"], circle[stroke="#94a3b8"] { stroke: ${theme === 'light' ? '#475569' : '#94a3b8'}; }
          line[stroke="#475569"], path[stroke="#475569"], rect[stroke="#475569"], polyline[stroke="#475569"] { stroke: ${theme === 'light' ? '#1e293b' : '#475569'}; }
          text[fill="#ffffff"], text[fill="white"] { fill: ${theme === 'light' ? '#0f172a' : '#ffffff'}; }
        `}</style>

        {/* INFRASTRUCTURE LAYER */}
        <g>
          {/* TU Sections */}
          <g transform="translate(280, 100)">
           <circle cx="0" cy="-8" r="10" fill="none" stroke={COLOR_RED} strokeWidth="1.5" />
           <circle cx="0" cy="8" r="10" fill="none" stroke={COLOR_RED} strokeWidth="1.5" />
           <path d="M-4,-5 L4,-5 L0,-11 Z" fill="none" stroke={COLOR_RED} strokeWidth="1" opacity="1" />
           <path d="M0,8 L0,13 M0,8 L-3,4 M0,8 L3,4" fill="none" stroke={COLOR_RED} strokeWidth="1" />
           <text x="0" y="-25" textAnchor="middle" className={`text-[20px] font-bold ${theme === 'light' ? 'fill-slate-700' : 'fill-slate-300'}`}>TU471</text>
           <rect x="20" y="-8" width="50" height="12" fill="none" stroke={COLOR_RED} strokeWidth="1.5" />
           <line x1="10" y1="-2" x2="70" y2="-2" stroke={COLOR_RED} strokeWidth="1.5" />
           <path d="M70,-2 L120,-2 L120,150" stroke={COLOR_RED} strokeWidth="2" fill="none" />
           <path d="M120,60 L150,60" stroke="#94a3b8" strokeWidth="1" />
           {(() => {
             const es = state.breakers?.['471']?.earthSwitchStatus;
             const color = es === 'CLOSED' ? COLOR_RED : (es === 'OPEN' ? COLOR_GREEN : '#94a3b8');
             const isOpen = es !== 'CLOSED';
             return (
               <>
                 <Disconnector x="165" y="60" horizontal isOpen={isOpen} color={color} />
                 <Ground x="180" y="60" color={color} />
               </>
             );
           })()}
        </g>
          <g transform="translate(850, 80)">
           <circle cx="0" cy="-10" r="10" fill="none" stroke={COLOR_RED} strokeWidth="1.5" />
           <circle cx="0" cy="10" r="10" fill="none" stroke={COLOR_RED} strokeWidth="1.5" />
           <text x="0" y="-25" textAnchor="middle" className={`text-[20px] font-bold ${theme === 'light' ? 'fill-slate-700' : 'fill-slate-300'}`}>TU41</text>
           <rect x="-8" y="25" width="16" height="40" fill="none" stroke={COLOR_RED} strokeWidth="1.5" />
           <line x1="0" y1="25" x2="0" y2="65" stroke={COLOR_RED} strokeWidth="1.5" />
           <path d="M0,20 L0,25 M0,65 L0,170" stroke={COLOR_RED} strokeWidth="2" fill="none" />
           <path d="M0,120 L-40,120" stroke="#94a3b8" strokeWidth="1.2" />
           <Disconnector x="-55" y="120" horizontal isOpen />
           <Ground x="-75" y="120" />
        </g>
          <g transform="translate(1350, 80)">
           <circle cx="0" cy="-10" r="10" fill="none" stroke={COLOR_GREEN} strokeWidth="1.5" />
           <circle cx="0" cy="10" r="10" fill="none" stroke={COLOR_GREEN} strokeWidth="1.5" />
           <text x="0" y="-25" textAnchor="middle" className={`text-[20px] font-bold ${theme === 'light' ? 'fill-slate-700' : 'fill-slate-300'}`}>TU42</text>
           <rect x="-8" y="25" width="16" height="40" fill="none" stroke={COLOR_GREEN} strokeWidth="1.5" />
           <line x1="0" y1="25" x2="0" y2="65" stroke={COLOR_GREEN} strokeWidth="1.5" />
           <path d="M0,20 L0,25 M0,65 L0,170" stroke={COLOR_GREEN} strokeWidth="2" fill="none" />
        </g>

          {/* MAIN BUSBARS */}
          <line x1="50" y1="250" x2="1150" y2="250" stroke={COLOR_RED} strokeWidth="4" />
          <text x="60" y="240" className="text-[15px] font-black" fill={COLOR_RED}>C41</text>
          <line x1="1200" y1="250" x2="1850" y2="250" stroke={COLOR_GREEN} strokeWidth="4" />
          <text x="1840" y="240" className="text-[15px] font-black" fill={COLOR_GREEN} textAnchor="end">C42</text>
          
          <Breaker x={1175} y={250} id="412" label="412" horizontal {...commonProps} />
          <Breaker x={400} y={200} id="471" label="471" {...commonProps} />

          {/* FEEDERS PATHS */}
          {c41Feeders.map(f => (
            <g key={`path-c41-${f.id}`} transform={`translate(${f.x}, 0)`}>
              <path d="M 0,250 L 0,295 M 0,345 L 0,420 M 0,465 L 0,570 M 0,630 L 0,780" stroke={COLOR_RED} strokeWidth="1.5" fill="none" />
              <Breaker x={0} y={320} id={f.id} label={f.id} {...commonProps} />
              {(() => {
                const es = state.breakers?.[f.id]?.earthSwitchStatus;
                const color = es === 'CLOSED' ? COLOR_RED : (es === 'OPEN' ? COLOR_GREEN : '#94a3b8');
                const isOpen = es !== 'CLOSED';
                return (
                  <>
                    <Disconnector x="20" y="380" horizontal isOpen={isOpen} color={color} />
                    <Ground x="35" y="380" color={color} />
                  </>
                );
              })()}
              <Transformer x={0} y={445} id={f.tId} label={f.tId} {...commonProps} />
              <Breaker x={0} y={600} id={f.htId} label={f.htId} {...commonProps} />
              
              <g 
                className={(f.load === 'NMB-PTB-01' || f.load === 'NMB-PTB-02' || f.load === 'NMB-PTB-03' || f.load === 'NMB-PTB-04' || f.load.includes('NMB-UC')) ? 'cursor-pointer hover:brightness-110 transition-all' : ''}
                style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
                onClick={(e) => {
                  if (f.load === 'NMB-PTB-01' || f.load === 'NMB-PTB-02') {
                    e.stopPropagation();
                    onNavigateToLt1?.();
                  } else if (f.load === 'NMB-PTB-03' || f.load === 'NMB-PTB-04') {
                    e.stopPropagation();
                    onNavigateToLt2?.();
                  } else if (f.load.includes('NMB-UC')) {
                    e.stopPropagation();
                    onNavigateToLtUc?.();
                  }
                }}
              >
                <rect x="-40" y="778" width="80" height="20" rx="3" fill={COLOR_GREEN} />
                <text x="0" y="793" className="text-[14px] font-bold fill-white pointer-events-none" textAnchor="middle">{f.load}</text>
              </g>
            </g>
          ))}

          {c42Feeders.map(f => (
            <g key={`path-c42-${f.id}`} transform={`translate(${f.x- 20}, 0)`}>
              <path d="M 0,250 L 0,295 M 0,345 L 0,425 M 0,465 L 0,745 M 0,795 L 0,825" stroke={COLOR_GREEN} strokeWidth="1.5" fill="none" />
              <Breaker x={0} y={320} id={f.id} label={f.id === '436' ? '436' : f.id} {...commonProps} />
              {(() => {
                const es = state.breakers?.[f.id]?.earthSwitchStatus;
                const color = es === 'CLOSED' ? COLOR_RED : (es === 'OPEN' ? COLOR_GREEN : '#94a3b8');
                const isOpen = es !== 'CLOSED';
                return (
                  <>
                    <Disconnector x="20" y="380" horizontal isOpen={isOpen} color={color} />
                    <Ground x="35" y="380" color={color} />
                  </>
                );
              })()}
              <Transformer x={0} y={445} id={f.tId} label={f.tId} isRed={false} {...commonProps} />
              <Breaker x={0} y={770} id={f.mainHt} label={f.mainHt} {...commonProps} />
              <g 
                className="cursor-pointer hover:brightness-110"
                onClick={() => {
                  if (isEditMode) {
                    onConfigClick?.(f.gId, `MÁY PHÁT ${f.gId}`, 'GENERATOR');
                  } else {
                    onGeneratorClick?.(f.gId);
                  }
                }}
              >
                {(() => {
                    const genState = state.generators?.[f.gId];
                    const isRunning = genState?.status === 'RUNNING';
                    const isFault = genState?.hasFault || genState?.status === 'FAULT';
                    
                    let strokeColor = isRunning ? COLOR_RED : (isFault ? '#f59e0b' : COLOR_GREEN);
                    let circleClass = isFault ? 'animate-pulse' : '';
                    let stateTextColor = theme === 'light' ? 'fill-slate-600' : 'fill-slate-400';

                    if (genState?.detailedState && genState.detailedState !== 'UNKNOWN') {
                      if (genState.detailedState === 'RUNNING') {
                        strokeColor = COLOR_RED;
                      } else if (['PRE CRANK', 'STARTING', 'WARMING UP', 'STOPPING'].includes(genState.detailedState)) {
                        strokeColor = '#f59e0b'; // amber
                        circleClass = 'animate-pulse';
                        stateTextColor = 'fill-amber-500';
                      } else if (['PRE COOLDOWN', 'COOLDOWN'].includes(genState.detailedState)) {
                        strokeColor = '#3b82f6'; // blue
                        circleClass = 'animate-pulse';
                        stateTextColor = 'fill-blue-400';
                      } else if (genState.detailedState === 'IDLING') {
                        strokeColor = '#eab308'; // yellow
                        stateTextColor = 'fill-yellow-500';
                      }
                    }

                    const circleFill = strokeColor;
                    const textColor = (strokeColor === '#f59e0b' || strokeColor === '#eab308' || (isFault && !isRunning)) ? 'fill-black' : 'fill-white';
                    
                    let modeText = '';
                    if (genState?.mode === 'AUTO') modeText = '[A]';
                    else if (genState?.mode === 'SEMI-AUTO') modeText = '[S]';
                    else if (genState?.mode === 'STOP MODE') modeText = '[OFF]';
                    else if (genState?.mode === 'MANUAL') modeText = '[M]';

                    const needsWarning = isFault || (genState?.mode && genState.mode !== 'AUTO');

                    return (
                      <>
                         <circle cx="0" cy="840" r="15" fill={circleFill} stroke={strokeColor} strokeWidth="1.5" className={circleClass} />
                         <text x="0" y="844" className={`text-[13px] font-black ${textColor} pointer-events-none`} textAnchor="middle">{f.gId}</text>
                         {modeText && <text x="22" y="844" className="text-[11px] font-bold fill-blue-400 pointer-events-none">{modeText}</text>}
                         {genState?.detailedState && genState.detailedState !== 'UNKNOWN' && (
                           <text x="0" y="865" className={`text-[9px] font-black pointer-events-none ${stateTextColor}`} textAnchor="middle">
                             {genState.detailedState}
                           </text>
                         )}
                         {needsWarning && (
                           <g className="animate-pulse" transform="translate(-15, 825)">
                             <circle cx="0" cy="0" r="8" fill="#ef4444" />
                             <text x="0" y="4" className="text-[12px] font-black fill-white pointer-events-none" textAnchor="middle">!</text>
                           </g>
                         )}
                      </>
                    );
                 })()}
              </g>
              {f.htId && <><path d="M 0,610 L 0,670" stroke={COLOR_RED} strokeWidth="1.5" /><Breaker x={0} y={640} id={f.htId} label={f.htId} {...commonProps} /></>}
            </g>
          ))}

          {/* BOTTOM LINKS */}
          <g stroke={COLOR_GREEN} strokeWidth="1.5" fill="none" >
            <path d="M 335,880 L 640,880 M660,880 L1330,880" />
            <path d="M 100,720 L 240,720" /> <Breaker x={170} y={720} id="52B2" label="52B2"  horizontal {...commonProps}  />
            <path d="M 380,720 L 520,720" /> <Breaker x={450} y={720} id="52B1" label="52B1"  horizontal {...commonProps} />
            <path d="M 720,720 L 860,720" /> <Breaker x={790} y={720} id="52B3" label="52B3" horizontal {...commonProps} />
            <path d="M 240,720 L 308,720 L 308,630 L 335,630 L 335,880" /> <Breaker x={308} y={670} id="52S10" label="52S10" {...commonProps} />
            <path d="M 520,720 L 575,720 L 575,620 L 640,620 L 640,880" /> <Breaker x={575} y={670} id="52S1" label="52S1" {...commonProps} />
            <path d="M 590,620 L 590,590 L 660,590 L660,880" /> <Breaker x={640} y={670} id="52S4" label="52S4" {...commonProps} />
            <path d="M 860,720 L 920,720 L 920,620 L 940,620 L 940,840 L 1120,840" /> <Breaker x={920} y={670} id="52S9" label="52S9" {...commonProps} />
            <path d="M 1000,720 L 1055,720 L 1055,620 L 1120,620 L 1120,840" /> <Breaker x={1055} y={670} id="52S7" label="52S7" {...commonProps} />
            <path d="M 1080,620 L 1080,580 L 1190,580 L1190,644 M1190,695 L1190,720 L1280,720" /> <Breaker x={1120} y={670} id="52S8" label="52S8" {...commonProps} />
            <Breaker x={1190} y={670} id="52S6" label="52S6" {...commonProps} />
            <path d="M 1480,720 L 1410,720 L 1410,695 M1410,645 L1410,580 L1330,580 L1330,880" /> <Breaker x={1410} y={670} id="52S3" label="52S3" {...commonProps} />
          </g>
        </g>

        <g className="cursor-pointer hover:brightness-110 transition-all" onClick={() => onNavigateToFuel?.()}>
           <rect x="1500" y="865" width="130" height="28" rx="4" fill={COLOR_GREEN} />
           <text x="1565" y="882" fontSize="13" fontWeight="bold" fill="white" textAnchor="middle">MONITORING FUEL</text>
        </g>

        {/* EXPANDED ENERGY TABLES (Topmost layer) */}
        <g className="transition-all duration-300 drop-shadow-2xl">
          {expandedTables.map(id => {
            const pos = getBreakerPosition(id);
            if (!pos) return null;
            return renderEnergyTable(id, pos.x, pos.y, pos.isRed);
          })}
        </g>
      </svg>
    </div>
  );
};
