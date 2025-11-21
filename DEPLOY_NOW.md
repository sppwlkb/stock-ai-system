# 🚀 立即部署指南 - 小七AI選股系統 v2.0

## ✅ 已完成的準備工作

- ✅ Git 已初始化
- ✅ 代碼已提交
- ✅ 建置測試成功
- ✅ Vercel CLI 已安裝
- ✅ 您已登入 Vercel (sppwlkb)

---

## 🎯 最簡單的部署方式（推薦）

### 方法一：使用 Vercel 網頁介面（3分鐘）

#### 步驟 1：推送到 GitHub

```bash
# 在終端執行以下命令：
cd "C:\Users\SPPWLKB\Downloads\小七ai選股系統"

# 創建 GitHub Repository（前往 https://github.com/new）
# Repository 名稱：stock-ai-system
# 設為 Public

# 連接並推送
git remote add origin https://github.com/sppwlkb/stock-ai-system.git
git branch -M main
git push -u origin main
```

#### 步驟 2：在 Vercel 導入專案

1. 前往：https://vercel.com/new
2. 點擊「Import Git Repository」
3. 選擇 `stock-ai-system`
4. 點擊「Import」

#### 步驟 3：配置專案

- **Framework Preset**: Vite（自動偵測）
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 步驟 4：設定環境變數

點擊「Environment Variables」，添加：

```
Name: GEMINI_API_KEY
Value: [您的 Gemini API 金鑰]
```

#### 步驟 5：部署

點擊「Deploy」，等待 2-3 分鐘即可完成！

---

### 方法二：使用 Vercel CLI（互動式）

```bash
# 在終端執行：
cd "C:\Users\SPPWLKB\Downloads\小七ai選股系統"
vercel

# 按照提示操作：
# ? Set up and deploy? [Y/n] y
# ? Which scope? sppwlkb
# ? Link to existing project? [y/N] n
# ? What's your project's name? stock-ai-system
# ? In which directory is your code located? ./

# 等待部署完成後，設定環境變數：
vercel env add GEMINI_API_KEY production

# 部署到生產環境：
vercel --prod
```

---

## 🔑 獲取 Gemini API 金鑰

1. 前往：https://ai.google.dev/
2. 點擊「Get API Key」
3. 創建新的 API 金鑰
4. 複製金鑰

---

## 📊 預期結果

部署成功後，您將獲得：

```
✅ 部署網址：https://stock-ai-system.vercel.app
✅ 或：https://stock-ai-system-sppwlkb.vercel.app
✅ 自動 HTTPS
✅ 全球 CDN 加速
```

---

## 🆘 如果遇到問題

### 問題 1：GitHub 推送失敗

```bash
# 確認 GitHub Repository 已創建
# 檢查 remote URL
git remote -v

# 如果需要重新設定
git remote remove origin
git remote add origin https://github.com/sppwlkb/stock-ai-system.git
```

### 問題 2：Vercel 部署失敗

- 檢查建置日誌
- 確認環境變數已設定
- 確認 `package.json` 中的 scripts 正確

### 問題 3：環境變數無效

- 重新部署專案
- 確認變數名稱為 `GEMINI_API_KEY`
- 檢查 API 金鑰是否有效

---

## 📝 部署後檢查清單

- [ ] 網站可正常訪問
- [ ] 風險確認彈窗顯示
- [ ] 點擊「開始分析」正常
- [ ] AI 分析功能正常
- [ ] 股價數據正常顯示
- [ ] 技術指標正常計算

---

## 🎉 完成！

部署完成後，您的專案將可以透過網址訪問！

**下一步：**
1. 測試所有功能
2. 分享您的專案
3. 持續優化改進

---

**需要幫助？** 請參考：
- [完整部署指南](DEPLOYMENT_GUIDE.md)
- [快速部署指南](QUICK_DEPLOY.md)
- Vercel 文件：https://vercel.com/docs

