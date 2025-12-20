/**
 * Google News RSS API - 獲取真實股票新聞
 * 
 * 使用 Google News RSS 來抓取真實的新聞連結
 * 避免 AI 幻覺生成假新聞連結的問題
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
    const { stock, limit = 5 } = req.query;

    if (!stock) {
      return res.status(400).json({
        success: false,
        error: '缺少股票名稱參數'
      });
    }

    // 建立 Google News RSS URL
    // 搜尋格式：股票名稱 + 台股
    const searchQuery = encodeURIComponent(`${stock} 台股`);
    const rssUrl = `https://news.google.com/rss/search?q=${searchQuery}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;

    console.log('Fetching Google News RSS:', rssUrl);

    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });

    if (!response.ok) {
      throw new Error(`Google News RSS 回應錯誤: ${response.status}`);
    }

    const xmlText = await response.text();

    // 解析 RSS XML
    const news = parseRssXml(xmlText, parseInt(limit));

    return res.status(200).json({
      success: true,
      stock: stock,
      count: news.length,
      news: news,
      source: 'Google News RSS'
    });

  } catch (error) {
    console.error('獲取新聞失敗:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '獲取新聞失敗'
    });
  }
}

/**
 * 解析 RSS XML 並提取新聞項目
 * @param {string} xmlText RSS XML 文字
 * @param {number} limit 最大新聞數量
 * @returns {Array} 新聞陣列
 */
function parseRssXml(xmlText, limit) {
  const news = [];

  // 使用正則表達式解析 XML（Vercel Serverless 環境可能沒有 DOM parser）
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/;
  const linkRegex = /<link>([\s\S]*?)<\/link>/;
  const sourceRegex = /<source[^>]*>([\s\S]*?)<\/source>/;
  const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/;

  let match;
  while ((match = itemRegex.exec(xmlText)) !== null && news.length < limit) {
    const itemContent = match[1];

    // 提取標題
    const titleMatch = itemContent.match(titleRegex);
    const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';

    // 提取連結
    const linkMatch = itemContent.match(linkRegex);
    const link = linkMatch ? linkMatch[1].trim() : '';

    // 提取來源
    const sourceMatch = itemContent.match(sourceRegex);
    const source = sourceMatch ? sourceMatch[1].trim() : 'Google News';

    // 提取發布日期
    const pubDateMatch = itemContent.match(pubDateRegex);
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';

    if (title && link) {
      news.push({
        title: title,
        link: link,
        source: source,
        pubDate: pubDate
      });
    }
  }

  return news;
}

