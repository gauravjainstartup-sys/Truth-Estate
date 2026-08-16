import fs from "node:fs";
import path from "node:path";

const polyfillPath = path.join(process.cwd(), "node_modules/next/dist/build/polyfills/polyfill-module.js");
if (fs.existsSync(polyfillPath)) {
  fs.writeFileSync(polyfillPath, "/* stripped for modern browsers */\n", "utf8");
  console.log("[perf] stripped @next/polyfill-module");
}
