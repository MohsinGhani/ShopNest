"""
Agent Tools — functions the shopping assistant can call.
Each tool queries the real database and returns a plain-text result
that the agent brain can use to compose its final answer.
"""

from sqlalchemy.orm import Session
from .. import crud, models


# ── Tool registry ────────────────────────────────────────────────
TOOL_DESCRIPTIONS = {
    "search_products": "Search products by keyword, category, or price range. Input: JSON with optional keys: query, category, min_price, max_price, sort.",
    "list_categories": "List all available product categories. No input needed.",
    "get_product_details": "Get detailed info about a specific product by ID. Input: product_id (int).",
    "get_recommendations": "Get top-rated and featured product recommendations. Input: optional category name.",
    "compare_prices": "Compare prices of products matching a search term. Input: search query string.",
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


# ── Tool dispatcher ──────────────────────────────────────────────
def execute_tool(db: Session, tool_name: str, tool_input: dict) -> str:
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
        else:
            return f"Tool '{tool_name}' is not implemented."
    except Exception as e:
        return f"Tool execution failed: {e}"
