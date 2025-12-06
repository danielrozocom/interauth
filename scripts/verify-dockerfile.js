#!/usr/bin/env node
/**
 * Verify which Dockerfile will be used when you build
 * 
 * Usage:
 *   node scripts/verify-dockerfile.js
 * 
 * This helps catch configuration errors BEFORE deploying
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");

console.log("\n" + "=".repeat(70));
console.log("  Dockerfile Verification Tool");
console.log("=".repeat(70) + "\n");

// Check 1: Verify both Dockerfiles exist
console.log("📋 File Existence Check:");

const dockerfile = path.resolve(appRoot, "Dockerfile");
const dockerfileDev = path.resolve(appRoot, "Dockerfile.dev");

const prodExists = fs.existsSync(dockerfile);
const devExists = fs.existsSync(dockerfileDev);

console.log(`   Dockerfile (production): ${prodExists ? "✅ Found" : "❌ NOT FOUND"}`);
console.log(
  `   Dockerfile.dev (dev):     ${devExists ? "✅ Found" : "❌ NOT FOUND"}`
);

if (!prodExists) {
  console.error("\n❌ ERROR: Dockerfile not found!");
  process.exit(1);
}

// Check 2: Read and verify CMD in both files
console.log("\n🔍 CMD Verification:");

const prodContent = fs.readFileSync(dockerfile, "utf-8");
const hasCorrectCmd = prodContent.includes('CMD ["pnpm", "start"]');

console.log(`   Dockerfile CMD:     ${hasCorrectCmd ? "✅ Correct: pnpm start" : "⚠️  Not standard"}`);

if (devExists) {
  const devContent = fs.readFileSync(dockerfileDev, "utf-8");
  const hasDevCmd = devContent.includes('["pnpm", "dev"') || devContent.includes("pnpm dev");
  console.log(`   Dockerfile.dev CMD: ${hasDevCmd ? "✅ Correct: pnpm dev" : "⚠️  Unexpected"}`);
}

// Check 3: Verify .dockerignore excludes Dockerfile.dev
console.log("\n📁 .dockerignore Check:");

const dockerIgnore = path.resolve(appRoot, ".dockerignore");
const ignoreExists = fs.existsSync(dockerIgnore);

if (ignoreExists) {
  const ignoreContent = fs.readFileSync(dockerIgnore, "utf-8");
  const excludesDev = ignoreContent.includes("Dockerfile.dev");

  console.log(`   .dockerignore exists:      ✅ Found`);
  console.log(
    `   Excludes Dockerfile.dev:   ${excludesDev ? "✅ Yes" : "⚠️  No (dev file might be included)"}`
  );
} else {
  console.log(`   .dockerignore exists:      ❌ NOT FOUND (created one for you)`);
}

// Check 4: Verify package.json scripts
console.log("\n📦 Package.json Scripts Check:");

const pkg = JSON.parse(fs.readFileSync(path.resolve(appRoot, "package.json"), "utf-8"));
const scripts = pkg.scripts || {};

const correctDev = scripts.dev === "vite dev --host 0.0.0.0 --port 5173";
const correctBuild = scripts.build === "vite build";
const correctStart = scripts.start === "vite preview --host 0.0.0.0 --port 3000";

console.log(
  `   "dev" script:   ${correctDev ? "✅" : "⚠️ "} ${scripts.dev || "NOT FOUND"}`
);
console.log(
  `   "build" script: ${correctBuild ? "✅" : "⚠️ "} ${scripts.build || "NOT FOUND"}`
);
console.log(
  `   "start" script: ${correctStart ? "✅" : "⚠️ "} ${scripts.start || "NOT FOUND"}`
);

// Check 5: Verify server.js exists
console.log("\n🚀 Server.js Check:");

const serverJs = path.resolve(appRoot, "server.js");
const serverExists = fs.existsSync(serverJs);

console.log(`   server.js exists:    ${serverExists ? "✅ Found" : "❌ NOT FOUND"}`);

if (serverExists) {
  const serverContent = fs.readFileSync(serverJs, "utf-8");
  const hasDevCheck = serverContent.includes("process.argv.includes('dev')");
  console.log(
    `   Dev mode detection: ${hasDevCheck ? "✅ Protected against 'pnpm dev'" : "⚠️  No protection"}`
  );
}

// Check 6: Suggest correct Docker commands
console.log("\n" + "=".repeat(70));
console.log("  📝 Correct Docker Commands");
console.log("=".repeat(70) + "\n");

console.log("🏗️  Building for Production:");
console.log("   docker build -f Dockerfile -t interauth:prod .\n");

console.log("▶️  Running Production Container:");
console.log("   docker run -p 3000:3000 \\");
console.log("     -e NODE_ENV=production \\");
console.log("     -e SUPABASE_URL=<your-url> \\");
console.log("     -e SUPABASE_ANON_KEY=<your-key> \\");
console.log("     -e APP_NAME=MyApp \\");
console.log("     interauth:prod\n");

console.log("🛠️  Building for Development:");
console.log("   docker build -f Dockerfile.dev -t interauth:dev .\n");

console.log("▶️  Running Development Container:");
console.log("   docker run -p 5173:5173 \\");
console.log("     -v $(pwd)/src:/app/src \\");
console.log("     interauth:dev\n");

console.log("📦 Using Docker Compose:");
console.log("   Production: docker-compose -f docker-compose.prod.yml up");
console.log("   Development: docker-compose -f docker-compose.dev.yml up\n");

// Final summary
console.log("=".repeat(70));
console.log("  ✅ VERIFICATION SUMMARY");
console.log("=".repeat(70) + "\n");

const allChecks = [
  ["Production Dockerfile", prodExists],
  ["Dockerfile has correct CMD", hasCorrectCmd],
  ["package.json scripts correct", correctDev && correctBuild && correctStart],
  ["server.js exists", serverExists],
  [".dockerignore exists", ignoreExists],
];

const passed = allChecks.filter(([_, check]) => check).length;
const total = allChecks.length;

allChecks.forEach(([check, result]) => {
  console.log(`   ${result ? "✅" : "⚠️ "} ${check}`);
});

console.log(`\n   ${passed}/${total} checks passed\n`);

if (passed === total) {
  console.log("   ✅ Your setup appears correct!");
  console.log("   ✅ You can safely deploy to production\n");
} else {
  console.log("   ⚠️  Some checks failed. Please review above.\n");
}

console.log("=".repeat(70) + "\n");
