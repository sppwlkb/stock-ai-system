
import React from 'react';
import type { GroundingChunk } from '../types';
import { LinkIcon } from './icons/LinkIcon';

interface GroundingSourcesProps {
  sources: GroundingChunk[];
}

export const GroundingSources: React.FC<GroundingSourcesProps> = ({ sources = [] }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  // Filter out potential null/undefined sources and duplicates
  const validSources = sources
    .filter(chunk => chunk && chunk.web && chunk.web.uri && chunk.web.title)
    .reduce((acc, current) => {
        if (!acc.find(item => item.web.uri === current.web.uri)) {
            acc.push(current);
        }
        return acc;
    }, [] as GroundingChunk[]);

  if (validSources.length === 0) {
      return null;
  }

  return (
    <div className="mt-6 bg-gray-800/50 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold text-blue-300 mb-4">資料來源 (Data Sources)</h3>
      <ul className="space-y-3">
        {validSources.map((chunk, index) => (
          <li key={index} className="flex items-start">
            <LinkIcon className="w-4 h-4 mr-3 mt-1 text-gray-500 flex-shrink-0" />
            <a
              href={chunk.web.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-400 transition-colors duration-200 break-all"
              title={chunk.web.title}
            >
              {chunk.web.title || chunk.web.uri}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
