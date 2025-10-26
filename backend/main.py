from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.video import router as video_router

from backend.config import settings

COMPANY_NAME = "AIBrain"

# ------------------------------------------------------
# App Initialization
# ------------------------------------------------------
app = FastAPI(title=f"{COMPANY_NAME} API", version="0.1.0", description="Backend for AI Ad Generator dashboard")

# ------------------------------------------------------
# Middleware
# ------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],       
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------
# Routers
# ------------------------------------------------------
app.include_router(video_router, prefix="/v1", tags=["videos"])

# ------------------------------------------------------
# Root route
# ------------------------------------------------------

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/")
def root():
    return {f"message": "Welcome to {COMPANY_NAME} API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
