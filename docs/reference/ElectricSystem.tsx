import React, { useState, useEffect } from 'react';
import { ElectricScadaDiagram } from './ElectricScadaDiagram';
import { ElectricConfigModal } from './ElectricConfigModal';
import { GeneratorInfoModal } from './GeneratorInfoModal';
import { ElectricState, BreakerStatus, Transformer, ElectricBreaker } from '../types';
import { Edit3, X, Zap, Activity, Sun, Moon } from 'lucide-react';
import { plcService } from '../services/plcService';
import { socketService } from '../services/socketService';

interface ElectricSystemProps {
  userRole?: string;
  isEmbedded?: boolean;
  onNavigateToLt1?: () => void;
  onNavigateToLt2?: () => void;
  onNavigateToLtUc?: () => void;
  onNavigateToFuel?: () => void;
}

export const ElectricSystem: React.FC<ElectricSystemProps> = ({ userRole, isEmbedded, onNavigateToLt1, onNavigateToLt2, onNavigateToLtUc, onNavigateToFuel }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [electricConfig, setElectricConfig] = useState<any>({});
  const [rawPlcData, setRawPlcData] = useState<any>({});
  const [kepwareData, setKepwareData] = useState<any>({});
  const [configModal, setConfigModal] = useState({ isOpen: false, id: '', name: '', type: 'BREAKER' as any });
  const [genModal, setGenModal] = useState<{isOpen: boolean, gId: string}>({ isOpen: false, gId: '' });
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
      busbars: { c41: true, c42: true },
      breakers: {},
      transformers: {},
      generators: {}
    };

    const breakerIds = ["471", "412", "443", "437", "435", "441", "431", "447", "433", "432", "434", "436", "438", "52T13", "52T7", "52T5", "52T11", "52T1", "52T17", "52T3", "52B2", "52B1", "52B3", "52S10", "52S1", "52S4", "52S9", "52S7", "52S8", "52S6", "52S5", "52S2", "52S3"];
    const transformerIds = ["T13", "T7", "T5", "T11", "T1", "T17", "T3", "T2", "T4", "T6", "T8"];
    const generatorIds = ["D1", "D2", "D3", "D4"];

    breakerIds.forEach(id => {
      const config = electricConfig[id];
      let status: BreakerStatus = 'UNKNOWN';
      
      const getVal = (key: string) => {
          const tagId = config?.tags?.[key];
          let val = plcService.getUnifiedValue(tagId, kepwareData, rawPlcData) ?? 0;
          if (typeof val === 'number') {
            const scale = Number(config?.tags?.[`scale_${key}`]);
            if (!isNaN(scale) && scale !== 0) val = val * scale;
          }
          return val;
      };

      if (config?.tags?.statusTag) {
        let sVal = plcService.getUnifiedValue(config.tags.statusTag, kepwareData, rawPlcData);
        if (config.tags.statusTagInverse) sVal = !sVal;
        status = sVal ? 'CLOSED' : 'OPEN';
        if (config.tags.tripTag && plcService.getUnifiedValue(config.tags.tripTag, kepwareData, rawPlcData)) status = 'TRIP';
      } else {
        status = id === "471" || id.startsWith("52T") ? 'CLOSED' : 'OPEN';
      }

      let localRemote: 'LOCAL' | 'REMOTE' | 'UNKNOWN' = 'UNKNOWN';
      if (config?.tags?.localRemoteTag) {
        let lrVal = plcService.getUnifiedValue(config.tags.localRemoteTag, kepwareData, rawPlcData);
        if (lrVal !== undefined && lrVal !== null) {
          if (config.tags.localRemoteTagInverse) lrVal = !lrVal;
          localRemote = lrVal ? 'REMOTE' : 'LOCAL';
        }
      }

      let earthSwitchStatus: 'CLOSED' | 'OPEN' | 'UNKNOWN' = 'UNKNOWN';
      if (config?.tags?.earthSwitchTag) {
        let esVal = plcService.getUnifiedValue(config.tags.earthSwitchTag, kepwareData, rawPlcData);
        if (esVal !== undefined && esVal !== null) {
          if (config.tags.earthSwitchTagInverse) esVal = !esVal;
          earthSwitchStatus = esVal ? 'CLOSED' : 'OPEN';
        }
      }

      state.breakers[id] = {
        id,
        name: config?.name || `MC ${id}`,
        status,
        localRemote,
        earthSwitchStatus,
        currents: [getVal('i1'), getVal('i2'), getVal('i3')],
        voltages: [getVal('v1'), getVal('v2'), getVal('v3')],
        frequency: getVal('freq'),
        powerFactor: getVal('pf'),
        powerKW: getVal('kw'),
        energyKWH: getVal('kwh')
      };
    });

    transformerIds.forEach(id => {
      const config = electricConfig[id];
      const getVal = (key: string) => {
        const tagId = config?.tags?.[key];
        let val = plcService.getUnifiedValue(tagId, kepwareData, rawPlcData);
        if (typeof val === 'number') {
          const scale = Number(config?.tags?.[`scale_${key}`]);
          if (!isNaN(scale) && scale !== 0) val = val * scale;
        }
        return val;
      };

      state.transformers[id] = {
        id,
        name: config?.name || `MBA ${id}`,
        status: 'ONLINE',
        tempW1: getVal('tempW1'),
        tempW2: getVal('tempW2'),
        tempW3: getVal('tempW3')
      };
    });

    generatorIds.forEach(id => {
      const config = electricConfig[id];
      let status: 'RUNNING' | 'STOPPED' | 'FAULT' | 'UNKNOWN' = 'UNKNOWN';
      let mode: 'AUTO' | 'MANUAL' | 'UNKNOWN' = 'UNKNOWN';

      let hasFault = false;
      if (config?.tags) {
        if (config.tags.faultTag && plcService.getUnifiedValue(config.tags.faultTag, kepwareData, rawPlcData)) {
          hasFault = true;
          status = 'FAULT'; // Fallback if not running
        } 
        
        if (config.tags.runTag && plcService.getUnifiedValue(config.tags.runTag, kepwareData, rawPlcData)) {
          status = 'RUNNING';
        } else if (config.tags.stopTag && plcService.getUnifiedValue(config.tags.stopTag, kepwareData, rawPlcData)) {
          status = 'STOPPED';
        } else if (!hasFault) {
           status = 'STOPPED';
        }

        if (config.tags.modeAutoTag && plcService.getUnifiedValue(config.tags.modeAutoTag, kepwareData, rawPlcData)) mode = 'AUTO';
        else if (config.tags.modeSemiAutoTag && plcService.getUnifiedValue(config.tags.modeSemiAutoTag, kepwareData, rawPlcData)) mode = 'SEMI-AUTO';
        else if (config.tags.modeStopTag && plcService.getUnifiedValue(config.tags.modeStopTag, kepwareData, rawPlcData)) mode = 'STOP MODE';
        else if (config.tags.modeManualTag && plcService.getUnifiedValue(config.tags.modeManualTag, kepwareData, rawPlcData)) mode = 'MANUAL';
        else if (config.tags.autoTag) {
          const autoVal = plcService.getUnifiedValue(config.tags.autoTag, kepwareData, rawPlcData);
          if (autoVal !== undefined && autoVal !== null) {
            mode = autoVal ? 'AUTO' : 'MANUAL';
          }
        }
      } else {
        status = 'STOPPED';
      }

      // Compute detailed state from HR 40206
      let detailedState = 'UNKNOWN';
      const tag40206Id = `${id}.40206`;
      const val1 = kepwareData[tag40206Id];
      const val2 = kepwareData[`Channel1.Device1.${tag40206Id}`];
      let raw = val1 !== undefined ? val1 : (val2 !== undefined ? val2 : undefined);
      
      if (raw !== undefined && raw !== 'N/A') {
        const num = Number(raw);
        switch (num) {
          case 0: detailedState = 'INIT'; break;
          case 1: detailedState = 'PRE CRANK'; break;
          case 2: detailedState = 'STARTING'; break;
          case 3: detailedState = 'RUNNING'; break;
          case 4: detailedState = 'PRE COOLDOWN'; break;
          case 5: detailedState = 'COOLDOWN'; break;
          case 6: detailedState = 'STOPPING'; break;
          case 7: detailedState = 'STOPPED'; break;
          case 8: detailedState = 'IDLING'; break;
          case 9: detailedState = 'WAITING'; break;
          case 10: detailedState = 'WARMING UP'; break;
          default: detailedState = `STATE ${num}`; break;
        }
      }

      state.generators[id] = {
        id,
        name: config?.name || `Máy phát ${id}`,
        status,
        hasFault,
        detailedState,
        mode
      };
    });

    return state;
  };

  const handleConfigClick = (id: string, name: string, type: 'BREAKER' | 'TRANSFORMER' | 'GENERATOR') => {
    setConfigModal({ isOpen: true, id, name, type });
  };

  const handleGeneratorClick = (gId: string) => {
    setGenModal({ isOpen: true, gId });
  };

  const handleSaveConfig = async () => {
    const config = await plcService.getElectricConfig();
    setElectricConfig(config);
  };

  const state = getElectricState();

  if (isEmbedded) {
    return (
      <div className={`w-full h-full ${theme === 'light' ? 'bg-slate-50' : 'bg-[#050b14]'} overflow-hidden relative`}>
        <ElectricScadaDiagram state={state} isEditMode={false} theme={theme} onConfigClick={() => {}} onGeneratorClick={handleGeneratorClick} />
        <GeneratorInfoModal 
          isOpen={genModal.isOpen} 
          gId={genModal.gId} 
          onClose={() => setGenModal({ ...genModal, isOpen: false })} 
          electricConfig={electricConfig}
          rawPlcData={rawPlcData}
          kepwareData={kepwareData}
        />
      </div>
    );
  }

  const HeaderEnergyCard = ({ id, title, colorClass }: { id: string, title: string, colorClass: string }) => {
    const b = state.breakers[id];
    if (!b) return null;

    return (
      <div className={`flex items-center gap-2 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'} p-1 px-1 rounded-xl border shadow-lg w-[800px]`}>
        <div className={`p-2 rounded-full ${colorClass === 'red' ? (theme === 'light' ? 'bg-red-100 text-red-600' : 'bg-red-950/40 text-red-400') : (theme === 'light' ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-950/40 text-emerald-400')}`}>
          <Zap size={24} />
        </div>
        <div className="flex-1 grid grid-cols-[1.15fr_0.85fr] gap-x-6 gap-y-0 p-1">
          <div className={`col-span-4 flex justify-between items-center border-b ${theme === 'light' ? 'border-slate-100' : 'border-slate-800'} pb-1 mb-1`}>
            <span className={`text-sm font-black ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>{title}</span>
            <span className={`text-xs font-bold px-3 py-0.5 rounded border ${b.status === 'CLOSED' ? (theme === 'light' ? 'bg-red-100 text-red-600 border-red-200' : 'bg-red-950/40 text-red-400 border-red-900/50') : (theme === 'light' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50')}`}>
              {b.status}
            </span>
          </div>
          <div className="flex flex-col">
            <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'} uppercase whitespace-nowrap`}>Dòng điện (A)</span>
            <span className={`text-base font-black ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'} font-mono whitespace-nowrap`}>
              {b.currents?.[0]?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} / {b.currents?.[1]?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} / {b.currents?.[2]?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
          </div>
	  <div className="flex flex-col">
            <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'} uppercase whitespace-nowrap`}>Điện áp (kV)</span>
            <span className={`text-base font-black ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'} font-mono whitespace-nowrap`}>
              {((b.voltages?.[0] || 0) / 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {((b.voltages?.[1] || 0) / 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {((b.voltages?.[2] || 0) / 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'} uppercase whitespace-nowrap`}>Công suất (kW)</span>
            <span className={`text-base font-black ${theme === 'light' ? 'text-cyan-600' : 'text-cyan-400'} font-mono whitespace-nowrap`}>{b.powerKW?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'} uppercase whitespace-nowrap`}>Điện năng (kWh)</span>
            <span className={`text-base font-black ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'} font-mono whitespace-nowrap`}>{b.energyKWH?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full gap-4 animate-in fade-in duration-500 ${theme === 'light' ? 'bg-slate-100' : 'bg-slate-950'}`}>
      <div className={`system-header flex justify-between items-center px-6 py-3 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/40 border-slate-800'} border-b`}>
        <div className="flex gap-6 items-center">
          <HeaderEnergyCard id="471" title="MÁY CẮT 471" colorClass="red" />
          <div className={`w-px h-12 ${theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'}`}></div>
          <HeaderEnergyCard id="412" title="MÁY CẮT 412" colorClass="emerald" />
        </div>

        <div className="flex items-center gap-2">
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
              className={`flex items-center justify-center p-2 rounded-xl transition-all shadow-lg ${
                isEditMode ? 'bg-amber-500 text-white animate-pulse' : (theme === 'light' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-200 hover:bg-slate-700')
              }`}
              title={isEditMode ? 'Thoát cấu hình' : 'Cấu hình tag Trung thế'}
            >
              {isEditMode ? <X size={20}/> : <Edit3 size={20}/>}
            </button>
          )}
        </div>
      </div>

      <div className={`flex-3 ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-inner'} rounded-3xl border overflow-hidden relative mx-2 mb-2`}>
        <ElectricScadaDiagram 
          state={state} 
          isEditMode={isEditMode} 
          theme={theme}
          onConfigClick={handleConfigClick} 
          onGeneratorClick={handleGeneratorClick}
          onNavigateToLt1={onNavigateToLt1} 
          onNavigateToLt2={onNavigateToLt2}
          onNavigateToLtUc={onNavigateToLtUc}
          onNavigateToFuel={onNavigateToFuel}
        />
      </div>

      {configModal.isOpen && (
        <ElectricConfigModal deviceId={configModal.id} deviceName={configModal.name} deviceType={configModal.type} initialTags={electricConfig[configModal.id]?.tags || {}} onClose={() => setConfigModal({...configModal, isOpen: false})} onSave={handleSaveConfig} />
      )}
      
      <GeneratorInfoModal 
        isOpen={genModal.isOpen} 
        gId={genModal.gId} 
        onClose={() => setGenModal({ ...genModal, isOpen: false })}
        electricConfig={electricConfig}
        rawPlcData={rawPlcData}
        kepwareData={kepwareData}
      />
    </div>
  );
};
