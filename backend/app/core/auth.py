from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel
from typing import Optional
from app.config import settings

security = HTTPBearer(auto_error=True)


class CurrentUser(BaseModel):
    id: str
    email: Optional[str] = None
    role: Optional[str] = None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> CurrentUser:
    token = credentials.credentials
    try:
        # If JWT secret is configured, verify signature; otherwise decode claims safely
        if settings.SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
        else:
            payload = jwt.get_unverified_claims(token)

        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject (user_id)",
            )

        return CurrentUser(
            id=user_id,
            email=payload.get("email"),
            role=payload.get("role", "authenticated"),
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
        )
