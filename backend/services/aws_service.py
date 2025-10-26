import boto3
from backend.config import settings
from fastapi import UploadFile

# Create a single S3 client instance instead of creating new sessions
s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION,
)

def upload_video(file: UploadFile, s3_key: str, content_type: str = None) -> bool:
    try:
        # Use provided content_type or fall back to file's content_type or default to video/mp4
        mime_type = content_type or getattr(file, 'content_type', None) or "video/mp4"
        
        s3_client.upload_fileobj(
            file.file,
            settings.AWS_S3_BUCKET_NAME,
            s3_key,
            ExtraArgs={
                "ContentType": mime_type,
                "CacheControl": "max-age=86400",  # Cache for 24 hours
                "ContentDisposition": "inline"  # Display inline (for video playback)
            }
        )
        return True
    except Exception as e:
        print(f"Error uploading file: {e}")
        return False

def get_video_url(s3_key: str, expires_in: int) -> str | None:
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.AWS_S3_BUCKET_NAME,
                'Key': s3_key
            },
            ExpiresIn=expires_in 
        )
        return url
    except Exception as e:
        print(f"Error generating URL: {e}")
        return None