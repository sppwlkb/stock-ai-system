# 🔒 後端 API 安全設置指南

## 📋 概述

本系統已升級為**後端 API 架構**，API Key 完全隱藏在後端，不會暴露在前端代碼中。

---

## 🎯 架構說明

### 之前的架構（不安全）❌
```
前端 → 直接調用 Gemini API（API Key 暴露在前端代碼中）
```

### 現在的架構（安全）✅
```
前端 → 後端 API (/api/gemini) → Gemini API
                ↑
          API Key 存儲在環境變量中（安全）
```

---

## 🔧 設置步驟

### 步驟 1：撤銷舊的 API Key

1. 訪問：https://aistudio.google.com/app/apikey
2. 找到舊的 API Key：`AIzaSyAhw1qIkr0UHpIHRFyHnEVlM7WMjJ0Vrwk`
3. 點擊「Delete」或「Revoke」
4. 確認撤銷

⚠️ **重要：** 這個 API Key 已經在對話中暴露，必須立即撤銷！

---

### 步驟 2：生成新的 API Key

1. 訪問：https://aistudio.google.com/app/apikey
2. 點擊「Create API Key」
3. 選擇 Google Cloud 專案
4. 複製新的 API Key
5. **不要在任何地方分享這個 API Key！**

---

### 步驟 3：在 Vercel 中設置環境變量

1. 登入 Vercel Dashboard：https://vercel.com/dashboard
2. 選擇專案：`stock-ai-system`
3. 點擊「Settings」
4. 點擊「Environment Variables」
5. 添加新的環境變量：
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `您的新 API Key`（從步驟 2 複製）
   - **Environment:** 勾選 `Production`, `Preview`, `Development`
6. 點擊「Save」

---

### 步驟 4：重新部署

1. 在 Vercel Dashboard 中，點擊「Deployments」
2. 點擊最新的部署
3. 點擊「Redeploy」
4. 等待部署完成（約 1-2 分鐘）

---

## ✅ 驗證設置

### 測試後端 API

1. 訪問：`https://stock-ai-system.vercel.app/working.html`
2. 按 `Ctrl+Shift+R` 強制重新整理
3. 點擊「開始 AI 分析」
4. 打開 Console（F12）

**預期 Console 日誌：**
```
✅ 使用後端 API 回應
✅ 後端 API 正常回應
```

**如果看到錯誤：**
```
❌ 後端 API 調用失敗
```

**解決方案：**
1. 檢查 Vercel 環境變量是否正確設置
2. 檢查 API Key 是否有效
3. 重新部署專案

---

## 🔒 安全特性

### 1. API Key 隱藏
- ✅ API Key 存儲在 Vercel 環境變量中
- ✅ 不會出現在前端代碼中
- ✅ 不會出現在 Git 提交記錄中
- ✅ 不會暴露給用戶

### 2. 速率限制
- ✅ 每分鐘最多 10 次請求
- ✅ 每小時最多 100 次請求
- ✅ 防止濫用和配額耗盡

### 3. 錯誤處理
- ✅ API 配額超限自動提示
- ✅ API Key 無效自動提示
- ✅ 詳細的錯誤日誌

---

## 📊 後端 API 端點

### `/api/gemini`

**請求格式：**
```json
POST /api/gemini
Content-Type: application/json

{
  "prompt": "您的提示詞",
  "model": "gemini-2.0-flash-exp",
  "temperature": 1.0
}
```

**成功回應：**
```json
{
  "success": true,
  "text": "AI 生成的文本",
  "model": "gemini-2.0-flash-exp",
  "timestamp": "2025-11-26T17:00:00.000Z"
}
```

**錯誤回應：**
```json
{
  "error": "Too Many Requests",
  "message": "每分鐘請求次數超過限制（最多 10 次）"
}
```

---

## 🚨 常見問題

### Q1: 為什麼要使用後端 API？

**A:** 
- 前端代碼中的 API Key 會暴露給所有用戶
- 任何人都可以複製並使用您的 API Key
- 這會導致您的免費配額被快速消耗
- 後端 API 可以完全隱藏 API Key

### Q2: 如何檢查環境變量是否設置成功？

**A:**
1. 在 Vercel Dashboard 中，進入「Settings」→「Environment Variables」
2. 確認 `GEMINI_API_KEY` 存在
3. 確認勾選了 `Production`, `Preview`, `Development`

### Q3: 如果後端 API 失敗怎麼辦？

**A:**
- 系統會自動記錄錯誤日誌
- 檢查 Console 中的錯誤訊息
- 確認環境變量設置正確
- 確認 API Key 有效且未超過配額

### Q4: 如何更換 API Key？

**A:**
1. 在 Google AI Studio 生成新的 API Key
2. 在 Vercel Dashboard 中更新 `GEMINI_API_KEY` 環境變量
3. 重新部署專案

---

## 📝 檔案結構

```
stock-ai-system/
├── api/
│   └── gemini.js          # 後端 API 端點（Vercel Serverless Function）
├── public/
│   └── working.html       # 前端頁面（調用後端 API）
├── .env.example           # 環境變量範例
└── BACKEND_API_SETUP.md   # 本文件
```

---

## 🎯 下一步

1. ✅ 撤銷舊的 API Key
2. ✅ 生成新的 API Key
3. ✅ 在 Vercel 設置環境變量
4. ✅ 重新部署專案
5. ✅ 測試後端 API

---

**完成後，您的 API Key 將完全安全，不會再暴露給任何人！** 🔒

