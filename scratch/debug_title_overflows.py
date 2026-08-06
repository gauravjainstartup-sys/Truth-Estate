import json

with open("/Users/gj/.gemini/antigravity/scratch/Truth-Estate/scratch/seo_category_growth_strategy.json") as f:
    data = json.load(f)

overflows = [x for x in data if x["seoTitleLength"] > 60]
for x in overflows:
    print(f"Index {x['index']}: {x['projectName']} | Title: '{x['seoTitle']}' ({x['seoTitleLength']} chars)")
