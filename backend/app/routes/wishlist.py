from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas, models
from ..auth import get_current_user

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("", response_model=list[schemas.WishlistItemOut])
def list_wishlist(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    items = crud.get_wishlist(db, user.id)
    result = []
    for item in items:
        crud._enrich_product(db, item.product)
        result.append(item)
    return result


@router.get("/ids", response_model=list[int])
def wishlist_product_ids(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    return crud.get_wishlist_product_ids(db, user.id)


@router.post("/{product_id}", status_code=201)
def add_to_wishlist(
    product_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    crud.add_to_wishlist(db, user.id, product_id)
    return {"status": "added"}


@router.delete("/{product_id}", status_code=204)
def remove_from_wishlist(
    product_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    if not crud.remove_from_wishlist(db, user.id, product_id):
        raise HTTPException(status_code=404, detail="Item not in wishlist")
