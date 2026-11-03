import { useEffect, useRef, useState } from 'react';
import { Activity, AlertTriangle, ArrowRight, BookOpen, Check, ChevronRight, CircleHelp, Clock3, Download, Gauge, LayoutDashboard, Play, Radio, RotateCcw, ShieldCheck, SlidersHorizontal, Unplug, X, Zap } from 'lucide-react';
import { Diagram } from './Diagram';
import type { Scenario, Telemetry } from './types';

async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, body === undefined ? undefined : {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(typeof error.detail === 'string' ? error.detail : `Yêu cầu thất bại (${response.status})`);
  }
  return response.json();
}
const clock = (seconds: number) => `${String(Math.floor(seconds/60)).padStart(2, '0')}:${String(seconds%60).padStart(2, '0')}`;

export function App() {
  const [data, setData] = useState<Telemetry | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenario, setScenario] = useState('free');
  const [view, setView] = useState<'scada'|'training'|'guide'>('scada');
  const [connection, setConnection] = useState<'connecting'|'online'|'offline'>('connecting');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selection, setSelection] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'open'|'close'|null>(null);
  const [load, setLoad] = useState(100);
  const initial = useRef(false);

  async function start(id: string) {
    setBusy(true); setError('');
    try {
      const result = await api<Telemetry>('/sessions', {scenario: id});
      setData(result); setScenario(id); setLoad(result.load_factor*100);
      setSelection(null); setView('scada');
      sessionStorage.setItem('powerlab_session', result.session_id);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    if (initial.current) return;
    initial.current = true;
    api<Scenario[]>('/scenarios').then(setScenarios).catch(e => setError(e.message));
    const saved = sessionStorage.getItem('powerlab_session');
    if (saved) {
      api<Telemetry>(`/sessions/${saved}`).then(result => {
        setData(result); setScenario(result.scenario); setLoad(result.load_factor*100);
      }).catch(() => { sessionStorage.removeItem('powerlab_session'); void start('free'); });
    } else void start('free');
  }, []);

  const sid = data?.session_id;
  useEffect(() => {
    if (!sid) return;
    let socket: WebSocket;
    let timer: ReturnType<typeof setTimeout>;
    let disposed = false;
    function connect() {
      setConnection('connecting');
      socket = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws/${sid}`);
      socket.onopen = () => setConnection('online');
      socket.onmessage = event => {
        const next = JSON.parse(event.data) as Telemetry;
        setData(current => current?.session_id === next.session_id && current.revision <= next.revision ? next : current);
      };
      socket.onerror = () => socket.close();
      socket.onclose = event => {
        if (disposed) return;
        setConnection('offline');
        if (event.code === 1008) setError('Phiên đã hết hiệu lực. Hãy bắt đầu phiên mới.');
        else timer = setTimeout(connect, 3000);
      };
    }
    connect();
    return () => { disposed = true; clearTimeout(timer); socket?.close(); };
  }, [sid]);

  async function command(action: string, target = selection, value?: number) {
    if (!data || busy) return;
    setBusy(true); setError('');
    try {
      const next = await api<Telemetry>(`/sessions/${data.session_id}/commands`, {action, target: target ?? 'LT1', value, revision: data.revision});
      setData(next);
      if (action === 'set_load') setLoad(next.load_factor*100);
      setConfirm(null);
    } catch (e) {
      setError((e as Error).message);
      try { setData(await api<Telemetry>(`/sessions/${data.session_id}`)); } catch { /* retain last telemetry */ }
    } finally { setBusy(false); }
  }

  async function downloadReport() {
    if (!data) return;
    try {
      const report = await api(`/sessions/${data.session_id}/report`);
      const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], {type: 'application/json'}));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `powerlab-${data.session_id}.json`; anchor.click(); URL.revokeObjectURL(url);
    } catch (e) { setError((e as Error).message); }
  }

  const feeder = data?.feeders.find(f => f.id === selection);
  const locked = busy || connection !== 'online';
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#" onClick={e => {e.preventDefault(); setView('scada');}}><span className="brand-mark"><Zap size={24} fill="currentColor"/></span><span>Power<span className="brand-light">Lab</span><small>ĐÀO TẠO VẬN HÀNH ĐIỆN</small></span></a>
      <div className="workspace-label">KHÔNG GIAN LÀM VIỆC</div>
      <nav aria-label="Điều hướng chính">
        <button className={view === 'scada' ? 'active' : ''} onClick={() => setView('scada')}><LayoutDashboard size={18}/>Trạm mô phỏng<span className="nav-dot"/></button>
        <button className={view === 'training' ? 'active' : ''} onClick={() => setView('training')}><BookOpen size={18}/>Bài tập & kịch bản</button>
        <button className={view === 'guide' ? 'active' : ''} onClick={() => setView('guide')}><CircleHelp size={18}/>Hướng dẫn thực hành</button>
      </nav>
      <div className="sidebar-card"><ShieldCheck size={25}/><strong>Học bằng thực hành</strong><p>Quan sát hệ thống, ra quyết định và đánh giá từng thao tác.</p><span>MÔI TRƯỜNG MÔ PHỎNG</span></div>
      <div className="sidebar-bottom"><div className="avatar">HV</div><div><strong>Học viên thực hành</strong><small>Phiên demo · Không đăng nhập</small></div></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div>Không gian đào tạo <ChevronRight size={14}/><strong>{view === 'scada' ? 'Trạm mô phỏng' : view === 'training' ? 'Bài tập & kịch bản' : 'Hướng dẫn'}</strong></div><span className={`connection ${connection}`}><i/>{connection === 'online' ? 'Telemetry trực tuyến' : connection === 'connecting' ? 'Đang kết nối…' : 'Mất kết nối'}</span></header>
      <main>
        <div className="page-heading"><div><div className="eyebrow"><span/>POWER SYSTEM SIMULATOR</div><h1>{view === 'scada' ? 'Trung tâm vận hành' : view === 'training' ? 'Thực hành xử lý sự cố' : 'Bắt đầu với PowerLab'}</h1><p>Mô phỏng hệ thống điện. Rèn luyện kỹ năng. Chủ động trước sự cố.</p></div><button className="secondary" onClick={() => void downloadReport()} disabled={!data}><Download size={16}/>Xuất báo cáo</button></div>
        {error && <div role="alert" className="error-banner"><AlertTriangle size={18}/><span>{error}</span><button aria-label="Đóng thông báo" onClick={() => setError('')}><X size={16}/></button></div>}
        {view === 'training' && <div className="scenario-grid">{scenarios.map((item, index) => <article className="scenario-card" key={item.id}><span className="scenario-number">BÀI THỰC HÀNH 0{index+1}</span><div className="scenario-icon">{index === 0 ? <SlidersHorizontal/> : index === 1 ? <Unplug/> : <Gauge/>}</div><h2>{item.name}</h2><p>{item.description}</p><div className="scenario-meta"><Clock3 size={14}/>Tự điều chỉnh thời gian<span>3 lộ phụ tải</span></div><button className="primary" disabled={busy} onClick={() => void start(item.id)}>Bắt đầu thực hành<ArrowRight size={16}/></button></article>)}</div>}
        {view === 'guide' && <section className="panel guide"><h2>Quy trình thực hành</h2><ol><li>Chọn bài tập trong mục Bài tập & kịch bản. Mỗi bài tập tạo một phiên độc lập.</li><li>Quan sát điện áp, công suất, mức mang tải và cảnh báo trên sơ đồ.</li><li>Nhấn vào lộ để chọn máy cắt, kiểm tra trạng thái rồi xác nhận đóng hoặc cắt.</li><li>Với sự cố LT1: máy cắt đã TRIP. Kiểm tra và xác nhận đã xử lý sự cố, sau đó đóng lại. Đóng khi còn sự cố sẽ bị liên động từ chối.</li><li>Với quá tải: điều chỉnh hệ số phụ tải; chỉ hoàn thành khi toàn bộ phụ tải có điện và các giới hạn trở về bình thường.</li><li>Xuất báo cáo JSON để xem thời gian hoàn thành, lệnh sai và nhật ký thao tác.</li></ol><div className="guide-note">Mô hình trào lưu AC cân bằng, trạng thái xác lập. Các thông số là dữ liệu mẫu. Chưa mô phỏng dòng ngắn mạch, quá trình quá độ, hòa đồng bộ hoặc phối hợp bảo vệ. Không kết nối PLC hay thiết bị thực.</div><button className="primary" onClick={() => setView('training')}>Chọn bài thực hành<ArrowRight size={16}/></button></section>}
        {view === 'scada' && <>
          <div className="session-toolbar"><div><span className="tag">PHIÊN THỰC HÀNH</span><select aria-label="Chọn kịch bản" value={scenario} onChange={e => setScenario(e.target.value)}>{scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div><span className="timer"><Clock3 size={15}/>{clock(data?.elapsed_seconds ?? 0)}</span><button className="primary compact" disabled={busy} onClick={() => void start(scenario)}><RotateCcw size={14}/>Phiên mới</button></div></div>
          {data ? <>
            <div className="metrics">
              <Metric label="CÔNG SUẤT TÁC DỤNG" value={data.p_mw.toFixed(2)} unit="MW" detail={`Q = ${data.q_mvar.toFixed(2)} MVAr`} icon={<Zap size={18}/>}/>
              <Metric label="ĐIỆN ÁP THANH CÁI" value={data.bus_vm_pu.toFixed(3)} unit="p.u." detail="Điện áp danh định 0.4 kV" icon={<Activity size={18}/>}/>
              <Metric label="MANG TẢI MBA T1" value={data.transformer_loading_percent.toFixed(1)} unit="%" detail="Công suất định mức 4 MVA" warn={data.transformer_loading_percent > 100} icon={<Gauge size={18}/>}/>
              <Metric label="PHỤ TẢI ĐƯỢC CẤP" value={data.served_percent.toFixed(0)} unit="%" detail={`${data.feeders.filter(f => f.energized).length}/3 lộ đang có điện`} icon={<ShieldCheck size={18}/>}/>
            </div>
            <div className="work-grid">
              <section className="panel diagram-panel"><div className="panel-heading"><div><Radio size={17}/><h2>Sơ đồ đơn tuyến</h2><span className="mini-tag">LƯỚI MẪU</span></div><span className={`status-pill ${data.status === 'normal' ? 'good' : 'danger'}`}><i/>{data.status === 'normal' ? 'Vận hành bình thường' : data.status === 'collapse' ? 'Không hội tụ' : `${data.alarms.length} cảnh báo`}</span></div><div className="diagram"><Diagram data={data} onSelect={id => {setSelection(id); setConfirm(null);}}/></div><div className="diagram-legend"><span><i className="live"/>Có điện</span><span><i className="fault"/>Sự cố / vi phạm</span><span><i className="offline"/>Mất điện</span><small>AC load flow · Newton–Raphson · 2 giây</small></div></section>
              <aside className="right-panels"><section className="panel exercise-panel"><div className="panel-heading"><div><BookOpen size={17}/><h2>Mục tiêu bài tập</h2></div></div><div className="exercise-body"><span className="mini-label">ĐANG THỰC HÀNH</span><h3>{scenarios.find(s => s.id === data.scenario)?.name}</h3><p>{scenarios.find(s => s.id === data.scenario)?.description}</p><div className="objective"><span className={data.served_percent === 100 ? 'checked' : ''}><Check size={12}/></span>Cấp điện toàn bộ phụ tải</div><div className="objective"><span className={data.status === 'normal' ? 'checked' : ''}><Check size={12}/></span>Đưa thông số về giới hạn</div><div className="score-row"><div><strong>{data.score}<small>/100</small></strong><span>Điểm minh họa</span></div><div><strong>{data.actions}</strong><span>Thao tác hợp lệ</span></div></div>{data.completed_seconds !== null && <div role="status" className="completed"><ShieldCheck size={18}/>Hoàn thành sau {data.completed_seconds.toFixed(1)} giây</div>}</div></section>
                <section className="panel load-panel"><div className="panel-heading"><div><SlidersHorizontal size={17}/><h2>Điều chỉnh phụ tải</h2></div></div><div className="load-body"><div><span>Hệ số tải toàn trạm</span><strong>{load.toFixed(0)}%</strong></div><input aria-label="Hệ số phụ tải" type="range" min="20" max="180" step="5" value={load} onChange={e => setLoad(Number(e.target.value))}/><div className="range-label"><span>20%</span><span>Đang áp dụng: {(data.load_factor*100).toFixed(0)}%</span><span>180%</span></div><button className="secondary full" disabled={locked || load === data.load_factor*100} onClick={() => void command('set_load', null, load/100)}>Áp dụng phụ tải<ArrowRight size={14}/></button></div></section>
              </aside>
            </div>
            <div className="bottom-grid"><section className="panel alarm-panel"><div className="panel-heading"><div><AlertTriangle size={17}/><h2>Cảnh báo hiện tại</h2><span className="count">{data.alarms.length}</span></div></div><div className="alarm-list">{data.alarms.length ? data.alarms.map(alarm => <div className="alarm-row" key={alarm}><AlertTriangle size={16}/><span>{alarm}</span><span className="alarm-badge">ACTIVE</span></div>) : <div className="empty-state"><ShieldCheck size={23}/><strong>Hệ thống trong giới hạn cho phép</strong><span>Không có cảnh báo đang hoạt động</span></div>}</div></section><section className="panel event-panel"><div className="panel-heading"><div><Clock3 size={17}/><h2>Nhật ký thao tác</h2></div><span className="muted">{data.mistakes} lệnh bị từ chối</span></div><div className="event-list">{data.logs.map(log => <div className={`event-row ${log.level}`} key={log.id}><time>{new Date(log.timestamp.endsWith('Z') || /[+-]\d\d:\d\d$/.test(log.timestamp) ? log.timestamp : `${log.timestamp}Z`).toLocaleTimeString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}</time><i/><span>{log.message}</span></div>)}</div></section></div>
          </> : <div className="panel loading"><Activity/> {busy ? 'Đang khởi tạo mô phỏng…' : 'Chưa có phiên mô phỏng. Chọn Phiên mới để thử lại.'}</div>}
        </>}
        <footer><span><ShieldCheck size={13}/>Chỉ phục vụ mô phỏng và đào tạo</span><span>PowerLab v0.1 · pandapower / FastAPI</span></footer>
      </main>
    </div>
    {feeder && <div className="modal-overlay" onClick={() => {if (!busy) setSelection(null);}}><section className="control-modal" role="dialog" aria-modal="true" aria-labelledby="control-title" onClick={e => e.stopPropagation()}><div className="modal-title"><div className="modal-icon"><Zap/></div><button aria-label="Đóng bảng điều khiển" disabled={busy} onClick={() => setSelection(null)}><X size={20}/></button></div><span className="mini-label">ĐIỀU KHIỂN MÁY CẮT · MÔ PHỎNG</span><h2 id="control-title">{feeder.name}</h2><p>Trạng thái: <strong>{feeder.fault ? 'TRIP · Còn sự cố' : feeder.closed ? 'ĐÓNG' : 'CẮT'}</strong></p><div className="modal-readings"><div><small>Điện áp</small><strong>{feeder.vm_pu.toFixed(3)} p.u.</strong></div><div><small>Dòng điện</small><strong>{feeder.i_ka.toFixed(3)} kA</strong></div><div><small>Mang tải</small><strong>{feeder.loading_percent.toFixed(1)}%</strong></div></div>{error && <p role="alert" className="modal-error">{error}</p>}{confirm ? <div className="confirmation"><p>Xác nhận <strong>{confirm === 'close' ? 'ĐÓNG' : 'CẮT'}</strong> máy cắt {feeder.id}?</p><div><button className="secondary" disabled={busy} onClick={() => setConfirm(null)}>Hủy</button><button className="primary" disabled={locked} onClick={() => void command(confirm)}>{busy ? 'Đang xử lý…' : 'Xác nhận thao tác'}</button></div></div> : <><div className="control-buttons"><button className="secondary" disabled={locked || !feeder.closed} onClick={() => setConfirm('open')}><Unplug size={16}/>Cắt máy cắt</button><button className="primary" disabled={locked || feeder.closed} onClick={() => setConfirm('close')}><Play size={16}/>Đóng máy cắt</button></div>{feeder.fault ? <button className="secondary full" disabled={locked} onClick={() => void command('clear_fault')}>Xác nhận đã kiểm tra và xử lý sự cố</button> : <button className="fault-button" disabled={locked} onClick={() => void command('fault')}>Tạo sự cố mô phỏng tại lộ {feeder.id}</button>}</>}<p className="modal-note">Lệnh được kiểm tra tại máy chủ và lưu vào nhật ký phiên.</p></section></div>}
  </div>;
}

function Metric({label, value, unit, detail, icon, warn = false}: {label: string; value: string; unit: string; detail: string; icon: React.ReactNode; warn?: boolean}) {
  return <section className={`metric ${warn ? 'warn' : ''}`}><div className="metric-label">{label}<span>{icon}</span></div><div className="metric-value">{value}<small>{unit}</small></div><div className="metric-detail"><i/>{detail}</div></section>;
}
