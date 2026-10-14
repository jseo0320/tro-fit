from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, JSON, String
from app.db.base import Base


def now():
    return datetime.now(timezone.utc)


class ChoreographyJob(Base):
    __tablename__ = 'choreography_jobs'
    id = Column(String(36), primary_key=True)
    user_id = Column(String, ForeignKey('users.user_id'), nullable=False, index=True)
    status = Column(String(32), nullable=False, default='queued', index=True)
    request = Column(JSON, nullable=False)
    result = Column(JSON, nullable=True)
    error_code = Column(String(80), nullable=True)
    video_path = Column(String, nullable=True)
    reviewed_by = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=now, onupdate=now, nullable=False)
