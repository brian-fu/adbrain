from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    # ENVIRONMENT
    DEBUG: bool = True
    HOST: str = "localhost"
    PORT: int = 8000

    # API KEYS
    GOOGLE_AI_API_KEY: str 
    GOOGLE_PROJECT_ID: str
   
    # AWS SETTINGS
    AWS_ACCESS_KEY_ID: str 
    AWS_SECRET_ACCESS_KEY: str 
    AWS_REGION: str 
    AWS_S3_BUCKET_NAME: str 
    
    # DATABASE
    DB_URL: str 
    
    # SUPABASE
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str

    class Config:
        env_file = Path(__file__).parent / ".env"  # Changed from parent.parent to parent
        env_file_encoding = 'utf-8'

settings = Settings()