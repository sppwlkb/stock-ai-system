# 📄 GitHub Pages 部署指南

## ⚠️ 注意事項

GitHub Pages **不支援環境變數**，所以需要將 API 金鑰直接編譯到代碼中。

**不推薦用於生產環境**（API 金鑰會暴露）

---

## 🎯 如果仍要使用

### 步驟 1：修改代碼

創建 `.env.production` 檔案：

```
VITE_GEMINI_API_KEY=AIzaSyCodEpEezZ804-7TlwSJj5o19QBX1fpGSM
```

---

### 步驟 2：安裝 gh-pages

```bash
npm install --save-dev gh-pages
```

---

### 步驟 3：修改 package.json

添加：

```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "homepage": "https://sppwlkb.github.io/stock-ai-system"
}
```

---

### 步驟 4：部署

```bash
npm run deploy
```

---

### 步驟 5：啟用 GitHub Pages

1. 前往 GitHub Repository
2. Settings → Pages
3. Source: gh-pages branch
4. Save

---

## 🌐 網址

```
https://sppwlkb.github.io/stock-ai-system
```

---

## ⚠️ 缺點

- ❌ API 金鑰會暴露在代碼中
- ❌ 不支援環境變數
- ❌ 不適合生產環境

**建議使用 Netlify 或 Cloudflare Pages！**

