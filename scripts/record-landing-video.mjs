import { chromium } from "playwright";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}/simulacao-video?record=1`;
const TEMP_DIR = path.resolve("./videos_temp");
const TARGET_ASSET_WEBM = path.resolve("./src/assets/video_novo.webm");
const TARGET_ASSET_MP4 = path.resolve("./src/assets/video_atual.mp4");

async function checkServerRunning() {
  try {
    const res = await fetch(`http://localhost:${PORT}`);
    return res.ok || res.status === 200 || res.status === 404;
  } catch {
    return false;
  }
}

async function startServer() {
  const isRunning = await checkServerRunning();
  if (isRunning) {
    console.log(`Server already running on port ${PORT}`);
    return null;
  }

  console.log("Starting Vite dev server...");
  const server = spawn("npm", ["run", "dev", "--", "--port", String(PORT)], {
    stdio: "inherit",
    detached: false,
  });

  // Wait for server to become responsive
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await checkServerRunning()) {
      console.log("Vite dev server is ready!");
      return server;
    }
  }
  throw new Error("Vite dev server failed to start within 30s.");
}

async function record() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Clear existing temp videos
  const existing = fs.readdirSync(TEMP_DIR);
  for (const file of existing) {
    if (file.endsWith(".webm") || file.endsWith(".mp4")) {
      fs.unlinkSync(path.join(TEMP_DIR, file));
    }
  }

  let serverProcess = null;
  try {
    serverProcess = await startServer();

    console.log("Launching Playwright Chromium...");
    const browser = await chromium.launch({
      headless: true,
      args: [
        "--enable-features=VaapiVideoDecoder",
        "--disable-gpu-sandbox",
        "--no-sandbox",
        "--hide-scrollbars",
        "--mute-audio"
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      recordVideo: {
        dir: TEMP_DIR,
        size: { width: 1920, height: 1080 },
      },
    });

    const page = await context.newPage();
    console.log(`Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    console.log("Recording video scene in progress...");

    // Wait until simulation finishes or max 28 seconds
    try {
      await page.waitForFunction(() => window.__VIDEO_FINISHED__ === true, {
        timeout: 27000,
      });
      console.log("Simulation finished flag detected!");
      // Extra 1.5s for clean outro hold
      await page.waitForTimeout(1500);
    } catch {
      console.log("Timeout waiting for flag, proceeding with recorded duration...");
    }

    console.log("Closing page and browser context to finalize video...");
    await page.close();
    await context.close();
    await browser.close();

    // Find the recorded video in TEMP_DIR
    const files = fs.readdirSync(TEMP_DIR).filter((f) => f.endsWith(".webm"));
    if (files.length === 0) {
      throw new Error("No recorded video found in temp dir.");
    }

    const recordedFile = path.join(TEMP_DIR, files[0]);
    const stats = fs.statSync(recordedFile);
    console.log(`Recorded video: ${recordedFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

    // Copy to assets
    fs.copyFileSync(recordedFile, TARGET_ASSET_WEBM);
    console.log(`Saved WebM video to ${TARGET_ASSET_WEBM}`);

    // Also copy to TARGET_ASSET_MP4 as fallback
    fs.copyFileSync(recordedFile, TARGET_ASSET_MP4);
    console.log(`Saved to ${TARGET_ASSET_MP4}`);

    console.log("Video generation completed successfully!");
  } finally {
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

record().catch((err) => {
  console.error("Recording error:", err);
  process.exit(1);
});
