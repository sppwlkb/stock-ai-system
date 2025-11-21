@echo off
chcp 65001 >nul
title 設定 Gemini API 金鑰 - 小七AI選股系統 v2.0

echo.
echo ========================================
echo   小七AI選股系統 v2.0
echo   設定 Gemini API 金鑰
echo ========================================
echo.

echo 📝 請按照以下步驟操作：
echo.
echo 1. 我將為您打開 Google AI Studio 頁面
echo 2. 請登入您的 Google 帳號
echo 3. 點擊「Create API Key」創建 API 金鑰
echo 4. 複製 API 金鑰
echo 5. 回到此視窗，貼上 API 金鑰
echo.

pause

echo.
echo 🌐 正在打開 Google AI Studio...
start https://aistudio.google.com/app/apikey

echo.
echo ⏳ 請在瀏覽器中完成 API 金鑰創建...
echo.
pause

echo.
echo 🔑 請貼上您的 Gemini API 金鑰：
echo （格式類似：AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX）
echo.
set /p API_KEY="API 金鑰: "

if "%API_KEY%"=="" (
    echo.
    echo ❌ 錯誤：API 金鑰不能為空
    echo.
    pause
    exit /b 1
)

echo.
echo 💾 正在更新 .env.local 檔案...

echo GEMINI_API_KEY=%API_KEY%> .env.local

echo.
echo ✅ API 金鑰已成功設定！
echo.
echo 📋 .env.local 檔案內容：
type .env.local
echo.
echo.
echo 🚀 下一步：
echo    1. 重新啟動開發伺服器（如果正在運行）
echo    2. 執行：npm run dev
echo    3. 重新整理瀏覽器頁面
echo    4. 點擊「開始 AI 分析」測試
echo.

pause

