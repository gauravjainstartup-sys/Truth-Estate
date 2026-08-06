import puppeteer from "puppeteer";
import path from "path";

async function snap() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Navigate to localhost homepage
  await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });

  // Take full page or footer screenshot
  const footerElement = await page.$("footer");
  if (footerElement) {
    await footerElement.screenshot({
      path: "/Users/gj/.gemini/antigravity/brain/33182201-aa57-47d1-b541-827b0c56d34b/scratch/footer_ui_fix.png",
    });
    console.log("Captured footer UI screenshot successfully!");
  }

  const heroHeader = await page.$("header");
  if (heroHeader) {
    await heroHeader.screenshot({
      path: "/Users/gj/.gemini/antigravity/brain/33182201-aa57-47d1-b541-827b0c56d34b/scratch/hero_header_ui_fix.png",
    });
    console.log("Captured hero header UI screenshot successfully!");
  }

  await page.screenshot({
    path: "/Users/gj/.gemini/antigravity/brain/33182201-aa57-47d1-b541-827b0c56d34b/scratch/homepage_full_ui_fix.png",
    fullPage: false,
  });

  await browser.close();
}

snap().catch((err) => {
  console.error("Puppeteer error:", err.message);
});
