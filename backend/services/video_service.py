from fastapi import UploadFile
from sqlalchemy.orm import Session
from backend.config import settings
from backend.db.models import Video, VideoStatus
from backend.services.aws_service import upload_video as s3_upload_video, get_video_url as s3_get_video_url
from datetime import datetime
from typing import List, Optional
import uuid

def make_s3_key(filename: str) -> str:
    return f"videos/{uuid.uuid4()}-{filename}"

# ---------- Create / Upload ----------

def upload_video(db: Session, owner_id: str, upload_file : UploadFile, title: Optional[str] = None, content_type: str = None) -> Video:
    """
    uploads the file to S3, creates a video row, returns the ORM object.
    owner_id should be a UUID string from Supabase authentication.
    """
    s3_key = make_s3_key(upload_file.filename)

    ok = s3_upload_video(upload_file, s3_key, content_type=content_type) 
    if not ok:
        raise RuntimeError("S3 upload failed")
    
    video = Video(
        owner_id=owner_id,
        bucket=settings.AWS_S3_BUCKET_NAME,
        s3_key=s3_key,
        title=title,
        status=VideoStatus.READY, 
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.add(video)
    db.commit()
    db.refresh(video)
    return video


# ---------- Read helpers ----------

def presign_video(video: Video, expires_in: int = 3600) -> str:
    """
    Returns a presigned GET URL for the given video
    """
    return s3_get_video_url(video.s3_key, expires_in)

def get_video_by_id(db: Session, video_id: int) -> Optional[Video]:
    return db.query(Video).filter(Video.id == video_id).first()

def list_videos_for_user(db: Session, user_id: str) -> List[Video]:
    return (
        db.query(Video)
        .filter(Video.owner_id == user_id)
        .order_by(Video.created_at.desc())
        .all()
    )

def list_videos_with_urls_for_user(db: Session, user_id: str, expires_in: int = 3600) -> list[dict]:
    """
    Returns a list of dicts (or schema instances in the route) combining Video fields + presigned URL.
    Kept as dicts to keep service layer decoupled from Pydantic.
    """
    videos = list_videos_for_user(db, user_id)
    out = []
    for v in videos:
        url = presign_video(v, expires_in=expires_in)
        if not url:
            raise RuntimeError(f"Failed to generate URL for {v.s3_key}")
        out.append({
            "id": v.id,
            "owner_id": str(v.owner_id),  # Convert UUID to string
            "bucket": v.bucket,
            "s3_key": v.s3_key,
            "title": v.title,
            "status": v.status,
            "created_at": v.created_at,
            "updated_at": v.updated_at,
            "playback_url": url,
        })
    return out
