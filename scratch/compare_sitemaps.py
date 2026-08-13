import xml.etree.ElementTree as ET
import json
import os
import re

SITE_URL = "https://truthestate.in"

# 1. Parse Prod sitemap
prod_file = '/Users/gj/.gemini/antigravity/brain/33182201-aa57-47d1-b541-827b0c56d34b/.system_generated/steps/1341/content.md'
with open(prod_file, 'r', encoding='utf-8') as f:
    text = f.read()

xml_start = text.find('<?xml')
xml_content = text[xml_start:] if xml_start != -1 else text
root = ET.fromstring(xml_content)
namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}

prod_urls = [u.find('ns:loc', namespace).text for u in root.findall('ns:url', namespace)]
prod_set = set(prod_urls)

# 2. Build New Sitemap URLs based on updated sitemap.ts & compare.ts
new_urls = []

def add(path):
    url = f"{SITE_URL}{path}"
    if url not in new_urls:
        new_urls.append(url)

# Core pages
add("/")
add("/nri")
add("/the-record")
add("/intelligence")
add("/pricing")
add("/methodology")
add("/sun-vastu")
add("/about")
add("/vision")
add("/data-sources")

# Key Product Funnels
add("/deal-room")
add("/get-custom-project-report")

# Dynamic 3D Models in /public/tower-intel/
EXCLUDED_MODELS = {"projects-map.html", "elan-walk.html", "titanium-t7-102-walk.html", "dlf-arbour.html"}
tower_dir = '/Users/gj/.gemini/antigravity/scratch/Truth-Estate/public/tower-intel'
if os.path.exists(tower_dir):
    for f in sorted(os.listdir(tower_dir)):
        if f.endswith('.html') and not f.startswith('.') and f not in EXCLUDED_MODELS:
            add(f"/tower-intel/{f}")

# Intelligence hubs
add("/intelligence/projects")
add("/intelligence/developers")
add("/intelligence/markets")
add("/intelligence/compare")

# Best projects
best_slugs = [
    "under-3-cr-gurugram", "under-5-cr-gurugram", "under-8-cr-gurugram",
    "luxury-above-10-cr", "high-appreciation-cagr", "lowest-construction-delays", "new-launches"
]
for b in best_slugs:
    add(f"/best-projects/{b}")

# Legal
add("/privacy")
add("/terms")
add("/disclaimer")

# Project detail dossiers (from dataset / prod project list)
with open('/Users/gj/.gemini/antigravity/scratch/Truth-Estate/src/data/seo_category_growth_strategy.json', 'r', encoding='utf-8') as f:
    seo_data = json.load(f)

# Extract project slugs from prod URLs to match exact pipeline slugs
prod_project_slugs = [u.replace('https://truthestate.in/projects/', '') for u in prod_urls if '/projects/' in u]

for p_slug in prod_project_slugs:
    add(f"/projects/{p_slug}")

# Developers & Markets
prod_dev_slugs = [u.replace('https://truthestate.in/intelligence/developers/', '') for u in prod_urls if '/intelligence/developers/' in u]
for d in prod_dev_slugs:
    add(f"/intelligence/developers/{d}")

prod_mkt_slugs = [u.replace('https://truthestate.in/intelligence/markets/', '') for u in prod_urls if '/intelligence/markets/' in u]
for m in prod_mkt_slugs:
    add(f"/intelligence/markets/{m}")

# Compare Pairs:
# 1. Developer pairs (DEV_PAIRS)
for i in range(len(prod_dev_slugs)):
    for j in range(i + 1, len(prod_dev_slugs)):
        pair = "-vs-".join(sorted([prod_dev_slugs[i], prod_dev_slugs[j]]))
        add(f"/intelligence/compare/{pair}")

# 2. Market pairs (MARKET_PAIRS)
for i in range(len(prod_mkt_slugs)):
    for j in range(i + 1, len(prod_mkt_slugs)):
        pair = "-vs-".join(sorted([prod_mkt_slugs[i], prod_mkt_slugs[j]]))
        add(f"/intelligence/compare/{pair}")

# 3. High-intent Project pairs (filtered by same dev, same market, top tier >= 75)
# Top 40 scored projects
top_40 = seo_data[:40]

for i in range(len(top_40)):
    for j in range(i + 1, len(top_40)):
        p1 = top_40[i]
        p2 = top_40[j]
        
        same_dev = (p1['developerName'] == p2['developerName'])
        both_top = (p1['truthScore'] >= 75 and p2['truthScore'] >= 75)
        
        if same_dev or both_top:
            s1 = p1['projectName'].lower().replace(' ', '-')
            s2 = p2['projectName'].lower().replace(' ', '-')
            # Find matching prod project slugs if possible
            match1 = [s for s in prod_project_slugs if p1['projectName'].lower()[:8] in s]
            match2 = [s for s in prod_project_slugs if p2['projectName'].lower()[:8] in s]
            if match1 and match2:
                pair = "-vs-".join(sorted([match1[0], match2[0]]))
                add(f"/intelligence/compare/{pair}")

new_set = set(new_urls)

added_urls = sorted(list(new_set - prod_set))
removed_urls = sorted(list(prod_set - new_set))

print(f"=== SITEMAP COMPARISON SUMMARY ===")
print(f"Current Prod XML Total URLs: {len(prod_urls)}")
print(f"New Generated XML Total URLs: {len(new_urls)}")
print(f"Added URLs Count: {len(added_urls)}")
print(f"Removed URLs Count: {len(removed_urls)}")

print("\n--- ADDED URLS (New High-Value Pages) ---")
for u in added_urls:
    print(f"  + {u}")

print(f"\n--- REMOVED URLS (Sample of {len(removed_urls)} thin/synthetic comparison pairs filtered out) ---")
for u in removed_urls[:15]:
    print(f"  - {u}")
