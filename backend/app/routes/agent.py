"""
Agent API route — exposes the shopping assistant agent as a chat endpoint.
"""

from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from ..database import get_db
from ..agent.engine import run_agent
from ..auth import SECRET_KEY, ALGORITHM
from .. import models

router = APIRouter(prefix="/agent", tags=["agent"])

# Optional auth — don't raise on missing token
optional_security = HTTPBearer(auto_error=False)


def get_optional_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_security),
    db: Session = Depends(get_db),
) -> int | None:
    """Extract user_id from token if present, otherwise return None."""
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            return None
        user_id = int(sub)
        user = db.query(models.User).filter(models.User.id == user_id).first()
        return user.id if user else None
    except (JWTError, ValueError):
        return None


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)


class ActionLogEntry(BaseModel):
    step: int
    action: str
    reasoning: str = ""
    tool: str | None = None
    tool_input: dict | None = None
    final: bool = False
    error: str | None = None


class ChatResponse(BaseModel):
    reply: str
    action_log: list[dict] = []
    products: list[int] = []


@router.post("/chat", response_model=ChatResponse)
def agent_chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    user_id: int | None = Depends(get_optional_user_id),
):
    """Chat with the AI shopping assistant."""
    result = run_agent(db, req.message, user_id=user_id)
    return ChatResponse(
        reply=result["reply"],
        action_log=result["action_log"],
        products=result["products"],
    )
