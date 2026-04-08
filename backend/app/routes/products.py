from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from collections import Counter
from ..database import get_db
from .. import crud, schemas, models
from ..auth import require_admin, get_current_user

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


@router.get("/recommendations/personalized", response_model=list[schemas.ProductOut])
def get_personalized_recommendations(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """
    Return personalized product recommendations based on the user's order history.
    Analyzes which categories the user orders from most, then returns products
    from those categories (excluding already-purchased products).
    Falls back to featured/newest products if no order history.
    """
    # Get all the user's order items with product info
    order_items = (
        db.query(models.OrderItem)
        .join(models.Order, models.OrderItem.order_id == models.Order.id)
        .filter(models.Order.user_id == user.id)
        .options(joinedload(models.OrderItem.product))
        .all()
    )

    if not order_items:
        # No order history — fall back to featured products
        products, _ = crud.get_products(db, limit=8, featured_only=True)
        if len(products) < 4:
            more, _ = crud.get_products(db, limit=8, sort="newest")
            seen = {p.id for p in products}
            for p in more:
                if p.id not in seen:
                    products.append(p)
                    seen.add(p.id)
                if len(products) >= 8:
                    break
        return products

    # Count category frequency from orders (weighted by quantity)
    category_counter: Counter = Counter()
    purchased_product_ids: set[int] = set()
    for oi in order_items:
        purchased_product_ids.add(oi.product_id)
        if oi.product and oi.product.category_id:
            category_counter[oi.product.category_id] += oi.quantity

    # Get top categories (up to 3)
    top_categories = [cat_id for cat_id, _ in category_counter.most_common(3)]

    # Fetch products from those categories, excluding already purchased
    recommendations: list[models.Product] = []
    seen_ids: set[int] = set()

    for cat_id in top_categories:
        products, _ = crud.get_products(
            db, limit=6, category_id=cat_id, sort="newest"
        )
        for p in products:
            if p.id not in purchased_product_ids and p.id not in seen_ids:
                recommendations.append(p)
                seen_ids.add(p.id)

    # If we don't have enough, fill with featured/newest
    if len(recommendations) < 8:
        featured, _ = crud.get_products(db, limit=8, featured_only=True)
        for p in featured:
            if p.id not in purchased_product_ids and p.id not in seen_ids:
                recommendations.append(p)
                seen_ids.add(p.id)

    if len(recommendations) < 4:
        newest, _ = crud.get_products(db, limit=8, sort="newest")
        for p in newest:
            if p.id not in seen_ids:
                recommendations.append(p)
                seen_ids.add(p.id)

    return recommendations[:8]
