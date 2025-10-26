import os
import ffmpeg
import logging
from typing import List

logger = logging.getLogger(__name__)


def concatenate_videos(video_paths: List[str], output_path: str = "concatenated_video.mp4") -> str:
    if len(video_paths) < 2:
        raise ValueError("At least 2 videos are required for concatenation")
    
    # Check if all input files exist
    for video_path in video_paths:
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
    
    # Concatenate the videos
    concat_file = None
    try:
        # Create a concat file list for ffmpeg
        concat_file = "concat_list.txt"
        with open(concat_file, 'w') as f:
            for video_path in video_paths:
                # Use absolute paths and escape single quotes
                abs_path = os.path.abspath(video_path)
                f.write(f"file '{abs_path}'\n")
        
        print(f"📝 Created concat file with {len(video_paths)} videos")
        
        # Use ffmpeg concat demuxer with re-encoding to ensure compatibility
        # Note: Using c='copy' can fail if videos have different parameters
        input_stream = ffmpeg.input(concat_file, format='concat', safe=0)
        
        # Re-encode to ensure all segments are compatible
        output_stream = ffmpeg.output(
            input_stream, 
            output_path,
            vcodec='libx264',  # Re-encode video
            acodec='aac',      # Re-encode audio
            video_bitrate='5M', # High quality
            audio_bitrate='192k',
            preset='medium'
        )
        
        # Run the ffmpeg command, overwrite output file if it exists
        logger.info(f"🎬 Running ffmpeg concatenation...")
        ffmpeg.run(output_stream, overwrite_output=True, capture_stdout=True, capture_stderr=True)
        
        # Verify output file exists and has content
        if not os.path.exists(output_path):
            raise Exception(f"Output file was not created: {output_path}")
        
        output_size = os.path.getsize(output_path)
        if output_size == 0:
            raise Exception(f"Output file is empty: {output_path}")
        
        logger.info(f"✅ Successfully concatenated {len(video_paths)} videos into: {output_path} ({output_size} bytes)")
        
        # Clean up concat file
        if concat_file and os.path.exists(concat_file):
            os.remove(concat_file)
        
        return output_path
        
    except ffmpeg.Error as e:
        logger.error(f"❌ Error concatenating videos: {e.stderr.decode() if e.stderr else str(e)}")
        # Clean up concat file on error
        if concat_file and os.path.exists(concat_file):
            os.remove(concat_file)
        raise
    except Exception as e:
        logger.error(f"❌ Error in concatenation: {str(e)}")
        # Clean up concat file on error
        if concat_file and os.path.exists(concat_file):
            os.remove(concat_file)
        raise
