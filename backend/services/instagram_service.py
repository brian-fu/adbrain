import requests, tempfile
from pathlib import Path
from backend.config import settings
from instagrapi import Client
from instagrapi.exceptions import TwoFactorRequired


SESSION_FILE = Path("ig_session.json")

def download_to_tmp(url: str) -> Path:
    tmpdir = Path(tempfile.gettempdir()) / "ig_uploads"
    tmpdir.mkdir(parents=True, exist_ok=True)
    dest = tmpdir / "reel.mp4"
    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=1<<15):
                if chunk:
                    f.write(chunk)
    return dest

def get_client(username: str, password: str) -> Client:
    cl = Client()
    
    if SESSION_FILE.exists():
        cl.load_settings(SESSION_FILE)

    try:
        cl.login(username, password)
    except TwoFactorRequired:
        code = input("Enter 2FA code: ").strip()
        cl.login(username, password, verification_code=code)

    # Persist session so next runs won’t re-trigger checks
    cl.dump_settings(SESSION_FILE)
    return cl

def upload_reel(url: str, caption: str):
    USERNAME=settings.INSTAGRAM_USERNAME
    PASSWORD=settings.INSTAGRAM_PASSWORD
    cl: Client = get_client(USERNAME, PASSWORD)
    video_path = download_to_tmp(url)
    if not video_path.exists():
        raise RuntimeError(f"Download failed: {video_path}")
    print(f"Downloaded to: {video_path}")

    # Reels upload (clip_upload). Pass a cover image if you have one via thumb_path=...
    media = cl.clip_upload(str(video_path), caption=caption)
    print("Reel posted!")
    print("pk:", media.pk, "code:", media.code, "url:", f"https://www.instagram.com/reel/{media.code}/")
