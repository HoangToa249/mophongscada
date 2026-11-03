import React, { useState } from 'react';
import { ElectricState, BreakerData } from '../types';
import { 
  Zap, Activity, AlertTriangle, ShieldCheck, Power, Sliders, 
  ChevronRight, Gauge, Info, CheckCircle2, XCircle, Wrench, Layers 
} from 'lucide-react';

interface Lt2CabinetViewProps {
  state: ElectricState;
  isEditMode?: boolean;
  theme?: 'light' | 'dark';
  onConfigClick?: (id: string, name: string, type: 'BREAKER' | 'TRANSFORMER' | 'AHF') => void;
}

export const Lt2CabinetView: React.FC<Lt2CabinetViewProps> = ({
  state,
  isEditMode = false,
  theme = 'dark',
  onConfigClick
}) => {
  const [selectedBreaker, setSelectedBreaker] = useState<BreakerData | null>(null);
  const [cabinetLayout, setCabinetLayout] = useState<'2-ROWS' | '1-ROW'>('2-ROWS');

  const getBreaker = (id: string): BreakerData => {
    return state.breakers?.[id] || {
      id,
      name: id,
      status: 'OPEN',
      currents: [0, 0, 0],
      voltages: [0, 0, 0],
      frequency: 0,
      powerFactor: 0,
      powerKW: 0,
      energyKWH: 0
    };
  };

  const isDark = theme === 'dark';

  // Styles per status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CLOSED': return 'bg-red-500 shadow-[0_0_10px_#ef4444] text-white';
      case 'OPEN': return 'bg-emerald-500 shadow-[0_0_10px_#10b981] text-white';
      case 'TRIP': return 'bg-amber-500 animate-pulse shadow-[0_0_10px_#f59e0b] text-black';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CLOSED': return 'ON (CLOSED)';
      case 'OPEN': return 'OFF (OPEN)';
      case 'TRIP': return 'TRIPPED';
      default: return 'OFFLINE / UNKNOWN';
    }
  };

  const handleBreakerClick = (b: BreakerData) => {
    if (isEditMode && onConfigClick) {
      onConfigClick(b.id, b.name, 'BREAKER');
    } else {
      setSelectedBreaker(b);
    }
  };

  // --- Subcomponents for Cabinet Elements ---

  // Pilot Lights (R-Y-B Phase indicators)
  const PilotLights = () => (
    <div className="flex justify-center items-center gap-3 my-2 py-1 bg-black/40 rounded border border-slate-700/50 w-32 mx-auto">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></div>
        <span className="text-[9px] text-slate-400 mt-0.5 font-bold">L1</span>
      </div>
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]"></div>
        <span className="text-[9px] text-slate-400 mt-0.5 font-bold">L2</span>
      </div>
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
        <span className="text-[9px] text-slate-400 mt-0.5 font-bold">L3</span>
      </div>
    </div>
  );

  // Digital Meter on Door
  const DigitalMeter = ({ breaker }: { breaker: BreakerData }) => {
    const v = breaker.voltages?.[0] || 0;
    const i = breaker.currents?.[0] || 0;
    const kw = breaker.powerKW || 0;

    return (
      <div className={`p-2.5 rounded-lg border mb-3 ${isDark ? 'bg-black/80 border-slate-700 text-emerald-400' : 'bg-slate-900 border-slate-600 text-emerald-400'} shadow-inner font-mono`}>
        <div className="flex justify-between items-center border-b border-slate-800 pb-1 mb-1.5 text-[10px] text-slate-400 uppercase tracking-wider font-sans">
          <span className="flex items-center gap-1"><Gauge className="w-3 h-3 text-cyan-400" /> PM8000 METER</span>
          <span className="text-emerald-500 flex items-center gap-1">● COM</span>
        </div>
        <div className="grid grid-cols-3 gap-1 text-center">
          <div className="bg-slate-950/80 p-1 rounded border border-slate-800/60">
            <div className="text-[9px] text-slate-400 font-sans">VOLT</div>
            <div className="text-sm font-bold text-cyan-300">{v.toFixed(0)}<span className="text-[10px] ml-0.5">V</span></div>
          </div>
          <div className="bg-slate-950/80 p-1 rounded border border-slate-800/60">
            <div className="text-[9px] text-slate-400 font-sans">CURR</div>
            <div className="text-sm font-bold text-amber-300">{i.toFixed(1)}<span className="text-[10px] ml-0.5">A</span></div>
          </div>
          <div className="bg-slate-950/80 p-1 rounded border border-slate-800/60">
            <div className="text-[9px] text-slate-400 font-sans">POWER</div>
            <div className="text-sm font-bold text-emerald-300">{kw.toFixed(1)}<span className="text-[10px] ml-0.5">kW</span></div>
          </div>
        </div>
      </div>
    );
  };

  // Air Circuit Breaker (ACB) Component - Large Panel Breaker
  const AcbBreaker = ({ breaker, label }: { breaker: BreakerData, label: string }) => {
    const isClosed = breaker.status === 'CLOSED';
    const isTrip = breaker.status === 'TRIP';

    return (
      <div 
        onClick={() => handleBreakerClick(breaker)}
        className={`relative group cursor-pointer transition-all duration-200 rounded-xl p-3 border-2 ${
          isClosed 
            ? isDark ? 'bg-slate-900/90 border-emerald-500/60 shadow-lg shadow-emerald-900/20' : 'bg-white border-emerald-500 shadow-md'
            : isTrip
            ? 'bg-amber-950/30 border-amber-500 shadow-lg shadow-amber-900/30'
            : isDark ? 'bg-slate-900/60 border-slate-700 hover:border-slate-500' : 'bg-slate-100 border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            
            <h4 className={`text-sm font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'} group-hover:text-cyan-400 transition-colors flex items-center gap-1.5`}>
              {breaker.name}
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">{label}</span>
          </div>
          <div className={`w-3.5 h-3.5 rounded-full ${getStatusColor(breaker.status)} flex items-center justify-center`} title={getStatusText(breaker.status)}></div>
        </div>

        {/* ACB Dashboard (Replaces Mechanical Faceplate & Footer) */}
        <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-col gap-2">
          {/* Top Row: Status Flag & Power/Energy */}
          <div className="flex items-stretch gap-2">
            {/* Status Flag */}
            <div className="flex-shrink-0 p-2 rounded-lg bg-black/60 border border-slate-700/80 flex flex-col items-center justify-center min-w-[70px]">
              <span className="text-[9px] text-slate-400 mb-1 font-bold">STATUS</span>
              <div className={`px-2 py-0.5 rounded text-[11px] font-extrabold tracking-wider ${
                isClosed ? 'bg-red-600 text-white' : isTrip ? 'bg-amber-500 text-black animate-pulse' : 'bg-emerald-600 text-white'
              }`}>
                {isClosed ? 'I - ON' : isTrip ? 'TRIP' : 'O - OFF'}
              </div>
            </div>

            {/* Power & Energy */}
            <div className="flex-1 flex flex-col justify-between bg-black/40 p-1.5 rounded-lg border border-slate-700/50 text-center font-mono gap-1 overflow-hidden">
              <div className="flex justify-between items-center px-1">
                <span className="text-slate-500 font-sans text-[9px] font-bold tracking-wider truncate mr-1">POWER (kW)</span>
                <span className="font-bold text-emerald-400 text-xs leading-none truncate">{(breaker.powerKW || 0).toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center px-1 border-t border-slate-700/50 pt-1">
                <span className="text-slate-500 font-sans text-[9px] font-bold tracking-wider truncate mr-1">ENERGY (kWh)</span>
                <span className="font-bold text-pink-400 text-xs leading-none truncate">{(breaker.energyKWH || 0).toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* 3-Phase Readings */}
          <div className="flex flex-col gap-1.5 font-mono">
            {/* Currents 3-phase */}
            <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <span className="text-slate-400 font-sans text-[9px] font-bold">CURRENT (A)</span>
              <div className="flex gap-4 font-bold text-amber-400 text-[11px]">
                <span className="flex flex-col items-center leading-none"><span className="text-slate-500 text-[8px] mb-0.5">L1</span><span>{breaker.currents?.[0]?.toFixed(1) || '0.0'}</span></span>
                <span className="flex flex-col items-center leading-none"><span className="text-slate-500 text-[8px] mb-0.5">L2</span><span>{breaker.currents?.[1]?.toFixed(1) || '0.0'}</span></span>
                <span className="flex flex-col items-center leading-none"><span className="text-slate-500 text-[8px] mb-0.5">L3</span><span>{breaker.currents?.[2]?.toFixed(1) || '0.0'}</span></span>
              </div>
            </div>
            
            {/* Voltages 3-phase */}
            <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <span className="text-slate-400 font-sans text-[9px] font-bold">VOLTAGE (V)</span>
              <div className="flex gap-4 font-bold text-cyan-300 text-[11px]">
                <span className="flex flex-col items-center leading-none"><span className="text-slate-500 text-[8px] mb-0.5">L1</span><span>{breaker.voltages?.[0]?.toFixed(0) || '0'}</span></span>
                <span className="flex flex-col items-center leading-none"><span className="text-slate-500 text-[8px] mb-0.5">L2</span><span>{breaker.voltages?.[1]?.toFixed(0) || '0'}</span></span>
                <span className="flex flex-col items-center leading-none"><span className="text-slate-500 text-[8px] mb-0.5">L3</span><span>{breaker.voltages?.[2]?.toFixed(0) || '0'}</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Molded Case Circuit Breaker (MCCB / MCB) - Stacked Feeder Breaker
  const MccbBreaker = ({ breaker, label }: { breaker: BreakerData, label?: string }) => {
    const isClosed = breaker.status === 'CLOSED';
    const isTrip = breaker.status === 'TRIP';

    return (
      <div 
        onClick={() => handleBreakerClick(breaker)}
        className={`group cursor-pointer transition-all duration-150 rounded-lg p-2.5 border flex items-center justify-between ${
          isClosed 
            ? isDark ? 'bg-slate-800/80 border-slate-600 hover:border-red-500/80' : 'bg-white border-slate-300 hover:border-red-500 shadow-sm'
            : isTrip
            ? 'bg-amber-950/20 border-amber-500 animate-pulse shadow-[0_0_15px_#f59e0b]'
            : isDark ? 'bg-slate-900/40 border-slate-800 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Toggle Switch Illustration */}
          <div className={`w-6 h-9 rounded flex flex-col justify-between p-0.5 border ${
            isClosed ? 'bg-red-950 border-red-500/60' : 'bg-slate-900 border-slate-700'
          }`}>
            <div className={`w-full h-3.5 rounded-sm transition-all ${isClosed ? 'bg-red-500 shadow-[0_0_6px_#ef4444]' : 'bg-transparent'}`}></div>
            <div className={`w-full h-3.5 rounded-sm transition-all ${!isClosed ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-transparent'}`}></div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 w-full">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(breaker.status)}`}></span>
              <h5 className={`text-xs font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'} group-hover:text-cyan-400 transition-colors`} title={label || breaker.name}>
                {label || breaker.name}
              </h5>
            </div>
          </div>
        </div>

        {/* Readings */}
        <div className="text-right font-mono flex-shrink-0 pl-2">
          <div className="text-xs font-bold text-amber-400">
            {breaker.currents?.[0]?.toFixed(1) || '0.0'} <span className="text-[10px] text-slate-400 font-sans">A</span>
          </div>
          <div className="text-[11px] text-emerald-400">
            {breaker.powerKW?.toFixed(1) || '0.0'} <span className="text-[9px] text-slate-400 font-sans">kW</span>
          </div>
        </div>
      </div>
    );
  };

  // Cabinet Section / Column Frame
  const CabinetSection = ({ 
    title, subtitle, sectionNum, children, width = "w-72" 
  }: { 
    title: string, subtitle?: string, sectionNum: string, children: React.ReactNode, width?: string 
  }) => (
    <div className={`${width} ${width === 'w-full' ? '' : 'flex-shrink-0'} flex flex-col rounded-xl border-2 ${
      isDark ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-slate-700/80 shadow-2xl' : 'bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 border-slate-400 shadow-xl'
    } overflow-hidden relative`}>
      {/* Top Busbar Duct Header */}
      <div className={`px-3 py-2 border-b ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-300 border-slate-400 text-slate-800'} flex justify-between items-center`}>
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded bg-cyan-600 text-white">
            {sectionNum}
          </span>
          <div>
            <h3 className="text-xs font-extrabold tracking-wide uppercase">{title}</h3>
            {subtitle && <p className="text-[10px] text-slate-400 font-mono">{subtitle}</p>}
          </div>
        </div>
        <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
      </div>

      {/* Ventilation Louvers Top */}
      <div className="flex justify-center gap-1.5 py-1.5 bg-black/20 border-b border-slate-800/40">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-6 h-1 bg-slate-700/60 rounded-full"></div>
        ))}
      </div>

      {/* Main Door / Compartment Body */}
      <div className="p-3 flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[620px] custom-scrollbar">
        {children}
      </div>

      {/* Ventilation Louvers Bottom & Door Handle */}
      <div className={`mt-auto px-3 py-2 border-t ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-300 border-slate-400'} flex justify-between items-center`}>
        <div className="flex gap-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-4 h-1 bg-slate-700/60 rounded-full"></div>
          ))}
        </div>
        {/* Door Lock / Handle Icon */}
        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-slate-600 border border-slate-500 inline-block"></span>
          <span>LOCK</span>
        </div>
      </div>

      {/* Base Plinth */}
      <div className="h-4 bg-black border-t border-slate-800 flex justify-around items-center px-4">
        <div className="w-8 h-1 bg-slate-800 rounded"></div>
        <div className="w-8 h-1 bg-slate-800 rounded"></div>
      </div>
    </div>
  );

  // Active Harmonic Filter (AHF) Dashboard
  const AhfDashboard = ({ ahfId }: { ahfId: string }) => {
    const ahf = state.ahfs?.[ahfId] || { 
      id: ahfId, name: ahfId, status: 'UNKNOWN', 
      thdICurrent: 0, thdVVoltage: 0, loadCurrent: 0, compensationCurrent: 0 
    };

    return (
      <div 
        onClick={() => {
          if (isEditMode && onConfigClick) {
            onConfigClick(ahf.id, ahf.name, 'AHF');
          }
        }}
        className={`p-3 bg-slate-900/90 rounded-lg border font-mono my-3 shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] ${isEditMode ? 'cursor-pointer hover:bg-slate-800 border-yellow-500/50' : 'border-cyan-700/50'}`}
      >
        <div className="text-[10px] text-cyan-400 font-sans font-bold flex justify-center items-center gap-1.5 pb-2 border-b border-slate-700/60 mb-2">
          <Activity className="w-3.5 h-3.5" /> ACTIVE HARMONIC FILTER
          {isEditMode && <span className="ml-2 text-yellow-500 animate-pulse text-[9px]">(EDIT)</span>}
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-1 text-center">
          <div className="bg-black/50 p-2 rounded-md border border-slate-700/50 flex flex-col justify-center">
            <div className="text-[9px] text-slate-400 mb-1 font-sans tracking-wider">THD-I (CURRENT)</div>
            <div className="text-base font-bold text-amber-400">{ahf.thdICurrent?.toFixed(1) || '0.0'}<span className="text-[10px] text-slate-500 ml-0.5">%</span></div>
          </div>
          <div className="bg-black/50 p-2 rounded-md border border-slate-700/50 flex flex-col justify-center">
            <div className="text-[9px] text-slate-400 mb-1 font-sans tracking-wider">THD-V (VOLTAGE)</div>
            <div className="text-base font-bold text-emerald-400">{ahf.thdVVoltage?.toFixed(1) || '0.0'}<span className="text-[10px] text-slate-500 ml-0.5">%</span></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-2 text-center">
          <div className="bg-black/50 p-2 rounded-md border border-slate-700/50 flex flex-col justify-center">
            <div className="text-[9px] text-slate-400 mb-1 font-sans tracking-wider">LOAD CURRENT</div>
            <div className="text-base font-bold text-cyan-300">{ahf.loadCurrent?.toFixed(1) || '0.0'}<span className="text-[10px] text-slate-500 ml-0.5">A</span></div>
          </div>
          <div className="bg-black/50 p-2 rounded-md border border-slate-700/50 flex flex-col justify-center">
            <div className="text-[9px] text-slate-400 mb-1 font-sans tracking-wider">COMPENSATION</div>
            <div className="text-base font-bold text-pink-400">{ahf.compensationCurrent?.toFixed(1) || '0.0'}<span className="text-[10px] text-slate-500 ml-0.5">A</span></div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-700/60 px-1">
          <div className="text-[9px] text-slate-400 font-sans tracking-wider">STATUS</div>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${ahf.status === 'RUNNING' ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-slate-800 border-slate-600'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${ahf.status === 'RUNNING' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-slate-500'}`}></span>
            <span className={`text-[10px] font-bold tracking-wider ${ahf.status === 'RUNNING' ? 'text-emerald-400' : 'text-slate-400'}`}>{ahf.status}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderPtb04Sections = (isGrid: boolean) => (
    <>
      {/* SEC 01: PTB-04 AHF */}
      <CabinetSection sectionNum="+HMB.12" title="AHF-PTB-04 (SEC 1)"  width={isGrid ? "w-full" : "w-72"}>
        <PilotLights />
        <MccbBreaker breaker={getBreaker('SPARE')} label="SPARE" />
        <AhfDashboard ahfId="AHF-PTB-04" />
      </CabinetSection>

      {/* SEC 02: May cat mach vong lt1-lt2 */}
      <CabinetSection sectionNum="+HMB.3" title="NMB-PTB-04 (SEC 2)" width={isGrid ? "w-full" : "w-80"}>
        <MccbBreaker breaker={getBreaker('AHF-PTB-04')} label="AHF-PTB-04" />
        <PilotLights />
        <DigitalMeter breaker={getBreaker('52S10')} />
        <div className="my-1"></div>
        <AcbBreaker breaker={getBreaker('52S10')} label="FROM 52S4-LT1 ROOM" />
      </CabinetSection>

      {/* SEC 03: PTB-04 FEEDER PANEL 03 & TIE QTX2C */}
      <CabinetSection sectionNum="+HMB.4" title="NMB-PTB-04 (SEC 3)" width={isGrid ? "w-full" : "w-80"}>
        <MccbBreaker breaker={getBreaker('PUMP-LIFTPIT-01')} label="PUMP-LIFTPIT-01" />
        <MccbBreaker breaker={getBreaker('EISOL-LIFT-12_LT2')} label="EISOL-LIFT-12" />
        <MccbBreaker breaker={getBreaker('EISOL-LIFT-10_LT2')} label="EISOL-LIFT-10" />
        <MccbBreaker breaker={getBreaker('EISOL-LIFT-08_LT2')} label="EISOL-LIFT-08" />
        <MccbBreaker breaker={getBreaker('EISOL-LIFT-06_LT2')} label="EISOL-LIFT-06" />
        <div className="my-1 pt-1 border-t border-slate-700/60"></div>
        <AcbBreaker breaker={getBreaker('QTX2C_LT2')} label="Tủ tụ bù PTB04" />
      </CabinetSection>

      {/* SEC 04: PTB-04 FEEDER PANEL 01 */}
      <CabinetSection sectionNum="+HMB.1" title="NMB-PTB-04 (SEC 4)"  width={isGrid ? "w-full" : "w-72"}>
        
        <MccbBreaker breaker={getBreaker('MDB-02_LT2')} label="MDB-02 (AutoGrill)" />
        <MccbBreaker breaker={getBreaker('To ATS NMB-PTB-01_LT2')} label="To ATS NMB-PTB-01" />
        <MccbBreaker breaker={getBreaker('NSB-1ST-ME-02_LT2')} label="NSB-1ST-ME-02" />
        <MccbBreaker breaker={getBreaker('NSB-PLB-03_LT2')} label="NSB-PLB-03" />
        <MccbBreaker breaker={getBreaker('DB-FB-06_LT2')} label="DB-FB-06(AutoGrill 2ND)" />
        <MccbBreaker breaker={getBreaker('ESB-UPS-LTG_LT2')} label="ESB-UPS-LTG" />
        <MccbBreaker breaker={getBreaker('LC7_LT2')} label="LC07" />
        <MccbBreaker breaker={getBreaker('LC5_LT2')} label="LC05" />
      </CabinetSection>


      {/* SEC 05: PTB-04 SECTION / TIE 52T7 */}
      <CabinetSection sectionNum="+HMB.6" title="NMB-PTB-04 (SEC 5)" width={isGrid ? "w-full" : "w-80"}>
        <PilotLights />
        <DigitalMeter breaker={getBreaker('52T7')} />
        <div className="my-1"></div>
        <AcbBreaker breaker={getBreaker('52T7')} label="INCOMMING FROM T7" />
      </CabinetSection>

      {/* SEC 06: ATS & BUS COUPLER */}
      <CabinetSection sectionNum="+HMB.7" title="NMB-PTB-03 (SEC 6)" width={isGrid ? "w-full" : "w-80"}>
        <PilotLights />
        <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1 mt-1 border-b border-slate-700/60 pb-1 flex justify-between items-center">
          <span>ATS AUTO TRANSFER SWITCH</span>
          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">AUTO</span>
        </div>
        <MccbBreaker breaker={getBreaker('QM1_LT2')} label="QM1 (NORMAL SOURCE)" />
        <MccbBreaker breaker={getBreaker('QM2_LT2')} label="QM2 (EMERGENCY SOURCE)" />
        <div className="my-1 pt-1 border-t border-slate-700/60"></div>
        <AcbBreaker breaker={getBreaker('52B2')} label="BUSCOUPLER" />
      </CabinetSection>
    </>
  );

  const renderPtb03Sections = (isGrid: boolean) => (
    <>
      
      {/* SEC 07: PTB-03 INCOMING ACB 52T13 */}
      <CabinetSection sectionNum="+HMB.8" title="NMB-PTB-03 (SEC 7)" width={isGrid ? "w-full" : "w-80"}>
        <PilotLights />
        <DigitalMeter breaker={getBreaker('52T13')} />
        <div className="my-1"></div>
        <AcbBreaker breaker={getBreaker('52T13')} label="INCOMING FROM T13" />
      </CabinetSection>

      {/* SEC 08: PTB-03 FEEDER PANEL 01 */}
      <CabinetSection sectionNum="+HMB.9" title="NMB-PTB-03 (SEC 8)"  width={isGrid ? "w-full" : "w-72"}>
        
        
        <MccbBreaker breaker={getBreaker('NDB-GH-03')} label="NDB-GH-03" />
        <MccbBreaker breaker={getBreaker('PUMP-LIFTPIT-02')} label="PUMP-LIFTPIT-02" />
        <MccbBreaker breaker={getBreaker('EISOL-GOODS-LIFT2')} label="EISOL-GOODS-LIFT2" />
        <MccbBreaker breaker={getBreaker('EISOL-LIFT9')} label="EISOL-LIFT9" />
        <MccbBreaker breaker={getBreaker('EISOL-LIFT7')} label="EISOL-LIFT7" />
        <MccbBreaker breaker={getBreaker('AHF-PTB03')} label="AHF-PTB03" />
        <MccbBreaker breaker={getBreaker('NSB-GND-ME-02')} label="NSB-GND-ME-02" />
        <MccbBreaker breaker={getBreaker('LC06')} label="LC06" />
      </CabinetSection>

      {/* SEC 10: PTB-03 FEEDER PANEL 02 & TIE QTX1C */}
      <CabinetSection sectionNum="+HMB.10" title="NMB-PTB-03 (SEC 9)" width={isGrid ? "w-full" : "w-80"}>
      
        <MccbBreaker breaker={getBreaker('OG02')} label="OG02" />
        <MccbBreaker breaker={getBreaker('NISOL-BHS-03')} label="NISOL-BHS-03" />
        <MccbBreaker breaker={getBreaker('DB-N1')} label="Tủ điện quả cầu" />
        <MccbBreaker breaker={getBreaker('NSB-PLB-04')} label="NSB-PLB-04" />
        <MccbBreaker breaker={getBreaker('QTX1C')} label="TỦ TỤ BÙ 03" />
                <div className="my-1 pt-1 border-t border-slate-700/60"></div>
        <AcbBreaker breaker={getBreaker('QTX1C')} label="QTX1C" />
      </CabinetSection>

      {/* SEC 11: PTB-03 FEEDER PANEL 03 */}
      <CabinetSection sectionNum="+HMB.11" title="NMB-PTB-03 (SEC 10)" subtitle="Phân phối PTB-03 Nhánh 3" width={isGrid ? "w-full" : "w-72"}>
      <MccbBreaker breaker={getBreaker('SPARE')} label="SPARE" />
      </CabinetSection>

      {/* SEC 12: CAPACITOR BANK & CONTROLLER */}
      <CabinetSection sectionNum="+HMB.12" title="AHF-PTB-03 (SEC 11)"  width={isGrid ? "w-full" : "w-72"}>
        <PilotLights />
        <MccbBreaker breaker={getBreaker('SPARE')} label="SPARE" />
        <AhfDashboard ahfId="AHF-PTB03" />
      </CabinetSection>
    </>
  );

  return (
    <div className={`w-full h-full overflow-y-auto custom-scrollbar ${isDark ? 'bg-[#050b14] text-slate-100' : 'bg-slate-100 text-slate-900'} p-4 rounded-2xl`}>
      {/* Top Banner / Legend */}
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/20 rounded-xl border border-cyan-500/40">
            <Layers className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold tracking-wide uppercase text-cyan-400">
                SƠ ĐỒ MẶT TRƯỚC TỦ ĐIỆN LT2 (FRONT-VIEW SWITCHBOARD)
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                12-SECTION LAYOUT
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Hệ thống tủ hạ thế NMB-PTB-04 (6 Ngăn trái) & NMB-PTB-03 (6 Ngăn phải) theo bản vẽ thiết kế
            </p>
          </div>
        </div>

        {/* Layout Mode Switcher & Legend */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-black/60 border border-slate-700 shadow-inner">
            <button
              onClick={() => setCabinetLayout('2-ROWS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                cabinetLayout === '2-ROWS'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Hiển thị 2 dãy trên/dưới vừa vặn màn hình không cần cuộn ngang"
            >
              📊 2 Dãy (Trên/Dưới - Vừa Màn Hình)
            </button>
            <button
              onClick={() => setCabinetLayout('1-ROW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                cabinetLayout === '1-ROW'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Hiển thị 12 khoang liên tiếp trên 1 hàng ngang"
            >
              ↔️ 1 Dãy Ngang (Cuộn ngang)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs bg-black/40 px-3.5 py-2 rounded-xl border border-slate-700/60 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
              <span>ON</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
              <span>OFF</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span>
              <span>TRIP</span>
            </div>
          </div>
        </div>
      </div>

      {/* 12-Section Cabinet Layout (2-ROWS or 1-ROW) */}
      {cabinetLayout === '2-ROWS' ? (
        <div className="space-y-6 pb-6 pt-1">
          {/* ROW 1: PTB-04 (6 SECTIONS) */}
          <div className="p-4 rounded-2xl bg-black/30 border border-slate-800/80 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 px-2 border-b border-cyan-500/30 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]"></div>
                <div>
                  <h3 className="text-sm font-black text-cyan-400 tracking-wider uppercase">DÃY TỦ 1: NMB-PTB-04 (6 KHOANG TẢI TRÁI & NGUỒN T7)</h3>
                  <p className="text-[11px] text-slate-400">Phân phối các nhánh PTB04, Nguồn máy biến áp T7 và Khoang liên lạc QTX2C</p>
                </div>
              </div>
              <span className="text-xs font-bold text-cyan-300 font-mono bg-cyan-950/60 px-3 py-1 rounded-lg border border-cyan-800/60 shadow">Ngăn +HMB.1 ➔ +HMB.6</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 w-full">
              {renderPtb04Sections(true)}
            </div>
          </div>

          {/* ROW 2: PTB-03 (6 SECTIONS) */}
          <div className="p-4 rounded-2xl bg-black/30 border border-slate-800/80 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 px-2 border-b border-amber-500/30 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]"></div>
                <div>
                  <h3 className="text-sm font-black text-amber-400 tracking-wider uppercase">DÃY TỦ 2: NMB-PTB-03 (6 KHOANG NGUỒN T13, MÁY PHÁT & TẢI PHẢI)</h3>
                  <p className="text-[11px] text-slate-400">Hệ thống ATS, Nguồn máy biến áp T13, Phân phối nhánh PTB03 và Tủ bù PFC</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-300 font-mono bg-amber-950/60 px-3 py-1 rounded-lg border border-amber-800/60 shadow">Ngăn +HMB.7 ➔ +HMB.12</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 w-full">
              {renderPtb03Sections(true)}
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto pb-6 pt-2 custom-scrollbar">
          <div className="flex gap-4 min-w-max px-2">
            {renderPtb04Sections(false)}
            {renderPtb03Sections(false)}
          </div>
        </div>
      )}

      {/* Interactive Breaker Details Modal */}
      {selectedBreaker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200`}>
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-700/60 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${getStatusColor(selectedBreaker.status)}`}>
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold">{selectedBreaker.name}</h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">ID: {selectedBreaker.id}</div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedBreaker(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-slate-800 mb-4">
              <span className="text-sm text-slate-400 font-medium">Trạng thái Hoạt động:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                selectedBreaker.status === 'CLOSED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                selectedBreaker.status === 'TRIP' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse' :
                'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {getStatusText(selectedBreaker.status)}
              </span>
            </div>

            {/* Parameter Readings Grid */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
                <div className="text-xs text-slate-400 font-sans mb-1 truncate">Dòng Điện (I1 / I2 / I3):</div>
                <div className="text-sm font-bold text-amber-400 truncate">
                  {selectedBreaker.currents?.[0]?.toFixed(1) || '0.0'} / {selectedBreaker.currents?.[1]?.toFixed(1) || '0.0'} / {selectedBreaker.currents?.[2]?.toFixed(1) || '0.0'} A
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
                <div className="text-xs text-slate-400 font-sans mb-1 truncate">Điện Áp (V1 / V2 / V3):</div>
                <div className="text-sm font-bold text-cyan-400 truncate">
                  {selectedBreaker.voltages?.[0]?.toFixed(0) || '0'} / {selectedBreaker.voltages?.[1]?.toFixed(0) || '0'} / {selectedBreaker.voltages?.[2]?.toFixed(0) || '0'} V
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
                <div className="text-xs text-slate-400 font-sans mb-1 truncate">Công Suất Tác Dụng (P):</div>
                <div className="text-base font-extrabold text-emerald-400 truncate">
                  {selectedBreaker.powerKW?.toFixed(1) || '0.0'} kW
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
                <div className="text-xs text-slate-400 font-sans mb-1 truncate">Hệ Số Công Suất (PF):</div>
                <div className="text-base font-extrabold text-purple-400 truncate">
                  {selectedBreaker.powerFactor?.toFixed(2) || '0.00'}
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
                <div className="text-xs text-slate-400 font-sans mb-1 truncate">Tần Số (Freq):</div>
                <div className="text-sm font-bold text-blue-400 truncate">
                  {selectedBreaker.frequency?.toFixed(2) || '50.00'} Hz
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
                <div className="text-xs text-slate-400 font-sans mb-1 truncate">Điện Năng Tiêu Thụ:</div>
                <div className="text-sm font-bold text-pink-400 truncate">
                  {selectedBreaker.energyKWH?.toFixed(0) || '0'} kWh
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
              {isEditMode && (
                <button
                  onClick={() => {
                    const b = selectedBreaker;
                    setSelectedBreaker(null);
                    if (onConfigClick) onConfigClick(b.id, b.name, 'BREAKER');
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm flex items-center gap-2 transition-colors"
                >
                  <Wrench className="w-4 h-4" /> Cấu Hình Tag Kepware
                </button>
              )}
              <button
                onClick={() => setSelectedBreaker(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
