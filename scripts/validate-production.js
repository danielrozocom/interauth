#!/usr/bin/env node
/**
 * Production Build Validator
 *
 * This script validates that the production build is correctly configured
 * and will NOT run the dev server in production.
 *
 * Usage:
 *   node scripts/validate-production.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

console.log("\n🔍 InterAuth Production Build Validator\n");
console.log("═══════════════════════════════════════════════════════════════\n");

let errors = [];
let warnings = [];

// ============================================================================
// CHECK 1: package.json scripts
// ============================================================================
console.log("📋 Checking package.json scripts...");

try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf-8")
  );

  const { dev, build, start, preview } = packageJson.scripts || {};

  if (!dev) {
    errors.push("❌ Missing 'dev' script in package.json");
  } else if (!dev.includes("vite dev")) {
    errors.push(`❌ 'dev' script doesn't include 'vite dev': ${dev}`);
  } else {
    console.log(`   ✓ dev script: ${dev}`);
  }

  if (!build) {
    errors.push("❌ Missing 'build' script in package.json");
  } else if (!build.includes("vite build")) {
    errors.push(`❌ 'build' script doesn't include 'vite build': ${build}`);
  } else {
    console.log(`   ✓ build script: ${build}`);
  }

  if (!start) {
    errors.push("❌ Missing 'start' script in package.json");
  } else if (!start.includes("vite preview")) {
    errors.push(
      `❌ 'start' script doesn't run 'vite preview': ${start}`
    );
  } else {
    console.log(`   ✓ start script: ${start}`);
  }

  if (preview) {
    warnings.push(`⚠️  Found 'preview' script (may conflict): ${preview}`);
  }
} catch (e) {
  errors.push(`❌ Error reading package.json: ${e.message}`);
}

console.log("");

// ============================================================================
// CHECK 2: Dockerfile configuration
// ============================================================================
console.log("🐳 Checking Dockerfile...");

try {
  const dockerfile = fs.readFileSync(
    path.join(projectRoot, "Dockerfile"),
    "utf-8"
  );

  // Check for multi-stage build
  if (!dockerfile.includes("AS builder") || !dockerfile.includes("AS runner")) {
    warnings.push("⚠️  Dockerfile may not be using multi-stage build");
  } else {
    console.log("   ✓ Multi-stage build detected");
  }

  // Check for build command
  if (!dockerfile.includes("pnpm run build")) {
    errors.push("❌ Dockerfile doesn't run 'pnpm run build'");
  } else {
    console.log("   ✓ Build command found");
  }

  // Check for production CMD
  if (!dockerfile.includes('CMD ["pnpm", "start"]')) {
    errors.push('❌ Dockerfile CMD is not ["pnpm", "start"]');
    if (dockerfile.includes('CMD ["pnpm", "dev"]')) {
      errors.push(
        "❌ Dockerfile is using DEV command! This WILL cause vite dev to run in production"
      );
    }
  } else {
    console.log('   ✓ CMD correctly set to ["pnpm", "start"]');
  }

  // Check for exposed port
  if (dockerfile.includes("EXPOSE 3000")) {
    console.log("   ✓ Port 3000 exposed (production)");
  } else if (dockerfile.includes("EXPOSE 5173")) {
    errors.push("❌ Dockerfile exposes port 5173 (development server)");
  }
} catch (e) {
  errors.push(`❌ Error reading Dockerfile: ${e.message}`);
}

console.log("");

// ============================================================================
// CHECK 3: Dockerfile.dev configuration
// ============================================================================
console.log("🔧 Checking Dockerfile.dev (development)...");

try {
  const dockerfileDev = fs.readFileSync(
    path.join(projectRoot, "Dockerfile.dev"),
    "utf-8"
  );

  if (
    !dockerfileDev.includes('CMD ["pnpm", "dev"]') &&
    !dockerfileDev.includes("pnpm dev")
  ) {
    warnings.push("⚠️  Dockerfile.dev may not be running dev server");
  } else {
    console.log("   ✓ Dev server command found");
  }

  if (dockerfileDev.includes("EXPOSE 5173")) {
    console.log("   ✓ Port 5173 exposed (dev server)");
  }
} catch (e) {
  errors.push(`❌ Error reading Dockerfile.dev: ${e.message}`);
}

console.log("");

// ============================================================================
// CHECK 4: Build artifacts
// ============================================================================
console.log("📦 Checking build artifacts...");

const buildDir = path.join(projectRoot, "build");
const buildIndex = path.join(buildDir, "index.js");

if (!fs.existsSync(buildDir)) {
  warnings.push("⚠️  Build directory doesn't exist (normal if not built yet)");
  console.log("   ⓘ Build directory not found (will be created after build)");
} else {
  console.log("   ✓ Build directory exists");

  if (!fs.existsSync(buildIndex)) {
    errors.push("❌ Build entry point not found: build/index.js");
    console.log("   ❌ Missing build/index.js");
  } else {
    console.log("   ✓ Build entry point found (build/index.js)");
  }
}

console.log("");

// ============================================================================
// CHECK 5: server.js entry point
// ============================================================================
console.log("⚙️  Checking server.js entry point...");

try {
  const serverJs = fs.readFileSync(
    path.join(projectRoot, "server.js"),
    "utf-8"
  );

  if (serverJs.includes("vite dev") || serverJs.includes("pnpm dev")) {
    errors.push("❌ server.js contains references to 'vite dev' or 'pnpm dev'");
  } else {
    console.log("   ✓ server.js doesn't contain dev server commands");
  }

  if (serverJs.includes("build/index.js")) {
    console.log("   ✓ server.js references built entry point");
  } else {
    errors.push("❌ server.js doesn't reference build/index.js");
  }
} catch (e) {
  errors.push(`❌ Error reading server.js: ${e.message}`);
}

console.log("");

// ============================================================================
// CHECK 6: Docker Compose configurations
// ============================================================================
console.log("🔗 Checking Docker Compose files...");

try {
  const devCompose = fs.readFileSync(
    path.join(projectRoot, "docker-compose.dev.yml"),
    "utf-8"
  );

  if (devCompose.includes('dockerfile: Dockerfile.dev')) {
    console.log("   ✓ docker-compose.dev.yml uses Dockerfile.dev");
  } else {
    warnings.push("⚠️  docker-compose.dev.yml may not reference Dockerfile.dev");
  }

  if (devCompose.includes("5173")) {
    console.log("   ✓ docker-compose.dev.yml exposes port 5173");
  }
} catch (e) {
  errors.push(`❌ Error reading docker-compose.dev.yml: ${e.message}`);
}

try {
  const prodCompose = fs.readFileSync(
    path.join(projectRoot, "docker-compose.prod.yml"),
    "utf-8"
  );

  if (prodCompose.includes('dockerfile: Dockerfile')) {
    console.log("   ✓ docker-compose.prod.yml uses Dockerfile");
  } else {
    warnings.push("⚠️  docker-compose.prod.yml may not reference Dockerfile");
  }

  if (prodCompose.includes("3000")) {
    console.log("   ✓ docker-compose.prod.yml exposes port 3000");
  }

  if (
    prodCompose.includes('NODE_ENV: production') ||
    prodCompose.includes('NODE_ENV=production')
  ) {
    console.log("   ✓ NODE_ENV set to production");
  } else {
    warnings.push(
      "⚠️  NODE_ENV not explicitly set to 'production' in docker-compose.prod.yml"
    );
  }
} catch (e) {
  console.log("   ⓘ docker-compose.prod.yml not found (created if needed)");
}

console.log("");

// ============================================================================
// RESULTS
// ============================================================================

console.log("═══════════════════════════════════════════════════════════════\n");

if (warnings.length > 0) {
  console.log("⚠️  WARNINGS:\n");
  warnings.forEach((w) => console.log(`  ${w}`));
  console.log("");
}

if (errors.length > 0) {
  console.log("❌ ERRORS:\n");
  errors.forEach((e) => console.log(`  ${e}`));
  console.log(
    "\n🔧 Please fix the above errors before deploying to production.\n"
  );
  process.exit(1);
} else {
  console.log("✅ All production checks passed!\n");
  console.log("📋 Next steps:");
  console.log("  1. Build: pnpm build");
  console.log("  2. Test production locally: docker-compose -f docker-compose.prod.yml up");
  console.log("  3. Verify logs show 'InterAuth Production Server - Starting'");
  console.log("  4. Deploy using: docker build -f Dockerfile -t interauth .");
  console.log("");
}
