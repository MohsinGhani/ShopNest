from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas, models
from ..auth import get_current_user

router = APIRouter(tags=["checkout"])


@router.post("/checkout", response_model=schemas.OrderOut, status_code=201)
def checkout(
    data: schemas.CheckoutRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    if not data.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Validate all products exist
    products: dict[int, models.Product] = {}
    for item in data.items:
        product = crud.get_product(db, item.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        products[item.product_id] = product

    order = crud.create_order(db, user.id, data.items, products)
    return order
