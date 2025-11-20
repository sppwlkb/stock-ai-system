
import React from 'react';

export const NewspaperIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h8" />
    <path d="M2 16h8" />
    <path d="M2 12h8" />
    <path d="M2 8h8" />
    <path d="M16 16h2" />
    <path d="M16 12h2" />
    <path d="M16 8h2" />
  </svg>
);
