"""Authentication and authorization utilities."""
import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel
from .database import get_users_collection
from .models import User, UserStats, VerificationType

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Password hashing (using Argon2 - more secure and no bcrypt compatibility issues)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Bearer token security
security = HTTPBearer(auto_error=False)


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


def decode_token(token: str) -> Optional[TokenData]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        
        if user_id is None:
            return None
            
        return TokenData(user_id=user_id, email=email)
    except JWTError:
        return None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[User]:
    """Get the current authenticated user from JWT token."""
    if credentials is None:
        return None
    
    token = credentials.credentials
    token_data = decode_token(token)
    
    if token_data is None:
        return None
    
    # Find user in database
    users = get_users_collection()
    from bson import ObjectId
    user_doc = users.find_one({"_id": ObjectId(token_data.user_id)})
    
    if user_doc is None:
        return None
    
    return User(
        id=str(user_doc["_id"]),
        username=user_doc["username"],
        email=user_doc["email"],
        is_verified=user_doc.get("is_verified", False),
        verification_type=user_doc.get("verification_type", VerificationType.NONE),
        phone=user_doc.get("phone"),
        avatar_url=user_doc.get("avatar_url"),
        created_at=user_doc["created_at"],
        last_login=user_doc.get("last_login"),
        stats=UserStats(**user_doc.get("stats", {}))
    )


async def require_auth(current_user: Optional[User] = Depends(get_current_user)) -> User:
    """Require authentication - raises 401 if not authenticated."""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


async def optional_auth(current_user: Optional[User] = Depends(get_current_user)) -> Optional[User]:
    """Optional authentication - returns user if authenticated, None otherwise."""
    return current_user
