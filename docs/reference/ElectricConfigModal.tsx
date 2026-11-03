import React, { useState, useEffect } from 'react';
import { X, Save, Zap, Activity, Info, Thermometer, Settings } from 'lucide-react';
import { plcService } from '../services/plcService';
import { GENERATOR_GROUPS } from './utils/generatorConfig';

interface ElectricConfigModalProps {
  deviceId: string;
  deviceName: string;
  deviceType: 'BREAKER' | 'TRANSFORMER' | 'FEEDER' | 'GENERATOR' | 'AHF' | 'TANK' | 'PUMP';
  initialTags?: any;
  onClose: () => void;
  onSave: () => void;
}

export const ElectricConfigModal: React.FC<ElectricConfigModalProps> = ({
  deviceId,
  deviceName,
  deviceType,
  initialTags = {},
  onClose,
  onSave
}) => {
  const [tags, setTags] = useState(initialTags);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [kepwareTags, setKepwareTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      const [allTags, kTags] = await Promise.all([
        plcService.getTags(),
        plcService.getKepwareTags()
      ]);
      setAvailableTags(allTags);
      setKepwareTags(kTags);
    };
    fetchTags();
  }, []);

  const unifiedTags = Array.from(new Set([...availableTags, ...kepwareTags]));

  const handleSave = async () => {
    setLoading(true);
    try {
      await plcService.saveElectricConfig(deviceId, deviceName, deviceType, tags);
      onSave();
      onClose();
    } catch (e) {
      alert("Lỗi khi lưu cấu hình!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-800 rounded-xl shadow-inner border border-slate-700/50">
              {deviceType === 'TRANSFORMER' ? <Thermometer className="text-orange-400" size={24} /> :
               deviceType === 'GENERATOR' ? <Activity className="text-purple-400" size={24} /> :
               deviceType === 'AHF' ? <Activity className="text-indigo-400" size={24} /> :
               deviceType === 'TANK' ? <Activity className="text-emerald-400" size={24} /> :
               deviceType === 'PUMP' ? <Settings className="text-slate-400" size={24} /> :
               <Zap className="text-blue-400" size={24} />}
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight uppercase leading-none">Cấu hình thiết bị {deviceType}</h2>
              <p className="text-slate-400 text-sm font-bold mt-1">{deviceName} ({deviceId})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
          {deviceType === 'BREAKER' ? (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                 <h4 className="text-xs font-black text-blue-600 uppercase border-b border-blue-100 pb-2">Trạng thái vận hành (PLC/Kepware)</h4>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Trạng thái Đóng/Mở</label>
                    <input 
                      type="text" 
                      list="unified-tags"
                      placeholder="Chọn hoặc nhập Tag ID" 
                      value={tags.statusTag || ''} 
                      onChange={(e) => setTags({...tags, statusTag: e.target.value})} 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:border-green-400 transition-all" 
                    />
                    <label className="flex items-center gap-2 mt-2 text-[10px] font-bold text-slate-500 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={tags.statusTagInverse || false} 
                        onChange={(e) => setTags({...tags, statusTagInverse: e.target.checked})} 
                        className="accent-green-500 w-3 h-3"
                      />
                      Đảo ngược logic (1 = Mở, 0 = Đóng)
                    </label>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-red-500 uppercase">Cảnh báo Trip</label>
                    <input 
                      type="text" 
                      list="unified-tags"
                      placeholder="Chọn hoặc nhập Tag ID" 
                      value={tags.tripTag || ''} 
                      onChange={(e) => setTags({...tags, tripTag: e.target.value})} 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:border-red-400 transition-all" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Tag Local/Remote</label>
                    <input 
                      type="text" 
                      list="unified-tags"
                      placeholder="Chọn hoặc nhập Tag ID" 
                      value={tags.localRemoteTag || ''} 
                      onChange={(e) => setTags({...tags, localRemoteTag: e.target.value})} 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:border-blue-400 transition-all" 
                    />
                    <label className="flex items-center gap-2 mt-2 text-[10px] font-bold text-slate-500 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={tags.localRemoteTagInverse || false} 
                        onChange={(e) => setTags({...tags, localRemoteTagInverse: e.target.checked})} 
                        className="accent-blue-500 w-3 h-3"
                      />
                      Đảo ngược logic (1 = Local, 0 = Remote)
                    </label>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Tag Dao Đất (Earth Switch)</label>
                    <input 
                      type="text" 
                      list="unified-tags"
                      placeholder="Chọn hoặc nhập Tag ID" 
                      value={tags.earthSwitchTag || ''} 
                      onChange={(e) => setTags({...tags, earthSwitchTag: e.target.value})} 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:border-amber-400 transition-all" 
                    />
                    <label className="flex items-center gap-2 mt-2 text-[10px] font-bold text-slate-500 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={tags.earthSwitchTagInverse || false} 
                        onChange={(e) => setTags({...tags, earthSwitchTagInverse: e.target.checked})} 
                        className="accent-amber-500 w-3 h-3"
                      />
                      Đảo ngược logic (1 = Mở, 0 = Đóng)
                    </label>
                 </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-xs font-black text-emerald-600 uppercase border-b border-emerald-100 pb-2">Thông số Năng lượng (PLC/Kepware)</h4>
                 <div className="grid grid-cols-1 gap-2">
                    {['i1', 'i2', 'i3', 'v1', 'v2', 'v3', 'freq', 'pf', 'kw', 'kwh', 'ig'].map(param => (
                       <div key={param} className="flex items-center gap-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase w-12">{param}</label>
                          <input 
                            type="text" 
                            list="unified-tags"
                            placeholder={`Tag ID cho ${param}`} 
                            value={tags[param] || ''} 
                            onChange={(e) => setTags({...tags, [param]: e.target.value})} 
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-bold text-blue-700 outline-none shadow-sm focus:border-blue-400 transition-all" 
                          />
                          <input 
                             type="number" 
                             placeholder="Hệ số (VD: 0.1)" 
                             value={tags[`scale_${param}`] || ''} 
                             onChange={(e) => setTags({...tags, [`scale_${param}`]: e.target.value})} 
                             className="w-28 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 outline-none shadow-sm focus:border-emerald-400 transition-all"
                             step="0.01"
                           />
                       </div>
                    ))}
                 </div>
              </div>
            </div>
          ) : deviceType === 'TRANSFORMER' ? (
            <div className="space-y-6">
               <h4 className="text-xs font-black text-orange-600 uppercase border-b border-orange-100 pb-2 flex items-center gap-2">
                  <Thermometer size={14}/> Giám sát Nhiệt độ Cuộn dây (PLC/Kepware)
               </h4>
               <div className="grid grid-cols-3 gap-4">
                  {['tempW1', 'tempW2', 'tempW3'].map((w, idx) => (
                     <div key={w} className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Cuộn dây {idx+1} (°C)</label>
                        <input 
                          type="text" 
                          list="unified-tags"
                          placeholder="Chọn hoặc nhập Tag ID" 
                          value={tags[w] || ''} 
                          onChange={(e) => setTags({...tags, [w]: e.target.value})} 
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-orange-400 transition-all" 
                        />
                     </div>
                  ))}
               </div>
            </div>
          ) : deviceType === 'GENERATOR' ? (
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
               <h4 className="text-xs font-black text-purple-600 uppercase border-b border-purple-100 pb-2 flex items-center gap-2">
                  <Activity size={14}/> Trạng Thái Máy Phát
               </h4>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase">Tag Chạy (Run)</label>
                     <input type="text" list="unified-tags" value={tags.runTag || ''} onChange={(e) => setTags({...tags, runTag: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-green-400 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase">Tag Dừng (Stop)</label>
                     <input type="text" list="unified-tags" value={tags.stopTag || ''} onChange={(e) => setTags({...tags, stopTag: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-slate-400 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-red-500 uppercase">Tag Báo Lỗi (Fault)</label>
                     <input type="text" list="unified-tags" value={tags.faultTag || ''} onChange={(e) => setTags({...tags, faultTag: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-red-400 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-emerald-500 uppercase">Tag Sync OK</label>
                     <input type="text" list="unified-tags" value={tags.syncOkTag || ''} onChange={(e) => setTags({...tags, syncOkTag: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-400 transition-all" />
                  </div>
               </div>

               <h4 className="text-xs font-black text-blue-600 uppercase border-b border-blue-100 pb-2 flex items-center gap-2">
                  <Activity size={14}/> Chế Độ Hoạt Động (Tags)
               </h4>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase">Tag Auto Mode</label>
                     <input type="text" list="unified-tags" value={tags.modeAutoTag || ''} onChange={(e) => setTags({...tags, modeAutoTag: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-blue-400 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase">Tag Semiauto Mode</label>
                     <input type="text" list="unified-tags" value={tags.modeSemiAutoTag || ''} onChange={(e) => setTags({...tags, modeSemiAutoTag: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-blue-400 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase">Tag Manual Mode</label>
                     <input type="text" list="unified-tags" value={tags.modeManualTag || ''} onChange={(e) => setTags({...tags, modeManualTag: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-blue-400 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase">Tag Stop Mode</label>
                     <input type="text" list="unified-tags" value={tags.modeStopTag || ''} onChange={(e) => setTags({...tags, modeStopTag: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-blue-400 transition-all" />
                  </div>
               </div>

               <h4 className="text-xs font-black text-amber-600 uppercase border-b border-amber-100 pb-2 flex items-center gap-2 mt-4">
                  <Activity size={14}/> Cấu Hình Tag Giám Sát Chi Tiết (40 Thông Số)
               </h4>
               <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
                 <div className="space-y-2">
                    <label className="text-xs font-black text-amber-700 uppercase">Base Tag (Tự động sinh tag)</label>
                    <p className="text-[10px] text-amber-600">Nhập tiếp đầu ngữ (ví dụ: Channel1.Device1.GEN1). Hệ thống sẽ tự động ghép với Holding Register để sinh ra toàn bộ 40 tag chi tiết.</p>
                    <input type="text" list="unified-tags" placeholder="VD: Channel1.Device1.GEN1" value={tags.baseTag || ''} onChange={(e) => setTags({...tags, baseTag: e.target.value})} className="w-full bg-white border-2 border-amber-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-amber-500 transition-all" />
                 </div>
               </div>

               {GENERATOR_GROUPS.map(group => (
                 <div key={group.id} className="space-y-3 mt-4">
                    <h5 className="text-[11px] font-black text-slate-600 border-b pb-1">{group.title}</h5>
                    <div className="grid grid-cols-2 gap-3">
                      {group.params.map(param => (
                        <div key={param.key} className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 flex justify-between">
                            <span>{param.label}</span>
                            {param.hr !== -1 && <span className="text-slate-400">HR {param.hr}</span>}
                          </label>
                          <input 
                            type="text" 
                            list="unified-tags"
                            placeholder={tags.baseTag && param.hr !== -1 ? `${tags.baseTag}.40${(param.hr + 1).toString().padStart(3, '0')}` : 'Chưa cấu hình (Override)'}
                            value={tags[param.key] || ''} 
                            onChange={(e) => setTags({...tags, [param.key]: e.target.value})} 
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-amber-400 transition-all placeholder-slate-300"
                          />
                        </div>
                      ))}
                    </div>
                 </div>
               ))}
               <div className="space-y-3 mt-4">
                  <h5 className="text-[11px] font-black text-slate-600 border-b pb-1">Trạng thái tự động (Automatic Start/Stop State)</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 flex justify-between">
                        <span>Trạng thái 11 bước (0-10)</span>
                        <span className="text-slate-400">HR 206</span>
                      </label>
                      <input 
                        type="text" 
                        list="unified-tags"
                        placeholder={tags.baseTag ? `${tags.baseTag}.40206` : 'Chưa cấu hình (Override)'}
                        value={tags['state_40206'] || ''} 
                        onChange={(e) => setTags({...tags, 'state_40206': e.target.value})} 
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-amber-400 transition-all placeholder-slate-300"
                      />
                    </div>
                  </div>
               </div>
            </div>
           ) : deviceType === 'AHF' ? (
            <div className="space-y-6">
               <h4 className="text-xs font-black text-cyan-600 uppercase border-b border-cyan-100 pb-2 flex items-center gap-2">
                  <Activity size={14}/> Cấu Hình Lọc Sóng Hài (AHF)
               </h4>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase">Trạng Thái (Running)</label>
                     <input type="text" list="unified-tags" value={tags.statusTag || ''} onChange={(e) => setTags({...tags, statusTag: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-cyan-400 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase">THD-I Current (%)</label>
                     <input type="text" list="unified-tags" value={tags.thdICurrentTag || ''} onChange={(e) => setTags({...tags, thdICurrentTag: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-amber-400 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase">THD-V Voltage (%)</label>
                     <input type="text" list="unified-tags" value={tags.thdVVoltageTag || ''} onChange={(e) => setTags({...tags, thdVVoltageTag: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-400 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase">Load Current (A)</label>
                     <input type="text" list="unified-tags" value={tags.loadCurrentTag || ''} onChange={(e) => setTags({...tags, loadCurrentTag: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-blue-400 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase">Compensation Current (A)</label>
                     <input type="text" list="unified-tags" value={tags.compensationCurrentTag || ''} onChange={(e) => setTags({...tags, compensationCurrentTag: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-pink-400 transition-all" />
                  </div>
               </div>
            </div>
           ) : deviceType === 'TANK' ? (
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
               <h4 className="text-xs font-black text-emerald-600 uppercase border-b border-emerald-100 pb-2 flex items-center gap-2">
                  <Activity size={14}/> Giám Sát Bồn Dầu
               </h4>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase">Tag Mức Dầu (%)</label>
                     <input type="text" list="unified-tags" value={tags.levelTag || ''} onChange={(e) => setTags({...tags, levelTag: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-400 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase">Tag Thể Tích (Lít - Tùy chọn)</label>
                     <input type="text" list="unified-tags" value={tags.volumeTag || ''} onChange={(e) => setTags({...tags, volumeTag: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-400 transition-all" />
                  </div>
               </div>
            </div>
           ) : deviceType === 'PUMP' ? (
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
               <h4 className="text-xs font-black text-slate-600 uppercase border-b border-slate-200 pb-2 flex items-center gap-2">
                  <Settings size={14}/> Trạng Thái Bơm
               </h4>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-emerald-600 uppercase">Tag Chạy (Run)</label>
                     <input type="text" list="unified-tags" value={tags.runTag || ''} onChange={(e) => setTags({...tags, runTag: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-emerald-400 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase">Tag Dừng (Stop)</label>
                     <input type="text" list="unified-tags" value={tags.stopTag || ''} onChange={(e) => setTags({...tags, stopTag: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-slate-400 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-red-500 uppercase">Tag Lỗi (Fault)</label>
                     <input type="text" list="unified-tags" value={tags.faultTag || ''} onChange={(e) => setTags({...tags, faultTag: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-red-400 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-blue-500 uppercase">Tag Auto Mode</label>
                     <input type="text" list="unified-tags" value={tags.modeAutoTag || ''} onChange={(e) => setTags({...tags, modeAutoTag: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-blue-400 transition-all" />
                  </div>
               </div>
            </div>
           ) : null}

          <datalist id="unified-tags">
            {unifiedTags.map(tag => <option key={tag} value={tag} />)}
          </datalist>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between rounded-b-2xl">
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-xs font-black text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-700 transition-all">HỦY BỎ</button>
            <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-95">
               <Save size={16}/> {loading ? 'Đang lưu...' : 'LƯU CẤU HÌNH'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
