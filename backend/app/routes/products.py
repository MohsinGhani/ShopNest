from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas, models
from ..auth import require_admin

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=schemas.PaginatedProducts)
def list_products(
    page: int = 1,
    per_page: int = 6,
    search: str = "",
    category_id: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    featured: bool = False,
    sort: str = "newest",
    db: Session = Depends(get_db),
):
    skip = (page - 1) * per_page
    products, total = crud.get_products(
        db, skip=skip, limit=per_page,
        search=search, category_id=category_id,
        min_price=min_price, max_price=max_price,
        featured_only=featured, sort=sort,
    )
    pages = (total + per_page - 1) // per_page if per_page > 0 else 1
    return schemas.PaginatedProducts(
        items=products, total=total, page=page, per_page=per_page, pages=pages
    )


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=schemas.ProductOut, status_code=201)
def create_product(
    data: schemas.ProductCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    return crud.create_product(db, data)


@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    data: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    product = crud.update_product(db, product_id, data)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    if not crud.delete_product(db, product_id):
        raise HTTPException(status_code=404, detail="Product not found")


@router.post("/{product_id}/images", response_model=schemas.ProductImageOut, status_code=201)
def add_image(
    product_id: int,
    image_url: str,
    sort_order: int = 0,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return crud.add_product_image(db, product_id, image_url, sort_order)


@router.delete("/images/{image_id}", status_code=204)
def remove_image(
    image_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    if not crud.delete_product_image(db, image_id):
        raise HTTPException(status_code=404, detail="Image not found")
