import puppeteer from "puppeteer";
import path from "path";

async function snap() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 2 });
  await page.goto("http://localhost:3000/deal-room/mandate", { waitUntil: "networkidle0" });
  
  const destPath = "/Users/gj/.gemini/antigravity/brain/33182201-aa57-47d1-b541-827b0c56d34b/deal_room_mandate_redesign.png";
  await page.screenshot({ path: destPath, fullPage: false });
  console.log("Saved screenshot to", destPath);
  await browser.close();
}

snap().catch(console.error);
