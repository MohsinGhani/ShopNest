"""
Helper script to create project directories.
Run this first: python setup_dirs.py
"""
import os

dirs = [
    "backend/app/routes",
    "frontend/app/products/[id]",
    "frontend/app/login",
    "frontend/app/admin",
    "frontend/app/cart",
    "frontend/app/checkout",
    "frontend/components",
    "frontend/lib",
    "frontend/types",
]

for d in dirs:
    os.makedirs(d, exist_ok=True)
    print(f"Created: {d}")

# Create __init__.py files
init_files = [
    "backend/app/__init__.py",
    "backend/app/routes/__init__.py",
]

for f in init_files:
    with open(f, "w") as file:
        file.write("")
    print(f"Created: {f}")

print("\nDirectories created successfully!")
