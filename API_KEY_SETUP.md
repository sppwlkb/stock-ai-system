# 🔑 API 金鑰設定指南

## ❌ 問題原因

您遇到的錯誤：
```
API 金鑰無效。請傳遞有效的 API 金鑰。
```

這是因為 `.env.local` 檔案中的 API 金鑰是佔位符 `PLACEHOLDER_API_KEY`，需要替換為真實的 Google Gemini API 金鑰。

---

## ✅ 解決方法

### 步驟 1：獲取 Google Gemini API 金鑰

**我已為您打開 Google AI Studio 頁面**

或手動前往：https://aistudio.google.com/app/apikey

#### 操作步驟：

1. **登入 Google 帳號**
   - 使用您的 Google 帳號登入

2. **創建 API 金鑰**
   - 點擊「Create API Key」或「建立 API 金鑰」
   - 選擇「Create API key in new project」（在新專案中建立 API 金鑰）
   - 或選擇現有的 Google Cloud 專案

3. **複製 API 金鑰**
   - 金鑰格式類似：`AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
   - 點擊複製按鈕
   - **重要：請妥善保管此金鑰，不要分享給他人**

---

### 步驟 2：更新 .env.local 檔案

#### 方法 A：手動編輯（推薦）

1. 打開檔案：`C:\Users\SPPWLKB\Downloads\小七ai選股系統\.env.local`

2. 將內容修改為：
   ```
   GEMINI_API_KEY=你剛才複製的API金鑰
   ```

3. 儲存檔案

#### 方法 B：使用記事本

```bash
# 1. 用記事本打開
notepad "C:\Users\SPPWLKB\Downloads\小七ai選股系統\.env.local"

# 2. 修改內容為：
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# 3. 儲存並關閉
```

#### 範例：

**修改前：**
```
GEMINI_API_KEY=PLACEHOLDER_API_KEY
```

**修改後：**
```
GEMINI_API_KEY=AIzaSyDemoKey123456789ABCDEFGHIJK
```

---

### 步驟 3：重新啟動開發伺服器

```bash
# 1. 停止當前伺服器（按 Ctrl+C）

# 2. 重新啟動
npm run dev

# 3. 重新整理瀏覽器頁面
```

---

## ✅ 驗證 API 金鑰

### 測試 API 金鑰是否有效

您可以使用以下方式測試：

#### 方法 1：在瀏覽器測試

前往：
```
https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY
```

將 `YOUR_API_KEY` 替換為您的 API 金鑰。

如果有效，會返回可用的模型列表。

#### 方法 2：在系統中測試

1. 更新 `.env.local` 後
2. 重新啟動開發伺服器
3. 點擊「開始 AI 分析」
4. 如果成功，會顯示股票推薦

---

## 🆘 常見問題

### Q1: 找不到 .env.local 檔案？

```bash
# 檢查檔案是否存在
dir "C:\Users\SPPWLKB\Downloads\小七ai選股系統\.env.local"

# 如果不存在，創建新檔案
echo GEMINI_API_KEY=你的API金鑰 > "C:\Users\SPPWLKB\Downloads\小七ai選股系統\.env.local"
```

### Q2: API 金鑰仍然無效？

可能原因：
1. **API 金鑰複製錯誤** - 確認沒有多餘的空格或換行
2. **API 金鑰已過期** - 重新生成新的金鑰
3. **API 配額用盡** - 檢查 Google Cloud Console 配額
4. **API 未啟用** - 確認 Gemini API 已啟用

解決方法：
```bash
# 重新生成 API 金鑰
# 前往 https://aistudio.google.com/app/apikey
# 刪除舊金鑰，創建新金鑰
```

### Q3: 修改後仍然報錯？

```bash
# 1. 完全停止開發伺服器（Ctrl+C）
# 2. 清除快取
npm run build

# 3. 重新啟動
npm run dev

# 4. 強制重新整理瀏覽器（Ctrl+Shift+R）
```

### Q4: 如何檢查環境變數是否載入？

在瀏覽器開發者工具 Console 中執行：
```javascript
// 注意：不要在生產環境這樣做！
console.log(import.meta.env.GEMINI_API_KEY ? '已設定' : '未設定');
```

---

## 🔒 安全提醒

### ⚠️ 重要安全事項

1. **不要將 API 金鑰提交到 Git**
   - `.env.local` 已在 `.gitignore` 中
   - 確認不要移除這個設定

2. **不要分享 API 金鑰**
   - 不要在公開場合展示
   - 不要截圖包含金鑰的畫面

3. **定期更換 API 金鑰**
   - 建議每 3-6 個月更換一次

4. **設定使用限制**
   - 在 Google Cloud Console 設定每日配額
   - 設定 IP 限制（如果可能）

---

## 📊 API 配額說明

### 免費額度（Gemini API）

- **每分鐘請求數：** 60 次
- **每天請求數：** 1,500 次
- **每月免費額度：** 充足的免費使用量

### 如果超過配額

1. 等待配額重置（每分鐘/每天）
2. 升級到付費方案
3. 使用多個 API 金鑰輪替

---

## ✅ 完成檢查清單

- [ ] 已前往 Google AI Studio
- [ ] 已創建 API 金鑰
- [ ] 已複製 API 金鑰
- [ ] 已更新 `.env.local` 檔案
- [ ] 已重新啟動開發伺服器
- [ ] 已測試 AI 分析功能
- [ ] 功能正常運作

---

## 🎉 成功！

更新 API 金鑰後，系統應該可以正常運作了！

**測試步驟：**
1. 重新整理頁面
2. 點擊「開始 AI 分析」
3. 等待 10-30 秒
4. 應該會顯示股票推薦

---

**需要更多幫助？**
- Google AI Studio: https://aistudio.google.com
- Gemini API 文件: https://ai.google.dev/docs

