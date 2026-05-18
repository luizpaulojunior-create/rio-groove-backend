import React from 'react';

const BrandTitle = ({ text, className = "" }) => {
  if (!text) return null;
  
  const words = text.split(' ');
  
  if (words.length <= 1) {
    return <span className={className}>{text}</span>;
  }
  
  const lastWord = words.pop();
  const rest = words.join(' ');
  
  return (
    <span className={className}>
      {rest} <span className="text-[#FF2A1F]">{lastWord}</span>
    </span>
  );
};

export default BrandTitle;
