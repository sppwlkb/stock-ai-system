# 🔧 修復 API 錯誤 - 快速指南

## ❌ 您遇到的錯誤

```
API 金鑰無效。請傳遞有效的 API 金鑰。
```

---

## ✅ 3步驟快速修復

### 步驟 1：獲取 API 金鑰（2分鐘）

**我已為您打開 Google AI Studio 頁面**

或手動前往：https://aistudio.google.com/app/apikey

1. 登入 Google 帳號
2. 點擊「Create API Key」
3. 複製 API 金鑰（格式：`AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`）

---

### 步驟 2：設定 API 金鑰（1分鐘）

#### 🎯 方法 A：雙擊執行（最簡單）

1. 找到檔案：`設定API金鑰.bat`
2. 雙擊執行
3. 按照提示貼上 API 金鑰
4. 完成！

#### 方法 B：手動編輯

1. 打開檔案：`.env.local`
2. 修改內容為：
   ```
   GEMINI_API_KEY=你的API金鑰
   ```
3. 儲存檔案

---

### 步驟 3：重新啟動（1分鐘）

```bash
# 1. 停止開發伺服器（按 Ctrl+C）

# 2. 重新啟動
npm run dev

# 3. 重新整理瀏覽器（Ctrl+Shift+R）

# 4. 點擊「開始 AI 分析」測試
```

---

## 📝 範例

### 修改前（錯誤）
```
GEMINI_API_KEY=PLACEHOLDER_API_KEY
```

### 修改後（正確）
```
GEMINI_API_KEY=AIzaSyDemoKey123456789ABCDEFGHIJK
```

---

## ✅ 驗證成功

修復後，您應該可以：

- ✅ 點擊「開始 AI 分析」
- ✅ 等待 10-30 秒
- ✅ 看到股票推薦列表
- ✅ 查看技術指標分析
- ✅ 查看風險評估

---

## 🆘 仍然有問題？

### 檢查清單

- [ ] API 金鑰格式正確（以 `AIza` 開頭）
- [ ] `.env.local` 檔案已儲存
- [ ] 開發伺服器已重新啟動
- [ ] 瀏覽器已強制重新整理

### 其他可能原因

1. **API 配額用盡**
   - 檢查：https://console.cloud.google.com/
   - 解決：等待配額重置或升級方案

2. **API 未啟用**
   - 前往 Google Cloud Console
   - 啟用 Generative Language API

3. **網路問題**
   - 檢查網路連線
   - 嘗試使用 VPN

---

## 📚 詳細文件

- [API 金鑰設定指南](API_KEY_SETUP.md) - 完整說明
- [系統使用說明](README_V2.md) - 功能介紹
- [部署指南](DEPLOYMENT_GUIDE.md) - 線上部署

---

## 🎉 完成！

設定完成後，您就可以開始使用小七AI選股系統了！

**享受專業的股市分析體驗！** 🚀

