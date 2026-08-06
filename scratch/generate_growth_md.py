import json

with open("/Users/gj/.gemini/antigravity/scratch/Truth-Estate/scratch/seo_category_growth_strategy.json") as f:
    data = json.load(f)

md = []
md.append("# Truth Estate — Category Design & Search Behavior Strategy (97 Projects)\n")
md.append("> **Objective**: Become the unassailable pre-booking decision layer in Indian real estate (The CIBIL / CarFax for ₹2 Cr – ₹20 Cr residential purchases).  \n")
md.append("> **Audience**: High Net Worth Buyers (CXOs, Founders, NRIs, Investors) experiencing post-shortlist anxiety prior to paying the booking fee.  \n")
md.append("> **Strict Formatting Constraints**: Titles ≤ 60 chars (Intent match in first 25 chars) | Meta Descriptions ≤ 155 chars (The Economist × Apple tone) | Zero internal buzzwords.  \n\n")

md.append("## Category Design Breakdown Across 7 Psychological Vectors\n")
md.append("| # | Project Name | Developer | Primary Emotion | SEO Title (Chars) | Meta Description (Chars) | Reasoning | Expected CTR | Conf |\n")
md.append("|---|---|---|---|---|---|---|---|---|\n")

for x in data:
    md.append(
        f"| {x['index']} | **{x['projectName']}** | {x['developerName']} | `{x['primaryEmotion']}` | `{x['seoTitle']}` ({x['seoTitleLength']}) | {x['metaDescription']} ({x['metaDescriptionLength']}) | {x['reasoning']} | {x['expectedCtrImprovement']} | {x['confidence']}/10 |\n"
    )

with open("/Users/gj/.gemini/antigravity/scratch/Truth-Estate/scratch/seo_category_growth_strategy.md", "w") as f:
    f.writelines(md)

print("Generated Markdown strategy doc successfully.")
