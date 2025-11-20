# 🚀 小七AI選股系統 v2.0 - 部署指南

## 📋 部署前準備

### 1. 必要條件
- ✅ GitHub 帳號
- ✅ Vercel 帳號（免費）
- ✅ Google Gemini API 金鑰

### 2. 環境變數
需要設定以下環境變數：
```
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🎯 方案一：Vercel 一鍵部署（推薦）

### 步驟 1：準備 GitHub Repository

```bash
# 1. 初始化 Git（如果尚未初始化）
cd "Downloads/小七ai選股系統"
git init

# 2. 添加所有檔案
git add .

# 3. 提交
git commit -m "Initial commit - 小七AI選股系統 v2.0"

# 4. 在 GitHub 創建新 Repository
# 前往 https://github.com/new
# Repository 名稱：stock-ai-system（或您喜歡的名稱）
# 設為 Public 或 Private

# 5. 連接到 GitHub
git remote add origin https://github.com/YOUR_USERNAME/stock-ai-system.git
git branch -M main
git push -u origin main
```

### 步驟 2：部署到 Vercel

#### 方法 A：透過 Vercel 網站（最簡單）

1. **前往 Vercel**
   - 訪問：https://vercel.com
   - 使用 GitHub 帳號登入

2. **導入專案**
   - 點擊「Add New...」→「Project」
   - 選擇您的 GitHub Repository
   - 點擊「Import」

3. **配置專案**
   - Framework Preset：自動偵測為 `Vite`
   - Build Command：`npm run build`
   - Output Directory：`dist`
   - Install Command：`npm install`

4. **設定環境變數**
   - 點擊「Environment Variables」
   - 添加：
     ```
     Name: GEMINI_API_KEY
     Value: your_gemini_api_key_here
     ```
   - 選擇所有環境（Production, Preview, Development）

5. **部署**
   - 點擊「Deploy」
   - 等待 2-3 分鐘
   - 部署完成後會獲得網址：`https://your-project.vercel.app`

#### 方法 B：使用 Vercel CLI

```bash
# 1. 安裝 Vercel CLI
npm install -g vercel

# 2. 登入 Vercel
vercel login

# 3. 部署專案
cd "Downloads/小七ai選股系統"
vercel

# 4. 按照提示操作
# - Set up and deploy? Yes
# - Which scope? 選擇您的帳號
# - Link to existing project? No
# - What's your project's name? stock-ai-system
# - In which directory is your code located? ./
# - Want to override the settings? No

# 5. 設定環境變數
vercel env add GEMINI_API_KEY

# 6. 部署到生產環境
vercel --prod
```

---

## 🎯 方案二：Netlify 部署

### 步驟 1：準備專案

```bash
# 創建 netlify.toml 配置文件
# （已包含在專案中）
```

### 步驟 2：部署

1. **前往 Netlify**
   - 訪問：https://app.netlify.com
   - 使用 GitHub 帳號登入

2. **導入專案**
   - 點擊「Add new site」→「Import an existing project」
   - 選擇「GitHub」
   - 選擇您的 Repository

3. **配置建置設定**
   - Build command：`npm run build`
   - Publish directory：`dist`

4. **設定環境變數**
   - 前往「Site settings」→「Environment variables」
   - 添加：`GEMINI_API_KEY`

5. **部署**
   - 點擊「Deploy site」
   - 獲得網址：`https://your-site.netlify.app`

---

## 🎯 方案三：GitHub Pages 部署

### 步驟 1：修改 vite.config.ts

```typescript
export default defineConfig({
  base: '/stock-ai-system/', // 改為您的 repo 名稱
  // ... 其他配置
});
```

### 步驟 2：創建部署腳本

```bash
# 已包含在 .github/workflows/deploy-gh-pages.yml
```

### 步驟 3：啟用 GitHub Pages

1. 前往 GitHub Repository
2. Settings → Pages
3. Source：選擇「GitHub Actions」
4. 推送代碼後自動部署

**注意：** GitHub Pages 不支援環境變數，需要在客戶端處理 API 金鑰（不推薦）

---

## ✅ 部署後檢查清單

### 1. 功能測試
- [ ] 網站可正常訪問
- [ ] 風險確認彈窗正常顯示
- [ ] 點擊「開始分析」可正常運作
- [ ] AI 分析功能正常
- [ ] 股價數據正常顯示
- [ ] 技術指標正常計算
- [ ] 風險評估正常顯示
- [ ] 圖表正常顯示

### 2. 效能檢查
- [ ] 首次載入時間 < 3 秒
- [ ] Lighthouse 分數 > 90
- [ ] 無 Console 錯誤

### 3. 安全檢查
- [ ] API 金鑰未暴露在前端代碼
- [ ] HTTPS 已啟用
- [ ] 免責聲明正常顯示

---

## 🔧 常見問題排查

### 問題 1：部署失敗

**可能原因：**
- Node.js 版本不符
- 依賴安裝失敗
- 建置錯誤

**解決方法：**
```bash
# 本地測試建置
npm run build

# 檢查錯誤訊息
# 修正後重新部署
```

### 問題 2：環境變數無效

**可能原因：**
- 環境變數名稱錯誤
- 未重新部署

**解決方法：**
1. 確認環境變數名稱為 `GEMINI_API_KEY`
2. 重新部署專案

### 問題 3：API 請求失敗

**可能原因：**
- CORS 問題
- API 金鑰無效

**解決方法：**
1. 檢查 API 金鑰是否正確
2. 確認 API 配額未用盡

---

## 📊 部署平台比較

| 平台 | 優點 | 缺點 | 推薦度 |
|------|------|------|--------|
| **Vercel** | 最簡單、自動 CI/CD、全球 CDN | 免費額度有限 | ⭐⭐⭐⭐⭐ |
| **Netlify** | 免費額度充足、易用 | 建置速度較慢 | ⭐⭐⭐⭐☆ |
| **GitHub Pages** | 完全免費、穩定 | 不支援環境變數 | ⭐⭐⭐☆☆ |

---

## 🎉 部署成功後

### 分享您的專案
```
專案名稱：小七AI選股系統 v2.0
線上網址：https://your-project.vercel.app
GitHub：https://github.com/YOUR_USERNAME/stock-ai-system
```

### 持續更新
```bash
# 修改代碼後
git add .
git commit -m "Update: 功能描述"
git push

# Vercel 會自動重新部署
```

---

**部署完成！** 🎊

如有任何問題，請參考：
- Vercel 文件：https://vercel.com/docs
- Netlify 文件：https://docs.netlify.com
- GitHub Pages 文件：https://docs.github.com/pages

