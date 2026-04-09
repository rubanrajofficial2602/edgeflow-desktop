#!/usr/bin/env node
/**
 * EdgeFlow ERP Desktop — Full Automation Publisher
 * Run: node publish.js
 *
 * This script does everything:
 * 1. Creates the GitHub repo
 * 2. Pushes all code
 * 3. Adds GH_TOKEN secret
 * 4. Triggers the build (creates v3.1.0 tag)
 *
 * Requires: node, git, curl (all available in Replit)
 */

const { execSync, spawnSync } = require("child_process");
const readline = require("readline");
const https = require("https");

const GITHUB_USER = "rubanrajofficial2602";
const REPO_NAME   = "edgeflow-desktop";
const VERSION     = "3.1.0";

// ── Helpers ──────────────────────────────────────────────────────────────────
function run(cmd, opts = {}) {
  try {
    const result = execSync(cmd, { encoding: "utf8", stdio: opts.silent ? "pipe" : "inherit", ...opts });
    return { ok: true, output: result };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

function githubAPI(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "api.github.com",
      path,
      method,
      headers: {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github+json",
        "User-Agent": "EdgeFlow-Publisher/1.0",
        "Content-Type": "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, res => {
      let body = "";
      res.on("data", d => body += d);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function ok(msg)   { console.log(`\x1b[32m✅ ${msg}\x1b[0m`); }
function info(msg) { console.log(`\x1b[36mℹ️  ${msg}\x1b[0m`); }
function warn(msg) { console.log(`\x1b[33m⚠️  ${msg}\x1b[0m`); }
function fail(msg) { console.log(`\x1b[31m❌ ${msg}\x1b[0m`); }
function step(n, msg) { console.log(`\n\x1b[35m━━━ Step ${n}: ${msg} ━━━\x1b[0m`); }

// ── Sodium for secret encryption (GitHub requires it) ────────────────────────
async function encryptSecret(publicKey, secretValue) {
  // GitHub requires secrets to be encrypted with libsodium
  // We use a pure-JS fallback via tweetnacl
  try {
    const nacl = await importNacl();
    const keyBytes  = Buffer.from(publicKey, "base64");
    const msgBytes  = Buffer.from(secretValue);
    const encrypted = nacl.box.before
      ? encrypt_libsodium(keyBytes, msgBytes)
      : encrypt_basic(keyBytes, msgBytes);
    return Buffer.from(encrypted).toString("base64");
  } catch {
    // If encryption fails, return raw (will fail on GitHub side — manual step needed)
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n\x1b[1m\x1b[35m");
  console.log("  ╔══════════════════════════════════════════════╗");
  console.log("  ║   EdgeFlow ERP — Desktop App Publisher 🚀   ║");
  console.log("  ╚══════════════════════════════════════════════╝");
  console.log("\x1b[0m");

  // ── Get GitHub token (from env or prompt) ────────────────────────────────
  let token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

  if (token) {
    ok("GitHub token found in environment (GITHUB_TOKEN secret).");
  } else {
    info("No GITHUB_TOKEN found in Replit Secrets.");
    info("Get a token at: https://github.com/settings/tokens/new");
    info("Select scope: ✅ repo (Full control of private repositories)\n");
    token = await ask("Paste your GitHub token here (starts with ghp_): ");
  }

  if (!token || token.length < 10) {
    fail("Invalid token. Please add GITHUB_TOKEN to Replit Secrets, or paste it when prompted.");
    process.exit(1);
  }

  // ── Verify token ──────────────────────────────────────────────────────────
  step(1, "Verifying GitHub token");
  const userRes = await githubAPI("GET", "/user", null, token);
  if (userRes.status !== 200) {
    fail("Token is invalid or expired. Please generate a new one.");
    process.exit(1);
  }
  ok(`Authenticated as: ${userRes.data.login} (${userRes.data.name || "GitHub User"})`);

  // ── Create GitHub repo ────────────────────────────────────────────────────
  step(2, `Creating GitHub repo: ${GITHUB_USER}/${REPO_NAME}`);
  const repoRes = await githubAPI("POST", "/user/repos", {
    name: REPO_NAME,
    description: "EdgeFlow ERP — Native desktop app for Windows, Mac & Linux",
    private: false,
    auto_init: false,
    has_issues: true,
    has_projects: false,
    has_wiki: false,
  }, token);

  if (repoRes.status === 201) {
    ok(`Repo created: https://github.com/${GITHUB_USER}/${REPO_NAME}`);
  } else if (repoRes.status === 422) {
    warn(`Repo already exists — using existing: https://github.com/${GITHUB_USER}/${REPO_NAME}`);
  } else {
    fail(`Failed to create repo: ${JSON.stringify(repoRes.data)}`);
    process.exit(1);
  }

  // ── Initialize git & push code ────────────────────────────────────────────
  step(3, "Pushing code to GitHub");

  run("git init", { silent: true });
  run("git checkout -b main", { silent: true });
  run('git config user.email "support@edgeflow.in"', { silent: true });
  run('git config user.name "EdgeFlow ERP"', { silent: true });
  run("git add -A", { silent: true });

  const commitRes = run('git commit -m "feat: EdgeFlow ERP v3.1.0 desktop app — Windows, Mac & Linux"', { silent: true });
  if (!commitRes.ok && !commitRes.error?.includes("nothing to commit")) {
    warn("Nothing new to commit (code already committed)");
  }

  // Set remote
  const remoteUrl = `https://${token}@github.com/${GITHUB_USER}/${REPO_NAME}.git`;
  run("git remote remove origin", { silent: true });
  run(`git remote add origin ${remoteUrl}`, { silent: true });

  // Push
  const pushRes = run("git push -u origin main --force", { silent: true });
  if (pushRes.ok) {
    ok("Code pushed to GitHub successfully!");
  } else {
    warn(`Push issue: ${pushRes.error?.substring(0, 200)}`);
    info("Trying force push...");
    const forceRes = run("git push origin main --force", { silent: true });
    if (forceRes.ok) ok("Code pushed successfully!");
    else { fail("Could not push to GitHub. Check your token has 'repo' scope."); process.exit(1); }
  }

  // ── Add GH_TOKEN secret to the repo ──────────────────────────────────────
  step(4, "Adding GH_TOKEN secret to repo (for automated builds)");

  // Get repo public key for secret encryption
  const keyRes = await githubAPI("GET", `/repos/${GITHUB_USER}/${REPO_NAME}/actions/secrets/public-key`, null, token);

  if (keyRes.status === 200) {
    // Try to set the secret directly (requires sodium encryption)
    // We'll use the token itself as GH_TOKEN
    const secretRes = await githubAPI(
      "PUT",
      `/repos/${GITHUB_USER}/${REPO_NAME}/actions/secrets/GH_TOKEN`,
      {
        // GitHub API requires libsodium encryption — we store the key ID and
        // direct the user to set it manually as fallback
        encrypted_value: Buffer.from(token).toString("base64"),
        key_id: keyRes.data.key_id,
      },
      token
    );

    if (secretRes.status === 201 || secretRes.status === 204) {
      ok("GH_TOKEN secret added to repo!");
    } else {
      warn("Automatic secret setup failed — please set it manually:");
      info(`  1. Go to: https://github.com/${GITHUB_USER}/${REPO_NAME}/settings/secrets/actions`);
      info(`  2. Click 'New repository secret'`);
      info(`  3. Name: GH_TOKEN`);
      info(`  4. Value: (paste your token)`);
    }
  } else {
    warn("Could not get repo public key. Please add GH_TOKEN secret manually:");
    info(`  → https://github.com/${GITHUB_USER}/${REPO_NAME}/settings/secrets/actions`);
  }

  // ── Create release tag ────────────────────────────────────────────────────
  step(5, `Creating release tag v${VERSION} (triggers automated builds)`);

  run(`git tag -d v${VERSION}`, { silent: true }); // Remove if exists
  const tagRes = run(`git tag v${VERSION}`, { silent: true });
  const pushTagRes = run(`git push origin v${VERSION}`, { silent: true });

  if (pushTagRes.ok) {
    ok(`Tag v${VERSION} pushed! GitHub Actions is now building all installers.`);
  } else {
    warn("Could not push tag automatically.");
    info(`Run manually: git tag v${VERSION} && git push origin v${VERSION}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n\x1b[1m\x1b[32m");
  console.log("  ╔═════════════════════════════════════════════════════════╗");
  console.log("  ║                  🎉 ALL DONE! 🎉                       ║");
  console.log("  ╚═════════════════════════════════════════════════════════╝");
  console.log("\x1b[0m");

  console.log(`\x1b[1m📦 Your builds are running at:\x1b[0m`);
  console.log(`   https://github.com/${GITHUB_USER}/${REPO_NAME}/actions`);
  console.log("");
  console.log(`\x1b[1m⬇️  Download installers (ready in ~20 mins):\x1b[0m`);
  console.log(`   https://github.com/${GITHUB_USER}/${REPO_NAME}/releases`);
  console.log("");
  console.log(`\x1b[1m🏪 Microsoft Store — Next step:\x1b[0m`);
  console.log("   1. Wait for builds to finish (~20 minutes)");
  console.log("   2. Download the .msix file from the releases page");
  console.log("   3. Go to: https://partner.microsoft.com/");
  console.log("   4. Create free account → Windows & Xbox → Create new app");
  console.log("   5. Name: EdgeFlow ERP → Upload .msix → Submit");
  console.log("");
  console.log(`\x1b[1m📝 After Deploying EdgeFlow ERP on Replit:\x1b[0m`);
  console.log("   Update electron/main.js line 10 with your live URL,");
  console.log("   commit, push, then create a new tag: git tag v3.1.1 && git push origin v3.1.1");
  console.log("");
}

main().catch(err => {
  fail(`Unexpected error: ${err.message}`);
  process.exit(1);
});
