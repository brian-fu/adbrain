from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings

COMPANY_NAME = "da growth engineers"

# ------------------------------------------------------
# App Initialization
# ------------------------------------------------------
app = FastAPI(
    title=f"{COMPANY_NAME} API",
    version="0.1.0",
    description="Backend for AI Ad Generator dashboard"
)

# ------------------------------------------------------
# Middleware
# ------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],              # ADJUST LATER
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------
# Routers
# ------------------------------------------------------

# endpoints

# ------------------------------------------------------
# Root route
# ------------------------------------------------------
@app.get("/")
def root():
    return {f"message": "Welcome to {COMPANY_NAME} API"}