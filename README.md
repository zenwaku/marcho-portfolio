# Marcho Portfolio

Interactive medical scientific portfolio website for HR and hiring teams.

## Local Development

```powershell
pnpm install
pnpm run dev
```

## Production Build

```powershell
pnpm run build
```

## GitHub Pages

This repo includes a free GitHub Pages workflow at `.github/workflows/deploy-pages.yml`.

The two MP4 videos are intentionally excluded from Git commits because GitHub blocks regular repository files larger than 100 MiB. Keep the full-size videos as GitHub Release assets.

After logging in with GitHub CLI, deploy everything with:

```powershell
gh auth login --web --scopes repo,workflow
powershell -ExecutionPolicy Bypass -File .\scripts\deploy_github_pages.ps1
```
