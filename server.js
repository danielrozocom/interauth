#!/usr/bin/env node
/**
 * InterAuth Production Server Launcher
 *
 * This script serves as the main entry point for the production container.
 * It:
 * 1. Validates environment variables
 * 2. Ensures the application was built in production mode
 * 3. Runs the built SvelteKit app using Node.js directly
 *
 * This is NOT the dev server. The dev server runs via `pnpm dev`
 * and should NEVER be used in production.
 *
 * @see ./Dockerfile - Production Dockerfile configuration
 * @see ./package.json - Script definitions
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";

// ============================================================================
// STARTUP VALIDATION
// ============================================================================

console.log(
  "\n═══════════════════════════════════════════════════════════════"
);
console.log("  ✅ InterAuth Production Server - Starting");
console.log("     Entry Point: server.js (via 'pnpm start')");
console.log(
  "═══════════════════════════════════════════════════════════════\n"
);

// Verify we're NOT in development mode
const isDevMode = process.env.NODE_ENV === "development";
if (isDevMode) {
  console.warn(
    "⚠️  WARNING: NODE_ENV is set to 'development'. This should not happen in production."
  );
  console.warn(
    "              The application will still run, but should be in 'production' mode.\n"
  );
}

// CRITICAL CHECK: Prevent accidental vite dev execution
// This prevents the scenario where 'pnpm dev' is called instead of 'pnpm start'
if (process.argv.includes("dev") || process.argv.includes("5173")) {
  console.error(
    "\n❌ CRITICAL ERROR: This appears to be a Vite dev invocation!"
  );
  console.error(
    "   server.js should be called with production build artifacts."
  );
  console.error("   Use 'pnpm start' or 'npm start', NOT 'pnpm dev'\n");
  process.exit(1);
}

// Try to load .env file if running locally (not in container)
// This only loads .env if SUPABASE_URL is not already set
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!process.env.SUPABASE_URL && fs.existsSync(envPath)) {
    console.log("📄 Loading .env file...");
    await import("dotenv").then((d) => d.config({ path: envPath }));
    console.log("✓ .env loaded into process.env\n");
  }
} catch (e) {
  console.debug("   No .env file loaded:", e?.message || e);
}

// Set defaults for container environment
if (!process.env.PORT) process.env.PORT = "3000";
if (!process.env.HOST) process.env.HOST = "0.0.0.0";

// Validate required environment variables
const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "APP_NAME"];
const missing = required.filter((k) => !process.env[k]);

if (missing.length) {
  console.error("❌ Missing required environment variables:");
  missing.forEach((k) => console.error(`   - ${k}`));
  console.error(
    "\n⚠️  Please set them in your deployment platform's environment settings"
  );
  console.error(
    "   (Dokploy, Railway, Coolify, etc.) and restart the server.\n"
  );
  process.exit(1);
}

// Log startup configuration (without secrets)
try {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const appName = process.env.APP_NAME || "";
  const anon = process.env.SUPABASE_ANON_KEY || "";
  const port = process.env.PORT || "3000";
  const host = process.env.HOST || "0.0.0.0";

  const urlPreview = supabaseUrl
    ? supabaseUrl.replace(/(^https?:\/\/)|(:.*$)/g, "")
    : "";
  const anonPreview = anon ? `${anon.slice(0, 4)}...${anon.slice(-4)}` : "";

  console.log("🔧 Configuration:");
  console.log(`   App Name:        ${appName}`);
  console.log(`   Supabase URL:    ${urlPreview} ✓`);
  console.log(`   Anon Key:        ${anonPreview} ✓`);
  console.log(`   Server Port:     ${port}`);
  console.log(`   Server Host:     ${host}`);
  console.log(`   Node Env:        ${process.env.NODE_ENV || "not set"}`);
  console.log("");
} catch (e) {
  console.warn("⚠️  Startup logging error:", e?.message || e);
}

// ============================================================================
// BUILD VERIFICATION
// ============================================================================

const buildIndex = path.resolve(process.cwd(), "build", "index.js");
const buildDir = path.resolve(process.cwd(), "build");

if (!fs.existsSync(buildDir)) {
  console.error("❌ Build directory not found: " + buildDir);
  console.error(
    "\n⚠️  The application must be built BEFORE running in production."
  );
  console.error("   Run: pnpm build\n");
  process.exit(1);
}

if (!fs.existsSync(buildIndex)) {
  console.error("❌ Build entry point not found: " + buildIndex);
  console.error("\n⚠️  Run `pnpm build` to generate the build artifacts.\n");
  process.exit(1);
}

console.log("✓ Build artifacts found\n");

// ============================================================================
// PRODUCTION SERVER STARTUP
// ============================================================================

console.log("🚀 Starting built application...\n");
console.log("─────────────────────────────────────────────────────────────\n");

// Spawn the built SvelteKit server
// This executes the Node.js server built by the SvelteKit adapter
// The server is listening on the configured HOST:PORT
const child = spawn(process.execPath, [buildIndex], {
  stdio: "inherit", // Inherit parent process stdio (show logs directly)
  env: process.env, // Pass environment variables to child process
});

// Handle child process exit
child.on("exit", (code, signal) => {
  console.log(
    "\n─────────────────────────────────────────────────────────────"
  );
  if (signal) {
    console.log(`⚠️  Server terminated by signal: ${signal}`);
    process.kill(process.pid, signal);
  } else if (code === 0) {
    console.log("✓ Server stopped gracefully");
  } else {
    console.error(`❌ Server exited with code ${code}`);
  }
  process.exit(code ?? 0);
});

// Handle parent process signals (graceful shutdown)
process.on("SIGTERM", () => {
  console.log("\n⚠️  Received SIGTERM, shutting down gracefully...");
  child.kill("SIGTERM");
});

process.on("SIGINT", () => {
  console.log("\n⚠️  Received SIGINT, shutting down gracefully...");
  child.kill("SIGINT");
});
