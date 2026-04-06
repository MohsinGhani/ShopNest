from sqlalchemy.orm import Session
from . import crud, models, schemas


CATEGORIES = [
    {"name": "Electronics", "slug": "electronics"},
    {"name": "Clothing", "slug": "clothing"},
    {"name": "Shoes", "slug": "shoes"},
    {"name": "Accessories", "slug": "accessories"},
]


DEMO_PRODUCTS = [
    # Electronics
    {
        "name": "Wireless Headphones",
        "description": "Premium noise-cancelling wireless headphones with 30-hour battery life.",
        "price": 79.99,
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
        "category_slug": "electronics",
        "is_featured": True,
        "extra_images": [
            "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400",
            "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400",
        ],
    },
    {
        "name": "Mechanical Keyboard",
        "description": "Compact mechanical keyboard with RGB backlighting and Cherry MX switches.",
        "price": 129.99,
        "image_url": "https://images.unsplash.com/photo-1595225476474-87563907a212?w=400",
        "category_slug": "electronics",
        "is_featured": True,
        "extra_images": [
            "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400",
            "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400",
        ],
    },
    {
        "name": "USB-C Hub",
        "description": "7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader, and PD charging.",
        "price": 34.99,
        "image_url": "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400",
        "category_slug": "electronics",
        "extra_images": [],
    },
    {
        "name": "Laptop Stand",
        "description": "Ergonomic aluminum laptop stand for better posture and airflow.",
        "price": 45.00,
        "image_url": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400",
        "category_slug": "electronics",
        "extra_images": [
            "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400",
        ],
    },
    {
        "name": "Desk Lamp",
        "description": "LED desk lamp with adjustable brightness and color temperature.",
        "price": 29.99,
        "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400",
        "category_slug": "electronics",
        "extra_images": [],
    },
    {
        "name": "Wireless Mouse",
        "description": "Ergonomic wireless mouse with precision tracking and long battery life.",
        "price": 24.99,
        "image_url": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400",
        "category_slug": "electronics",
        "is_featured": True,
        "extra_images": [],
    },
    # Clothing
    {
        "name": "Classic T-Shirt",
        "description": "Soft cotton t-shirt available in multiple colors. Comfortable everyday wear.",
        "price": 19.99,
        "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
        "category_slug": "clothing",
        "extra_images": [
            "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400",
        ],
    },
    {
        "name": "Denim Jacket",
        "description": "Classic denim jacket with a modern slim fit. Perfect for layering.",
        "price": 89.99,
        "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400",
        "category_slug": "clothing",
        "is_featured": True,
        "extra_images": [
            "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400",
            "https://images.unsplash.com/photo-1559551409-dadc959f76b8?w=400",
        ],
    },
    {
        "name": "Hoodie",
        "description": "Cozy fleece-lined hoodie with kangaroo pocket. Ideal for casual outings.",
        "price": 49.99,
        "image_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400",
        "category_slug": "clothing",
        "extra_images": [],
    },
    # Shoes
    {
        "name": "Running Sneakers",
        "description": "Lightweight running shoes with responsive cushioning and breathable mesh.",
        "price": 99.99,
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
        "category_slug": "shoes",
        "is_featured": True,
        "extra_images": [
            "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400",
            "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400",
        ],
    },
    {
        "name": "Canvas Slip-Ons",
        "description": "Casual canvas slip-on shoes. Simple, lightweight, and versatile.",
        "price": 39.99,
        "image_url": "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400",
        "category_slug": "shoes",
        "extra_images": [],
    },
    {
        "name": "Leather Boots",
        "description": "Genuine leather boots with durable outsole. Timeless style for any season.",
        "price": 149.99,
        "image_url": "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400",
        "category_slug": "shoes",
        "extra_images": [],
    },
    # Accessories
    {
        "name": "Leather Wallet",
        "description": "Slim bifold wallet crafted from genuine leather with RFID blocking.",
        "price": 29.99,
        "image_url": "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400",
        "category_slug": "accessories",
        "extra_images": [],
    },
    {
        "name": "Sunglasses",
        "description": "Polarized sunglasses with UV400 protection and lightweight titanium frame.",
        "price": 59.99,
        "image_url": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
        "category_slug": "accessories",
        "is_featured": True,
        "extra_images": [
            "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400",
        ],
    },
    {
        "name": "Canvas Backpack",
        "description": "Durable canvas backpack with padded laptop compartment and water-resistant coating.",
        "price": 54.99,
        "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
        "category_slug": "accessories",
        "extra_images": [],
    },
    {
        "name": "Wrist Watch",
        "description": "Minimalist analog watch with stainless steel case and genuine leather strap.",
        "price": 119.99,
        "image_url": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400",
        "category_slug": "accessories",
        "is_featured": True,
        "extra_images": [
            "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400",
            "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=400",
        ],
    },
]


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
