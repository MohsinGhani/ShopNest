from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas, models
from ..auth import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=schemas.UserProfileOut)
def get_profile(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    order_count = db.query(models.Order).filter(models.Order.user_id == user.id).count()
    return schemas.UserProfileOut(
        id=user.id,
        email=user.email,
        role=user.role,
        name=user.name,
        created_at=user.created_at,
        order_count=order_count,
    )


@router.put("", response_model=schemas.UserProfileOut)
def update_profile(
    data: schemas.UserProfileUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    updated = crud.update_user_profile(db, user.id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated
