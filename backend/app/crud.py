from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from . import models, schemas
from .auth import hash_password


# --- Users ---
def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, email: str, password: str, role: str = "user", name: str = "") -> models.User:
    user = models.User(email=email, hashed_password=hash_password(password), role=role, name=name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user_profile(db: Session, user_id: int, data: schemas.UserProfileUpdate) -> models.User | None:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


# --- Categories ---
def get_categories(db: Session) -> list[models.Category]:
    return db.query(models.Category).order_by(models.Category.name).all()


def get_category(db: Session, category_id: int) -> models.Category | None:
    return db.query(models.Category).filter(models.Category.id == category_id).first()


def create_category(db: Session, data: schemas.CategoryCreate) -> models.Category:
    cat = models.Category(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def delete_category(db: Session, category_id: int) -> bool:
    cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not cat:
        return False
    db.delete(cat)
    db.commit()
    return True


# --- Products ---
def _enrich_product(db: Session, product: models.Product) -> models.Product:
    """Add avg_rating and review_count to a product object."""
    stats = db.query(
        func.avg(models.Review.rating),
        func.count(models.Review.id),
    ).filter(models.Review.product_id == product.id).first()
    product.avg_rating = round(stats[0] or 0, 1)
    product.review_count = stats[1] or 0
    return product


def get_products(
    db: Session,
    skip: int = 0,
    limit: int = 0,
    search: str = "",
    category_id: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    featured_only: bool = False,
    sort: str = "newest",
) -> tuple[list[models.Product], int]:
    query = db.query(models.Product).options(
        joinedload(models.Product.category),
        joinedload(models.Product.images),
    )
    if search:
        query = query.filter(models.Product.name.ilike(f"%{search}%"))
    if category_id:
        query = query.filter(models.Product.category_id == category_id)
    if min_price is not None:
        query = query.filter(models.Product.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Product.price <= max_price)
    if featured_only:
        query = query.filter(models.Product.is_featured == True)

    if sort == "price_asc":
        query = query.order_by(models.Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(models.Product.price.desc())
    elif sort == "name":
        query = query.order_by(models.Product.name.asc())
    else:  # newest
        query = query.order_by(models.Product.created_at.desc())

    total = query.count()
    if limit > 0:
        query = query.offset(skip).limit(limit)
    products = query.all()
    for p in products:
        _enrich_product(db, p)
    return products, total


def get_product(db: Session, product_id: int) -> models.Product | None:
    product = db.query(models.Product).options(
        joinedload(models.Product.category),
        joinedload(models.Product.images),
    ).filter(models.Product.id == product_id).first()
    if product:
        _enrich_product(db, product)
    return product


def create_product(db: Session, data: schemas.ProductCreate) -> models.Product:
    product = models.Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return _enrich_product(db, product)


def update_product(db: Session, product_id: int, data: schemas.ProductUpdate) -> models.Product | None:
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return _enrich_product(db, product)


def delete_product(db: Session, product_id: int) -> bool:
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        return False
    db.delete(product)
    db.commit()
    return True


# --- Product Images ---
def add_product_image(db: Session, product_id: int, image_url: str, sort_order: int = 0) -> models.ProductImage:
    img = models.ProductImage(product_id=product_id, image_url=image_url, sort_order=sort_order)
    db.add(img)
    db.commit()
    db.refresh(img)
    return img


def delete_product_image(db: Session, image_id: int) -> bool:
    img = db.query(models.ProductImage).filter(models.ProductImage.id == image_id).first()
    if not img:
        return False
    db.delete(img)
    db.commit()
    return True


# --- Reviews ---
def get_reviews(db: Session, product_id: int) -> list[models.Review]:
    return db.query(models.Review).filter(
        models.Review.product_id == product_id
    ).order_by(models.Review.created_at.desc()).all()


def create_review(db: Session, product_id: int, user_id: int, data: schemas.ReviewCreate) -> models.Review:
    review = models.Review(product_id=product_id, user_id=user_id, **data.model_dump())
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def delete_review(db: Session, review_id: int) -> bool:
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        return False
    db.delete(review)
    db.commit()
    return True


def user_has_reviewed(db: Session, product_id: int, user_id: int) -> bool:
    return db.query(models.Review).filter(
        models.Review.product_id == product_id,
        models.Review.user_id == user_id,
    ).first() is not None


# --- Wishlist ---
def get_wishlist(db: Session, user_id: int) -> list[models.WishlistItem]:
    return db.query(models.WishlistItem).options(
        joinedload(models.WishlistItem.product).joinedload(models.Product.category),
        joinedload(models.WishlistItem.product).joinedload(models.Product.images),
    ).filter(
        models.WishlistItem.user_id == user_id
    ).order_by(models.WishlistItem.created_at.desc()).all()


def add_to_wishlist(db: Session, user_id: int, product_id: int) -> models.WishlistItem:
    existing = db.query(models.WishlistItem).filter(
        models.WishlistItem.user_id == user_id,
        models.WishlistItem.product_id == product_id,
    ).first()
    if existing:
        return existing
    item = models.WishlistItem(user_id=user_id, product_id=product_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def remove_from_wishlist(db: Session, user_id: int, product_id: int) -> bool:
    item = db.query(models.WishlistItem).filter(
        models.WishlistItem.user_id == user_id,
        models.WishlistItem.product_id == product_id,
    ).first()
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True


def is_in_wishlist(db: Session, user_id: int, product_id: int) -> bool:
    return db.query(models.WishlistItem).filter(
        models.WishlistItem.user_id == user_id,
        models.WishlistItem.product_id == product_id,
    ).first() is not None


def get_wishlist_product_ids(db: Session, user_id: int) -> list[int]:
    items = db.query(models.WishlistItem.product_id).filter(
        models.WishlistItem.user_id == user_id,
    ).all()
    return [item[0] for item in items]


# --- Orders ---
def create_order(
    db: Session, user_id: int, items: list[schemas.CheckoutItem], products: dict[int, models.Product]
) -> models.Order:
    total = sum(products[item.product_id].price * item.quantity for item in items)
    order = models.Order(user_id=user_id, total_amount=total)
    db.add(order)
    db.flush()

    for item in items:
        order_item = models.OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=products[item.product_id].price,
        )
        db.add(order_item)

    db.commit()
    db.refresh(order)
    return order


def get_all_orders(db: Session) -> list[models.Order]:
    return db.query(models.Order).order_by(models.Order.created_at.desc()).all()


def get_user_orders(db: Session, user_id: int) -> list[models.Order]:
    return db.query(models.Order).filter(
        models.Order.user_id == user_id
    ).order_by(models.Order.created_at.desc()).all()
