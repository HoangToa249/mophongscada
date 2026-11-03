"""Append-only audit trail; SQLite locally, PostgreSQL via DATABASE_URL."""
import os
from pathlib import Path
from datetime import datetime, timezone
from sqlalchemy import create_engine, String, Text, DateTime, Integer, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session


class Base(DeclarativeBase):
    pass


class SessionLog(Base):
    __tablename__ = "session_logs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[str] = mapped_column(String(36), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    level: Mapped[str] = mapped_column(String(16))
    message: Mapped[str] = mapped_column(Text)


class AuditStore:
    def __init__(self, url=None):
        if url is None:
            Path("data").mkdir(exist_ok=True)
            url = os.getenv("DATABASE_URL", "sqlite:///data/training.db")
        self.engine = create_engine(url)
        Base.metadata.create_all(self.engine)

    def append(self, session_id, message, level="info"):
        with Session(self.engine) as db:
            db.add(SessionLog(session_id=session_id, timestamp=datetime.now(timezone.utc),
                              message=message, level=level))
            db.commit()

    def logs(self, session_id):
        with Session(self.engine) as db:
            rows = db.scalars(select(SessionLog).where(SessionLog.session_id == session_id)
                              .order_by(SessionLog.id.desc()).limit(500)).all()
            return [{"id": row.id, "timestamp": row.timestamp.isoformat(),
                     "level": row.level, "message": row.message} for row in rows]
