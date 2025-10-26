from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from backend.config import settings
from backend.schemas import VideoRead, VideoReadWithUrl, VideoGenerationResponse
from backend.db.models import Video, VideoStatus, get_db
from backend.services.veo_service import generate_video as veo_generate_video
from backend.services.video_generator import concatenate_videos
from backend.services.aws_service import upload_video as s3_upload_video, get_video_url as s3_get_video_url
from backend.services import video_service
from backend.auth import get_current_user, get_current_user_optional
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
import logging
import os
import json

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Videos"])

    
# ---------- Generate Video ----------
@router.post("/videos/generate", response_model=VideoGenerationResponse)
async def generate_video_endpoint(
    prompt: str = Form(...),  # Single base prompt string with numbered sections
    duration: str = Form("8"),  # Duration as string from form, will convert to int
    title: Optional[str] = Form(None),  # Product name/title
    image: Optional[UploadFile] = File(None),
    user_id: str = Depends(get_current_user),  # Require authentication
    db: Session = Depends(get_db),
):
    logger.info(f"Received video generation request")
    logger.info(f"Title: {title}")
    logger.info(f"Duration (raw): {duration} (type: {type(duration)})")
    
    # Convert duration to int
    try:
        duration_int = int(duration)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid duration format")
    
    logger.info(f"Duration (converted): {duration_int} seconds")
    logger.info(f"Base prompt (first 150 chars): {prompt[:150]}...")
    if image:
        logger.info(f"Reference image provided: {image.filename}")
    
    # Validate duration
    if duration_int not in [8, 16, 24]:
        raise HTTPException(
            status_code=400,
            detail="Duration must be 8, 16, or 24 seconds"
        )
    
    # Calculate how many videos to generate (each video is 8 seconds)
    num_videos = duration_int // 8
    logger.info(f"Will generate {num_videos} video(s) of 8 seconds each")
    
    image_path = None
    generated_video_paths: List[str] = []
    
    try:
        # Generate unique video ID
        video_id = str(uuid.uuid4())
        
        # Save uploaded image temporarily if provided
        if image:
            # Validate image file type
            allowed_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
            file_ext = os.path.splitext(image.filename)[1].lower()
            
            if file_ext not in allowed_extensions:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid image format. Allowed: {', '.join(allowed_extensions)}"
                )
            
            image_path = f"{video_id}_reference{file_ext}"
            logger.info(f"Saving reference image to: {image_path}")
            
            # Save the uploaded image
            with open(image_path, "wb") as f:
                content = await image.read()
                f.write(content)
            
            logger.info(f"Reference image saved successfully")
        
        # Generate multiple videos using segment-specific prompts
        for i in range(num_videos):
            segment_num = i + 1
            logger.info(f"Generating video segment {segment_num}/{num_videos} for video_id: {video_id}")
            
            # Create a unique filename for each segment
            segment_filename = f"{video_id}_segment_{i}.mp4"
            
            # Add "Focus ONLY on part X" instruction to the base prompt
            segment_prompt = f"Focus ONLY on part {segment_num} of this ad concept. {prompt}"
            logger.info(f"Segment {segment_num} prompt (first 150 chars): {segment_prompt[:150]}...")
            
            # Call the veo service to generate video with the segment-specific prompt
            generated_file_path = veo_generate_video(segment_prompt, segment_filename, image_path)
            
            if not os.path.exists(generated_file_path):
                raise HTTPException(status_code=500, detail=f"Video segment {segment_num} generation failed - file not found")
            
            generated_video_paths.append(generated_file_path)
            logger.info(f"Video segment {segment_num} generated successfully: {generated_file_path}")
        
        # Determine final output path
        if num_videos == 1:
            # Single video, no concatenation needed
            final_video_path = generated_video_paths[0]
            output_filename = f"{video_id}.mp4"
            # Rename the file to match expected output name
            final_output_path = output_filename
            os.rename(final_video_path, final_output_path)
            final_video_path = final_output_path
        else:
            # Multiple videos, concatenate them
            logger.info(f"Concatenating {num_videos} video segments...")
            logger.info(f"Segment files: {generated_video_paths}")
            output_filename = f"{video_id}.mp4"
            final_video_path = concatenate_videos(generated_video_paths, output_filename)
            logger.info(f"Videos concatenated successfully: {final_video_path}")
            
            # Verify the concatenated file
            if os.path.exists(final_video_path):
                file_size = os.path.getsize(final_video_path)
                logger.info(f"Concatenated video size: {file_size} bytes")
            else:
                raise HTTPException(status_code=500, detail="Concatenated video file not found")
        
        # Upload to S3 and save to database using video_service
        video_record = None
        try:
            with open(final_video_path, "rb") as video_file:
                # Convert to UploadFile-like object
                from io import BytesIO
                
                file_content = video_file.read()
                upload_file = UploadFile(
                    filename=output_filename,
                    file=BytesIO(file_content)
                )
                
                # Use video_service to handle upload and DB record creation
                # Pass content_type explicitly since UploadFile from BytesIO doesn't have one
                video_record = video_service.upload_video(
                    db=db,
                    owner_id=user_id,
                    upload_file=upload_file,
                    title=title or f"Generated Video - {video_id[:8]}",  # Use provided title or fallback
                    content_type="video/mp4"
                )
                
                # Get presigned URL for the uploaded video
                video_url = video_service.presign_video(video_record, expires_in=3600)
                upload_success = True
                logger.info(f"Video uploaded to S3 and saved to database with ID: {video_record.id}")
        except Exception as e:
            logger.error(f"Failed to upload to S3: {str(e)}")
            upload_success = False
            video_url = None
            logger.warning("Failed to upload to S3, but video was generated locally")
        
        # Clean up local files
        try:
            # Remove final video
            if os.path.exists(final_video_path):
                os.remove(final_video_path)
                logger.info(f"Cleaned up final video file: {final_video_path}")
            
            # Remove segment videos if they still exist
            for segment_path in generated_video_paths:
                if os.path.exists(segment_path):
                    os.remove(segment_path)
                    logger.info(f"Cleaned up segment video: {segment_path}")
            
            # Remove reference image
            if image_path and os.path.exists(image_path):
                os.remove(image_path)
                logger.info(f"Cleaned up reference image: {image_path}")
        except Exception as e:
            logger.warning(f"Failed to clean up local files: {e}")
        
        return VideoGenerationResponse(
            message=f"Video generated successfully ({duration_int} seconds)",
            video_id=str(video_record.id) if (upload_success and video_record) else video_id,  # Use DB ID if uploaded
            status="completed",
            video_url=video_url
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error generating video: {str(e)}")
        
        # Clean up on error
        try:
            if image_path and os.path.exists(image_path):
                os.remove(image_path)
            for segment_path in generated_video_paths:
                if os.path.exists(segment_path):
                    os.remove(segment_path)
        except:
            pass
            
        raise HTTPException(status_code=500, detail=f"Video generation failed: {str(e)}")

        

# ---------- Upload Video ----------

@router.post("/videos/upload")
def upload_video_endpoint(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user),  # Require authentication
    db: Session = Depends(get_db)
):
    logger.info(f"Received upload request for file: {file.filename} from user: {user_id}")
    
    try:
        video = video_service.upload_video(db=db, owner_id=user_id, upload_file=file, title=title)
        return video
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------- Get by id (with URL) ----------

@router.get("/videos/{video_id}") # returns a single VideoRead object by video id with a presigned url that expires in an hour
def get_video(video_id: str, db: Session = Depends(get_db)):
    # Try to convert to int (database ID)
    try:
        video_id_int = int(video_id)
        video = video_service.get_video_by_id(db, video_id_int)
    except ValueError:
        # If it's not an integer, it might be a UUID (but we don't have UUID lookup implemented)
        raise HTTPException(status_code=404, detail="Video not found. Please use the database ID.")
    
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    url = video_service.presign_video(video, expires_in=3600)
    if not url:
        raise HTTPException(status_code=500, detail="Failed to generate video URL")

    # pydantic converts given list of hashmaps to schema
    return VideoReadWithUrl.model_validate(
        {
            "id": video.id,
            "owner_id": str(video.owner_id),  # Convert UUID to string
            "bucket": video.bucket,
            "s3_key": video.s3_key,
            "title": video.title,
            "status": video.status,
            "created_at": video.created_at,
            "updated_at": video.updated_at,
            "playback_url": url,
        },
        from_attributes=False,
    )


# ---------- List for user (with URLs) ----------

@router.get("/users/{user_id}/videos-with-urls")
def list_user_videos(user_id: str, db: Session = Depends(get_db)):
    try:
        records = video_service.list_videos_with_urls_for_user(db, user_id, expires_in=3600)
        # Convert dicts to schema 
        return [VideoReadWithUrl.model_validate(r, from_attributes=False) for r in records]
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
