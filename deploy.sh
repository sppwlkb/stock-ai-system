#!/bin/bash

# 小七AI選股系統 v2.0 - 快速部署腳本

echo "🚀 開始部署小七AI選股系統 v2.0..."

# 檢查是否已安裝 Vercel CLI
if ! command -v vercel &> /dev/null
then
    echo "📦 安裝 Vercel CLI..."
    npm install -g vercel
fi

# 檢查是否已初始化 Git
if [ ! -d .git ]; then
    echo "📝 初始化 Git Repository..."
    git init
    git add .
    git commit -m "Initial commit - 小七AI選股系統 v2.0"
fi

# 建置專案
echo "🔨 建置專案..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 建置成功！"
    
    # 部署到 Vercel
    echo "🚀 部署到 Vercel..."
    vercel --prod
    
    echo "🎉 部署完成！"
    echo "📝 請記得在 Vercel 設定環境變數："
    echo "   GEMINI_API_KEY=your_api_key_here"
else
    echo "❌ 建置失敗，請檢查錯誤訊息"
    exit 1
fi

