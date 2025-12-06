#!/usr/bin/env node
/**
 * Diagnose which Dockerfile is being used for the build
 *
 * Run this inside the container to verify correct setup:
 *   node /app/scripts/diagnose-dockerfile.js
 *
 * This helps identify why 'pnpm dev' might be running instead of 'pnpm start'
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");

console.log("\n" + "=".repeat(70));
console.log("  InterAuth Dockerfile Diagnosis");
console.log("=".repeat(70) + "\n");

// Check 1: Verify build directory exists
const buildDir = path.resolve(appRoot, "build");
const buildExists = fs.existsSync(buildDir);

console.log("📋 Build Artifacts Status:");
console.log(`   Build directory exists: ${buildExists ? "✅ YES" : "❌ NO"}`);

if (buildExists) {
  const buildIndexJs = path.resolve(buildDir, "index.js");
  const buildIndexExists = fs.existsSync(buildIndexJs);
  console.log(
    `   build/index.js exists:   ${buildIndexExists ? "✅ YES" : "❌ NO"}`
  );

  if (buildIndexExists) {
    const stats = fs.statSync(buildIndexJs);
    console.log(
      `   build/index.js size:     ${(stats.size / 1024).toFixed(2)} KB`
    );
  }
}

// Check 2: Verify package.json scripts
console.log("\n📦 Package Scripts Verification:");
const pkgPath = path.resolve(appRoot, "package.json");
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const scripts = pkg.scripts || {};

  console.log(
    `   dev script:   ${scripts.dev ? "✅ " + scripts.dev : "❌ NOT FOUND"}`
  );
  console.log(
    `   build script: ${scripts.build ? "✅ " + scripts.build : "❌ NOT FOUND"}`
  );
  console.log(
    `   start script: ${scripts.start ? "✅ " + scripts.start : "❌ NOT FOUND"}`
  );

  // Check if 'start' is actually running the dev server (security check)
  if (scripts.start && scripts.start.includes("dev")) {
    console.log(`   \n   ⚠️  WARNING: 'start' script contains 'dev'!`);
    console.log(`       This might cause production to run the dev server.`);
  }
}

// Check 3: Verify which Node modules are installed
console.log("\n🔧 Production Build Dependencies:");
const moduleChecks = [
  { name: "vite", prod: false, msg: "Development - should NOT be in prod" },
  {
    name: "svelte",
    prod: false,
    msg: "Development - should NOT be in prod",
  },
  {
    name: "@sveltejs/kit",
    prod: false,
    msg: "Development - should NOT be in prod",
  },
];

const nodeModules = path.resolve(appRoot, "node_modules");
moduleChecks.forEach(({ name, prod, msg }) => {
  const exists = fs.existsSync(path.resolve(nodeModules, name));
  const status = exists
    ? prod
      ? "✅ (OK)"
      : "⚠️  FOUND (should be removed for production)"
    : prod
    ? "❌ NOT FOUND"
    : "✅ Not installed (correct)";
  console.log(`   ${name.padEnd(20)}: ${status}`);
  if (!exists === prod) {
    console.log(`      ${msg}`);
  }
});

// Check 4: Environment
console.log("\n🌍 Environment Status:");
console.log(
  `   NODE_ENV:       ${
    process.env.NODE_ENV || "NOT SET (⚠️  should be 'production')"
  }`
);
console.log(
  `   SUPABASE_URL:   ${process.env.SUPABASE_URL ? "✅ SET" : "❌ NOT SET"}`
);
console.log(
  `   SUPABASE_ANON_KEY: ${
    process.env.SUPABASE_ANON_KEY ? "✅ SET" : "❌ NOT SET"
  }`
);
console.log(
  `   APP_NAME:       ${
    process.env.APP_NAME
      ? "✅ SET (" + process.env.APP_NAME + ")"
      : "❌ NOT SET"
  }`
);

// Check 5: Startup command analysis
console.log("\n🚀 Current Process Analysis:");
console.log(`   Process title:   ${process.title}`);
console.log(`   Process argv:    ${process.argv.join(" ")}`);

if (process.argv.includes("dev") || process.argv.includes("5173")) {
  console.log(
    "\n   ❌ ERROR: This appears to be running 'vite dev' instead of production!"
  );
} else if (
  process.argv.includes("start") ||
  process.argv.includes("preview") ||
  process.argv.includes("index.js")
) {
  console.log("\n   ✅ Correct: Running via production entry point");
} else {
  console.log("\n   ⚠️  Unknown entry point");
}

// Check 6: File existence checks
console.log("\n📁 Critical Files:");
const files = [
  "server.js",
  "package.json",
  "Dockerfile",
  "Dockerfile.dev",
  ".dockerignore",
];
files.forEach((file) => {
  const exists = fs.existsSync(path.resolve(appRoot, file));
  console.log(`   ${file.padEnd(20)}: ${exists ? "✅" : "❌"}`);
});

// Final diagnosis
console.log("\n" + "=".repeat(70));
console.log("  DIAGNOSIS");
console.log("=".repeat(70) + "\n");

if (!buildExists) {
  console.log("❌ PROBLEM: No build directory found!");
  console.log("   SOLUTION: Run 'pnpm build' before starting the server\n");
} else if (process.argv.includes("dev") || process.argv.includes("5173")) {
  console.log("❌ PROBLEM: Running 'pnpm dev' instead of 'pnpm start'!");
  console.log("   SOLUTION: Ensure Dockerfile uses CMD ['pnpm', 'start']\n");
  console.log("   If using a deployment platform:");
  console.log("   - Dokploy: Check that correct Dockerfile is selected");
  console.log("   - Railway: Ensure 'Start Command' is not overridden");
  console.log("   - Coolify: Verify Docker configuration\n");
} else if (process.env.NODE_ENV !== "production") {
  console.log("⚠️  WARNING: NODE_ENV is not set to 'production'");
  console.log("   The app will run, but you should set NODE_ENV=production\n");
} else {
  console.log("✅ All checks passed! Production setup appears correct.\n");
}

console.log("=".repeat(70) + "\n");
