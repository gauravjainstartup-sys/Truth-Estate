import fs from "fs";
import path from "path";

const targetDir = "/Users/gj/.gemini/antigravity/scratch/Truth-Estate/src/data";
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const data = fs.readFileSync("/Users/gj/.gemini/antigravity/scratch/Truth-Estate/scratch/seo_category_growth_strategy.json", "utf-8");
fs.writeFileSync(path.join(targetDir, "seo_category_growth_strategy.json"), data);
console.log("Copied json data to src/data/ successfully.");
