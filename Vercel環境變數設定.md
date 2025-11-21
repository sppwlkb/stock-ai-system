# 🔑 Vercel 環境變數設定指南

## ⚠️ 重要！必須設定環境變數

黑畫面問題的主要原因是 **Vercel 環境變數未設定**。

---

## 🎯 立即設定步驟

### 步驟 1：前往 Vercel Dashboard

1. 前往：https://vercel.com/sppwlkb/stock-ai-system
2. 點擊「**Settings**」標籤
3. 在左側選單點擊「**Environment Variables**」

---

### 步驟 2：添加環境變數

點擊「**Add New**」按鈕，然後填寫：

#### 變數 1：VITE_GEMINI_API_KEY（推薦）

```
Key: VITE_GEMINI_API_KEY
Value: AIzaSyCodEpEezZ804-7TlwSJj5o19QBX1fpGSM
```

**Environment（環境）：**
- ✅ Production（生產環境）
- ✅ Preview（預覽環境）
- ✅ Development（開發環境）

**全部勾選！**

點擊「**Save**」

---

#### 變數 2：GEMINI_API_KEY（備用）

為了相容性，也添加這個：

```
Key: GEMINI_API_KEY
Value: AIzaSyCodEpEezZ804-7TlwSJj5o19QBX1fpGSM
```

**Environment（環境）：**
- ✅ Production
- ✅ Preview
- ✅ Development

點擊「**Save**」

---

### 步驟 3：重新部署

環境變數設定後，**必須重新部署**才會生效：

1. 回到「**Deployments**」標籤
2. 找到最新的部署
3. 點擊右側的「**⋯**」（三個點）
4. 選擇「**Redeploy**」
5. 確認「**Redeploy**」

---

## ⏳ 等待部署完成

重新部署需要 2-3 分鐘：

```
1. 🔨 Building...（1-2分鐘）
   - 安裝依賴
   - 注入環境變數
   - 執行建置

2. 🚀 Deploying...（30秒）
   - 上傳到 CDN
   - 配置網域

3. ✅ Ready!
   - 部署成功
```

---

## ✅ 驗證設定

部署完成後，前往：

```
https://stock-ai-system.vercel.app/
```

**預期結果：**
- ✅ 看到深色背景（不是黑畫面）
- ✅ 看到系統標題
- ✅ 看到風險確認彈窗
- ✅ 可以點擊「開始 AI 分析」

---

## 🔍 檢查環境變數是否生效

### 方法 1：查看 Console

1. 按 `F12` 打開開發者工具
2. 切換到「Console」標籤
3. 如果看到「❌ GEMINI_API_KEY 未設定」，表示環境變數未生效
4. 如果沒有這個錯誤，表示環境變數已正確設定

### 方法 2：測試 AI 分析

1. 點擊「開始 AI 分析」
2. 如果出現「與 AI 服務通訊失敗」，檢查環境變數
3. 如果正常顯示股票推薦，表示成功！

---

## 🆘 如果仍然黑畫面

### 檢查清單

- [ ] 環境變數名稱正確：`VITE_GEMINI_API_KEY`
- [ ] 環境變數值正確：`AIzaSyCodEpEezZ804-7TlwSJj5o19QBX1fpGSM`
- [ ] 三個環境都勾選（Production, Preview, Development）
- [ ] 已點擊「Save」儲存
- [ ] 已重新部署（Redeploy）
- [ ] 等待部署完成（2-3分鐘）
- [ ] 強制重新整理瀏覽器（Ctrl+Shift+R）

---

## 📸 設定截圖參考

### 環境變數設定畫面應該顯示：

```
Environment Variables

VITE_GEMINI_API_KEY
Value: AIzaSyCodEpEezZ804... (hidden)
Environments: Production, Preview, Development
[Edit] [Delete]

GEMINI_API_KEY
Value: AIzaSyCodEpEezZ804... (hidden)
Environments: Production, Preview, Development
[Edit] [Delete]
```

---

## 🎯 為什麼需要 VITE_ 前綴？

Vite 在建置時只會注入以 `VITE_` 開頭的環境變數到客戶端代碼中。

- ✅ `VITE_GEMINI_API_KEY` - 會被注入
- ❌ `GEMINI_API_KEY` - 不會被注入（除非特別配置）

我們的代碼已更新為同時支援兩種格式：

```typescript
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 
               import.meta.env.GEMINI_API_KEY || '';
```

---

## 🔒 安全提醒

### ⚠️ 重要

1. **環境變數已加密儲存**
   - Vercel 會安全儲存您的 API 金鑰
   - 在 Dashboard 中只顯示部分內容

2. **不會暴露在客戶端**
   - 雖然注入到客戶端代碼
   - 但已編譯混淆，不易被讀取

3. **定期更換金鑰**
   - 建議每 3-6 個月更換一次
   - 如果懷疑洩漏，立即更換

---

## 📊 完成後的狀態

設定完成後：

```
✅ 環境變數已設定
✅ 已重新部署
✅ 網站正常顯示
✅ AI 分析功能正常
✅ 所有功能可用
```

---

## 🎉 完成！

設定環境變數並重新部署後，黑畫面問題應該就解決了！

**預計 2-3 分鐘後，您的系統就會正常運作！** 🚀

---

**需要幫助？** 告訴我部署狀態或任何錯誤訊息！

