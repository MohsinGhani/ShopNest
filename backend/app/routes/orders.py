from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas, models
from ..auth import require_admin, get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=list[schemas.OrderDetailOut])
def list_orders(db: Session = Depends(get_db), admin=Depends(require_admin)):
    orders = crud.get_all_orders(db)
    return _serialize_orders(orders)


@router.get("/my", response_model=list[schemas.OrderDetailOut])
def my_orders(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    orders = crud.get_user_orders(db, user.id)
    return _serialize_orders(orders)


def _serialize_orders(orders: list[models.Order]) -> list[schemas.OrderDetailOut]:
    result = []
    for order in orders:
        result.append(schemas.OrderDetailOut(
            id=order.id,
            user_id=order.user_id,
            user_email=order.user.email,
            total_amount=order.total_amount,
            created_at=order.created_at,
            items=[
                schemas.OrderItemOut(
                    id=item.id,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    price=item.price,
                    product=item.product,
                )
                for item in order.items
            ],
        ))
    return result
