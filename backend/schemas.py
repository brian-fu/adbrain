from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from backend.db.models import VideoStatus

class UserBase(BaseModel):
    email: EmailStr
    company: Optional[str] = None
    company_description: Optional[str] = None

class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime

class VideoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    owner_id: str  # UUID string from Supabase
    bucket: str
    s3_key: str
    title: Optional[str] = None
    status: VideoStatus
    created_at: datetime
    updated_at: datetime

class VideoReadWithUrl(VideoRead):
    playback_url: str

class VideoGenerationResponse(BaseModel):
    message: str
    video_id: str
    status: str
    video_url: Optional[str] = None