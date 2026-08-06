import json
import csv

with open("/Users/gj/.gemini/antigravity/scratch/Truth-Estate/scratch/seo_rewrite_results.json", "r") as f:
    data = json.load(f)

perfect_list = []

for r in data:
    p = r["projectName"]
    d = r["developerName"]
    s = r["truthScore"]

    score_str = f"Truth Score {s}" if s != "N/A" else "Truth Score"
    short_score = f"Score {s}" if s != "N/A" else "Score"

    # Candidate titles
    t_options = [
        f"{p} Review (2026): Worth Buying? {score_str}",
        f"{p} Review: Worth Buying? {score_str}",
        f"{p} Review: Should You Buy? {score_str}",
        f"{p} Review (2026): Verdict & {score_str}",
        f"{p} Review: Verdict & {score_str}",
        f"{p} Review: Buyer Guide & {score_str}",
        f"{p} Review: Worth Buying? {short_score}",
        f"{p} Review: Should You Buy? {short_score}",
        f"{p} Review: Verdict & {short_score}",
        f"{p} Review (2026): {short_score}",
        f"{p} Review: {score_str}",
        f"{p} Review: {short_score}",
        f"{p} Review: Verdict & Buyer Guide",
        f"{p} Review: Verdict",
    ]

    new_title = ""
    for t in t_options:
        if len(t.strip()) <= 60:
            new_title = t.strip()
            break

    # Candidate meta descriptions (140-160 chars)
    d_options = [
        f"Should you buy {p} by {d}? Discover legal risks, construction progress, pricing, developer track record and delivery outlook before booking.",
        f"Thinking of buying {p} by {d}? Explore legal risks, construction progress, pricing, developer history and delivery outlook before booking.",
        f"Planning to buy {p} by {d}? Discover legal risks, construction progress, pricing, developer track record and delivery outlook before you invest.",
        f"Considering an investment in {p} by {d}? Uncover legal risks, construction progress, pricing and delivery outlook before booking.",
        f"Should you invest in {p} by {d}? Read our review covering legal risks, construction progress, pricing and delivery outlook before booking.",
        f"Thinking of buying {p}? Discover legal risks, construction progress, pricing, developer history and delivery outlook before paying booking amount.",
        f"Should you buy {p}? Explore legal risks, construction progress, pricing, developer track record and delivery outlook before paying booking amount.",
        f"Planning to buy {p}? Discover legal risks, construction progress, pricing, developer history and delivery outlook before paying booking amount.",
        f"Considering {p} by {d}? Uncover legal risks, construction progress, pricing and delivery outlook before paying booking amount.",
        f"Should you buy {p} by {d}? Discover legal risks, construction progress, pricing and delivery outlook before paying the booking amount.",
        f"Thinking of buying {p}? Uncover legal risks, construction progress, pricing, developer track record and delivery outlook before booking.",
        f"Should you buy {p}? Review legal risks, construction progress, pricing and delivery outlook before paying your booking amount.",
        f"Thinking of buying {p}? Uncover legal risks, construction progress, pricing and delivery outlook before paying your booking amount.",
        f"Planning to buy {p}? Discover legal risks, construction progress, pricing and delivery outlook before paying your booking amount.",
        f"Considering {p}? Explore legal risks, construction progress, pricing and delivery outlook before paying your booking amount.",
        f"Should you buy {p}? Review legal risks, construction progress, pricing and delivery outlook before booking.",
        f"Thinking of buying {p}? Uncover legal risks, construction progress, pricing and delivery outlook before booking.",
        f"Planning to buy {p}? Discover legal risks, construction progress, pricing and delivery outlook before booking.",
        f"Considering {p}? Explore legal risks, construction progress, pricing and delivery outlook before booking.",
        f"Should you buy {p}? Discover legal risks, construction progress and delivery outlook before paying the booking amount.",
        f"Planning to buy {p}? Explore legal risks, construction progress and delivery outlook before paying the booking amount.",
        f"Should you buy {p}? Discover legal risks, construction progress and delivery outlook before booking.",
        f"Planning to buy {p}? Explore legal risks, construction progress and delivery outlook before booking.",
    ]

    new_desc = ""
    for d_text in d_options:
        clean_d = d_text.strip()
        if 140 <= len(clean_d) <= 160:
            new_desc = clean_d
            break

    if not new_desc:
        new_desc = d_options[0][:160]

    reason = "Replaced methodology jargon with high-intent buyer decision keywords (Review, Worth Buying, Legal Risks, Delivery Outlook) and a Truth Score hook to maximize SERP click-through rate."

    perfect_list.append({
        "index": r["index"],
        "projectName": p,
        "developerName": d,
        "truthScore": s,
        "oldTitle": r["oldTitle"],
        "newTitle": new_title,
        "newTitleLength": len(new_title),
        "oldDescription": r["oldDescription"],
        "newDescription": new_desc,
        "newDescLength": len(new_desc),
        "reasonForImprovement": reason,
    })

# Verify constraints
title_errs = sum(1 for x in perfect_list if x["newTitleLength"] > 60)
desc_errs = sum(1 for x in perfect_list if not (140 <= x["newDescLength"] <= 160))

print(f"Validation: Title Overflows (>60): {title_errs}, Desc Violations (<140 or >160): {desc_errs}")

# Write JSON
with open("/Users/gj/.gemini/antigravity/scratch/Truth-Estate/scratch/seo_rewrite_results.json", "w") as f:
    json.dump(perfect_list, f, indent=2)

# Write CSV
headers = ["Index", "Project Name", "Developer", "Truth Score", "Old Title", "New Title", "Title Chars", "Old Description", "New Description", "Desc Chars", "Reason for Improvement"]
with open("/Users/gj/.gemini/antigravity/scratch/Truth-Estate/scratch/seo_rewrite_results.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    for x in perfect_list:
        writer.writerow([
            x["index"],
            x["projectName"],
            x["developerName"],
            x["truthScore"],
            x["oldTitle"],
            x["newTitle"],
            x["newTitleLength"],
            x["oldDescription"],
            x["newDescription"],
            x["newDescLength"],
            x["reasonForImprovement"],
        ])

print("CSV and JSON regenerated cleanly.")
