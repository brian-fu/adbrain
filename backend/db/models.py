from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from enum import Enum
from datetime import datetime
from typing import Optional
from backend.config import settings
from sqlalchemy import create_engine
import uuid

Base = declarative_base()
engine = create_engine(settings.DB_URL, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class VideoStatus(str, Enum):
    DRAFT = "draft"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"

class User(Base):
    __tablename__ = "users"

    id: int = Column(Integer, primary_key=True)
    email: str = Column(String(50), nullable=False)
    company: Optional[str] = Column(String(100))
    company_description: Optional[str] = Column(String(500))
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    # Removed relationship since Supabase manages users externally
    # videos = relationship("Video", back_populates="owner")

class Video(Base):
    __tablename__ = "video"

    id: int = Column(Integer, primary_key=True)
    owner_id: str = Column(String(36), nullable=False)  # Store UUID as string (Supabase user ID)
    bucket: str = Column(String(500), nullable=False)
    s3_key: str = Column(String(500), nullable=False, unique=True)
    title: Optional[str] = Column(String(100))
    status = Column(SQLEnum(VideoStatus, name="video_status"), nullable=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Note: No foreign key relationship to users table since Supabase manages users externally

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_session():
    Base.metadata.create_all(bind=engine)
    return SessionLocal()
