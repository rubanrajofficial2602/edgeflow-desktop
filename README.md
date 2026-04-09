# EdgeFlow ERP — Desktop App

Native Windows (.exe/.msi/.msix), Mac (.dmg), and Linux (.AppImage/.deb/.rpm) desktop application built with Electron.

**GitHub:** https://github.com/rubanrajofficial2602/edgeflow-desktop

---

## Step 1 — Push to GitHub

```bash
# Create a new repo at github.com/rubanrajofficial2602/edgeflow-desktop (no README, no .gitignore)
# Then from inside artifacts/edgeflow-desktop/:

git init
git add .
git commit -m "feat: EdgeFlow ERP v3.1.0 desktop app"
git remote add origin https://github.com/rubanrajofficial2602/edgeflow-desktop.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Add GitHub Secret (GH_TOKEN)

1. Go to: https://github.com/settings/tokens/new
2. Select scope: **repo** (full control)
3. Click **Generate token** — copy the token
4. Go to: https://github.com/rubanrajofficial2602/edgeflow-desktop/settings/secrets/actions
5. Click **New repository secret**
   - Name: `GH_TOKEN`
   - Value: paste your token
6. Click **Add secret**

---

## Step 3 — Update the App URL (After Deploying EdgeFlow ERP)

After you deploy EdgeFlow ERP on Replit, you get a live URL like:
`https://edgeflow-erp.rubanrajofficial2602.replit.app/edgeflow-erp/`

Update `electron/main.js` line 10:
```js
const APP_URL = process.env.EDGEFLOW_URL || "https://YOUR-LIVE-URL.replit.app/edgeflow-erp/";
```

Then commit and push that change.

---

## Step 4 — Build & Release (GitHub Actions builds everything automatically)

```bash
# Tag the release — GitHub Actions triggers automatically
git tag v3.1.0
git push origin v3.1.0
```

GitHub Actions will:
- Build `EdgeFlow-ERP-Setup-3.1.0.exe` (Windows installer)
- Build `EdgeFlow-ERP-3.1.0.msi` (Windows enterprise)
- Build `EdgeFlow-ERP-3.1.0.msix` (Microsoft Store package)
- Build `EdgeFlow-ERP-3.1.0.dmg` (macOS Intel)
- Build `EdgeFlow-ERP-3.1.0-arm64.dmg` (macOS Apple Silicon)
- Build `EdgeFlow-ERP-3.1.0.AppImage` (Linux universal)
- Build `EdgeFlow-ERP-3.1.0.deb` (Ubuntu/Debian)
- Build `EdgeFlow-ERP-3.1.0.rpm` (Fedora/RHEL)

All files appear at:
https://github.com/rubanrajofficial2602/edgeflow-desktop/releases/tag/v3.1.0

---

## Step 5 — Publish to Microsoft Store

1. **Create a free account:** https://partner.microsoft.com/en-us/dashboard/registration/Developer
2. **Create a new app:** Dashboard → Windows & Xbox → Create a new app → Name: **EdgeFlow ERP**
3. **Reserve the app name** (it will be pending review)
4. **Package:** Upload the `.msix` file from your GitHub Release
5. **Store listing:** Fill in description, screenshots, pricing (free + in-app subscriptions)
6. **Submit for review:** Takes ~3-5 business days

> The `.msix` file is automatically built by GitHub Actions in Step 4.

---

## Step 6 — Auto-Updates Work Automatically

Once published on GitHub Releases, existing users see an in-app notification when you release a new version. They click "Download" and the app restarts with the update. No action needed from you.

---

## Local Development

```bash
npm install
npm start          # Opens the app pointing to the live EdgeFlow ERP URL
```

## Build Locally (Optional)

**Windows** (must run on a Windows machine):
```bash
npm run build:win
# Output: dist/EdgeFlow-ERP-Setup-3.1.0.exe, .msi, .msix
```

**macOS** (must run on a Mac):
```bash
npm run build:mac
# Output: dist/EdgeFlow-ERP-3.1.0.dmg, .pkg
```

**Linux** (run on Ubuntu/Debian):
```bash
npm run build:linux
# Output: dist/EdgeFlow-ERP-3.1.0.AppImage, .deb, .rpm
```

---

## App Icons — Required Before Building

Place these files in `build/`:
- `build/icon.ico` — Windows (256×256, multi-size ICO)
- `build/icon.icns` — macOS (1024×1024 ICNS)
- `build/icon.png` — Linux (1024×1024 PNG)

**Generate icons:**
1. Design a 1024×1024 PNG logo
2. Convert to ICO: https://www.icoconverter.com
3. Convert to ICNS: https://cloudconvert.com
4. Run: `node build/generate-icons.js` for a starter SVG template

---

## Code Signing (Makes installers trusted — no "Windows blocked this app" warning)

**Windows:**
- Buy an EV certificate from DigiCert/Sectigo (~₹15,000/yr)
- Add to GitHub Secrets: `WIN_CSC_LINK` (base64 .pfx) + `WIN_CSC_KEY_PASSWORD`

**macOS:**
- Requires Apple Developer account ($99/yr = ₹8,000/yr)
- Add to GitHub Secrets: `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`

> Without signing: Windows shows a SmartScreen warning (users click "Run anyway"). This is normal for new apps.

---

## Support
support@edgeflow.in
