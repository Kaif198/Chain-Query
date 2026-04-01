import React, { useState, useMemo } from 'react';
import Icon from './Icon';
import { GLOSSARY } from '../utils/glossary';

export default function GlossaryPanel({ open, onClose }) {
  const [search, setSearch] = useState('');

  // Group terms by category
  const categories = useMemo(() => {
    const s = search.toLowerCase();
    const grouped = {};
    
    GLOSSARY.forEach(term => {
      if (s && !term.term.toLowerCase().includes(s) && !term.definition.toLowerCase().includes(s)) {
        return;
      }
      if (!grouped[term.category]) grouped[term.category] = [];
      grouped[term.category].push(term);
    });

    return grouped;
  }, [search]);

  if (!open) return null;

  return (
    <div className="absolute inset-y-0 right-0 w-[400px] bg-surface border-l border-outline/20 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-250">
      <header className="p-4 border-b border-outline/10 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-on-background flex items-center gap-2">
          <Icon name="menu_book" size={18} className="text-primary" />
          Business Glossary
        </h2>
        <button onClick={onClose} className="p-1 text-secondary hover:text-on-background rounded hover:bg-surface-container-high transition-colors">
          <Icon name="close" size={20} />
        </button>
      </header>

      <div className="p-4 border-b border-outline/10">
        <div className="relative">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            className="w-full bg-surface-container-high border-none text-[13px] pl-9 pr-4 py-2 rounded focus:ring-1 focus:ring-primary transition-all placeholder:text-secondary/50 outline-none"
            placeholder="Search terms, metrics, definitions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(categories).map(([category, terms]) => (
          <div key={category}>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-secondary mb-3">{category}</h3>
            <div className="space-y-4">
              {terms.map(term => (
                <div key={term.id} className="bg-surface-container-lowest p-3 rounded-lg border border-outline/10 hover:border-outline/30 transition-colors">
                  <div className="flex items-baseline justify-between mb-1">
                     <span className="font-semibold text-[14px] text-primary">{term.term}</span>
                     {term.benchmark && <span className="text-[11px] bg-surface-container-high text-secondary px-1.5 py-0.5 rounded ml-2">{term.benchmark}</span>}
                  </div>
                  <p className="text-[13px] text-on-surface mb-2 leading-relaxed">{term.definition}</p>
                  <p className="text-[12px] text-secondary italic leading-relaxed border-l-2 border-primary/30 pl-2">"{term.businessContext}"</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {Object.keys(categories).length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-secondary">
             <Icon name="search_off" size={32} className="mb-2 opacity-50" />
             <p className="text-[13px]">No terms found matching "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
