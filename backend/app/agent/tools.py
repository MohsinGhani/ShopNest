"""
Agent Tools — functions the shopping assistant can call.
Each tool queries the real database and returns a plain-text result
that the agent brain can use to compose its final answer.
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session, joinedload
from .. import crud, models


# ── Tool registry ────────────────────────────────────────────────
TOOL_DESCRIPTIONS = {
    "search_products": "Search products by keyword, category, or price range. Input: JSON with optional keys: query, category, min_price, max_price, sort.",
    "list_categories": "List all available product categories. No input needed.",
    "get_product_details": "Get detailed info about a specific product by ID. Input: product_id (int).",
    "get_recommendations": "Get top-rated and featured product recommendations. Input: optional category name.",
    "compare_prices": "Compare prices of products matching a search term. Input: search query string.",
    "get_user_orders": "Get the authenticated user's order history. Input: optional time_filter ('today', 'this_week', 'last_week', 'this_month', 'last_month', 'all'). Requires user_id.",
}

TOOL_NAMES = set(TOOL_DESCRIPTIONS.keys())


# ── Tool implementations ────────────────────────────────────────

def search_products(db: Session, query: str = "", category: str = "",
                    min_price: float | None = None, max_price: float | None = None,
                    sort: str = "newest") -> str:
    """Search products with filters. Returns formatted text."""
    category_id = None
    if category:
        cats = crud.get_categories(db)
        for c in cats:
            if c.name.lower() == category.lower() or c.slug.lower() == category.lower():
                category_id = c.id
                break

    products, total = crud.get_products(
        db, skip=0, limit=6, search=query,
        category_id=category_id, min_price=min_price, max_price=max_price, sort=sort,
    )

    if not products:
        return "No products found matching your criteria."

    lines = [f"Found {total} product(s). Here are the top results:\n"]
    for p in products:
        cat_name = p.category.name if p.category else "Uncategorized"
        rating = f"★ {p.avg_rating}/5 ({p.review_count} reviews)" if p.review_count else "No reviews yet"
        featured = " ⭐ Featured" if p.is_featured else ""
        lines.append(f"• [{p.id}] {p.name} — ${p.price:.2f} | {cat_name} | {rating}{featured}")
    return "\n".join(lines)


def list_categories(db: Session) -> str:
    """List all product categories."""
    cats = crud.get_categories(db)
    if not cats:
        return "No categories available."
    lines = ["Available categories:"]
    for c in cats:
        count = db.query(models.Product).filter(models.Product.category_id == c.id).count()
        lines.append(f"• {c.name} ({count} products)")
    return "\n".join(lines)


def get_product_details(db: Session, product_id: int) -> str:
    """Get detailed product information."""
    p = crud.get_product(db, product_id)
    if not p:
        return f"Product with ID {product_id} not found."

    cat_name = p.category.name if p.category else "Uncategorized"
    rating = f"★ {p.avg_rating}/5 ({p.review_count} reviews)" if p.review_count else "No reviews yet"
    featured = "Yes" if p.is_featured else "No"
    images = len(p.images) + (1 if p.image_url else 0)

    return (
        f"Product: {p.name} (ID: {p.id})\n"
        f"Price: ${p.price:.2f}\n"
        f"Category: {cat_name}\n"
        f"Rating: {rating}\n"
        f"Featured: {featured}\n"
        f"Images: {images}\n"
        f"Description: {p.description or 'No description available.'}"
    )


def get_recommendations(db: Session, category: str = "") -> str:
    """Get featured and top-rated product recommendations."""
    # First try featured products
    category_id = None
    if category:
        cats = crud.get_categories(db)
        for c in cats:
            if c.name.lower() == category.lower() or c.slug.lower() == category.lower():
                category_id = c.id
                break

    featured, _ = crud.get_products(db, limit=4, featured_only=True, category_id=category_id)

    # Also get top products sorted by price (as proxy for popular)
    all_prods, _ = crud.get_products(db, limit=6, category_id=category_id, sort="newest")

    # Merge and deduplicate, prioritize featured
    seen = set()
    results = []
    for p in featured + all_prods:
        if p.id not in seen and len(results) < 5:
            seen.add(p.id)
            results.append(p)

    if not results:
        return "No recommendations available" + (f" in {category}" if category else "") + "."

    # Sort by rating (best first)
    results.sort(key=lambda p: (p.avg_rating, p.is_featured), reverse=True)

    category_label = f" in {category}" if category else ""
    lines = [f"Recommended products{category_label}:\n"]
    for p in results:
        cat_name = p.category.name if p.category else "Uncategorized"
        rating = f"★ {p.avg_rating}/5" if p.review_count else "New"
        featured_tag = " ⭐" if p.is_featured else ""
        lines.append(f"• [{p.id}] {p.name} — ${p.price:.2f} | {rating}{featured_tag}")
    return "\n".join(lines)


def compare_prices(db: Session, query: str) -> str:
    """Compare prices of products matching a search term."""
    products, total = crud.get_products(db, search=query, sort="price_asc", limit=8)

    # If no direct name match, try matching by category
    if not products:
        cats = crud.get_categories(db)
        for c in cats:
            if c.name.lower() in query.lower() or query.lower() in c.name.lower():
                products, total = crud.get_products(db, category_id=c.id, sort="price_asc", limit=8)
                if products:
                    query = c.name
                    break

    if not products:
        return f"No products found matching '{query}' for price comparison."

    lines = [f"Price comparison for '{query}' ({total} found):\n"]
    prices = [p.price for p in products]
    lines.append(f"Price range: ${min(prices):.2f} – ${max(prices):.2f}")
    if len(prices) > 1:
        avg = sum(prices) / len(prices)
        lines.append(f"Average: ${avg:.2f}\n")

    lines.append("Products (cheapest first):")
    for p in products:
        rating = f"★ {p.avg_rating}" if p.review_count else "No reviews"
        lines.append(f"• [{p.id}] {p.name} — ${p.price:.2f} ({rating})")
    return "\n".join(lines)


def get_user_orders(db: Session, user_id: int | None, time_filter: str = "all") -> str:
    """Get the user's order history with optional time filtering."""
    if not user_id:
        return "You need to be signed in to view your orders. Please log in first."

    now = datetime.now(timezone.utc)

    # Determine date cutoff based on filter
    date_cutoff = None
    filter_label = "all time"
    if time_filter == "today":
        date_cutoff = now.replace(hour=0, minute=0, second=0, microsecond=0)
        filter_label = "today"
    elif time_filter == "this_week":
        date_cutoff = now - timedelta(days=now.weekday())
        date_cutoff = date_cutoff.replace(hour=0, minute=0, second=0, microsecond=0)
        filter_label = "this week"
    elif time_filter == "last_week":
        start_of_this_week = now - timedelta(days=now.weekday())
        start_of_this_week = start_of_this_week.replace(hour=0, minute=0, second=0, microsecond=0)
        date_cutoff = start_of_this_week - timedelta(days=7)
        filter_label = "last week"
    elif time_filter == "this_month":
        date_cutoff = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        filter_label = "this month"
    elif time_filter == "last_month":
        first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        date_cutoff = (first_of_month - timedelta(days=1)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        filter_label = "last month"

    # Query orders
    query = (
        db.query(models.Order)
        .filter(models.Order.user_id == user_id)
        .options(
            joinedload(models.Order.items).joinedload(models.OrderItem.product)
        )
        .order_by(models.Order.created_at.desc())
    )

    if date_cutoff:
        query = query.filter(models.Order.created_at >= date_cutoff)
        # For "last_week", also cap at start of this week
        if time_filter == "last_week":
            start_of_this_week = now - timedelta(days=now.weekday())
            start_of_this_week = start_of_this_week.replace(hour=0, minute=0, second=0, microsecond=0)
            query = query.filter(models.Order.created_at < start_of_this_week)
        # For "last_month", cap at start of this month
        if time_filter == "last_month":
            first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            query = query.filter(models.Order.created_at < first_of_month)

    orders = query.limit(10).all()

    if not orders:
        return f"No orders found for {filter_label}."

    lines = [f"Your orders ({filter_label}) — {len(orders)} order(s):\n"]
    for order in orders:
        date_str = order.created_at.strftime("%b %d, %Y") if order.created_at else "Unknown date"
        lines.append(f"📦 Order #{order.id} — ${order.total_amount:.2f} — {date_str}")
        for item in order.items:
            product_name = item.product.name if item.product else f"Product #{item.product_id}"
            lines.append(f"   • {product_name} × {item.quantity} — ${item.price:.2f} each")
    
    total_spent = sum(o.total_amount for o in orders)
    lines.append(f"\nTotal spent ({filter_label}): ${total_spent:.2f}")
    return "\n".join(lines)


# ── Tool dispatcher ──────────────────────────────────────────────
def execute_tool(db: Session, tool_name: str, tool_input: dict, user_id: int | None = None) -> str:
    """Execute a tool by name with given inputs. Returns result string."""
    if tool_name not in TOOL_NAMES:
        return f"Unknown tool: {tool_name}"

    try:
        if tool_name == "search_products":
            return search_products(
                db,
                query=tool_input.get("query", ""),
                category=tool_input.get("category", ""),
                min_price=tool_input.get("min_price"),
                max_price=tool_input.get("max_price"),
                sort=tool_input.get("sort", "newest"),
            )
        elif tool_name == "list_categories":
            return list_categories(db)
        elif tool_name == "get_product_details":
            return get_product_details(db, product_id=int(tool_input.get("product_id", 0)))
        elif tool_name == "get_recommendations":
            return get_recommendations(db, category=tool_input.get("category", ""))
        elif tool_name == "compare_prices":
            return compare_prices(db, query=tool_input.get("query", ""))
        elif tool_name == "get_user_orders":
            return get_user_orders(db, user_id=user_id, time_filter=tool_input.get("time_filter", "all"))
        else:
            return f"Tool '{tool_name}' is not implemented."
    except Exception as e:
        return f"Tool execution failed: {e}"
