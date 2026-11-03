import { spawn } from "node:child_process";
import { chromium } from "playwright";

const port = 3123;
const base = `http://localhost:${port}`;
const server = spawn("npx", ["next", "start", "-p", String(port)], { stdio: ["ignore", "pipe", "inherit"] });
await new Promise((resolve) => server.stdout.on("data", (chunk) => String(chunk).includes("Ready") && resolve()));

const browser = await chromium.launch();
let failed = true;

try {
  const page = await browser.newPage();
  await page.goto(base);

  await page.getByRole("link", { name: /Open \/a\?to=b/ }).click();
  await page.waitForURL(`${base}/b`);
  console.log("1. Soft navigation to /a?to=b redirected to:", new URL(page.url()).pathname);

  await page.getByRole("link", { name: /Open \/a \(no search params/ }).click();
  // Give the router time to settle on its final URL.
  await page.waitForTimeout(2000);
  const finalPath = new URL(page.url()).pathname;
  const heading = await page.getByRole("heading", { level: 1 }).textContent();
  console.log(`2. Soft navigation to /a ended on: ${finalPath} (heading: "${heading}")`);

  failed = finalPath !== "/a";
  console.log(failed ? "BUG: /a was redirected to /b again by the earlier /a?to=b redirect" : "OK: /a rendered");
} finally {
  await browser.close();
  server.kill();
}

process.exitCode = failed ? 1 : 0;
