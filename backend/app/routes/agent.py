"""
Agent API route — exposes the shopping assistant agent as a chat endpoint.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from ..database import get_db
from ..agent.engine import run_agent

router = APIRouter(prefix="/agent", tags=["agent"])


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
def agent_chat(req: ChatRequest, db: Session = Depends(get_db)):
    """Chat with the AI shopping assistant."""
    result = run_agent(db, req.message)
    return ChatResponse(
        reply=result["reply"],
        action_log=result["action_log"],
        products=result["products"],
    )
