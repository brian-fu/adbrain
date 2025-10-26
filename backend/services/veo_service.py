import os
import time
import logging
import mimetypes
from typing import Optional
from google import genai
from google.genai import types
from backend.config import settings

logger = logging.getLogger(__name__)


def get_mime_type(file_path: str) -> str:
    """Detect MIME type from file extension"""
    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type:
        return mime_type
    
    # Fallback based on extension
    ext = os.path.splitext(file_path)[1].lower()
    mime_types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
    }
    return mime_types.get(ext, 'image/jpeg')

def generate_video(prompt: str, output_path: str = "dialogue_example.mp4", image_path: Optional[str] = None, aspect_ratio: str = "9:16") -> str:
    try:
        logger.info("Initializing Google GenAI client for Veo video generation.")
        client = genai.Client(api_key=settings.GOOGLE_AI_API_KEY)

        logger.info(f"Starting video generation with prompt: {prompt[:100]}...")
        logger.info(f"Aspect ratio: {aspect_ratio}")

        # Build the generation request with config
        config = types.GenerateVideosConfig(
            aspectRatio=aspect_ratio  # 9:16 for portrait (Instagram/TikTok), 16:9 for landscape
        )
        
        generation_args = {
            "model": "veo-3.0-fast-generate-001",
            "prompt": prompt,
            "config": config
        }
        
        # Prepare image data using proper SDK types
        if image_path and os.path.exists(image_path):
            logger.info(f"Processing reference image: {image_path}")
            
            # Read image as bytes
            with open(image_path, 'rb') as f:
                image_bytes = f.read()
            
            # Get MIME type
            mime_type = get_mime_type(image_path)
            logger.info(f"Image MIME type: {mime_type}, size: {len(image_bytes)} bytes")
            
            # Create Image object using SDK types
            image_obj = types.Image(
                imageBytes=image_bytes,
                mimeType=mime_type
            )
            
            # Pass the Image object
            generation_args["image"] = image_obj
        elif image_path:
            logger.warning(f"⚠️ Image path provided but not found: {image_path}")

        logger.info("Sending video generation request to Veo...")
        operation = client.models.generate_videos(**generation_args)

        # Poll the operation until it's done
        wait_count = 0
        while not operation.done:
            wait_count += 1
            logger.info(f"Waiting for Veo to finish rendering... ({wait_count * 10}s elapsed)")
            time.sleep(10)
            operation = client.operations.get(operation)

        logger.info("✅ Video generation completed. Downloading the file...")

        # Retrieve and save the generated video
        generated_video = operation.response.generated_videos[0]
        client.files.download(file=generated_video.video)
        generated_video.video.save(output_path)

        logger.info(f"🎬 Generated video saved to: {output_path}")
        return output_path

    except Exception as e:
        logger.error(f"❌ Error in video generation: {str(e)}", exc_info=True)
        raise Exception(f"Veo video generation failed: {str(e)}")
