import os
import json
import urllib.request

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
COMPONENTS_DIR = os.path.join(REPO_ROOT, "components")
CATALOG_PATH = os.path.join(REPO_ROOT, "catalog.json")
SKILL_CATALOG_PATH = os.path.join(REPO_ROOT, "skills", "framer-craft-vault", "catalog.json")
SYNC_WEBHOOK_URL = os.environ.get("SYNC_WEBHOOK_URL", "https://jishnupg-opencode-cli.hf.space/vault/api/sync")

def generate_catalog():
    print(f"Scanning components in {COMPONENTS_DIR}...")
    items = []
    
    if os.path.exists(COMPONENTS_DIR):
        for cat in sorted(os.listdir(COMPONENTS_DIR)):
            cat_dir = os.path.join(COMPONENTS_DIR, cat)
            if not os.path.isdir(cat_dir):
                continue
            for fname in sorted(os.listdir(cat_dir)):
                if fname.endswith(".tsx"):
                    slug = fname[:-4]
                    file_path = os.path.join(cat_dir, fname)
                    size = os.path.getsize(file_path)
                    
                    # Compute human-friendly clean title
                    title = slug.replace("-", " ").title()
                    
                    items.append({
                        "id": slug,
                        "slug": slug,
                        "title": title,
                        "clean_title": title,
                        "category": cat,
                        "code_size_bytes": size,
                        "source_url": f"https://www.framer.com/marketplace/components/{slug}/",
                        "module_url": f"https://framer.com/m/{slug}.js"
                    })

    print(f"Found {len(items)} components across all categories.")
    catalog_obj = {
        "total": len(items),
        "components": items
    }

    # Save to catalog.json at root
    with open(CATALOG_PATH, "w", encoding="utf-8") as f:
        json.dump(catalog_obj, f, indent=2)
    print(f"Updated {CATALOG_PATH}")

    # Save to skills/framer-craft-vault/catalog.json if directory exists
    if os.path.exists(os.path.dirname(SKILL_CATALOG_PATH)):
        with open(SKILL_CATALOG_PATH, "w", encoding="utf-8") as f:
            json.dump(catalog_obj, f, indent=2)
        print(f"Updated {SKILL_CATALOG_PATH}")

    # Notify webapp
    try:
        print(f"Notifying live WebApp at {SYNC_WEBHOOK_URL}...")
        req = urllib.request.Request(
            SYNC_WEBHOOK_URL,
            data=b"{}",
            headers={"Content-Type": "application/json", "User-Agent": "GitHub-Runner/1.0"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"Sync webhook response: {resp.getcode()} - {resp.read().decode('utf-8')[:100]}")
    except Exception as e:
        print(f"[NOTICE] Could not ping sync webhook (webapp will auto-refresh): {e}")

    return len(items)

if __name__ == "__main__":
    generate_catalog()
