import React, { useState, useEffect } from 'react';
import { Lt1RoomScadaDiagram } from './Lt1RoomScadaDiagram';
import { Lt1CabinetView } from './Lt1CabinetView';
import { ElectricConfigModal } from './ElectricConfigModal';
import { ElectricState, BreakerStatus } from '../types';
import { Edit3, X, Zap, Activity, ArrowLeft, ChevronDown, ChevronUp, Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import { plcService } from '../services/plcService';
import { socketService } from '../services/socketService';

interface Lt1SystemProps {
  userRole?: string;
  isEmbedded?: boolean;
  onBack?: () => void;
}

export const Lt1System: React.FC<Lt1SystemProps> = ({ userRole, isEmbedded, onBack }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [electricConfig, setElectricConfig] = useState<any>({});
  const [rawPlcData, setRawPlcData] = useState<any>({});
  const [kepwareData, setKepwareData] = useState<any>({});
  const [configModal, setConfigModal] = useState({ isOpen: false, id: '', name: '', type: 'BREAKER' as any });
  const [viewMode, setViewMode] = useState<'SINGLELINE' | 'CABINET'>('SINGLELINE');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
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
      transformers: {}
    };

    const breakerIds = [
      "52T11", "52S3", "52S1", "52S4", "QM1", "QM2",
      "52T5", "52B1",
      "AHF_PTB01","MCB_LC1", "MCB_LC3", "MCB_UPS_EQPT", "MCB_ATS_PTB04", "MCB_LIFT01", "MCB_LIFT02", "MCB_ME01", "MCB_PLB01", "MCB_GH01", "MCB_DG01", "MCB_LIFT05", "MCB_LIFT11",
      "MCB_LC2", "MCB_LC4", "MCB_BHS01", "MCB_BHS02", "MCB_BHS03", "MCB_BHS04", "MCB_LIFT03", "MCB_LIFT04", "MCB_BHS_CTII", "MCB_GH02", "MCB_MDB01", "MCB_SERVICE_LIFT1",
      "MCB_BIN01","AHF_PTB02","MCB_PLB02", "MCB_GND_ME01","QTX1C_LT1","QTX2C_LT1","OG1","NHA_KINH","AUTOGRILL_2ND_2AB","SPARE",
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

    return state;
  };

  const handleConfigClick = (id: string, name: string, type: 'BREAKER' | 'TRANSFORMER') => {
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
          <Lt1RoomScadaDiagram state={state} isEditMode={false} theme={theme} onConfigClick={() => {}} />
        ) : (
          <Lt1CabinetView state={state} isEditMode={false} theme={theme} onConfigClick={() => {}} />
        )}
      </div>
    );
  }

  const EnergyCard = ({ id, label }: { id: string, label: string }) => {
    const b = state.breakers[id];
    if (!b) return null;
    const isExpanded = expandedCardId === id;
    const maxLoad = id.startsWith('52') ? 4000 : 800; // Ước tính tải tối đa
    const getPct = (val: number) => Math.min(100, Math.max(0, (val / maxLoad) * 100));

    return (
      <div 
        className={`backdrop-blur-md border transition-all duration-300 rounded-xl overflow-hidden shadow-xl cursor-pointer ${
          isExpanded ? (theme === 'light' ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-200' : 'bg-indigo-950/40 ring-2 ring-indigo-500/50 border-indigo-500/50') : (theme === 'light' ? 'bg-white hover:bg-slate-50 border-slate-200' : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-700/50 hover:border-slate-600/50')
        }`}
        onClick={() => setExpandedCardId(isExpanded ? null : id)}
      >
        <div className={`p-3 flex justify-between items-center ${isExpanded ? (theme === 'light' ? 'bg-indigo-100/50' : 'bg-gradient-to-r from-indigo-900/40 to-transparent') : ''}`}>
          <div className="flex flex-col">
            <span className={`text-[13px] font-black ${theme === 'light' ? 'text-slate-700' : 'text-slate-100'} uppercase tracking-tight`}>{label}</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 w-fit mt-1.5 border shadow-sm ${
              b.status === 'CLOSED' ? (theme === 'light' ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-rose-900/20') : 
              b.status === 'OPEN' ? (theme === 'light' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-900/20') : 
              b.status === 'TRIP' ? (theme === 'light' ? 'bg-amber-100 text-amber-600 border-amber-200 animate-pulse' : 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-amber-900/20 animate-pulse') :
              (theme === 'light' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-800/50 text-slate-400 border-slate-700')
            }`}>
              {b.status === 'CLOSED' && <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></div>}
              {b.status === 'OPEN' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>}
              {b.status}
            </span>
          </div>
          {isExpanded ? <ChevronUp size={18} className="text-indigo-400 drop-shadow-md" /> : <ChevronDown size={18} className="text-slate-500" />}
        </div>

        <div className="px-3 pb-3 space-y-3">
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { label: 'IA', val: b.currents?.[0] || 0, color: 'text-amber-400', bg: 'bg-amber-400' },
              { label: 'IB', val: b.currents?.[1] || 0, color: 'text-emerald-400', bg: 'bg-emerald-400' },
              { label: 'IC', val: b.currents?.[2] || 0, color: 'text-rose-400', bg: 'bg-rose-400' }
            ].map((c, idx) => (
              <div key={idx} className={`${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950/50'} rounded-lg p-2 flex flex-col justify-center border ${theme === 'light' ? 'border-slate-200' : 'border-slate-800/50'} shadow-inner`}>
                <div className="flex justify-between items-end mb-1">
                  <span className={`text-[10px] font-black ${theme === 'light' ? c.color.replace('400', '600') : c.color}`}>{c.label}</span>
                  <span className={`text-xs font-black ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'} font-mono`}>{c.val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}<span className="text-[9px] text-slate-500 ml-0.5">A</span></span>
                </div>
                <div className={`w-full ${theme === 'light' ? 'bg-slate-200' : 'bg-slate-900'} rounded-full h-1 overflow-hidden`}>
                  <div className={`${theme === 'light' ? c.bg.replace('400', '500') : c.bg} h-full rounded-full transition-all duration-700 ease-out`} style={{ width: `${getPct(c.val)}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          {isExpanded && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-3 pt-3 border-t border-slate-700/50">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'V-AB', val: b.voltages?.[0] || 0, color: theme === 'light' ? 'text-amber-600' : 'text-amber-400' },
                  { label: 'V-BC', val: b.voltages?.[1] || 0, color: theme === 'light' ? 'text-emerald-600' : 'text-emerald-400' },
                  { label: 'V-CA', val: b.voltages?.[2] || 0, color: theme === 'light' ? 'text-rose-600' : 'text-rose-400' }
                ].map((v, idx) => (
                  <div key={idx} className={`flex flex-col items-center ${theme === 'light' ? 'bg-white' : 'bg-slate-950/30'} rounded py-1 border ${theme === 'light' ? 'border-slate-200' : 'border-slate-800/30'}`}>
                    <span className="text-[9px] font-bold text-slate-500">{v.label}</span>
                    <span className={`text-[13px] font-black ${v.color} font-mono mt-0.5`}>{v.val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                ))}
              </div>

              <div className={`${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-gradient-to-br from-slate-900/80 to-slate-950/80 border-slate-700/50'} rounded-xl p-3 grid grid-cols-2 gap-4 border shadow-inner relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 blur-xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="flex flex-col relative z-10">
                  <span className={`text-[10px] font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-wider`}>Công suất</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={`text-xl font-black ${theme === 'light' ? 'text-cyan-600' : 'text-cyan-400'} font-mono leading-none drop-shadow-md`}>{b.powerKW?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) || '0.0'}</span>
                    <span className="text-[10px] font-bold text-cyan-600">kW</span>
                  </div>
                </div>
                <div className="flex flex-col items-end relative z-10">
                  <span className={`text-[10px] font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-wider`}>Điện năng</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={`text-xl font-black ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'} font-mono leading-none drop-shadow-md`}>{b.energyKWH?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}</span>
                    <span className="text-[10px] font-bold text-indigo-600">kWh</span>
                  </div>
                </div>
              </div>

              <div className={`flex justify-between items-center px-2 py-1 ${theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/30 border-slate-800/30'} rounded-lg border`}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500">PF:</span>
                  <span className={`text-xs font-black ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'} font-mono`}>{b.powerFactor?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                </div>
                <div className={`w-px h-3 ${theme === 'light' ? 'bg-slate-300' : 'bg-slate-700'}`}></div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500">FREQ:</span>
                  <span className={`text-xs font-black ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'} font-mono`}>{b.frequency?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) || '00.0'} Hz</span>
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
            <h2 className={`text-xl font-black ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'} tracking-tight`}>GIÁM SÁT HẠ THẾ LT1 - ROOM</h2>
          </div>
        </div>

        <div className="flex gap-2">
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
          <div className={`flex bg-slate-800/80 p-1 rounded-lg border border-slate-700 ml-2 ${theme === 'light' ? 'bg-slate-100 border-slate-200' : ''}`}>
             <button 
                onClick={() => handleViewModeChange('SINGLELINE')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'SINGLELINE' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
             >
                SINGLE LINE
             </button>
             <button 
                onClick={() => handleViewModeChange('CABINET')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'CABINET' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
             >
                CABINET VIEW
             </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-3 px-3 pb-4 overflow-hidden mt-3">
        {/* Main SCADA View */}
        <div className={`flex-1 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} rounded-2xl border overflow-hidden relative shadow-inner`}>
          {viewMode === 'SINGLELINE' ? (
            <Lt1RoomScadaDiagram state={state} isEditMode={isEditMode} theme={theme} onConfigClick={handleConfigClick} />
          ) : (
            <Lt1CabinetView state={state} isEditMode={isEditMode} theme={theme} onConfigClick={handleConfigClick} />
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
                   <div className={`text-sm font-bold ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'} truncate`}>LT1 Main Feeders</div>
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
            <EnergyCard id="52T11" label="Incoming T11" />
            <EnergyCard id="52T5" label="Incoming T5" />
            <EnergyCard id="52B1" label="Bus Tie 52B1" />
            
            <div className="pt-2 border-t border-slate-800">
               <div className="text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">Ring Breakers</div>
               <div className="space-y-2">
                  <EnergyCard id="52S1" label="Breaker 52S1" />
                  <EnergyCard id="52S3" label="Breaker 52S3" />
                  <EnergyCard id="52S4" label="Breaker 52S4" />
               </div>
            </div>
          </div>
          
          <div className={`${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-700/50'} backdrop-blur-md border rounded-xl p-4 flex-1 shadow-xl`}>
             <div className={`flex items-center gap-2 mb-4 border-b ${theme === 'light' ? 'border-slate-100' : 'border-slate-700/50'} pb-2`}>
                <Activity size={16} className={theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'} />
                <span className={`text-xs font-black ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'} uppercase tracking-widest`}>System Status</span>
             </div>
             <div className="space-y-3">
                {[
                  { label: 'Active Closed', count: Object.values(state.breakers).filter(b => b.status === 'CLOSED').length, color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30' },
                  { label: 'Standby Open', count: Object.values(state.breakers).filter(b => b.status === 'OPEN').length, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
                  { label: 'Tripped Units', count: Object.values(state.breakers).filter(b => b.status === 'TRIP').length, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30', pulse: true as boolean }
                ].map((s, idx) => (
                  <div key={idx} className={`flex justify-between items-center p-2 rounded-lg border shadow-sm ${theme === 'light' ? s.bg.replace('20', '10') : s.bg} ${theme === 'light' ? s.border.replace('30', '20') : s.border}`}>
                     <span className={`text-[11px] font-bold ${theme === 'light' ? s.color.replace('400', '600') : s.color} uppercase tracking-wider flex items-center gap-2`}>
                        {s.pulse && s.count > 0 && <span className={`w-1.5 h-1.5 rounded-full ${theme === 'light' ? 'bg-amber-500' : 'bg-amber-400'} animate-ping`}></span>}
                        {s.label}
                     </span>
                     <span className={`font-black text-lg font-mono ${theme === 'light' ? s.color.replace('400', '600') : s.color} drop-shadow`}>{s.count}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
        ) : (
          <div className="flex flex-col items-center gap-4 transition-all duration-300">
             <button 
               onClick={() => setIsSidebarCollapsed(false)}
               className={`p-2 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50' : 'bg-slate-900 border-slate-800 text-indigo-400 hover:bg-slate-800'} shadow-md transition-all h-full`}
               title="Mở rộng thanh trạng thái năng lượng"
             >
               <ChevronLeft size={20} />
             </button>
          </div>
        )}
      </div>

      {configModal.isOpen && (
        <ElectricConfigModal deviceId={configModal.id} deviceName={configModal.name} deviceType={configModal.type} initialTags={electricConfig[configModal.id]?.tags || {}} onClose={() => setConfigModal({...configModal, isOpen: false})} onSave={handleSaveConfig} />
      )}
    </div>
  );
};
