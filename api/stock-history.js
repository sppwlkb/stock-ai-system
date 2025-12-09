/**
 * Vercel Serverless Function - 證交所歷史數據代理
 * 用途：解決 CORS 問題，從後端獲取 TWSE 歷史股價數據
 */

export default async function handler(req, res) {
  // 設定 CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { ticker, date } = req.query;

    if (!ticker) {
      return res.status(400).json({
        success: false,
        error: '缺少股票代號參數'
      });
    }

    // 計算日期（如果沒有提供，使用當月）
    const targetDate = date || (() => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      return `${year}${month}01`;
    })();

    // 嘗試 OpenAPI（JSON 格式）
    const openApiUrl = `https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY?stockNo=${ticker}&date=${targetDate}`;
    
    console.log('Fetching historical data from:', openApiUrl);

    let response = await fetch(openApiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    let data;
    
    if (response.ok) {
      data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        // 轉換為標準格式
        const historicalData = data.map(item => ({
          date: item.Date || item.日期 || '',
          open: parseFloat(item.Opening_Price || item.開盤價 || '0'),
          high: parseFloat(item.Highest_Price || item.最高價 || '0'),
          low: parseFloat(item.Lowest_Price || item.最低價 || '0'),
          close: parseFloat(item.Closing_Price || item.收盤價 || '0'),
          volume: parseInt((item.Trade_Volume || item.成交股數 || '0').replace(/,/g, ''), 10),
        })).filter(item => item.close > 0);

        return res.status(200).json({
          success: true,
          ticker: ticker,
          data: historicalData,
          source: 'TWSE_OpenAPI',
          count: historicalData.length
        });
      }
    }

    // 備用：嘗試 TWSE 網站 API
    const backupUrl = `https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY?date=${targetDate}&stockNo=${ticker}&response=json`;
    
    console.log('Trying backup URL:', backupUrl);

    response = await fetch(backupUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`TWSE API 回應錯誤: ${response.status}`);
    }

    data = await response.json();

    if (data.stat !== 'OK' || !data.data || data.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: `無法取得 ${ticker} 的歷史數據`,
        stat: data.stat
      });
    }

    // 轉換數據格式
    // TWSE 格式: [日期, 成交股數, 成交金額, 開盤價, 最高價, 最低價, 收盤價, 漲跌價差, 成交筆數]
    const historicalData = data.data.map(row => ({
      date: row[0],
      volume: parseInt(row[1].replace(/,/g, ''), 10),
      open: parseFloat(row[3].replace(/,/g, '')),
      high: parseFloat(row[4].replace(/,/g, '')),
      low: parseFloat(row[5].replace(/,/g, '')),
      close: parseFloat(row[6].replace(/,/g, '')),
    })).filter(item => !isNaN(item.close) && item.close > 0);

    return res.status(200).json({
      success: true,
      ticker: ticker,
      data: historicalData,
      source: 'TWSE_Website',
      count: historicalData.length
    });

  } catch (error) {
    console.error('Stock History API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '獲取歷史數據時發生錯誤'
    });
  }
}

