from sqlalchemy.orm import Session
from . import crud, models, schemas
from .seed_categories import CATEGORIES
from .seed_products import DEMO_PRODUCTS


def seed_database(db: Session) -> None:
    # Check if already seeded
    if db.query(models.User).first():
        return

    # Create demo users
    crud.create_user(db, email="admin@example.com", password="admin123", role="admin", name="Admin User")
    crud.create_user(db, email="user@example.com", password="user123", role="user", name="Demo User")

    # Create categories
    cat_map: dict[str, models.Category] = {}
    for cat_data in CATEGORIES:
        cat = models.Category(**cat_data)
        db.add(cat)
        db.flush()
        cat_map[cat_data["slug"]] = cat

    # Create demo products
    for product_data in DEMO_PRODUCTS:
        extra_images = product_data.pop("extra_images", [])
        category_slug = product_data.pop("category_slug", None)
        category_id = cat_map[category_slug].id if category_slug and category_slug in cat_map else None

        product = models.Product(
            name=product_data["name"],
            description=product_data["description"],
            price=product_data["price"],
            image_url=product_data["image_url"],
            category_id=category_id,
            is_featured=product_data.get("is_featured", False),
        )
        db.add(product)
        db.flush()

        for i, img_url in enumerate(extra_images):
            img = models.ProductImage(product_id=product.id, image_url=img_url, sort_order=i)
            db.add(img)

    db.commit()
    print("Database seeded with demo data.")
