from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from backend.config import settings
from backend.db.models import Video, VideoStatus, get_db
from backend.services.aws_service import upload_video as s3_upload_video, get_video_url as s3_get_video_url
import uuid
import logging
from datetime import datetime



logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/videos/upload")
def upload_video_endpoint(file: UploadFile = File(...), db: Session = Depends(get_db)):
    logger.info(f"Received upload request for file: {file.filename}")
    
    try:
        # Generate unique key like videos/<uuid>-filename.mp4
        s3_key = f"videos/{uuid.uuid4()}-{file.filename}"
        logger.info(f"Generated S3 key: {s3_key}")

        # Upload directly (synchronous boto3 call)
        upload_success = s3_upload_video(file, s3_key)
        if not upload_success:
            raise HTTPException(status_code=500, detail="Failed to upload video")
        
        logger.info("Successfully uploaded to S3")
        """
        # Create DB record
        video = Video(
            owner_id=1,   # TODO: REPLACE WITH CURRENT USER
            bucket=settings.AWS_S3_BUCKET_NAME,
            s3_key=s3_key,
            status=VideoStatus.PROCESSING,
            video_length=0,
            width=0,
            height=0,
        )
        db.add(video)
        db.commit()
        db.refresh(video)

        # Update status READY
        video.status = VideoStatus.READY
        video.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(video)
        """
        url = s3_get_video_url(s3_key)

        return {
            "message": "Video uploaded successfully",
            #"video_id": video.id,
            #"status": video.status,
            "key": s3_key,
            "url": url,
        }

    except Exception as e:
        # Update DB to FAILED if upload partially succeeded
        if 'video' in locals():
            video.status = VideoStatus.FAILED
            video.updated_at = datetime.utcnow()
            db.commit()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/videos/{video_id}")
def get_video(video_id: int, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Generate a temporary presigned URL for playback
    url = s3_get_video_url(video.s3_key)
    if not url:
        raise HTTPException(status_code=500, detail="Failed to generate video URL")

    return {
        "id": video.id,
        "title": getattr(video, "title", None),
        "status": video.status,
        "url": url,
    }
