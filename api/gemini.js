/**
 * Vercel Serverless Function - Gemini API 代理
 * 用途：隱藏 API Key，提供安全的後端接口
 *
 * 注意：這個文件使用 fetch API 直接調用 Gemini REST API
 * 因為 @google/genai SDK 在 Vercel Edge Runtime 中可能不兼容
 *
 * 🆕 新增功能：
 * - 多模型備援機制（自動切換到可用模型）
 * - 重試機制（Exponential Backoff）
 */

// 模型優先順序（當主模型過載時自動切換）
// 注意：gemini-1.5-flash 在 v1beta 中已不可用
const MODEL_PRIORITY = [
  'gemini-2.5-flash',           // 主模型（最新、最強）
  'gemini-2.0-flash',           // 備用 1（穩定）
  'gemini-2.0-flash-lite',      // 備用 2（輕量快速）
];

// 重試配置
const RETRY_CONFIG = {
  maxRetries: 2,           // 每個模型最多重試 2 次
  baseDelayMs: 1000,       // 基礎等待時間 1 秒
  maxDelayMs: 4000,        // 最大等待時間 4 秒
};

// 速率限制配置（防止濫用）
const RATE_LIMIT = {
  maxRequestsPerMinute: 10,
  maxRequestsPerHour: 100,
};

// 簡單的內存速率限制器（生產環境建議使用 Redis）
const rateLimitStore = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const userKey = `user:${ip}`;
  
  if (!rateLimitStore.has(userKey)) {
    rateLimitStore.set(userKey, {
      minute: { count: 0, resetTime: now + 60000 },
      hour: { count: 0, resetTime: now + 3600000 },
    });
  }
  
  const userData = rateLimitStore.get(userKey);
  
  // 檢查分鐘限制
  if (now > userData.minute.resetTime) {
    userData.minute = { count: 0, resetTime: now + 60000 };
  }
  if (userData.minute.count >= RATE_LIMIT.maxRequestsPerMinute) {
    return { allowed: false, reason: '每分鐘請求次數超過限制（最多 10 次）' };
  }
  
  // 檢查小時限制
  if (now > userData.hour.resetTime) {
    userData.hour = { count: 0, resetTime: now + 3600000 };
  }
  if (userData.hour.count >= RATE_LIMIT.maxRequestsPerHour) {
    return { allowed: false, reason: '每小時請求次數超過限制（最多 100 次）' };
  }
  
  // 增加計數
  userData.minute.count++;
  userData.hour.count++;
  
  return { allowed: true };
}

export default async function handler(req, res) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 獲取客戶端 IP（用於速率限制）
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';

  // 檢查速率限制
  const rateLimitCheck = checkRateLimit(ip);
  if (!rateLimitCheck.allowed) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: rateLimitCheck.reason
    });
  }

  try {
    // 從環境變量獲取 API Key（安全）
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return res.status(500).json({
        error: 'Server Configuration Error',
        message: 'API Key 未設置，請聯繫管理員'
      });
    }

    // 從請求中獲取參數
    let { prompt, temperature = 1.0 } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'prompt 參數是必需的'
      });
    }

    // 🆕 使用多模型備援機制
    let lastError = null;
    let usedModel = null;

    for (const model of MODEL_PRIORITY) {
      console.log(`\n=== 嘗試模型: ${model} ===`);

      // 對每個模型進行重試
      for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            // 計算重試等待時間（Exponential Backoff）
            const delay = Math.min(
              RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt - 1),
              RETRY_CONFIG.maxDelayMs
            );
            console.log(`等待 ${delay}ms 後重試... (第 ${attempt} 次)`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

          console.log(`[${model}] 嘗試 ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}`);

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }],
              generationConfig: {
                temperature: temperature,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 65536,
              }
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch (e) {
              errorData = { error: { message: errorText } };
            }
            const errorMessage = errorData.error?.message || errorText || `API Error: ${response.status}`;

            // 檢查是否為可重試的錯誤
            const isRetryable =
              response.status === 503 ||
              response.status === 429 ||
              errorMessage.includes('overloaded') ||
              errorMessage.includes('temporarily unavailable') ||
              errorMessage.includes('quota');

            if (isRetryable && attempt < RETRY_CONFIG.maxRetries) {
              console.log(`[${model}] 可重試錯誤: ${errorMessage}`);
              lastError = new Error(errorMessage);
              continue; // 繼續重試
            }

            // 不可重試或已達最大重試次數，切換到下一個模型
            console.log(`[${model}] 無法使用: ${errorMessage}`);
            lastError = new Error(errorMessage);
            break; // 跳出重試循環，嘗試下一個模型
          }

          // 成功！
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!text) {
            throw new Error('無法從 API 回應中提取文本');
          }

          usedModel = model;
          console.log(`✅ 成功使用模型: ${model}`);

          return res.status(200).json({
            success: true,
            text: text,
            model: usedModel,
            fallbackUsed: model !== MODEL_PRIORITY[0],
            timestamp: new Date().toISOString()
          });

        } catch (fetchError) {
          console.error(`[${model}] 請求錯誤:`, fetchError.message);
          lastError = fetchError;

          if (attempt < RETRY_CONFIG.maxRetries) {
            continue; // 繼續重試
          }
          break; // 嘗試下一個模型
        }
      }
    }

    // 所有模型都失敗
    console.error('所有模型都無法使用:', lastError?.message);
    throw lastError || new Error('所有 AI 模型都暫時無法使用');

  } catch (error) {
    console.error('Gemini API Error:', error);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);

    // 處理不同類型的錯誤
    if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({
        error: 'API Quota Exceeded',
        message: 'API 配額已用完，請稍後再試',
        details: error.message
      });
    }

    if (error.message?.includes('403') || error.message?.includes('API_KEY_INVALID')) {
      return res.status(403).json({
        error: 'API Key Invalid',
        message: 'API Key 無效或已被撤銷',
        details: error.message
      });
    }

    if (error.message?.includes('400') || error.message?.includes('INVALID_ARGUMENT')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '請求參數錯誤',
        details: error.message
      });
    }

    // 處理模型過載錯誤
    if (error.message?.includes('overloaded') || error.message?.includes('503')) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: '所有 AI 模型都暫時過載，請稍後再試（約 1-2 分鐘）',
        details: error.message,
        modelsAttempted: MODEL_PRIORITY,
        timestamp: new Date().toISOString()
      });
    }

    // 返回詳細的錯誤訊息（用於調試）
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || '調用 AI 服務時發生錯誤',
      details: error.message,
      modelsAttempted: MODEL_PRIORITY,
      timestamp: new Date().toISOString()
    });
  }
}

