# 🚀 Vercel 部署步驟

## ✅ 已完成的準備工作

- ✅ 代碼已推送到 GitHub
- ✅ Repository: https://github.com/sppwlkb/stock-ai-system
- ✅ API 金鑰已設定
- ✅ Vercel 部署頁面已打開

---

## 🎯 現在請在 Vercel 頁面執行以下步驟：

### 步驟 1：導入 GitHub Repository

**我已為您打開 Vercel 部署頁面**

1. 在頁面中找到「Import Git Repository」
2. 如果看到 `stock-ai-system`，點擊「Import」
3. 如果沒看到，點擊「Add GitHub Account」授權

---

### 步驟 2：配置專案設定

Vercel 會自動偵測為 Vite 專案，確認以下設定：

```
Framework Preset: Vite ✅（自動偵測）
Root Directory: ./
Build Command: npm run build ✅
Output Directory: dist ✅
Install Command: npm install ✅
```

**不需要修改，保持預設即可！**

---

### 步驟 3：設定環境變數（重要！）

點擊「Environment Variables」，添加：

```
Name: GEMINI_API_KEY
Value: AIzaSyCodEpEezZ804-7TlwSJj5o19QBX1fpGSM
Environment: Production, Preview, Development（全選）
```

**步驟：**
1. 在 Name 欄位輸入：`GEMINI_API_KEY`
2. 在 Value 欄位輸入：`AIzaSyCodEpEezZ804-7TlwSJj5o19QBX1fpGSM`
3. 確認三個環境都勾選（Production, Preview, Development）
4. 點擊「Add」

---

### 步驟 4：部署

1. 確認所有設定正確
2. 點擊「**Deploy**」按鈕
3. 等待 2-3 分鐘

---

## ⏳ 部署過程

您會看到以下階段：

```
1. Building... 🔨
   - Installing dependencies
   - Running build command
   - Optimizing assets

2. Deploying... 🚀
   - Uploading to CDN
   - Configuring domains

3. Ready! ✅
   - Deployment successful
```

---

## ✅ 部署成功後

您將獲得：

### 1. 部署網址

```
主要網址：https://stock-ai-system.vercel.app
或
https://stock-ai-system-sppwlkb.vercel.app
```

### 2. 自動功能

- ✅ 自動 HTTPS
- ✅ 全球 CDN 加速
- ✅ 自動部署（推送代碼後自動更新）
- ✅ 預覽部署（Pull Request 自動預覽）

---

## 🧪 測試部署結果

部署完成後，請測試：

### 1. 訪問網站

點擊 Vercel 提供的網址

### 2. 測試功能

- [ ] 風險確認彈窗顯示
- [ ] 點擊「我已了解並同意」
- [ ] 點擊「開始 AI 分析」
- [ ] 等待 10-30 秒
- [ ] 查看股票推薦
- [ ] 查看技術指標
- [ ] 查看風險評估
- [ ] 即時股價更新

---

## 🆘 如果部署失敗

### 常見問題

#### 1. 建置失敗

**檢查：**
- 建置日誌中的錯誤訊息
- 確認 `package.json` 正確

**解決：**
```bash
# 本地測試建置
npm run build

# 如果成功，重新部署
git push
```

#### 2. 環境變數無效

**檢查：**
- 環境變數名稱是否為 `GEMINI_API_KEY`
- 環境變數值是否正確
- 是否選擇了所有環境

**解決：**
1. 前往 Vercel Dashboard
2. 選擇專案
3. Settings → Environment Variables
4. 重新添加或修改
5. Redeploy

#### 3. API 請求失敗

**檢查：**
- API 金鑰是否有效
- API 配額是否充足

**解決：**
- 檢查 Google AI Studio
- 確認 API 金鑰未過期

---

## 📊 部署後管理

### Vercel Dashboard

前往：https://vercel.com/dashboard

您可以：
- 查看部署歷史
- 查看分析數據
- 管理環境變數
- 設定自訂網域
- 查看建置日誌

### 自動部署

每次推送代碼到 GitHub，Vercel 會自動：
1. 偵測變更
2. 執行建置
3. 部署新版本
4. 更新網站

---

## 🎉 完成！

部署成功後，您的專案將可以透過網址訪問！

**分享您的專案：**

```
專案名稱：小七AI選股系統 v2.0
GitHub：https://github.com/sppwlkb/stock-ai-system
線上網址：https://stock-ai-system.vercel.app
```

---

## 📚 相關資源

- Vercel 文件：https://vercel.com/docs
- Vite 部署指南：https://vitejs.dev/guide/static-deploy.html
- GitHub Actions：https://docs.github.com/actions

---

**祝您部署順利！** 🚀

