<#
  一键提交并推送到 GitHub
  用法：
    powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Remote https://github.com/用户名/仓库名.git
    .\deploy.ps1 -Message "更新子页文案"

  说明：本机若没装 git，会尝试 GitHub Desktop 自带的 git。
#>
param(
  [string]$Remote = "",
  [string]$Message = "更新站点",
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $root

function Find-Git {
  $g = Get-Command git -ErrorAction SilentlyContinue
  if ($g) { return $g.Source }
  $candidates = @(
    "$env:LOCALAPPDATA\GitHubDesktop\app-*\resources\app\git\cmd\git.exe",
    "$env:ProgramFiles\Git\cmd\git.exe",
    "${env:ProgramFiles(x86)}\Git\cmd\git.exe"
  )
  foreach ($c in $candidates) {
    $hit = Get-ChildItem $c -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($hit) { return $hit.FullName }
  }
  return $null
}

$git = Find-Git
if (-not $git) {
  Write-Host "`n[!] 没有找到 git。" -ForegroundColor Yellow
  Write-Host "    两个选择："
  Write-Host "    1) 安装 GitHub Desktop（推荐，自带 git）：https://desktop.github.com/"
  Write-Host "    2) 安装 Git for Windows：https://git-scm.com/download/win"
  Write-Host "`n    装好后重新运行本脚本。详细步骤见 DEPLOY.md`n"
  exit 1
}
Write-Host "[+] git: $git"

if (-not (Test-Path (Join-Path $root ".git"))) {
  Write-Host "[+] 初始化仓库"
  & $git init | Out-Null
  & $git branch -M $Branch | Out-Null
}

# 提交
& $git add -A
$staged = (& $git diff --cached --name-only) | Measure-Object | Select-Object -ExpandProperty Count
if ($staged -gt 0) {
  Write-Host "[+] 暂存 $staged 个文件"
  & $git -c user.name="$(if($env:GIT_AUTHOR_NAME){$env:GIT_AUTHOR_NAME}else{'site'})" `
         -c user.email="$(if($env:GIT_AUTHOR_EMAIL){$env:GIT_AUTHOR_EMAIL}else{'site@local'})" `
         commit -m $Message | Out-Null
  Write-Host "[+] 已提交：$Message"
} else {
  Write-Host "[=] 没有改动需要提交"
}

# 远端
$hasRemote = (& $git remote) -contains "origin"
if (-not $hasRemote) {
  if (-not $Remote) {
    Write-Host "`n[!] 还没有配置远端仓库。" -ForegroundColor Yellow
    Write-Host "    先在 GitHub 新建一个 public 仓库，然后运行："
    Write-Host "    .\deploy.ps1 -Remote https://github.com/<用户名>/<仓库名>.git`n"
    exit 0
  }
  & $git remote add origin $Remote
  Write-Host "[+] 已添加远端：$Remote"
}

Write-Host "[+] 推送中（仓库约 190 MB，首次可能较慢）…"
& $git config http.postBuffer 524288000
& $git push -u origin $Branch
if ($LASTEXITCODE -ne 0) {
  Write-Host "`n[!] 推送失败。常见原因：仓库地址不对、未登录、或网络问题。" -ForegroundColor Yellow
  Write-Host "    可改用 GitHub Desktop 推送。详见 DEPLOY.md`n"
  exit 1
}

Write-Host "`n[√] 完成。到仓库 Settings → Pages 选择 main / root，等 1–2 分钟后访问：" -ForegroundColor Green
Write-Host "    https://<用户名>.github.io/<仓库名>/`n"
