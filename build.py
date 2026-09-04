#!/usr/bin/env python3
"""
Blossomly Copycat - Product Scanner
Scans the products/ folder for image + text file pairs and generates products.json.
To add a new product:
  1. Place an image (png, jpg, jpeg, svg, webp) in products/
  2. Place a matching .txt file with the same name in products/
  3. Run: python3 build.py
"""

import os
import json
import re
import sys

PRODUCTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "products")
ANNOUNCEMENT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "announcement")
PRODUCTS_OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "products.json")
ANNOUNCEMENT_OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "announcement.json")

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif"}


def parse_txt(filepath):
    """Parse a product .txt file. Expected format:
    First line: product name (or derived from filename)
    Rest: description
    Lines starting with 'Price:' or 'Category:' are metadata.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f.readlines() if line.strip()]

    name = ""
    description_lines = []
    price = ""
    category = ""

    for line in lines:
        if line.lower().startswith("price:"):
            price = line.split(":", 1)[1].strip()
        elif line.lower().startswith("category:"):
            category = line.split(":", 1)[1].strip()
        elif not name:
            name = line
        else:
            description_lines.append(line)

    return {
        "name": name,
        "description": " ".join(description_lines),
        "price": price,
        "category": category,
    }


def slugify(text):
    """Convert text to a URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "_", text)
    return text


def scan_products():
    """Scan products/ folder and return a list of product dicts."""
    products = []

    if not os.path.isdir(PRODUCTS_DIR):
        print(f"Error: Products directory not found at {PRODUCTS_DIR}")
        sys.exit(1)

    # Find all .txt files
    txt_files = {}
    image_files = {}

    for filename in os.listdir(PRODUCTS_DIR):
        filepath = os.path.join(PRODUCTS_DIR, filename)
        if not os.path.isfile(filepath):
            continue

        name, ext = os.path.splitext(filename)
        ext_lower = ext.lower()

        if ext_lower == ".txt":
            txt_files[name] = filepath
        elif ext_lower in IMAGE_EXTENSIONS:
            # If multiple images exist for same name, keep the first one
            if name not in image_files:
                image_files[name] = filename

    # Match txt files with images
    for name, txt_path in txt_files.items():
        parsed = parse_txt(txt_path)

        # Use filename as product name if not specified in txt
        if not parsed["name"]:
            parsed["name"] = name.replace("_", " ").replace("-", " ").title()

        # Find matching image
        image_file = image_files.get(name, "")
        image_path = f"products/{image_file}" if image_file else ""

        # Generate slug from the product name
        slug = slugify(parsed["name"])

        products.append(
            {
                "id": slug,
                "name": parsed["name"],
                "description": parsed["description"],
                "price": parsed["price"],
                "category": parsed["category"],
                "image": image_path,
                "txt_file": f"products/{name}.txt",
            }
        )

    # Sort by name
    products.sort(key=lambda p: p["name"])

    return products


def read_announcement():
    """Read the announcement/ folder and return the announcement text.
    If announcement/text.txt exists and is not empty, the bar is shown.
    If the file is empty or missing, the bar is hidden (announcement turned off).
    """
    text_path = os.path.join(ANNOUNCEMENT_DIR, "text.txt")

    if not os.path.isfile(text_path):
        return ""

    with open(text_path, "r", encoding="utf-8") as f:
        return f.read().strip()


def main():
    products = scan_products()

    with open(PRODUCTS_OUTPUT, "w", encoding="utf-8") as f:
        json.dump({"products": products}, f, indent=2, ensure_ascii=False)

    announcement = read_announcement()
    with open(ANNOUNCEMENT_OUTPUT, "w", encoding="utf-8") as f:
        json.dump({"text": announcement}, f, indent=2, ensure_ascii=False)

    print(f"Found {len(products)} product(s):")
    for p in products:
        img_status = "✓" if p["image"] else "✗ (no image)"
        print(f"  - {p['name']} [{p['category'] or 'Uncategorized'}] {p['price'] or 'No price'} {img_status}")

    print(f"Announcement: {'ON - ' + announcement if announcement else 'OFF'}")
    print(f"\nGenerated {PRODUCTS_OUTPUT} and {ANNOUNCEMENT_OUTPUT}")


if __name__ == "__main__":
    main()
