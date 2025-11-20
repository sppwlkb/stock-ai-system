
import React from 'react';

export const SignalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M20.5 6.5a10 10 0 0 0-17 0" />
    <path d="M12 16.5a2.5 2.5 0 0 0-5 0" />
    <path d="M17 16.5a2.5 2.5 0 0 0-5 0" />
    <path d="m12 16.5-1.5-3" />
    <path d="m13.5 13.5-5-5" />
    <path d="M12 22V19" />
  </svg>
);
