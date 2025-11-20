# 小七AI選股系統 v2.0 - Windows PowerShell 部署腳本

Write-Host "🚀 開始部署小七AI選股系統 v2.0..." -ForegroundColor Green

# 檢查是否已安裝 Vercel CLI
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "📦 安裝 Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# 檢查是否已初始化 Git
if (-not (Test-Path .git)) {
    Write-Host "📝 初始化 Git Repository..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit - 小七AI選股系統 v2.0"
}

# 建置專案
Write-Host "🔨 建置專案..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 建置成功！" -ForegroundColor Green
    
    # 部署到 Vercel
    Write-Host "🚀 部署到 Vercel..." -ForegroundColor Yellow
    vercel --prod
    
    Write-Host "🎉 部署完成！" -ForegroundColor Green
    Write-Host "📝 請記得在 Vercel 設定環境變數：" -ForegroundColor Cyan
    Write-Host "   GEMINI_API_KEY=your_api_key_here" -ForegroundColor Cyan
} else {
    Write-Host "❌ 建置失敗，請檢查錯誤訊息" -ForegroundColor Red
    exit 1
}

