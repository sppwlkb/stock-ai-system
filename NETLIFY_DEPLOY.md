# 🚀 Netlify 部署指南 - 超簡單！

## ✅ 為什麼選擇 Netlify？

- ✅ 比 Vercel 更簡單
- ✅ 環境變數設定更直觀
- ✅ 完全免費
- ✅ 自動 HTTPS
- ✅ 全球 CDN

---

## 🎯 立即部署（5分鐘）

### 步驟 1：連接 GitHub（1分鐘）

**我已為您打開 Netlify 頁面**

1. 點擊「**Import from Git**」
2. 選擇「**GitHub**」
3. 授權 Netlify 訪問您的 GitHub
4. 選擇 `stock-ai-system` Repository

---

### 步驟 2：配置建置設定（30秒）

Netlify 會自動偵測，確認以下設定：

```
Build command: npm run build
Publish directory: dist
```

**不需要修改！**

---

### 步驟 3：設定環境變數（1分鐘）⭐ 重要

在部署前，點擊「**Show advanced**」或「**Advanced build settings**」

然後點擊「**New variable**」，添加：

#### 變數 1：
```
Key: VITE_GEMINI_API_KEY
Value: AIzaSyCodEpEezZ804-7TlwSJj5o19QBX1fpGSM
```

#### 變數 2：
```
Key: GEMINI_API_KEY
Value: AIzaSyCodEpEezZ804-7TlwSJj5o19QBX1fpGSM
```

---

### 步驟 4：部署（2-3分鐘）

1. 點擊「**Deploy site**」
2. 等待 2-3 分鐘
3. 完成！

---

## ✅ 部署成功後

您將獲得網址：

```
https://your-site-name.netlify.app
```

可以在 Netlify Dashboard 中自訂網域名稱。

---

## 🎉 優勢

### Netlify vs Vercel

| 功能 | Netlify | Vercel |
|------|---------|--------|
| 環境變數設定 | ⭐⭐⭐⭐⭐ 超簡單 | ⭐⭐⭐ 較複雜 |
| 部署速度 | ⭐⭐⭐⭐ 快 | ⭐⭐⭐⭐ 快 |
| 免費額度 | ⭐⭐⭐⭐⭐ 充足 | ⭐⭐⭐⭐ 充足 |
| 介面友善度 | ⭐⭐⭐⭐⭐ 非常友善 | ⭐⭐⭐⭐ 友善 |

---

## 📝 netlify.toml 配置

我已經為您準備好配置文件（已在專案中）：

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 🆘 如果遇到問題

### 問題 1：找不到 Repository

**解決：**
1. 確認已授權 Netlify 訪問 GitHub
2. 重新整理頁面
3. 手動搜尋 `stock-ai-system`

### 問題 2：建置失敗

**解決：**
1. 檢查環境變數是否已設定
2. 查看建置日誌
3. 確認 `netlify.toml` 存在

### 問題 3：仍然黑畫面

**解決：**
1. 確認環境變數已設定
2. 重新部署
3. 清除瀏覽器快取

---

## 🎯 完成！

Netlify 部署完成後，您的系統就可以正常使用了！

**比 Vercel 簡單多了！** 🚀

