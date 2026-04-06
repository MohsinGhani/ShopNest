from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas, models
from ..auth import get_current_user

router = APIRouter(prefix="/products", tags=["reviews"])


@router.get("/{product_id}/reviews", response_model=list[schemas.ReviewOut])
def list_reviews(product_id: int, db: Session = Depends(get_db)):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    reviews = crud.get_reviews(db, product_id)
    result = []
    for r in reviews:
        result.append(schemas.ReviewOut(
            id=r.id,
            product_id=r.product_id,
            user_id=r.user_id,
            user_email=r.user.email,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at,
        ))
    return result


@router.post("/{product_id}/reviews", response_model=schemas.ReviewOut, status_code=201)
def create_review(
    product_id: int,
    data: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if crud.user_has_reviewed(db, product_id, user.id):
        raise HTTPException(status_code=400, detail="You have already reviewed this product")
    review = crud.create_review(db, product_id, user.id, data)
    return schemas.ReviewOut(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        user_email=user.email,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
    )


@router.delete("/{product_id}/reviews/{review_id}", status_code=204)
def delete_review(
    product_id: int,
    review_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    crud.delete_review(db, review_id)
