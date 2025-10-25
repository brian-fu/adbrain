import os
import time
from dotenv import load_dotenv
from google import genai

load_dotenv()

def generate_video():
    client = genai.Client(api_key=os.getenv("GOOGLE_AI_API_KEY"))
    prompt = "A cinematic shot of a futuristic city at sunset, flying cars passing by, ambient music."

    operation = client.models.generate_videos(
        model="veo-3.0-generate-001",
        prompt=prompt,)
    
    while not operation.done:
        print("Waiting for video generation to complete...")
        time.sleep(10)
        operation = client.operations.get(operation)

    # Download the generated video.
    generated_video = operation.response.generated_videos[0]
    client.files.download(file=generated_video.video)
    generated_video.video.save("dialogue_example.mp4")
    print("Generated video saved to dialogue_example.mp4")


generate_video()