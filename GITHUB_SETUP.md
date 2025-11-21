# 📦 GitHub Repository 設定指南

## 🎯 我已為您打開 GitHub 創建頁面

請在打開的頁面中填寫以下資訊：

---

## 📝 Repository 設定資訊

### 基本資訊

**Repository name（必填）:**
```
stock-ai-system
```

**Description（建議填寫）:**
```
小七AI選股系統 v2.0 - 專業級台股分析工具 | 整合真實股價API、7種技術指標、風險管理系統
```

### 設定選項

- **Public** ✅ 選擇這個（推薦，可以使用 Vercel 免費部署）
- **Private** ⬜ 如果您想保持私密

**不要勾選以下選項：**
- ⬜ Add a README file（我們已經有了）
- ⬜ Add .gitignore（我們已經有了）
- ⬜ Choose a license（可選）

---

## 🚀 創建後的步驟

### 步驟 1：複製 Repository URL

創建完成後，GitHub 會顯示快速設定頁面，複製 HTTPS URL：
```
https://github.com/sppwlkb/stock-ai-system.git
```

### 步驟 2：在終端執行以下命令

```bash
# 進入專案目錄
cd "C:\Users\SPPWLKB\Downloads\小七ai選股系統"

# 添加 remote
git remote add origin https://github.com/sppwlkb/stock-ai-system.git

# 推送代碼
git branch -M main
git push -u origin main
```

### 步驟 3：驗證推送成功

前往您的 Repository 頁面：
```
https://github.com/sppwlkb/stock-ai-system
```

應該可以看到所有檔案已經上傳。

---

## ✅ 推送成功後

您將看到以下檔案結構：

```
stock-ai-system/
├── components/          # React 元件
├── services/           # 核心服務
├── config/             # 配置文件
├── .github/            # GitHub Actions
├── App.tsx             # 主應用
├── package.json        # 依賴管理
├── vercel.json         # Vercel 配置
├── README_V2.md        # 使用說明
└── ... 其他文件
```

---

## 🎯 下一步：部署到 Vercel

推送成功後，立即前往 Vercel 部署：

### 方法 1：網頁介面（推薦）

1. 前往：https://vercel.com/new
2. 選擇「Import Git Repository」
3. 找到 `stock-ai-system`
4. 點擊「Import」
5. 添加環境變數：
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
6. 點擊「Deploy」

### 方法 2：使用 CLI

```bash
cd "C:\Users\SPPWLKB\Downloads\小七ai選股系統"
vercel
# 按照提示操作
```

---

## 🆘 常見問題

### Q1: 推送時要求輸入帳號密碼？

GitHub 已不支援密碼驗證，需要使用 Personal Access Token：

1. 前往：https://github.com/settings/tokens
2. 點擊「Generate new token (classic)」
3. 勾選 `repo` 權限
4. 複製 token
5. 推送時使用 token 作為密碼

### Q2: 推送失敗？

```bash
# 檢查 remote 設定
git remote -v

# 如果需要重新設定
git remote remove origin
git remote add origin https://github.com/sppwlkb/stock-ai-system.git

# 強制推送（如果需要）
git push -u origin main --force
```

### Q3: 想要更改 Repository 名稱？

1. 前往 Repository 頁面
2. Settings → General
3. Repository name → 修改名稱
4. 更新本地 remote：
   ```bash
   git remote set-url origin https://github.com/sppwlkb/NEW_NAME.git
   ```

---

## 📊 Repository 建議設定

創建後，建議進行以下設定：

### 1. 添加 Topics（標籤）

在 Repository 頁面點擊「Add topics」，添加：
- `stock-analysis`
- `taiwan-stock`
- `ai`
- `react`
- `typescript`
- `technical-indicators`
- `risk-management`

### 2. 設定 About

在 Repository 頁面右側「About」區域：
- Description: 小七AI選股系統 v2.0
- Website: （部署後填入 Vercel URL）
- Topics: （如上）

### 3. 啟用 GitHub Pages（可選）

如果想要額外的文件網站：
1. Settings → Pages
2. Source: Deploy from a branch
3. Branch: main / docs

---

## 🎉 完成！

Repository 創建並推送成功後，您就可以：

1. ✅ 在 Vercel 部署
2. ✅ 分享專案連結
3. ✅ 接受其他開發者的貢獻
4. ✅ 使用 GitHub Actions 自動部署

---

**需要幫助？**
- GitHub 文件：https://docs.github.com
- Vercel 文件：https://vercel.com/docs

