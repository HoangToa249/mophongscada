import asyncio
import time
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from uuid import uuid4
from typing import Literal

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from .engine import Simulator
from .storage import AuditStore

SCENARIOS = [
    {"id": "free", "name": "Vận hành tự do", "description": "Thực hành đóng/cắt và theo dõi trào lưu công suất."},
    {"id": "fault_lt1", "name": "Sự cố lộ LT1", "description": "Bảo vệ cắt LT1. Kiểm tra, xác nhận xử lý và khôi phục cấp điện."},
    {"id": "overload", "name": "Quá tải máy biến áp", "description": "Phụ tải tăng 60%. Giảm tải về mức cho phép và khôi phục toàn bộ phụ tải."},
]


@dataclass
class TrainingSession:
    simulator: Simulator = field(default_factory=Simulator)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    started: float = field(default_factory=time.monotonic)
    scenario: str = "free"
    mistakes: int = 0
    actions: int = 0
    completed_at: float | None = None
    revision: int = 0
    snapshot: dict = field(default_factory=dict)


sessions: dict[str, TrainingSession] = {}
store = AuditStore()


async def refresh(session):
    result = await asyncio.to_thread(session.simulator.solve)
    if (session.scenario != "free" and session.completed_at is None
            and not result["alarms"] and result["served_percent"] == 100):
        session.completed_at = time.monotonic() - session.started
    session.snapshot = result


async def ticker():
    while True:
        for session in list(sessions.values()):
            async with session.lock:
                await refresh(session)
        await asyncio.sleep(2)


@asynccontextmanager
async def lifespan(app):
    task = asyncio.create_task(ticker())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="PowerLab · Training Simulator", lifespan=lifespan)


def find_session(sid):
    if sid not in sessions:
        raise HTTPException(404, "Phiên không tồn tại hoặc máy chủ đã khởi động lại. Hãy tạo phiên mới.")
    return sessions[sid]


def payload(sid, session):
    return {**session.snapshot, "session_id": sid, "revision": session.revision,
            "scenario": session.scenario, "elapsed_seconds": int(time.monotonic()-session.started),
            "actions": session.actions, "mistakes": session.mistakes,
            "score": max(0, 100-session.mistakes*10), "completed_seconds": session.completed_at,
            "load_factor": session.simulator.load_factor, "logs": store.logs(sid)}


@app.get("/api/health")
def health():
    return {"status": "ok", "engine": "pandapower", "mode": "training-only"}


@app.get("/api/scenarios")
def scenarios():
    return SCENARIOS


class CreateSession(BaseModel):
    scenario: Literal["free", "fault_lt1", "overload"] = "free"


@app.post("/api/sessions", status_code=201)
async def create_session(body: CreateSession):
    if len(sessions) >= 100:
        raise HTTPException(409, "Giới hạn 100 phiên trong bản demo; khởi động lại máy chủ để giải phóng.")
    session = TrainingSession(scenario=body.scenario)
    if body.scenario == "fault_lt1":
        session.simulator.inject_fault("LT1")
    elif body.scenario == "overload":
        session.simulator.load_factor = 1.6
    sid = str(uuid4())
    await refresh(session)
    sessions[sid] = session
    store.append(sid, f"Bắt đầu: {next(s['name'] for s in SCENARIOS if s['id'] == body.scenario)}")
    return payload(sid, session)


@app.get("/api/sessions/{sid}")
def get_session(sid: str):
    return payload(sid, find_session(sid))


class Command(BaseModel):
    action: Literal["open", "close", "clear_fault", "fault", "set_load"]
    target: str = "LT1"
    value: float | None = Field(default=None, ge=0.2, le=1.8)
    revision: int = Field(ge=0)


@app.post("/api/sessions/{sid}/commands")
async def command(sid: str, body: Command):
    session = find_session(sid)
    async with session.lock:
        if body.revision != session.revision:
            raise HTTPException(409, "Trạng thái đã thay đổi. Hãy kiểm tra lại trước khi thao tác.")
        try:
            if body.action in ("open", "close"):
                session.simulator.command(body.target, body.action)
            elif body.action == "clear_fault":
                session.simulator.clear_fault(body.target)
            elif body.action == "fault":
                session.simulator.inject_fault(body.target)
            else:
                if body.value is None:
                    raise ValueError("Thiếu hệ số phụ tải")
                session.simulator.load_factor = body.value
        except ValueError as error:
            session.mistakes += 1
            session.revision += 1
            store.append(sid, f"Từ chối {body.action} {body.target}: {error}", "error")
            raise HTTPException(409, str(error)) from error
        session.actions += 1
        session.revision += 1
        labels = {"open": "Cắt máy cắt", "close": "Đóng máy cắt", "clear_fault": "Xác nhận đã xử lý sự cố",
                  "fault": "Tạo sự cố", "set_load": "Đặt hệ số tải"}
        store.append(sid, f"{labels[body.action]}: {body.value if body.action == 'set_load' else body.target}")
        await refresh(session)
        return payload(sid, session)


@app.get("/api/sessions/{sid}/report")
def report(sid: str):
    session = find_session(sid)
    return {"session_id": sid, "scenario": session.scenario, "actions": session.actions,
            "mistakes": session.mistakes, "score": max(0, 100-session.mistakes*10),
            "completed_seconds": session.completed_at, "logs": store.logs(sid),
            "limitations": "Điểm minh họa theo số lệnh sai; chưa phải đánh giá năng lực vận hành."}


@app.websocket("/ws/{sid}")
async def telemetry(websocket: WebSocket, sid: str):
    if sid not in sessions:
        await websocket.close(code=1008)
        return
    await websocket.accept()
    try:
        while True:
            async with sessions[sid].lock:
                await websocket.send_json(payload(sid, sessions[sid]))
            await asyncio.sleep(2)
    except (WebSocketDisconnect, RuntimeError):
        pass
