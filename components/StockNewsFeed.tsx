
import React from 'react';
import type { NewsArticle } from '../types';
import { NewspaperIcon } from './icons/NewspaperIcon';

interface StockNewsFeedProps {
  news: NewsArticle[];
}

export const StockNewsFeed: React.FC<StockNewsFeedProps> = ({ news }) => {
  if (!news || news.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-700">
      <h4 className="font-bold text-blue-300 mb-3 flex items-center">
        <NewspaperIcon className="w-5 h-5 mr-2" />
        相關新聞
      </h4>
      <ul className="space-y-3">
        {news.map((article, index) => (
          <li key={index} className="p-3 bg-gray-700/50 rounded-md hover:bg-gray-700 transition-colors duration-200">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <p className="text-gray-300 group-hover:text-blue-300 text-sm font-semibold transition-colors duration-200">
                {article.title}
              </p>
              <p className="text-xs text-gray-500 mt-1">{article.source}</p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
