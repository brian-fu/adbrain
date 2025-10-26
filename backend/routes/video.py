from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks, Form
from sqlalchemy.orm import Session
from backend.config import settings
from backend.db.models import Video, VideoStatus, get_db
from backend.services.aws_service import upload_video as s3_upload_video, get_video_url as s3_get_video_url
from backend.services.veo_service import generate_video as veo_generate_video
from backend.services.video_generator import concatenate_videos
from pydantic import BaseModel
from typing import Optional, List
import uuid
import logging
from datetime import datetime
import os



logger = logging.getLogger(__name__)

router = APIRouter()
    
class VideoGenerationResponse(BaseModel):
    message: str
    video_id: str
    status: str
    video_url: Optional[str] = None
    
@router.post("/videos/generate", response_model=VideoGenerationResponse)
async def generate_video_endpoint(
    prompts: str = Form(...),  # JSON string array of prompts
    duration: int = Form(8),  # Default to 8 seconds
    image: Optional[UploadFile] = File(None),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    import json
    
    # Parse the prompts JSON string
    try:
        prompts_list = json.loads(prompts)
        if not isinstance(prompts_list, list):
            raise ValueError("Prompts must be a list")
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid prompts format: {str(e)}"
        )
    
    logger.info(f"Received video generation request with {len(prompts_list)} prompt(s)")
    logger.info(f"Requested duration: {duration} seconds")
    if image:
        logger.info(f"Reference image provided: {image.filename}")
    
    # Validate duration
    if duration not in [8, 16, 24]:
        raise HTTPException(
            status_code=400,
            detail="Duration must be 8, 16, or 24 seconds"
        )
    
    # Calculate how many videos to generate (each video is 8 seconds)
    num_videos = duration // 8
    
    # Validate that we have the correct number of prompts
    if len(prompts_list) != num_videos:
        raise HTTPException(
            status_code=400,
            detail=f"Expected {num_videos} prompt(s) for {duration}s duration, got {len(prompts_list)}"
        )
    
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
            logger.info(f"Generating video segment {i+1}/{num_videos} for video_id: {video_id}")
            
            # Create a unique filename for each segment
            segment_filename = f"{video_id}_segment_{i}.mp4"
            
            # Use the specific prompt for this segment
            segment_prompt = prompts_list[i]
            logger.info(f"Using prompt for segment {i+1}: {segment_prompt[:100]}...")
            
            # Call the veo service to generate video with the segment-specific prompt
            generated_file_path = veo_generate_video(segment_prompt, segment_filename, image_path)
            
            if not os.path.exists(generated_file_path):
                raise HTTPException(status_code=500, detail=f"Video segment {i+1} generation failed - file not found")
            
            generated_video_paths.append(generated_file_path)
            logger.info(f"Video segment {i+1} generated successfully: {generated_file_path}")
        
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
            output_filename = f"{video_id}.mp4"
            final_video_path = concatenate_videos(generated_video_paths, output_filename)
            logger.info(f"Videos concatenated successfully: {final_video_path}")
        
        # Upload to S3
        s3_key = f"generated-videos/{output_filename}"
        with open(final_video_path, "rb") as video_file:
            # Convert to UploadFile-like object
            from io import BytesIO
            
            file_content = video_file.read()
            upload_file = UploadFile(
                filename=output_filename,
                file=BytesIO(file_content)
            )
            
            upload_success = s3_upload_video(upload_file, s3_key)
            if not upload_success:
                logger.warning("Failed to upload to S3, but video was generated locally")
        
        # Get the video URL from S3
        video_url = s3_get_video_url(s3_key) if upload_success else None
        
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
            message=f"Video generated successfully ({duration} seconds)",
            video_id=video_id,
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