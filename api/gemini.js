/**
 * Vercel Serverless Function - Gemini API 代理
 * 用途：隱藏 API Key，提供安全的後端接口
 *
 * 注意：這個文件使用 fetch API 直接調用 Gemini REST API
 * 因為 @google/genai SDK 在 Vercel Edge Runtime 中可能不兼容
 */

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
    // 使用 gemini-1.5-flash（免費且穩定的模型）
    let { prompt, model = 'gemini-1.5-flash', temperature = 1.0 } = req.body;

    // 模型名稱映射（修正錯誤的模型名稱）
    const modelMapping = {
      'gemini-flash-latest': 'gemini-1.5-flash',
      'gemini-flash': 'gemini-1.5-flash',
      'gemini-2.0-flash': 'gemini-1.5-flash',  // 2.0 配額可能有問題，降級到 1.5
      'gemini-pro': 'gemini-1.5-pro',
    };

    // 移除 models/ 前綴（如果有）
    if (model.startsWith('models/')) {
      model = model.replace('models/', '');
    }

    // 應用模型名稱映射
    if (modelMapping[model]) {
      model = modelMapping[model];
    }

    if (!prompt) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'prompt 參數是必需的'
      });
    }

    // 使用 fetch 直接調用 Gemini REST API
    // 使用 v1beta API（支持更多模型）
    // 注意：URL 格式是 /v1beta/models/{model}:generateContent
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log('=== Gemini API Debug ===');
    console.log('Model:', model);
    console.log('API URL:', apiUrl.replace(apiKey, 'API_KEY_HIDDEN'));
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey ? apiKey.length : 0);

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
          maxOutputTokens: 8192,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error Response:', errorText);
      console.error('Status:', response.status);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: { message: errorText } };
      }

      // 詳細的錯誤訊息
      const errorMessage = errorData.error?.message || errorText || `API Error: ${response.status}`;
      console.error('Parsed Error Message:', errorMessage);

      throw new Error(errorMessage);
    }

    const data = await response.json();

    // 提取文本
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('無法從 API 回應中提取文本');
    }

    // 返回結果
    return res.status(200).json({
      success: true,
      text: text,
      model: model,
      timestamp: new Date().toISOString()
    });

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

    // 返回詳細的錯誤訊息（用於調試）
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || '調用 AI 服務時發生錯誤',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

