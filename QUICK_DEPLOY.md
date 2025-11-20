# ⚡ 小七AI選股系統 v2.0 - 快速部署指南

## 🎯 最快速的部署方式（5分鐘完成）

### 方法一：Vercel 一鍵部署 ⭐ 推薦

#### 步驟 1：點擊部署按鈕

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/stock-ai-system&env=GEMINI_API_KEY&envDescription=Google%20Gemini%20API%20Key&envLink=https://ai.google.dev/)

#### 步驟 2：設定環境變數
- 在部署頁面輸入 `GEMINI_API_KEY`
- 點擊 Deploy

#### 步驟 3：完成！
- 獲得網址：`https://your-project.vercel.app`

---

### 方法二：使用 Vercel CLI（本地部署）

```bash
# 1. 安裝 Vercel CLI
npm install -g vercel

# 2. 登入 Vercel
vercel login

# 3. 執行部署腳本（Windows）
.\deploy.ps1

# 或（Mac/Linux）
./deploy.sh

# 4. 設定環境變數
vercel env add GEMINI_API_KEY production

# 5. 完成！
```

---

### 方法三：手動部署到 Vercel

```bash
# 1. 建置專案
npm run build

# 2. 前往 Vercel 網站
# https://vercel.com

# 3. 點擊 "Add New Project"

# 4. 導入 GitHub Repository

# 5. 設定環境變數
# GEMINI_API_KEY=your_api_key_here

# 6. 點擊 Deploy
```

---

## 📋 部署前檢查清單

- [ ] 已安裝 Node.js 18+
- [ ] 已安裝 npm
- [ ] 已獲得 Google Gemini API 金鑰
- [ ] 已測試本地建置（`npm run build`）

---

## 🔑 獲取 API 金鑰

### Google Gemini API
1. 前往：https://ai.google.dev/
2. 點擊「Get API Key」
3. 創建新的 API 金鑰
4. 複製金鑰

---

## ✅ 部署後測試

訪問您的網站並測試：
- [ ] 風險確認彈窗顯示
- [ ] 點擊「開始分析」
- [ ] AI 分析功能正常
- [ ] 股價數據顯示
- [ ] 技術指標計算
- [ ] 圖表顯示

---

## 🆘 遇到問題？

### 問題 1：建置失敗
```bash
# 清除快取重新安裝
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 問題 2：API 無法使用
- 檢查環境變數是否正確設定
- 確認 API 金鑰有效
- 檢查 API 配額

### 問題 3：部署後無法訪問
- 等待 2-3 分鐘（DNS 傳播）
- 清除瀏覽器快取
- 檢查 Vercel 部署日誌

---

## 📚 詳細文件

- [完整部署指南](DEPLOYMENT_GUIDE.md)
- [系統使用說明](README_V2.md)
- [升級報告](UPGRADE_REPORT.md)

---

## 🎉 部署成功範例

```
✅ 專案名稱：小七AI選股系統 v2.0
✅ 線上網址：https://stock-ai-system.vercel.app
✅ 部署時間：2-3 分鐘
✅ 狀態：運行中
```

---

**祝您部署順利！** 🚀

