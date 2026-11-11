import asyncio
import json
import os
import re
import subprocess
import time
import urllib.request
import sqlite3
from playwright.async_api import async_playwright

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DB_PATH = os.environ.get('DB_PATH', os.path.join(REPO_ROOT, 'components.db'))
OUTPUT_DIR = os.environ.get('OUTPUT_DIR', os.path.join(REPO_ROOT, 'components'))
GIT_REPO_DIR = os.environ.get('GIT_REPO_DIR', REPO_ROOT)

# Target categories and search feeds
CATEGORY_TARGETS = [
    ("heroes", "https://www.framer.com/marketplace/components/?search=hero"),
    ("bento", "https://www.framer.com/marketplace/components/?search=bento"),
    ("carousels", "https://www.framer.com/marketplace/components/categories/carousels/"),
    ("forms", "https://www.framer.com/marketplace/components/categories/forms/"),
    ("pricing", "https://www.framer.com/marketplace/components/?search=pricing"),
    ("footers", "https://www.framer.com/marketplace/components/?search=footer"),
    ("buttons", "https://www.framer.com/marketplace/components/categories/buttons/"),
    ("accordions", "https://www.framer.com/marketplace/components/categories/accordions/"),
    ("cards", "https://www.framer.com/marketplace/components/categories/cards/"),
    ("backgrounds", "https://www.framer.com/marketplace/components/categories/backgrounds/"),
    ("navigation", "https://www.framer.com/marketplace/components/categories/navigation/"),
    ("sections", "https://www.framer.com/marketplace/components/categories/sections/"),
    ("effects", "https://www.framer.com/marketplace/components/categories/effects/"),
    ("interactive", "https://www.framer.com/marketplace/components/categories/interactive/"),
    ("text", "https://www.framer.com/marketplace/components/categories/text/"),
    ("charts", "https://www.framer.com/marketplace/components/categories/charts/"),
    ("cursors", "https://www.framer.com/marketplace/components/categories/cursors/"),
    ("galleries", "https://www.framer.com/marketplace/components/categories/galleries/"),
    ("loaders", "https://www.framer.com/marketplace/components/categories/loaders/"),
    ("maps", "https://www.framer.com/marketplace/components/categories/maps/"),
    ("players", "https://www.framer.com/marketplace/components/categories/players/"),
    ("all-free", "https://www.framer.com/marketplace/components/?pricing=free"),
]

def get_existing_slugs():
    if not os.path.exists(DB_PATH):
        return set()
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT slug FROM components')
        slugs = set(r[0] for r in c.fetchall())
        conn.close()
        return slugs
    except Exception:
        return set()

def save_to_db(slug, title, category, source_url, module_url, code_tsx):
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO components (id, slug, title, category, source_url, module_url, code_tsx)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (slug, slug, title, category, source_url, module_url, code_tsx))
    conn.commit()
    conn.close()

def extract_original_tsx(module_url):
    try:
        req = urllib.request.Request(module_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode('utf-8')
            
        target_js_url = module_url
        for line in content.split('\n'):
            if 'https://framerusercontent.com/modules/' in line:
                parts = line.split('"')
                for p in parts:
                    if p.startswith('https://framerusercontent.com/modules/'):
                        target_js_url = p
                        break
                        
        map_url = target_js_url.rsplit('.', 1)[0] + '.map'
        map_req = urllib.request.Request(map_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(map_req, timeout=10) as resp:
            map_data = json.loads(resp.read().decode('utf-8'))
            
        if 'sourcesContent' in map_data and len(map_data['sourcesContent']) > 0:
            return map_data['sourcesContent'][0]
    except Exception:
        pass
    return None

def make_standalone_react(code: str) -> str:
    shim = '''// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};
'''
    clean_code = re.sub(
        r'import\s*\{[^}]*\}\s*from\s*["\']framer["\'];?',
        shim,
        code
    )
    return clean_code

def save_component_files(slug, title, category, source_url, module_url, code_tsx):
    cat_dir = os.path.join(OUTPUT_DIR, category)
    os.makedirs(cat_dir, exist_ok=True)
    out_path = os.path.join(cat_dir, f"{slug}.tsx")
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(code_tsx)
    save_to_db(slug, title, category, source_url, module_url, code_tsx)
    print(f"    [SAVED] {title} ({slug}) -> {out_path} ({len(code_tsx)} bytes)")

def git_commit_and_push(batch_count):
    try:
        subprocess.run(["git", "add", "."], cwd=GIT_REPO_DIR, capture_output=True, timeout=10)
        res = subprocess.run([
            "git", "commit", "-m", f"feat(vault): add {batch_count} newly harvested Framer components [skip ci]"
        ], cwd=GIT_REPO_DIR, capture_output=True, text=True, timeout=15)
        if res.returncode == 0:
            push_res = subprocess.run(["git", "push", "origin", "main"], cwd=GIT_REPO_DIR, capture_output=True, text=True, timeout=30)
            if push_res.returncode == 0:
                print(f"[GIT SYNC] Pushed batch of {batch_count} components to GitHub vault.")
    except Exception as e:
        print(f"[GIT NOTICE] {e}")

async def process_component_page(context, item_url, category, existing_slugs):
    slug = item_url.strip('/').split('/')[-1]
    if slug in existing_slugs:
        return False
        
    print(f"\n[+] Processing Page: {slug} ({category})")
    
    tab = None
    try:
        tab = await context.new_page()
        # Fast DOM content loaded instead of networkidle to prevent hangs on canvas/shaders
        await tab.goto(item_url, wait_until="domcontentloaded", timeout=12000)
        await asyncio.sleep(1.0)
        
        title = await tab.title()
        title = title.split(' - ')[0].replace('for Framer', '').strip()
        
        copy_btn = tab.locator('button:has-text("Copy Component")').first
        if await copy_btn.count() == 0:
            print(f"    [-] 'Copy Component' button not found (possibly paid). Skipping.")
            return False
            
        await copy_btn.click(timeout=5000)
        await asyncio.sleep(0.8)
        clipboard_text = await tab.evaluate("() => navigator.clipboard.readText()")
        
        if not clipboard_text or not clipboard_text.startswith("https://framer.com/m/"):
            print(f"    [-] Clipboard did not contain valid module URL.")
            return False
            
        raw_tsx = extract_original_tsx(clipboard_text)
        if not raw_tsx:
            print(f"    [-] Failed to recover original TSX from sourcemap.")
            return False
            
        clean_tsx = make_standalone_react(raw_tsx)
        save_component_files(slug, title, category, item_url, clipboard_text, clean_tsx)
        existing_slugs.add(slug)
        return True
        
    except Exception as e:
        print(f"    [-] Page error / timeout on {slug}: {e}")
        return False
    finally:
        if tab:
            try:
                await tab.close()
            except Exception:
                pass

async def safe_process_page(context, item_url, category, existing_slugs):
    # Absolute strict 15s timeout per page so it can NEVER get stuck
    try:
        return await asyncio.wait_for(process_component_page(context, item_url, category, existing_slugs), timeout=16.0)
    except asyncio.TimeoutError:
        print(f"    [-] STRICT TIMEOUT (16s exceeded) on {item_url}. Skipped safely.")
        return False
    except Exception as e:
        print(f"    [-] Unexpected exception on {item_url}: {e}")
        return False

async def process_api_item(item, existing_slugs):
    slug = item.get('slug')
    if not slug or slug in existing_slugs:
        return False
        
    title = item.get('title') or slug
    attributes = item.get('attributes', {})
    module_url = attributes.get('url')
    if not module_url or not module_url.startswith("https://framer.com/m/"):
        return False
        
    categories_meta = attributes.get('categories', [])
    if categories_meta:
        category = categories_meta[0].get('slug', 'general')
    else:
        tags = [t.get('slug') for t in attributes.get('tags', []) if t.get('slug') != 'free']
        category = tags[0] if tags else 'components'
        
    source_url = f"https://www.framer.com/marketplace/components/{slug}/"
    print(f"\n[+] Processing API Item: {title} ({slug}) in [{category}]")
    
    raw_tsx = extract_original_tsx(module_url)
    if not raw_tsx:
        return False
        
    clean_tsx = make_standalone_react(raw_tsx)
    save_component_files(slug, title, category, source_url, module_url, clean_tsx)
    existing_slugs.add(slug)
    return True

async def harvest_api_feed(page, feed_name, base_url, existing_slugs):
    print(f"\n==========================================")
    print(f"HARVESTING API FEED: {feed_name}")
    print(f"==========================================")
    
    cursor = None
    total_processed = 0
    
    for page_idx in range(1, 35):
        url = base_url
        if cursor:
            url += f"&cursor={cursor}"
            
        try:
            data = await page.evaluate(f'''async () => {{
                try {{
                    const res = await fetch('{url}');
                    if (!res.ok) return {{ data: [], pagination: {{}} }};
                    return await res.json();
                }} catch (e) {{
                    return {{ data: [], pagination: {{}} }};
                }}
            }}''')
        except Exception as e:
            print(f"Error fetching API feed {feed_name} p.{page_idx}: {e}")
            break
            
        items = data.get('data', [])
        if not items:
            break
            
        print(f"--- {feed_name} Page {page_idx}: {len(items)} items ---")
        for it in items:
            success = await process_api_item(it, existing_slugs)
            if success:
                total_processed += 1
                if total_processed % 15 == 0:
                    git_commit_and_push(15)
            await asyncio.sleep(0.02)
            
        cursor = data.get('pagination', {}).get('next')
        if not cursor:
            break
            
    print(f"[FEED COMPLETE] {feed_name}: Harvested {total_processed} new components.")
    return total_processed

async def crawl_category_pages(context, cat_name, target_url, existing_slugs):
    print(f"\n==========================================")
    print(f"CRAWLING CATEGORY: {cat_name.upper()} ({target_url})")
    print(f"==========================================")
    
    seen_links = set()
    tab = None
    try:
        tab = await context.new_page()
        await tab.goto(target_url, wait_until="domcontentloaded", timeout=15000)
        await asyncio.sleep(1.0)
        
        for scroll_idx in range(8):
            links = await tab.evaluate('''() => {
                const anchors = Array.from(document.querySelectorAll('a[href^="/marketplace/components/"]'));
                const filtered = anchors.filter(a => 
                    !a.href.includes('/categories/') && 
                    !a.href.includes('/explore/') && 
                    a.href !== 'https://www.framer.com/marketplace/components/' &&
                    !a.href.endsWith('/components/')
                );
                return Array.from(new Set(filtered.map(a => a.href)));
            }''')
            
            seen_links.update(links)
            await tab.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(1.0)
    except Exception as e:
        print(f"Failed to crawl category index {cat_name}: {e}")
    finally:
        if tab:
            try:
                await tab.close()
            except Exception:
                pass
                
    print(f"Found {len(seen_links)} candidates in {cat_name}")
    extracted = 0
    for link in seen_links:
        slug = link.strip('/').split('/')[-1]
        if slug in existing_slugs:
            continue
        success = await safe_process_page(context, link, cat_name, existing_slugs)
        if success:
            extracted += 1
            if extracted % 15 == 0:
                git_commit_and_push(15)
                
    return extracted

async def run_pipeline():
    existing_slugs = get_existing_slugs()
    print(f"[INIT] Existing components in SQLite DB: {len(existing_slugs)}")
    
    # Launch Chromium with GPU/WebGL and images completely disabled to prevent hangs
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-software-rasterizer",
                "--disable-webgl",
                "--blink-settings=imagesEnabled=false"
            ]
        )
        context = await browser.new_context(
            permissions=["clipboard-read", "clipboard-write"],
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
        )
        
        # 1. High-speed multi-feed API stream (Popular, Newest, Trending)
        main_page = await context.new_page()
        try:
            await main_page.goto('https://www.framer.com/marketplace/components/?pricing=free', wait_until='domcontentloaded', timeout=15000)
            
            feeds = [
                ("Free Popular", "https://www.framer.com/creators/api/unified/resources/?limit=64&pricing=free&sort=popular&type=component"),
                ("Free Newest", "https://www.framer.com/creators/api/unified/resources/?limit=64&pricing=free&sort=newest&type=component"),
                ("Free Trending", "https://www.framer.com/creators/api/unified/resources/?limit=64&pricing=free&sort=trending&type=component"),
                ("All Components Newest", "https://www.framer.com/creators/api/unified/resources/?limit=64&sort=newest&type=component"),
                ("All Components Popular", "https://www.framer.com/creators/api/unified/resources/?limit=64&sort=popular&type=component")
            ]
            
            for feed_name, base_url in feeds:
                try:
                    await harvest_api_feed(main_page, feed_name, base_url, existing_slugs)
                except Exception as e:
                    print(f"Error on feed {feed_name}: {e}")
        finally:
            await main_page.close()
            
        # 2. Deep crawl categories with isolated tabs
        for cat_name, target_url in CATEGORY_TARGETS:
            try:
                await crawl_category_pages(context, cat_name, target_url, existing_slugs)
            except Exception as e:
                print(f"[CAT ERROR] {cat_name}: {e}")
                
        await browser.close()
        
    total_now = len(get_existing_slugs())
    print(f"\n[SWEEP FINISHED] Total components in DB now: {total_now}")
    git_commit_and_push("sweep")

async def main():
    daemon_mode = os.environ.get('DAEMON_MODE', '0') == '1'
    max_rounds = int(os.environ.get('MAX_ROUNDS', '1' if not daemon_mode else '999999'))
    
    print("=" * 60)
    print(f"AESTHETE HIGH-SPEED FRAMER EXTRACTION ({'DAEMON' if daemon_mode else 'SINGLE-SWEEP'} MODE)")
    print(f"PID: {os.getpid()} | Max Rounds: {max_rounds}")
    print("=" * 60)
    
    round_num = 1
    while round_num <= max_rounds:
        print(f"\n>>> STARTING HARVEST RUN #{round_num} of {max_rounds} at {time.strftime('%Y-%m-%d %H:%M:%S')} <<<")
        try:
            await run_pipeline()
        except Exception as e:
            print(f"[RUN ERROR] Exception in harvester run #{round_num}: {e}")
            
        print(f">>> RUN #{round_num} COMPLETE. <<<")
        if round_num < max_rounds:
            print(f"Sleeping 90s before next scan...")
            await asyncio.sleep(90)
        round_num += 1

    print("\n[FINISHED] Harvester finished all scheduled sweeps successfully.")

if __name__ == "__main__":
    asyncio.run(main())
