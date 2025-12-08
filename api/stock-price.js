/**
 * Vercel Serverless Function - 台灣股價代理 API
 * 用途：解決 CORS 問題，從後端獲取 TWSE 真實股價
 */

export default async function handler(req, res) {
  // 設置 CORS 標頭
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { ticker, exchange = 'tse' } = req.query;

    if (!ticker) {
      return res.status(400).json({
        success: false,
        error: '缺少股票代號參數'
      });
    }

    // 呼叫 TWSE API
    const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${exchange}_${ticker}.tw&json=1&delay=0`;
    
    console.log('Fetching stock price from:', url);

    const response = await fetch(url, {
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
      return res.status(404).json({
        success: false,
        error: `無法取得 ${ticker} 的股價資料`,
        rtcode: data.rtcode
      });
    }

    const stockData = data.msgArray[0];
    
    // 解析股價資料
    const price = parseFloat(stockData.z) || parseFloat(stockData.y) || 0;
    const open = parseFloat(stockData.o) || 0;
    const high = parseFloat(stockData.h) || 0;
    const low = parseFloat(stockData.l) || 0;
    const yesterday = parseFloat(stockData.y) || 0;
    const volume = parseInt(stockData.v) || 0;

    return res.status(200).json({
      success: true,
      ticker: stockData.c,
      name: stockData.n,
      price: price,
      open: open,
      high: high,
      low: low,
      yesterday: yesterday,
      volume: volume,
      change: price - yesterday,
      changePercent: yesterday > 0 ? ((price - yesterday) / yesterday * 100).toFixed(2) : 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stock Price API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '獲取股價失敗'
    });
  }
}

