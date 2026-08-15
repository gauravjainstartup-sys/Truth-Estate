import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const outputDir = path.join(root, "public/youtube-assets/videos");
fs.mkdirSync(outputDir, { recursive: true });

async function renderVideo() {
  console.log("[video-renderer] Launching 1080p 60fps Broadcast Video Recorder...");

  const browser = await chromium.launch({
    headless: true,
  });

  const targetPath = path.join(root, "public/youtube-assets/render-stage.html");
  const targetUrl = `file://${targetPath}`;

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  console.log(`[video-renderer] Loading stage: ${targetUrl}`);
  await page.goto(targetUrl);

  // Scene 1: Intro (0-10s)
  console.log("[video-renderer] Recording Scene 1: Project Overview (0s-10s)...");
  await page.evaluate(() => window.setScene(0));
  await page.waitForTimeout(10000);

  // Scene 2: Price & ROI (10s-25s)
  console.log("[video-renderer] Recording Scene 2: Financial & Price Audit (10s-25s)...");
  await page.evaluate(() => window.setScene(1));
  await page.waitForTimeout(15000);

  // Scene 3: Construction & Red Flags (25s-40s)
  console.log("[video-renderer] Recording Scene 3: Construction & Legal Audit (25s-40s)...");
  await page.evaluate(() => window.setScene(2));
  await page.waitForTimeout(15000);

  // Scene 4: Truth Score Verdict (40s-60s)
  console.log("[video-renderer] Recording Scene 4: Truth Score Verdict & CTA (40s-60s)...");
  await page.evaluate(() => window.setScene(3));
  await page.waitForTimeout(20000);

  // Close context to save video
  const videoPathObj = page.video();
  await page.close();
  await context.close();
  await browser.close();

  if (videoPathObj) {
    const rawVideoPath = await videoPathObj.path();
    const finalVideoPath = path.join(outputDir, "m3m-elie-saab-explainer.webm");
    fs.renameSync(rawVideoPath, finalVideoPath);
    console.log(`[video-renderer] SUCCESS! Rendered broadcast video saved to:\n  ${finalVideoPath}`);
  }
}

renderVideo().catch((err) => {
  console.error("[video-renderer] Render failed:", err);
  process.exit(1);
});
