import React, { useMemo, useState } from 'react';
import { GLOSSARY } from '../utils/glossary';

function TooltipWrapper({ children, termData }) {
  const [show, setShow] = useState(false);
  
  return (
    <span 
      className="relative inline-block cursor-help group"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="border-b-[1.5px] border-dotted border-primary/50 text-primary font-medium">{children}</span>
      
      {show && (
        <div className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 w-[280px] bg-surface border border-outline/20 shadow-xl rounded-lg p-3 text-left animate-in fade-in zoom-in-95 duration-200">
          <div className="font-semibold text-[13px] text-on-surface mb-1 flex items-center justify-between">
            {termData.term}
            {termData.benchmark && <span className="text-[10px] bg-surface-container-high px-1.5 py-0.5 rounded text-secondary font-mono">{termData.benchmark}</span>}
          </div>
          <p className="text-[12px] text-secondary leading-snug">{termData.definition}</p>
          <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-surface border-b border-r border-outline/20 rotate-45" />
        </div>
      )}
    </span>
  );
}

export default function GlossaryTooltip({ text, highlightNumbers = true }) {
  const parsed = useMemo(() => {
    if (!text) return null;
    if (typeof text !== 'string') text = text.toString();

    // 1. Convert GLOSSARY terms into a regex pipe separated string, sorted by longest first to avoid partial matches
    const terms = GLOSSARY.sort((a, b) => b.term.length - a.term.length);
    const escapedTerms = terms.map(t => t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    
    // Combine terms with number highlighting heuristics
    const regexPattern = highlightNumbers 
      ? new RegExp(`\\b(${escapedTerms}|Priority \\d:|\\d[\\d.,]*%?|[A-Z][a-zA-Z-]* (?:GmbH|Corp|Inc|LLC|DC|Warehouse|DC)\\b|[A-Z][a-zA-Z0-9-]*)\\b`, 'ig')
      : new RegExp(`\\b(${escapedTerms})\\b`, 'ig');

    const parts = text.split(regexPattern);
    
    return parts.map((part, i) => {
      if (!part) return null;
      
      const termMatch = terms.find(t => t.term.toLowerCase() === part.toLowerCase());
      
      if (termMatch) {
         return <TooltipWrapper key={i} termData={termMatch}>{part}</TooltipWrapper>;
      }
      
      if (highlightNumbers) {
         if (part.startsWith('Priority')) return <span key={i} className="font-bold block mt-2 text-primary">{part}</span>;
         if (part.match(/^\\d/) || part.includes('GmbH') || part.includes('DC')) return <span key={i} className="font-semibold text-on-background">{part}</span>;
      }
      
      return <span key={i}>{part}</span>;
    });

  }, [text, highlightNumbers]);

  return <>{parsed}</>;
}
