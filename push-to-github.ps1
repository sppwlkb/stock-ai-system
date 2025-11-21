# 推送到 GitHub 的自動化腳本
# 小七AI選股系統 v2.0

Write-Host "🚀 準備推送到 GitHub..." -ForegroundColor Green
Write-Host ""

# 檢查是否已經有 remote
$remoteExists = git remote -v 2>&1 | Select-String "origin"

if ($remoteExists) {
    Write-Host "⚠️  檢測到已存在的 remote，將會移除並重新設定" -ForegroundColor Yellow
    git remote remove origin
}

# 提示輸入 GitHub 用戶名（預設為 sppwlkb）
$username = Read-Host "請輸入您的 GitHub 用戶名 (預設: sppwlkb)"
if ([string]::IsNullOrWhiteSpace($username)) {
    $username = "sppwlkb"
}

# 提示輸入 Repository 名稱（預設為 stock-ai-system）
$repoName = Read-Host "請輸入 Repository 名稱 (預設: stock-ai-system)"
if ([string]::IsNullOrWhiteSpace($repoName)) {
    $repoName = "stock-ai-system"
}

# 構建 Repository URL
$repoUrl = "https://github.com/$username/$repoName.git"

Write-Host ""
Write-Host "📦 Repository 資訊:" -ForegroundColor Cyan
Write-Host "   用戶名: $username" -ForegroundColor White
Write-Host "   Repository: $repoName" -ForegroundColor White
Write-Host "   URL: $repoUrl" -ForegroundColor White
Write-Host ""

# 確認是否繼續
$confirm = Read-Host "確認推送到此 Repository? (Y/n)"
if ($confirm -eq "n" -or $confirm -eq "N") {
    Write-Host "❌ 已取消" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🔗 添加 remote..." -ForegroundColor Yellow
git remote add origin $repoUrl

Write-Host "🌿 設定主分支為 main..." -ForegroundColor Yellow
git branch -M main

Write-Host "📤 推送到 GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  如果要求輸入密碼，請使用 Personal Access Token" -ForegroundColor Yellow
Write-Host "   獲取 Token: https://github.com/settings/tokens" -ForegroundColor Cyan
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ 推送成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 您的專案已上傳到 GitHub！" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Repository 網址:" -ForegroundColor Cyan
    Write-Host "   https://github.com/$username/$repoName" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 下一步：部署到 Vercel" -ForegroundColor Cyan
    Write-Host "   1. 前往: https://vercel.com/new" -ForegroundColor White
    Write-Host "   2. 選擇 $repoName" -ForegroundColor White
    Write-Host "   3. 添加環境變數: GEMINI_API_KEY" -ForegroundColor White
    Write-Host "   4. 點擊 Deploy" -ForegroundColor White
    Write-Host ""
    
    # 詢問是否打開 Vercel 部署頁面
    $openVercel = Read-Host "是否立即打開 Vercel 部署頁面? (Y/n)"
    if ($openVercel -ne "n" -and $openVercel -ne "N") {
        Start-Process "https://vercel.com/new"
        Write-Host "✅ 已打開 Vercel 部署頁面" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "❌ 推送失敗" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 可能的原因:" -ForegroundColor Yellow
    Write-Host "   1. Repository 尚未在 GitHub 創建" -ForegroundColor White
    Write-Host "   2. 需要使用 Personal Access Token 而非密碼" -ForegroundColor White
    Write-Host "   3. 網路連線問題" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 解決方法:" -ForegroundColor Yellow
    Write-Host "   1. 確認已在 GitHub 創建 Repository: https://github.com/new" -ForegroundColor White
    Write-Host "   2. 獲取 Personal Access Token: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "   3. 重新執行此腳本" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "按任意鍵退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

