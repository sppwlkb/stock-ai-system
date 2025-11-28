# 🚀 快速設置後端 API（5 分鐘完成）

## ⚠️ 重要：立即執行以下步驟

您的舊 API Key 已經在對話中暴露，必須立即撤銷並設置新的！

---

## 📋 步驟 1：撤銷舊的 API Key（1 分鐘）

1. 訪問：https://aistudio.google.com/app/apikey
2. 找到這個 API Key：`AIzaSyAhw1qIkr0UHpIHRFyHnEVlM7WMjJ0Vrwk`
3. 點擊「Delete」或「Revoke」
4. 確認撤銷

---

## 📋 步驟 2：生成新的 API Key（1 分鐘）

1. 在同一頁面，點擊「Create API Key」
2. 選擇 Google Cloud 專案
3. 複製新的 API Key
4. **暫時保存在記事本中（不要關閉）**

---

## 📋 步驟 3：在 Vercel 設置環境變量（2 分鐘）

1. 訪問：https://vercel.com/dashboard
2. 選擇專案：`stock-ai-system`
3. 點擊「Settings」（設置）
4. 點擊左側的「Environment Variables」（環境變量）
5. 點擊「Add New」（添加新變量）
6. 填寫：
   - **Name（名稱）：** `GEMINI_API_KEY`
   - **Value（值）：** 貼上您在步驟 2 複製的新 API Key
   - **Environment（環境）：** 勾選全部三個選項
     - ✅ Production
     - ✅ Preview
     - ✅ Development
7. 點擊「Save」（保存）

---

## 📋 步驟 4：重新部署（1 分鐘）

### 方法 A：自動重新部署（推薦）

Vercel 會自動檢測到 Git 推送並重新部署。

**等待 1-2 分鐘**，Vercel 會自動部署最新版本。

### 方法 B：手動重新部署

1. 在 Vercel Dashboard 中，點擊「Deployments」
2. 點擊最新的部署
3. 點擊右上角的「...」（更多選項）
4. 點擊「Redeploy」（重新部署）
5. 確認重新部署

---

## ✅ 步驟 5：測試（1 分鐘）

1. 等待部署完成（約 1-2 分鐘）
2. 訪問：https://stock-ai-system.vercel.app/working.html
3. 按 `Ctrl+Shift+R` 強制重新整理
4. 點擊「開始 AI 分析」
5. 打開 Console（按 F12）

### 預期結果：

**成功：**
```
✅ 使用後端 API 回應
✅ 後端 API 正常回應
AI 原始回應: {...}
```

**失敗（如果看到這個）：**
```
❌ 後端 API 調用失敗
Error: API Key 未設置，請聯繫管理員
```

**解決方案：**
- 檢查環境變量名稱是否正確：`GEMINI_API_KEY`
- 檢查是否勾選了 Production 環境
- 重新部署專案

---

## 🔍 常見問題

### Q1: 我在哪裡找到 Vercel Dashboard？

**A:** https://vercel.com/dashboard

### Q2: 我找不到「Environment Variables」選項

**A:** 
1. 確保您已登入 Vercel
2. 確保您選擇了正確的專案（stock-ai-system）
3. 點擊「Settings」
4. 在左側菜單中找到「Environment Variables」

### Q3: 我設置了環境變量，但還是報錯

**A:**
1. 確認環境變量名稱是 `GEMINI_API_KEY`（區分大小寫）
2. 確認勾選了 `Production` 環境
3. 重新部署專案（Vercel 需要重新部署才能讀取新的環境變量）

### Q4: 如何確認環境變量設置成功？

**A:**
1. 在 Vercel Dashboard 中，進入「Settings」→「Environment Variables」
2. 確認看到 `GEMINI_API_KEY`
3. 確認 `Production` 旁邊有綠色勾選標記

---

## 📊 設置完成檢查清單

- [ ] 撤銷舊的 API Key
- [ ] 生成新的 API Key
- [ ] 在 Vercel 設置 `GEMINI_API_KEY` 環境變量
- [ ] 勾選 Production, Preview, Development
- [ ] 重新部署專案
- [ ] 測試後端 API 正常運作

---

## 🎯 完成後的安全性

✅ **API Key 完全隱藏**
- API Key 存儲在 Vercel 環境變量中
- 不會出現在前端代碼中
- 不會出現在 Git 提交記錄中
- 不會暴露給用戶

✅ **速率限制保護**
- 每分鐘最多 10 次請求
- 每小時最多 100 次請求
- 防止濫用和配額耗盡

✅ **錯誤處理**
- API 配額超限自動提示
- API Key 無效自動提示
- 詳細的錯誤日誌

---

**完成這些步驟後，您的系統將完全安全！** 🔒

