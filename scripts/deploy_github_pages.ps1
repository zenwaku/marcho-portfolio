param(
  [string]$RepoName = "marcho-portfolio",
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$sourceVideoRoot = "C:\Users\march\OneDrive\Documents\Website Portofolio & Project\Video"
$python = "C:\Users\march\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$pnpm = "C:\Users\march\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd"
$nodeBin = "C:\Users\march\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$gh = "C:\Users\march\AppData\Local\Microsoft\WinGet\Packages\GitHub.cli_Microsoft.Winget.Source_8wekyb3d8bbwe\bin\gh.exe"
$git = "C:\Program Files\Git\cmd\git.exe"

if (!(Test-Path $gh)) {
  throw "GitHub CLI was not found. Install it with: winget install --id GitHub.cli -e"
}
if (!(Test-Path $git)) {
  throw "Git was not found. Install it with: winget install --id Git.Git -e"
}

& $gh auth status | Out-Null

$owner = (& $gh api user --jq ".login").Trim()
$fullRepo = "$owner/$RepoName"
$repoUrl = "https://github.com/$fullRepo"
$pagesUrl = "https://$owner.github.io/$RepoName/"
$releaseTag = "media-v1"
$edukasiAsset = "edukasi-hiperfosfat-1080.mp4"
$lyricAsset = "hiperfosfat-1080.mp4"

$env:MARCHO_VIDEO_EDUKASI_URL = "$repoUrl/releases/download/$releaseTag/$edukasiAsset"
$env:MARCHO_VIDEO_LYRIC_URL = "$repoUrl/releases/download/$releaseTag/$lyricAsset"

Push-Location $projectRoot
try {
  $env:PATH = "$nodeBin;$env:PATH"

  & $python ".\scripts\build_assets.py"
  & $pnpm run build

  if (!(Test-Path ".git")) {
    & $git init -b $Branch
  }

  & $git config user.name "Marcho"
  & $git config user.email "marchoict@gmail.com"
  & $git branch -M $Branch

  $repoExists = $true
  try {
    & $gh repo view $fullRepo | Out-Null
  } catch {
    $repoExists = $false
  }

  if (!$repoExists) {
    & $gh repo create $RepoName --public --description "Interactive medical scientific portfolio website" --disable-issues --disable-wiki
  }

  $origin = (& $git remote get-url origin 2>$null)
  if (!$origin) {
    & $git remote add origin "$repoUrl.git"
  } else {
    & $git remote set-url origin "$repoUrl.git"
  }

  & $git add -A
  $hasChanges = (& $git status --porcelain)
  if ($hasChanges) {
    & $git commit -m "Build interactive portfolio website for GitHub Pages"
  }

  & $git push -u origin $Branch

  $tempVideoDir = Join-Path $env:TEMP "marcho-portfolio-release-videos"
  New-Item -ItemType Directory -Force $tempVideoDir | Out-Null
  Copy-Item -LiteralPath (Join-Path $sourceVideoRoot "Edukasi Hiperfosfat 1080.mp4") -Destination (Join-Path $tempVideoDir $edukasiAsset) -Force
  Copy-Item -LiteralPath (Join-Path $sourceVideoRoot "Hiperfosfat 1080.mp4") -Destination (Join-Path $tempVideoDir $lyricAsset) -Force

  $releaseExists = $true
  try {
    & $gh release view $releaseTag --repo $fullRepo | Out-Null
  } catch {
    $releaseExists = $false
  }

  if (!$releaseExists) {
    & $gh release create $releaseTag --repo $fullRepo --target $Branch --title "Portfolio media assets" --notes "Full-size video assets used by the GitHub Pages portfolio."
  }

  & $gh release upload $releaseTag (Join-Path $tempVideoDir $edukasiAsset) (Join-Path $tempVideoDir $lyricAsset) --repo $fullRepo --clobber

  try {
    & $gh api -X POST "repos/$fullRepo/pages" -f build_type=workflow | Out-Null
  } catch {
    & $gh api -X PUT "repos/$fullRepo/pages" -f build_type=workflow | Out-Null
  }

  Write-Host "GitHub repo: $repoUrl"
  Write-Host "GitHub Pages URL: $pagesUrl"
  Write-Host "After Actions finishes, the website will be live at the Pages URL."
} finally {
  Pop-Location
}
