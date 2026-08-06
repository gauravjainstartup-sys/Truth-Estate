import pandas as pd
import openpyxl

df = pd.read_csv("/Users/gj/.gemini/antigravity/scratch/Truth-Estate/scratch/seo_rewrite_results.csv")
excel_path = "/Users/gj/.gemini/antigravity/scratch/Truth-Estate/scratch/seo_rewrite_results.xlsx"

with pd.ExcelWriter(excel_path, engine="openpyxl") as writer:
    df.to_excel(writer, sheet_name="SEO Rewrites (97 Projects)", index=False)

print("Saved Excel file successfully to", excel_path)
