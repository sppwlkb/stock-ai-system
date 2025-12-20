/**
 * Vercel Serverless Function - 台灣加權指數 API
 * 用途：獲取真實的加權指數數據，用於驗證 AI 生成的市場數據
 */

export default async function handler(req, res) {
  // 設置 CORS 標頭
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 方法1: 使用 TWSE 即時報價 API
    const twseUrl = 'https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_t00.tw&json=1&delay=0';
    
    console.log('Fetching TAIEX from:', twseUrl);

    const response = await fetch(twseUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`TWSE API 回應錯誤: ${response.status}`);
    }

    const data = await response.json();

    if (data.rtcode !== '0000' || !data.msgArray || data.msgArray.length === 0) {
      // 如果即時 API 失敗，嘗試備用方案
      return await getFallbackData(res);
    }

    const indexData = data.msgArray[0];
    
    // 解析指數資料
    // z: 當前指數, y: 昨日收盤, o: 開盤, h: 最高, l: 最低, v: 成交量(億)
    const currentIndex = parseFloat(indexData.z) || parseFloat(indexData.y) || 0;
    const yesterdayClose = parseFloat(indexData.y) || 0;
    const change = currentIndex - yesterdayClose;
    const changePercent = yesterdayClose > 0 ? (change / yesterdayClose * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        name: '加權指數',
        symbol: 'TAIEX',
        currentIndex: currentIndex,
        previousClose: yesterdayClose,
        open: parseFloat(indexData.o) || 0,
        high: parseFloat(indexData.h) || 0,
        low: parseFloat(indexData.l) || 0,
        change: change,
        changePercent: parseFloat(changePercent.toFixed(2)),
        volume: indexData.v || '0', // 成交量（億）
        timestamp: new Date().toISOString(),
        source: 'TWSE'
      }
    });

  } catch (error) {
    console.error('Market Index API Error:', error);
    
    // 嘗試備用方案
    return await getFallbackData(res, error.message);
  }
}

/**
 * 備用方案：返回估計值並標記為不精確
 */
async function getFallbackData(res, errorMessage = null) {
  // 由於無法獲取即時數據，返回警告
  return res.status(200).json({
    success: false,
    data: null,
    warning: '無法獲取即時加權指數數據',
    error: errorMessage,
    suggestion: '請稍後再試或參考 Yahoo 股市、鉅亨網等網站的即時數據'
  });
}

