# Blending Calculator

A React + TypeScript + Vite application for blending calculations.

## Quick Start - Run in Browser

To run the application and open it in your browser:

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

## Deploy to GitHub Pages

To deploy this application to GitHub Pages:

1. **Enable GitHub Pages** in your repository settings:
   - Go to Settings → Pages
   - Under "Build and deployment", select "GitHub Actions" as the source

2. **Push to main/master branch**:
   - The GitHub Actions workflow will automatically build and deploy your app
   - Your app will be available at `https://yourusername.github.io/your-repo-name/`

3. **Manual deployment**:
   - Push your code to the `main` or `master` branch
   - The workflow in `.github/workflows/deploy.yml` will run automatically
   - Check the Actions tab to monitor the deployment progress

## Development Setup

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
