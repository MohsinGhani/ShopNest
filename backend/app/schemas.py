from pydantic import BaseModel, Field
from datetime import datetime


# --- Auth ---
class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    role: str


class UserProfileOut(BaseModel):
    id: int
    email: str
    role: str
    name: str
    created_at: datetime | None = None
    order_count: int = 0

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    name: str | None = None


# --- Category ---
class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str
    slug: str


# --- Product Image ---
class ProductImageOut(BaseModel):
    id: int
    image_url: str
    sort_order: int

    model_config = {"from_attributes": True}


# --- Product ---
class ProductCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    image_url: str = ""
    category_id: int | None = None
    is_featured: bool = False


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    image_url: str | None = None
    category_id: int | None = None
    is_featured: bool | None = None


class ProductOut(BaseModel):
    id: int
    name: str
    description: str
    price: float
    image_url: str
    category_id: int | None = None
    is_featured: bool = False
    created_at: datetime | None = None
    category: CategoryOut | None = None
    images: list[ProductImageOut] = []
    avg_rating: float = 0
    review_count: int = 0

    model_config = {"from_attributes": True}


class PaginatedProducts(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    per_page: int
    pages: int


# --- Review ---
class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = ""


class ReviewOut(BaseModel):
    id: int
    product_id: int
    user_id: int
    user_email: str = ""
    rating: int
    comment: str
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Wishlist ---
class WishlistItemOut(BaseModel):
    id: int
    product_id: int
    product: ProductOut
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Checkout ---
class CheckoutItem(BaseModel):
    product_id: int
    quantity: int


class CheckoutRequest(BaseModel):
    items: list[CheckoutItem]


class OrderOut(BaseModel):
    id: int
    total_amount: float
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    price: float
    product: ProductOut

    model_config = {"from_attributes": True}


class OrderDetailOut(BaseModel):
    id: int
    user_id: int
    user_email: str
    total_amount: float
    created_at: datetime
    items: list[OrderItemOut]

    model_config = {"from_attributes": True}
