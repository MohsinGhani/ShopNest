import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, SessionLocal, Base
from .models import User, Product, Order, OrderItem, Category, ProductImage, Review, WishlistItem  # noqa: F401
from .seed import seed_database
from .routes import auth, products, checkout, orders, upload, categories, reviews, wishlist, profile, agent

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables and seed on startup
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(title="E-Commerce Demo API", version="1.0.0", lifespan=lifespan)

# CORS – allow Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Register routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(reviews.router)
app.include_router(wishlist.router)
app.include_router(checkout.router)
app.include_router(orders.router)
app.include_router(upload.router)
app.include_router(profile.router)
app.include_router(agent.router)


@app.get("/")
def root():
    return {"message": "E-Commerce Demo API is running"}
