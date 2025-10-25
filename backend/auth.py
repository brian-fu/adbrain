"""
Authentication utilities for verifying Supabase JWT tokens
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from backend.config import settings
import httpx
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Verify Supabase JWT token and return the payload
    
    Returns:
        dict: Token payload containing user information
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials
    
    try:
        # Decode the JWT token
        # Supabase uses HS256 algorithm with the JWT secret (NOT the service role key)
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,  # Use JWT secret, not service role key
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": False}  # Supabase tokens don't always have aud claim
        )
        
        return payload
    
    except JWTError as e:
        logger.error(f"JWT verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(token_payload: dict = Depends(verify_token)) -> str:
    """
    Get the current user ID from the verified token
    
    Returns:
        str: User ID (UUID)
    """
    user_id = token_payload.get("sub")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token",
        )
    
    return user_id


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False))
) -> str | None:
    """
    Optional authentication - returns user ID if token is valid, None otherwise
    Useful for endpoints that work with or without authentication
    
    Returns:
        str | None: User ID if authenticated, None otherwise
    """
    if not credentials:
        return None
    
    try:
        payload = await verify_token(credentials)
        return payload.get("sub")
    except HTTPException:
        return None
