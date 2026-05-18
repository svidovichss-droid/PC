# Blending Calculator

A React + TypeScript + Vite application for blending calculations, packaged as a Windows EXE using Electron.

## 📥 Download Windows EXE

Download the latest Windows executable from the [Releases page](https://github.com/yourusername/your-repo/releases).

## 🚀 Build EXE via GitHub Actions

This project is configured to automatically build a Windows EXE file when you push to the `main` or `master` branch.

### Steps:

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for EXE build"
   git push origin main
   ```

2. **GitHub Actions will automatically**:
   - Build the React application
   - Package it with Electron into a Windows EXE
   - Create a new release with the EXE file attached

3. **Download the EXE**:
   - Go to the **Actions** tab in your GitHub repository
   - Wait for the build to complete
   - Download the EXE from the workflow artifacts, OR
   - Go to the **Releases** section to download from the latest release

### Manual Trigger:

You can also manually trigger the build:
- Go to **Actions** → **Build EXE for Windows** → **Run workflow**

## 🌐 Run in Browser (Local)

To run the application in your browser without building an EXE:

```bash
python3 serve.py
```

This will start a local HTTP server and automatically open http://localhost:8000 in your default browser.

Or manually:

```bash
cd dist
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## 🛠️ Local Development

### Install dependencies:

```bash
pnpm install
```

### Run in development mode:

```bash
pnpm dev
```

### Build React app only:

```bash
pnpm build
```

### Build Electron EXE locally (requires Windows):

```bash
pnpm electron:build
```

The EXE will be created in the `release/` directory.

### Run Electron app in development:

```bash
pnpm electron:dev
```

## 📦 Project Structure

```
blending-calculator/
├── .github/workflows/
│   └── deploy.yml       # GitHub Actions workflow for EXE build
├── electron/
│   └── main.js          # Electron main process
├── src/                 # React source files
├── dist/                # Built React app
├── release/             # Generated EXE files (after build)
├── package.json         # Project configuration
└── vite.config.ts       # Vite configuration
```

## 🔧 Configuration

The Electron builder is configured in `package.json`:

- **Windows**: Creates NSIS installer (.exe)
- **macOS**: Creates DMG file
- **Linux**: Creates AppImage

## 📝 Notes

- The GitHub Actions workflow runs on `windows-latest` runner
- EXE builds are triggered on push to `main` or `master` branches
- You can also manually trigger builds using the `workflow_dispatch` event
- Release artifacts are automatically created with version tags
