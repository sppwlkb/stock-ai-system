/**
 * Vercel Serverless Function - 列出可用的 Gemini 模型
 * 用途：診斷可用的模型名稱
 */

export default async function handler(req, res) {
  try {
    // 從環境變量獲取 API Key
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Server Configuration Error',
        message: 'API Key 未設置'
      });
    }
    
    // 調用 ListModels API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: 'API Error',
        message: errorText
      });
    }
    
    const data = await response.json();
    
    // 過濾出支持 generateContent 的模型
    const generateContentModels = data.models?.filter(model => 
      model.supportedGenerationMethods?.includes('generateContent')
    ) || [];
    
    // 返回模型列表
    return res.status(200).json({
      success: true,
      totalModels: data.models?.length || 0,
      generateContentModels: generateContentModels.map(m => ({
        name: m.name,
        displayName: m.displayName,
        description: m.description,
        supportedMethods: m.supportedGenerationMethods
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('List Models Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}

