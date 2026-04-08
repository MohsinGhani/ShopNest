"""
Agent Engine — the brain and control loop of the shopping assistant.

Architecture:
  User message → Intent detection → Plan → Execute tools → Evaluate → Respond

The brain uses rule-based intent detection. To upgrade to a real LLM,
replace `decide_next_action()` with an API call that returns the same
structured dict format.
"""

import re
from typing import Any
from sqlalchemy.orm import Session
from .tools import execute_tool, TOOL_DESCRIPTIONS


# ── Intent patterns ──────────────────────────────────────────────
INTENT_PATTERNS: list[tuple[str, list[str]]] = [
    ("greeting", [
        r"\b(hi|hello|hey|howdy|greetings|good\s*(morning|afternoon|evening))\b",
    ]),
    ("help", [
        r"\b(help|what can you do|what do you do|how do you work|commands|assist)\b",
    ]),
    ("my_orders", [
        r"\b(my\s*orders?|order\s*history|past\s*orders?|previous\s*orders?|show\s*(?:me\s*)?orders?|recent\s*orders?)\b",
        r"\b(orders?\s*(?:from|of|in|during|for)\s*(?:today|this\s*week|last\s*week|this\s*month|last\s*month|yesterday))\b",
        r"\b(what\s*(?:did\s*)?i\s*(?:order|buy|purchase))\b",
        r"\b(order\s*status|track\s*order|where.*(?:my|order))\b",
    ]),
    ("category_browse", [
        r"\b(categories|category|what.*(?:types|kinds)|show.*categories|list.*categories)\b",
    ]),
    ("product_detail", [
        r"\b(?:tell\s*(?:me\s*)?(?:about|more)|details?|info|information)\s+(?:about\s+)?(?:product\s*)?(?:#?\s*)?(\d+)\b",
        r"\bproduct\s*(?:#?\s*)?(\d+)\b",
        r"\b(?:id|ID)\s*:?\s*(\d+)\b",
    ]),
    ("compare", [
        r"\b(compare|comparison|versus|vs\.?|cheaper|cheapest|expensive|price\s*range)\b",
    ]),
    ("recommend", [
        r"\b(recommend|suggestion|suggest|best|top|popular|featured|pick|favorite|what.*(?:should|would).*(?:buy|get|choose))\b",
    ]),
    ("price_filter", [
        r"\b(?:under|below|less\s*than|max|up\s*to)\s*\$?\s*(\d+(?:\.\d+)?)\b",
        r"\b(?:over|above|more\s*than|at\s*least|min)\s*\$?\s*(\d+(?:\.\d+)?)\b",
        r"\$\s*(\d+(?:\.\d+)?)\s*(?:to|-)\s*\$?\s*(\d+(?:\.\d+)?)\b",
    ]),
    ("search", [
        r"\b(find|search|look\s*(?:for|up)|show|browse|shop|need|want|looking\s*for|any|have|got|sell|buy|get)\b",
    ]),
]


def _detect_intent(message: str) -> str:
    """Detect the primary intent from the user message."""
    msg = message.lower().strip()
    for intent, patterns in INTENT_PATTERNS:
        for pattern in patterns:
            if re.search(pattern, msg, re.IGNORECASE):
                return intent
    return "search"  # Default: treat as product search


def _extract_price_filters(message: str) -> dict:
    """Extract price constraints from the message."""
    msg = message.lower()
    filters: dict[str, float | None] = {"min_price": None, "max_price": None}

    # Range: $X to $Y
    range_match = re.search(r"\$?\s*(\d+(?:\.\d+)?)\s*(?:to|-)\s*\$?\s*(\d+(?:\.\d+)?)", msg)
    if range_match:
        filters["min_price"] = float(range_match.group(1))
        filters["max_price"] = float(range_match.group(2))
        return filters

    # Under/below $X
    under = re.search(r"(?:under|below|less\s*than|max|up\s*to|within|budget)\s*\$?\s*(\d+(?:\.\d+)?)", msg)
    if under:
        filters["max_price"] = float(under.group(1))

    # Over/above $X
    over = re.search(r"(?:over|above|more\s*than|at\s*least|min(?:imum)?)\s*\$?\s*(\d+(?:\.\d+)?)", msg)
    if over:
        filters["min_price"] = float(over.group(1))

    return filters


def _extract_category(message: str, categories: list[str]) -> str:
    """Try to match a category name from the message."""
    msg = message.lower()
    for cat in categories:
        if cat.lower() in msg:
            return cat
    return ""


def _extract_product_id(message: str) -> int | None:
    """Extract a product ID from the message."""
    patterns = [
        r"product\s*(?:#?\s*)?(\d+)",
        r"(?:id|ID)\s*:?\s*(\d+)",
        r"(?:about|details?)\s+(?:product\s*)?#?\s*(\d+)",
        r"\b#(\d+)\b",
    ]
    for pattern in patterns:
        m = re.search(pattern, message, re.IGNORECASE)
        if m:
            return int(m.group(1))
    return None


def _extract_search_query(message: str) -> str:
    """Extract the core search query by removing filler words."""
    msg = message.strip()
    # Remove common prefixes
    prefixes = [
        r"^(?:can you |please |i want to |i need |i'm looking for |show me |find me |search for |look for |do you have |any )",
        r"^(?:find|search|show|get|browse|look up|looking for|compare|comparison of)\s+",
    ]
    for prefix in prefixes:
        msg = re.sub(prefix, "", msg, flags=re.IGNORECASE).strip()
    # Remove price filters from query
    msg = re.sub(r"(?:under|below|above|over|less than|more than|up to|at least)\s*\$?\s*\d+(?:\.\d+)?", "", msg, flags=re.IGNORECASE).strip()
    # Remove category markers
    msg = re.sub(r"\b(?:in|from|under|category)\s+\w+\s*$", "", msg, flags=re.IGNORECASE).strip()
    # Clean up
    msg = re.sub(r"\s+", " ", msg).strip(" .,!?")
    return msg


def _extract_time_filter(message: str) -> str:
    """Extract time filter from order-related queries."""
    msg = message.lower()
    if re.search(r"\btoday\b", msg):
        return "today"
    if re.search(r"\bthis\s*week\b", msg):
        return "this_week"
    if re.search(r"\blast\s*week\b", msg):
        return "last_week"
    if re.search(r"\bthis\s*month\b", msg):
        return "this_month"
    if re.search(r"\blast\s*month\b", msg):
        return "last_month"
    if re.search(r"\byesterday\b", msg):
        return "today"  # close enough — will show recent
    return "all"


# ── Agent brain (decision maker) ────────────────────────────────

def decide_next_action(
    message: str,
    history: list[dict[str, Any]],
    available_categories: list[str],
    user_id: int | None = None,
) -> dict[str, Any]:
    """
    Decide the next action based on user message and history.

    Returns a dict with:
      {"action": "tool", "tool_name": "...", "tool_input": {...}}
      or
      {"action": "finish", "final_answer": "..."}

    To upgrade to a real LLM: replace this function with an API call
    that sends the message + history + tool descriptions as a prompt,
    and returns structured JSON in the same format.
    """

    # If we already have tool results, compose the final answer
    if history:
        last = history[-1]
        result = last["result"]

        # If the result is useful, finish with it
        if "not found" not in result.lower() and "no " not in result.lower()[:10]:
            return {
                "action": "finish",
                "final_answer": result,
            }

        # If first tool failed, try a broader search
        if len(history) == 1 and last["tool"] == "search_products":
            return {
                "action": "tool",
                "tool_name": "get_recommendations",
                "tool_input": {},
                "reasoning": "Search returned no results, falling back to recommendations.",
            }

        # Otherwise finish with whatever we have
        return {
            "action": "finish",
            "final_answer": result,
        }

    # First step: detect intent and plan action
    intent = _detect_intent(message)

    if intent == "greeting":
        return {
            "action": "finish",
            "final_answer": (
                "Hello! 👋 I'm your ShopNest shopping assistant. I can help you:\n\n"
                "• **Search** for products (e.g., \"find laptops under $500\")\n"
                "• **Browse** categories\n"
                "• **Get recommendations** and featured products\n"
                "• **Compare prices** on similar items\n"
                "• **View details** about any product (e.g., \"tell me about product #3\")\n\n"
                "What are you looking for today?"
            ),
        }

    if intent == "help":
        return {
            "action": "finish",
            "final_answer": (
                "Here's what I can help with:\n\n"
                "🔍 **Search**: \"find wireless headphones\", \"show me shoes\"\n"
                "📦 **Categories**: \"show categories\", \"what types of products?\"\n"
                "⭐ **Recommendations**: \"suggest something\", \"best products\"\n"
                "💰 **Price filter**: \"laptops under $200\", \"items between $10 and $50\"\n"
                "📊 **Compare**: \"compare phones\", \"cheapest laptops\"\n"
                "📋 **Details**: \"tell me about product #5\", \"details on product 3\"\n"
                "🛒 **My Orders**: \"show my orders\", \"orders from today\", \"orders from last week\"\n\n"
                "Just type naturally — I'll figure out what you need!"
            ),
        }

    if intent == "my_orders":
        time_filter = _extract_time_filter(message)
        return {
            "action": "tool",
            "tool_name": "get_user_orders",
            "tool_input": {"time_filter": time_filter},
            "reasoning": f"User wants to see their orders ({time_filter}).",
        }

    if intent == "category_browse":
        return {
            "action": "tool",
            "tool_name": "list_categories",
            "tool_input": {},
            "reasoning": "User wants to see available categories.",
        }

    if intent == "product_detail":
        pid = _extract_product_id(message)
        if pid:
            return {
                "action": "tool",
                "tool_name": "get_product_details",
                "tool_input": {"product_id": pid},
                "reasoning": f"User wants details on product #{pid}.",
            }
        # Couldn't parse ID — fall through to search
        return {
            "action": "finish",
            "final_answer": "Which product would you like details on? Please provide the product ID (e.g., \"product #3\").",
        }

    if intent == "compare":
        query = _extract_search_query(message)
        return {
            "action": "tool",
            "tool_name": "compare_prices",
            "tool_input": {"query": query or ""},
            "reasoning": f"User wants to compare prices for '{query}'.",
        }

    if intent == "recommend":
        category = _extract_category(message, available_categories)
        return {
            "action": "tool",
            "tool_name": "get_recommendations",
            "tool_input": {"category": category},
            "reasoning": f"User wants recommendations" + (f" in {category}" if category else "") + ".",
        }

    # Default: search (covers "search" and "price_filter" intents)
    query = _extract_search_query(message)
    prices = _extract_price_filters(message)
    category = _extract_category(message, available_categories)

    # If category matched, remove it from the search query to avoid double-filtering
    if category:
        query = re.sub(re.escape(category), "", query, flags=re.IGNORECASE).strip()

    return {
        "action": "tool",
        "tool_name": "search_products",
        "tool_input": {
            "query": query,
            "category": category,
            "min_price": prices["min_price"],
            "max_price": prices["max_price"],
        },
        "reasoning": f"Searching products: query='{query}', category='{category}', prices={prices}.",
    }


# ── Agent loop ───────────────────────────────────────────────────

MAX_STEPS = 4
ALLOWED_TOOLS = set(TOOL_DESCRIPTIONS.keys())


def run_agent(db: Session, message: str, user_id: int | None = None) -> dict[str, Any]:
    """
    Run the agent loop for a user message.

    Returns:
        {
            "reply": str,           # final answer to show the user
            "action_log": [...],    # list of steps taken (for transparency)
            "products": [...],      # product IDs mentioned (for frontend linking)
        }
    """
    # Get categories for intent extraction
    cats = [c.name for c in (db.query(__import__('backend.app.models', fromlist=['Category']).Category).all() if False else [])]
    try:
        from .. import models as m
        cats = [c.name for c in db.query(m.Category).all()]
    except Exception:
        cats = []

    history: list[dict[str, Any]] = []
    action_log: list[dict[str, Any]] = []

    for step in range(1, MAX_STEPS + 1):
        decision = decide_next_action(message, history, cats, user_id=user_id)

        # Log the decision
        log_entry = {
            "step": step,
            "action": decision["action"],
            "reasoning": decision.get("reasoning", ""),
        }

        if decision["action"] == "finish":
            log_entry["final"] = True
            action_log.append(log_entry)

            answer = decision["final_answer"]
            product_ids = _extract_product_ids_from_text(answer)

            return {
                "reply": answer,
                "action_log": action_log,
                "products": product_ids,
            }

        if decision["action"] == "tool":
            tool_name = decision["tool_name"]
            tool_input = decision["tool_input"]

            # Guardrail: only allowed tools
            if tool_name not in ALLOWED_TOOLS:
                log_entry["error"] = f"Tool '{tool_name}' is not allowed."
                action_log.append(log_entry)
                break

            result = execute_tool(db, tool_name, tool_input, user_id=user_id)

            log_entry["tool"] = tool_name
            log_entry["tool_input"] = tool_input
            action_log.append(log_entry)

            history.append({
                "step": step,
                "tool": tool_name,
                "input": tool_input,
                "result": result,
            })

    # Max steps reached
    final = history[-1]["result"] if history else "I couldn't complete your request. Please try rephrasing."
    return {
        "reply": final,
        "action_log": action_log,
        "products": _extract_product_ids_from_text(final),
    }


def _extract_product_ids_from_text(text: str) -> list[int]:
    """Extract product IDs like [3] or #3 from agent output text."""
    return [int(m) for m in re.findall(r"\[(\d+)\]", text)]
