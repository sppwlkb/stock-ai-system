# ☁️ Cloudflare Pages 部署指南

## 🎯 快速部署

### 步驟 1：前往 Cloudflare Pages

前往：https://pages.cloudflare.com/

1. 登入或註冊 Cloudflare 帳號
2. 點擊「Create a project」
3. 選擇「Connect to Git」

---

### 步驟 2：連接 GitHub

1. 選擇「GitHub」
2. 授權 Cloudflare 訪問
3. 選擇 `stock-ai-system` Repository

---

### 步驟 3：配置建置

```
Framework preset: Vite
Build command: npm run build
Build output directory: dist
```

---

### 步驟 4：環境變數

```
VITE_GEMINI_API_KEY = AIzaSyCodEpEezZ804-7TlwSJj5o19QBX1fpGSM
GEMINI_API_KEY = AIzaSyCodEpEezZ804-7TlwSJj5o19QBX1fpGSM
```

---

### 步驟 5：部署

點擊「Save and Deploy」

---

## ✅ 優點

- ✅ 全球最快的 CDN
- ✅ 無限流量
- ✅ 完全免費
- ✅ DDoS 防護

---

## 🌐 網址

```
https://your-project.pages.dev
```

