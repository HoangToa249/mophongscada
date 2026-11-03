import React, { useState, useEffect } from 'react';
import { LtUcRoomScadaDiagram } from './LtUcRoomScadaDiagram';
import { LtUcCabinetView } from './LtUcCabinetView';
import { ElectricConfigModal } from './ElectricConfigModal';
import { ElectricState, BreakerStatus } from '../types';
import { Edit3, X, Zap, Activity, ArrowLeft, ChevronDown, ChevronUp, Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import { plcService } from '../services/plcService';
import { socketService } from '../services/socketService';

interface LtUcSystemProps {
  userRole?: string;
  isEmbedded?: boolean;
  onBack?: () => void;
}

export const LtUcSystem: React.FC<LtUcSystemProps> = ({ userRole, isEmbedded, onBack }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [electricConfig, setElectricConfig] = useState<any>({});
  const [rawPlcData, setRawPlcData] = useState<any>({});
  const [kepwareData, setKepwareData] = useState<any>({});
  const [configModal, setConfigModal] = useState({ isOpen: false, id: '', name: '', type: 'BREAKER' as any });
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'SINGLELINE' | 'CABINET'>('SINGLELINE');
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
    const state: ElectricState = { busbars: {}, breakers: {}, transformers: {} };
    const breakerIds = [
      "52T1", "NDT_CH_01", "NDT_CT_01", "NDT_CDWP_01", "NDT_PCHWP_01", "NDT_SCHWP_01", "NDT_SCHWP_04", "AHF_UC01",
      "NDT_CH_02", "NDT_CT_02", "NDT_CDWP_02", "NDT_PCHWP_02", "SPARE_01", "SPARE_02", "SPARE_03", "QTX1C_UC01",
      "52T17", "52B3", "NDT_CH_03", "NDT_CT_03", "NDT_CDWP_03", "NDT_PCHWP_03", "NDT_SCHWP_02",
      "NDT_CH_05", "NDT_CT_05", "FPS_HYD_01", "2FPS_HYD_01", "FPS_HYD_JP1", "FPS_HYD_JP2","NDT_CT_04",
      "DWP_01", "NDT_SUMP_P_5", "NSB_UC_ME_01", "NSB_UC_LP_01", "NDT_SUMP_P_3", "AHF_UC02",
      "52T3", "52S6", "52S7", "52S8", "52S9", "NDT_STD_P_1","DWP_02","QTX2C_UC02",
      "NDT_CH_04", "XLNT_GD2", "MWP_01", "MWP_02", "NDT_CDWP_04", "NDT_PCHWP_04",
      "QTX3C_UC03", "NDT_CDWP_05", "NDT_PCHWP_05", "KHO_BAN_HAM", "FUEL_PUMP_GENERATOR", "STORAGE_K",
      "FPS_SPK_01", "FPS_SPK_02", "FPS_SPK_JP1", "FPS_SPK_JP2", "FPS_WT_P1", "FPS_WT_P2",
      "FPS_WT_JP1", "FPS_WT_JP2", "NDT_STP_P_2", "NDT_SUMP_P_4", "NDT_SUMP_P_6", "SPARE_UC03"
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
      } else { status = 'OPEN'; }
      
      state.breakers[id] = {
        id, name: config?.name || id, status,
        currents: [getVal('i1'), getVal('i2'), getVal('i3')],
        voltages: [getVal('v1'), getVal('v2'), getVal('v3')],
        frequency: getVal('freq'), powerFactor: getVal('pf'),
        powerKW: getVal('kw'), energyKWH: getVal('kwh')
      };
    });
    return state;
  };

  const handleConfigClick = (id: string, name: string, type: 'BREAKER' | 'TRANSFORMER') => {
    setConfigModal({ isOpen: true, id, name, type });
  };

  const handleBreakerClick = (id: string) => {
    setExpandedCardId(id);
    // Tự động cuộn sidebar đến card được chọn
    const element = document.getElementById(`energy-card-${id}`);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSaveConfig = async () => {
    const config = await plcService.getElectricConfig();
    setElectricConfig(config);
  };

  const state = getElectricState();

  if (isEmbedded) {
    return (
      <div className={`w-full h-full ${theme === 'light' ? 'bg-slate-50' : 'bg-[#050b14]'} overflow-hidden relative`}>
        <LtUcRoomScadaDiagram state={state} isEditMode={false} theme={theme} onConfigClick={() => {}} onBreakerClick={() => {}} />
      </div>
    );
  }

  const EnergyCard = ({ id, label }: { id: string, label: string }) => {
    const b = state.breakers[id];
    const config = electricConfig[id];
    if (!b) return null;
    const isExpanded = expandedCardId === id;
    const hasTags = config?.tags && (config.tags.i1 || config.tags.v1 || config.tags.kw);

    return (
      <div 
        id={`energy-card-${id}`}
        className={`${theme === 'light' ? 'bg-white' : 'bg-slate-900'} border-2 transition-all rounded-xl overflow-hidden shadow-lg cursor-pointer ${
          isExpanded ? (theme === 'light' ? 'border-indigo-400 ring-4 ring-indigo-100' : 'border-indigo-500 ring-4 ring-indigo-950/40') : (theme === 'light' ? 'border-slate-200 hover:border-slate-300' : 'border-slate-800/80 hover:border-slate-700')
        }`}
        onClick={() => setExpandedCardId(isExpanded ? null : id)}
      >
        <div className={`p-3 flex justify-between items-center ${isExpanded ? (theme === 'light' ? 'bg-indigo-50' : 'bg-indigo-950/20') : (theme === 'light' ? 'bg-white' : 'bg-slate-900')}`}>
          <div className="flex flex-col">
            <span className={`text-[12px] font-black ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'} uppercase tracking-tight`}>{label}</span>
            <div className="flex gap-1 mt-1">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block w-fit border ${
                b.status === 'CLOSED' ? (theme === 'light' ? 'bg-red-100 text-red-600 border-red-200' : 'bg-red-950/40 text-red-400 border-red-900/50') : 
                b.status === 'OPEN' ? (theme === 'light' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50') : (theme === 'light' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700')
              }`}>{b.status}</span>
              {!hasTags && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-950/40 text-amber-400 border border-amber-900/50 uppercase">No Tags</span>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1">
              <div className={`flex flex-col items-center ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} p-1 rounded border shadow-sm font-mono`}><span className={`text-[10px] font-bold ${theme === 'light' ? 'text-amber-600' : 'text-amber-500'}`}>A</span><span className={`text-[11px] font-black ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>{b.currents?.[0]?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}A</span></div>
              <div className={`flex flex-col items-center ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} p-1 rounded border shadow-sm font-mono`}><span className={`text-[10px] font-bold ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-500'}`}>B</span><span className={`text-[11px] font-black ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>{b.currents?.[1]?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}A</span></div>
              <div className={`flex flex-col items-center ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} p-1 rounded border shadow-sm font-mono`}><span className={`text-[10px] font-bold ${theme === 'light' ? 'text-rose-600' : 'text-rose-500'}`}>C</span><span className={`text-[11px] font-black ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>{b.currents?.[2]?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}A</span></div>
          </div>
        </div>
        
        {isExpanded && (
          <div className={`p-3 border-t ${theme === 'light' ? 'border-slate-100 bg-slate-50/50' : 'border-slate-850 bg-slate-950/30'} space-y-2 animate-in slide-in-from-top-2 duration-200`}>
            {isEditMode && config?.tags && (
              <div className="bg-amber-950/20 border border-amber-900/50 rounded-lg p-2 mb-2">
                <div className="text-[9px] font-black text-amber-400 uppercase mb-1">Cấu hình Tag hiện tại:</div>
                <div className="text-[9px] font-bold text-slate-300 truncate">I1: {config.tags.i1 || '---'}</div>
                <div className="text-[9px] font-bold text-slate-300 truncate">V1: {config.tags.v1 || '---'}</div>
                <div className="text-[9px] font-bold text-slate-300 truncate">KW: {config.tags.kw || '---'}</div>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="flex flex-col items-center"><span className="text-[10px] font-bold text-slate-500 font-mono">V-AB</span><span className={`text-[12px] font-black ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'} font-mono`}>{b.voltages?.[0]?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}V</span></div>
                <div className="flex flex-col items-center"><span className="text-[10px] font-bold text-slate-500 font-mono">V-BC</span><span className={`text-[12px] font-black ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'} font-mono`}>{b.voltages?.[1]?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}V</span></div>
                <div className="flex flex-col items-center"><span className="text-[10px] font-bold text-slate-500 font-mono">V-CA</span><span className={`text-[12px] font-black ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'} font-mono`}>{b.voltages?.[2]?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}V</span></div>
            </div>

            <div className={`${theme === 'light' ? 'bg-white border border-slate-200' : 'bg-slate-950 border border-transparent'} rounded-lg p-2.5 flex justify-between shadow-lg`}>
              <div><div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Power (kW)</div><div className={`text-sm font-black ${theme === 'light' ? 'text-cyan-600' : 'text-cyan-400'} font-mono leading-none`}>{b.powerKW?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div></div>
              <div className="text-right"><div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Energy (kWh)</div><div className={`text-sm font-black ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'} font-mono leading-none`}>{b.energyKWH?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div></div>
            </div>
            <div className="flex justify-between px-1">
               <div className="text-[11px] font-bold text-slate-500">Hz: <span className={`${theme === 'light' ? 'text-slate-700' : 'text-slate-300'} font-mono`}>{b.frequency?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span></div>
               <div className="text-[11px] font-bold text-slate-500">PF: <span className={`${theme === 'light' ? 'text-slate-700' : 'text-slate-300'} font-mono`}>{b.powerFactor?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${theme === 'light' ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-200'} animate-in fade-in duration-500 relative overflow-hidden`}>
      <div className={`h-14 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} border-b flex items-center justify-between px-4 shrink-0 shadow-sm z-20`}>
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className={`p-2 ${theme === 'light' ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-400'} rounded-full transition-colors`}>
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <Zap className={`w-5 h-5 ${theme === 'light' ? 'text-amber-500' : 'text-amber-400'}`} />
            <span className={`font-black text-lg ${theme === 'light' ? 'text-slate-800' : 'text-white'} tracking-tight`}>
              GIÁM SÁT HẠ THẾ LT UC - ROOM
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${theme === 'light' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'} transition-colors`}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <div className={`flex p-1 rounded-lg ${theme === 'light' ? 'bg-slate-100' : 'bg-slate-800'}`}>
             <button
                onClick={() => handleViewModeChange('SINGLELINE')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'SINGLELINE' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : theme === 'light' ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'
                }`}
             >
                SINGLE LINE
             </button>
             <button
                onClick={() => handleViewModeChange('CABINET')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'CABINET' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : theme === 'light' ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'
                }`}
             >
                CABINET VIEW
             </button>
          </div>

          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
              isEditMode 
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                : theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isEditMode ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {isEditMode ? 'XONG' : 'CẤU HÌNH TAG'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-3 px-3 pb-4 overflow-hidden mt-3">
        <div className={`flex-1 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} rounded-2xl border overflow-hidden relative shadow-inner`}>
          {viewMode === 'SINGLELINE' ? (
            <LtUcRoomScadaDiagram state={state} isEditMode={isEditMode} theme={theme} onConfigClick={handleConfigClick} onBreakerClick={handleBreakerClick} />
          ) : (
            <LtUcCabinetView state={state} isEditMode={isEditMode} theme={theme} onConfigClick={handleConfigClick} />
          )}
        </div>

        {viewMode === 'SINGLELINE' && (
        <div className={`${isSidebarCollapsed ? 'w-12' : 'w-80'} flex flex-col gap-3 overflow-y-auto p-4 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-900'} border-l shadow-inner custom-scrollbar ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'} transition-all duration-300`}>
          {isSidebarCollapsed ? (
             <button onClick={() => setIsSidebarCollapsed(false)} className={`p-2 rounded-lg ${theme === 'light' ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800'}`}>
                <ChevronLeft size={20} />
             </button>
          ) : (
          <>
          <div className={`${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} border rounded-xl p-3 flex items-center justify-between shadow-lg sticky top-0 z-20`}>
             <div className="flex items-center gap-3">
               <div className={`p-2 ${theme === 'light' ? 'bg-amber-100 text-amber-600' : 'bg-slate-950 text-amber-400'} rounded-lg`}><Zap size={20} /></div>
               <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Energy Monitor</div>
                  <div className={`text-sm font-bold ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'} uppercase`}>LT-UC Distribution</div>
               </div>
             </div>
             <button onClick={() => setIsSidebarCollapsed(true)} className={`p-1 rounded-lg ${theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-800'}`}><ChevronRight size={16} /></button>
          </div>
          
          <div className="space-y-2">
            <div className="text-[10px] font-black text-slate-500 uppercase ml-1 mt-2 tracking-widest">Main Incoming</div>
            <EnergyCard id="52T1" label="Incoming T1" />
            <EnergyCard id="52T17" label="Incoming T17" />
            <EnergyCard id="52T3" label="Incoming T3" />
            <EnergyCard id="52B3" label="Bus Tie 52B3" />

            <div className="text-[10px] font-black text-slate-500 uppercase ml-1 mt-4 tracking-widest">Ring Breakers</div>
            <EnergyCard id="52S6" label="Breaker 52S6" />
            <EnergyCard id="52S7" label="Breaker 52S7" />
            <EnergyCard id="52S8" label="Breaker 52S8" />
            <EnergyCard id="52S9" label="Breaker 52S9" />

            <div className="text-[10px] font-black text-slate-550 uppercase ml-1 mt-4 tracking-widest border-b border-slate-850 pb-1">Load Feeders</div>
            {expandedCardId && !expandedCardId.startsWith('52') && (
               <div className="animate-in fade-in zoom-in-95 duration-300">
                  <EnergyCard id={expandedCardId} label={state.breakers[expandedCardId]?.name || expandedCardId} />
               </div>
            )}
            
            <div className={`${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} border rounded-xl p-3 mt-4 flex flex-col shadow-sm`}>
               <div className={`flex items-center gap-2 mb-3 border-b ${theme === 'light' ? 'border-slate-100' : 'border-slate-800'} pb-2`}>
                  <Activity size={16} className={theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'} />
                  <span className={`text-[11px] font-black ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'} uppercase tracking-tight`}>Chọn phụ tải xem năng lượng</span>
               </div>
               <div className="grid grid-cols-1 gap-1 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                  {Object.keys(state.breakers).filter(id => !id.startsWith('52')).map(id => (
                    <div 
                      key={id} 
                      onClick={() => handleBreakerClick(id)}
                      className={`flex justify-between items-center text-[10px] p-2 rounded-lg border cursor-pointer transition-colors ${
                        expandedCardId === id ? (theme === 'light' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-indigo-950/40 border-indigo-800 text-indigo-300') : (theme === 'light' ? 'bg-slate-50 border-slate-200 hover:border-indigo-300 text-slate-600' : 'bg-slate-950 border-slate-900 hover:border-indigo-900 text-slate-400')
                      }`}
                    >
                      <span className={`${expandedCardId === id ? (theme === 'light' ? 'text-indigo-700' : 'text-indigo-300') : (theme === 'light' ? 'text-slate-600' : 'text-slate-400')} font-bold`}>{id.replace(/_/g, '-')}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${state.breakers[id]?.status === 'CLOSED' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
          </>
          )}
        </div>
        )}
      </div>

      {configModal.isOpen && (
        <ElectricConfigModal deviceId={configModal.id} deviceName={configModal.name} deviceType={configModal.type} initialTags={electricConfig[configModal.id]?.tags || {}} onClose={() => setConfigModal({...configModal, isOpen: false})} onSave={handleSaveConfig} />
      )}
    </div>
  );
};
