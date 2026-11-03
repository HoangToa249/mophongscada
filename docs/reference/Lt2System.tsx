import React, { useState, useEffect } from 'react';
import { Lt2RoomScadaDiagram } from './Lt2RoomScadaDiagram';
import { Lt2CabinetView } from './Lt2CabinetView';
import { ElectricConfigModal } from './ElectricConfigModal';
import { ElectricState, BreakerStatus } from '../types';
import { Edit3, X, Zap, Activity, ArrowLeft, ChevronDown, ChevronUp, Sun, Moon, ChevronRight, ChevronLeft } from 'lucide-react';
import { plcService } from '../services/plcService';
import { socketService } from '../services/socketService';

interface Lt2SystemProps {
  userRole?: string;
  isEmbedded?: boolean;
  onBack?: () => void;
}

export const Lt2System: React.FC<Lt2SystemProps> = ({ userRole, isEmbedded, onBack }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [electricConfig, setElectricConfig] = useState<any>({});
  const [rawPlcData, setRawPlcData] = useState<any>({});
  const [kepwareData, setKepwareData] = useState<any>({});
  const [configModal, setConfigModal] = useState({ isOpen: false, id: '', name: '', type: 'BREAKER' as any });
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'SINGLELINE' | 'CABINET'>('CABINET');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(true);

  const handleViewModeChange = (mode: 'SINGLELINE' | 'CABINET') => {
    setViewMode(mode);
    setIsSidebarCollapsed(mode === 'CABINET');
  };

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('scada_theme') as 'dark' | 'light') || 'dark';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('scada_theme', newTheme);
    window.dispatchEvent(new Event('scada_theme_changed'));
  };

  useEffect(() => {
    const handleThemeChange = () => {
      setTheme((localStorage.getItem('scada_theme') as 'dark' | 'light') || 'dark');
    };
    window.addEventListener('scada_theme_changed', handleThemeChange);
    return () => window.removeEventListener('scada_theme_changed', handleThemeChange);
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      const config = await plcService.getElectricConfig();
      setElectricConfig(config);
    };
    fetchConfig();
    const cleanupPlc = socketService.onDataUpdate((data) => setRawPlcData(data));
    const cleanupKepware = socketService.onKepwareUpdate((data) => setKepwareData(data));
    return () => { cleanupPlc(); cleanupKepware(); };
  }, []);

  const getElectricState = (): ElectricState => {
    const state: ElectricState = {
      busbars: {},
      breakers: {},
      transformers: {},
      ahfs: {}
    };

    const breakerIds = [
      "52T13", "52S10", "52S1", "52S4", "QM1_LT2", "QM2_LT2",
      "52T7", "52B2",
      "LC5_LT2", "LC7_LT2", "ESB-UPS-LTG_LT2", "To ATS NMB-PTB-01_LT2", "EISOL-LIFT-08_LT2", "AHF-PTB-04", 
      "EISOL-LIFT-10_LT2", "EISOL-LIFT-12_LT2", "NSB-1ST-ME-02_LT2", "PUMP-LIFTPIT-01", 
      "EISOL-LIFT-06_LT2", "NSB-PLB-03_LT2", "MDB-02_LT2", "DB-FB-06_LT2", 
      "QTX2C_LT2", "NDB-GH-03", "PUMP-LIFTPIT-02", "EISOL-GOODS-LIFT2", "EISOL-LIFT9", 
      "EISOL-LIFT7", "AHF-PTB03", "NSB-GND-ME-02", "LC06", "OG02", "NISOL-BHS-03", "DB-N1", "NSB-PLB-04", "QTX1C"
    ];

    breakerIds.forEach(id => {
      const config = electricConfig[id];
      let status: BreakerStatus = 'UNKNOWN';
      
      const getVal = (key: string) => {
          const tagId = config?.tags?.[key];
          return plcService.getUnifiedValue(tagId, kepwareData, rawPlcData) ?? 0;
      };

      if (config?.tags?.statusTag) {
        status = plcService.getUnifiedValue(config.tags.statusTag, kepwareData, rawPlcData) ? 'CLOSED' : 'OPEN';
        if (config.tags.tripTag && plcService.getUnifiedValue(config.tags.tripTag, kepwareData, rawPlcData)) status = 'TRIP';
      } else {
        status = 'OPEN';
      }

      state.breakers[id] = {
        id,
        name: config?.name || id,
        status,
        currents: [getVal('i1'), getVal('i2'), getVal('i3')],
        voltages: [getVal('v1'), getVal('v2'), getVal('v3')],
        frequency: getVal('freq'),
        powerFactor: getVal('pf'),
        powerKW: getVal('kw'),
        energyKWH: getVal('kwh')
      };
    });

    const ahfIds = ["AHF-PTB-04", "AHF-PTB03"];
    ahfIds.forEach(id => {
      const config = electricConfig[id];
      const getVal = (key: string) => {
          const tagId = config?.tags?.[key];
          return plcService.getUnifiedValue(tagId, kepwareData, rawPlcData) ?? 0;
      };
      
      let status: 'RUNNING' | 'STOPPED' | 'FAULT' | 'UNKNOWN' = 'UNKNOWN';
      if (config?.tags?.statusTag) {
        status = plcService.getUnifiedValue(config.tags.statusTag, kepwareData, rawPlcData) ? 'RUNNING' : 'STOPPED';
      }

      if (state.ahfs) {
        state.ahfs[id] = {
          id,
          name: config?.name || id,
          status,
          thdICurrent: getVal('thdICurrentTag'),
          thdVVoltage: getVal('thdVVoltageTag'),
          loadCurrent: getVal('loadCurrentTag'),
          compensationCurrent: getVal('compensationCurrentTag')
        };
      }
    });

    return state;
  };

  const handleConfigClick = (id: string, name: string, type: 'BREAKER' | 'TRANSFORMER' | 'AHF') => {
    setConfigModal({ isOpen: true, id, name, type });
  };

  const handleSaveConfig = async () => {
    const config = await plcService.getElectricConfig();
    setElectricConfig(config);
  };

  const state = getElectricState();

  if (isEmbedded) {
    return (
      <div className={`w-full h-full ${theme === 'light' ? 'bg-slate-50' : 'bg-[#050b14]'} overflow-hidden relative`}>
        {viewMode === 'SINGLELINE' ? (
          <Lt2RoomScadaDiagram state={state} isEditMode={false} theme={theme} onConfigClick={() => {}} />
        ) : (
          <Lt2CabinetView state={state} isEditMode={false} theme={theme} onConfigClick={() => {}} />
        )}
      </div>
    );
  }

  const EnergyCard = ({ id, label }: { id: string, label: string }) => {
    const b = state.breakers[id];
    if (!b) return null;
    const isExpanded = expandedCardId === id;

    return (
      <div 
        className={`${theme === 'light' ? 'bg-white' : 'bg-slate-900'} border-2 transition-all duration-300 rounded-xl overflow-hidden shadow-lg cursor-pointer ${
          isExpanded ? (theme === 'light' ? 'border-indigo-400 ring-4 ring-indigo-100' : 'border-indigo-500 ring-4 ring-indigo-950/40') : (theme === 'light' ? 'border-slate-200 hover:border-slate-300' : 'border-slate-800/80 hover:border-slate-700')
        }`}
        onClick={() => setExpandedCardId(isExpanded ? null : id)}
      >
        <div className={`p-3 flex justify-between items-center ${isExpanded ? (theme === 'light' ? 'bg-indigo-50' : 'bg-indigo-950/20') : (theme === 'light' ? 'bg-white' : 'bg-slate-900')}`}>
          <div className="flex flex-col">
            <span className={`text-[13px] font-black ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'} uppercase tracking-tight`}>{label}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block w-fit mt-1 border ${
              b.status === 'CLOSED' ? (theme === 'light' ? 'bg-red-100 text-red-600 border-red-200' : 'bg-red-950/40 text-red-400 border-red-900/50') : 
              b.status === 'OPEN' ? (theme === 'light' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50') : (theme === 'light' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700')
            }`}>{b.status}</span>
          </div>
          {isExpanded ? <ChevronUp size={18} className="text-indigo-400" /> : <ChevronDown size={18} className="text-slate-500" />}
        </div>

        <div className="px-3 pb-3 space-y-3">
          {/* Main Currents - Always Visible */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className={`${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'} rounded-lg p-1.5 flex flex-col items-center`}>
              <span className={`text-[11px] font-bold ${theme === 'light' ? 'text-amber-600' : 'text-amber-500'} uppercase`}>IA (A)</span>
              <span className={`text-md font-black ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'} font-mono`}>{b.currents?.[0]?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) || '0.0'}</span>
            </div>
            <div className={`${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} rounded-lg p-1.5 flex flex-col items-center border-x`}>
              <span className={`text-[11px] font-bold ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-500'} uppercase`}>IB (A)</span>
              <span className={`text-md font-black ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'} font-mono`}>{b.currents?.[1]?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) || '0.0'}</span>
            </div>
            <div className={`${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'} rounded-lg p-1.5 flex flex-col items-center`}>
              <span className={`text-[11px] font-bold ${theme === 'light' ? 'text-rose-600' : 'text-rose-500'} uppercase`}>IC (A)</span>
              <span className={`text-md font-black ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'} font-mono`}>{b.currents?.[2]?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) || '0.0'}</span>
            </div>
          </div>

          {isExpanded && (
            <div className={`animate-in fade-in slide-in-from-top-2 duration-300 space-y-3 pt-2 border-t ${theme === 'light' ? 'border-slate-100' : 'border-slate-850'}`}>
              {/* Voltages */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center">
                  <span className={`text-[9px] font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'} uppercase`}>V-AB</span>
                  <span className={`text-[12px] font-black ${theme === 'light' ? 'text-amber-600' : 'text-amber-500'} font-mono`}>{b.voltages?.[0]?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className={`text-[9px] font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'} uppercase`}>V-BC</span>
                  <span className={`text-[12px] font-black ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-500'} font-mono`}>{b.voltages?.[1]?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className={`text-[9px] font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'} uppercase`}>V-CA</span>
                  <span className={`text-[12px] font-black ${theme === 'light' ? 'text-rose-600' : 'text-rose-500'} font-mono`}>{b.voltages?.[2]?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}</span>
                </div>
              </div>

              {/* Power & Energy */}
              <div className={`${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'} rounded-xl p-3 grid grid-cols-2 gap-4`}>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'} uppercase`}>Công suất (kW)</span>
                  <span className={`text-lg font-black ${theme === 'light' ? 'text-cyan-600' : 'text-cyan-400'} font-mono leading-none mt-1`}>{b.powerKW?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) || '0.0'}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'} uppercase`}>Điện năng (kWh)</span>
                  <span className={`text-lg font-black ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'} font-mono leading-none mt-1`}>{b.energyKWH?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}</span>
                </div>
              </div>

              {/* PF & Hz */}
              <div className="flex justify-between items-center px-1">
                <div className="flex gap-2 items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Hệ số PF:</span>
                  <span className={`text-[11px] font-black ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'} font-mono`}>{b.powerFactor?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tần số:</span>
                  <span className={`text-[11px] font-black ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'} font-mono`}>{b.frequency?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) || '00.0'} Hz</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full gap-0 animate-in fade-in duration-500 ${theme === 'light' ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-200'}`}>
      <div className={`system-header flex justify-between items-center px-4 py-3 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/40 border-slate-800'} border-b shadow-sm`}>
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-800' : 'hover:bg-slate-850 text-slate-400 hover:text-white'}`}>
              <ArrowLeft size={24} />
            </button>
          )}
          <div className="flex flex-col">
            <h2 className={`text-xl font-black ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'} tracking-tight`}>GIÁM SÁT HẠ THẾ LT2-ROOM</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className={`flex items-center p-1 rounded-xl border ${theme === 'light' ? 'bg-slate-200 border-slate-300' : 'bg-slate-950 border-slate-800'}`}>
            <button
              onClick={() => handleViewModeChange('SINGLELINE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'SINGLELINE'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Single Line
            </button>
            <button
              onClick={() => handleViewModeChange('CABINET')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'CABINET'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              🏢 Cabinet View
            </button>
          </div>

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-all shadow-sm ${theme === 'light' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            title="Chuyển đổi giao diện"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          {userRole === 'ADMIN' && (
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all ${
                isEditMode ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/20' : (theme === 'light' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-200 hover:bg-slate-700')
              }`}
            >
              {isEditMode ? <X size={18}/> : <Edit3 size={18}/>}
              {isEditMode ? 'THOÁT' : 'CẤU HÌNH TAG'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 gap-3 px-3 pb-4 overflow-hidden mt-3">
        {/* Main SCADA View */}
        <div className={`flex-1 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} rounded-2xl border overflow-hidden relative shadow-inner`}>
          {viewMode === 'SINGLELINE' ? (
            <Lt2RoomScadaDiagram state={state} isEditMode={isEditMode} theme={theme} onConfigClick={handleConfigClick} />
          ) : (
            <Lt2CabinetView state={state} isEditMode={isEditMode} theme={theme} onConfigClick={handleConfigClick} />
          )}
        </div>

        {/* Energy Side Panel */}
        {!isSidebarCollapsed ? (
          <div className="system-sidebar w-60 flex flex-col gap-4 overflow-y-auto pr-1 transition-all duration-300 relative">
            <div className={`${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} border rounded-xl p-3 flex items-center justify-between shadow-lg sticky top-0 z-10`}>
               <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-2 ${theme === 'light' ? 'bg-amber-100 text-amber-600' : 'bg-slate-950 text-amber-400'} rounded-lg flex-shrink-0`}><Zap size={20} /></div>
                  <div className="min-w-0">
                     <div className="text-[10px] font-black text-slate-500 uppercase truncate">Energy Monitor</div>
                     <div className={`text-sm font-bold ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'} truncate`}>LT2 Feeders</div>
                  </div>
               </div>
               <button 
                 onClick={() => setIsSidebarCollapsed(true)}
                 className={`p-1 rounded-lg border ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'} transition-all`}
                 title="Thu gọn thanh trạng thái năng lượng"
               >
                 <ChevronRight size={16} />
               </button>
            </div>
            
            <div className="space-y-3">
              <EnergyCard id="52T13" label="Incoming T13" />
              <EnergyCard id="52T7" label="Incoming T7" />
              <EnergyCard id="52B2" label="Bus Tie 52B2" />

              <div className="pt-2 border-t border-slate-800">
                 <div className="text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">Ring Breakers</div>
                 <div className="space-y-2">
                    <EnergyCard id="52S10" label="Breaker 52S10" />
                 </div>
              </div>
            </div>
            
            <div className={`${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} border rounded-xl p-4 flex-1`}>
               <div className={`flex items-center gap-2 mb-4 border-b ${theme === 'light' ? 'border-slate-100' : 'border-slate-800'} pb-2`}>
                  <Activity size={16} className={theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'} />
                  <span className={`text-xs font-black ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'} uppercase`}>System Status</span>
               </div>
               <div className="space-y-3">
                   <div className="flex justify-between items-center text-xs">
                      <span className={`font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>ACB Closed</span>
                      <span className="font-bold text-red-500">{Object.values(state.breakers).filter(b => b.status === 'CLOSED').length}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className={`font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>MCB Open</span>
                      <span className="font-bold text-emerald-500">{Object.values(state.breakers).filter(b => b.status === 'OPEN').length}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className={`font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Tripped Units</span>
                      <span className="font-bold text-amber-500">{Object.values(state.breakers).filter(b => b.status === 'TRIP').length}</span>
                   </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-start gap-2 py-1 flex-shrink-0 transition-all duration-300">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className={`p-2 rounded-xl border ${theme === 'light' ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-sm' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 shadow-md'} flex flex-col items-center gap-2 transition-all group`}
              title="Mở rộng thanh trạng thái năng lượng"
            >
              <div className={`p-1.5 rounded-lg ${theme === 'light' ? 'bg-amber-100 text-amber-600' : 'bg-slate-950 text-amber-400'}`}>
                <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              </div>
              <span className="text-[10px] font-extrabold tracking-widest uppercase py-2 text-cyan-400" style={{ writingMode: 'vertical-rl' }}>
                ⚡ Energy Status
              </span>
            </button>
          </div>
        )}
      </div>

      {configModal.isOpen && (
        <ElectricConfigModal
          deviceId={configModal.id}
          deviceName={configModal.name}
          deviceType={configModal.type as any}
          initialTags={electricConfig[configModal.id]?.tags || {}}
          onClose={() => setConfigModal({...configModal, isOpen: false})}
          onSave={handleSaveConfig}
        />
      )}
    </div>
  );
};
