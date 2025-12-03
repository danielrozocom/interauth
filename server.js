#!/usr/bin/env node
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

// Defaults for container environment
if (!process.env.PORT) process.env.PORT = "3000";
if (!process.env.HOST) process.env.HOST = "0.0.0.0";

// Required env vars
const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "APP_NAME"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(
    "Missing required environment variables: " + missing.join(", ")
  );
  console.error(
    "Please set them (for example via Coolify env settings) and restart the server."
  );
  process.exit(1);
}

// Safe startup logging: don't print secrets, only presence and masked values
try {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const appName = process.env.APP_NAME || "";
  const anon = process.env.SUPABASE_ANON_KEY || "";

  const urlPreview = supabaseUrl
    ? supabaseUrl.replace(/(^https?:\/\/)|(:.*$)/g, "")
    : "";
  const anonPreview = anon ? `${anon.slice(0, 4)}...${anon.slice(-4)}` : "";

  console.info(
    `Starting ${
      appName || "app"
    } — SUPABASE_URL present: ${!!supabaseUrl} (${urlPreview})`
  );
  if (anonPreview) console.info(`SUPABASE_ANON_KEY (masked): ${anonPreview}`);
} catch (e) {
  // never crash on logging
  console.info("Startup logging error", e?.message || e);
}

const buildIndex = path.resolve(process.cwd(), "build", "index.js");
if (!fs.existsSync(buildIndex)) {
  console.error("Cannot find build entry:", buildIndex);
  console.error("Run `pnpm build` (or `npm run build`) first.");
  process.exit(1);
}

// Spawn the built server with same env and stdio inherited
const child = spawn(process.execPath, [buildIndex], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
