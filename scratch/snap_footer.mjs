import { execSync } from "child_process";

// Run Chrome to capture footer area
execSync(
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --window-size=1440,2400 --screenshot=/Users/gj/.gemini/antigravity/brain/33182201-aa57-47d1-b541-827b0c56d34b/footer_local_fixed_full.png http://localhost:3000`
);

console.log("Full length screenshot captured!");
