import React, { useState, useMemo } from 'react';
import Icon from './Icon';
import { QUERY_CATEGORIES } from '../db/queries';

export default function Sidebar({ activeId, onSelect }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(() => QUERY_CATEGORIES.reduce((a, c) => ({ ...a, [c.id]: true }), {}));

  const iconMap = { line: 'show_chart', bar: 'bar_chart', area: 'area_chart', pie: 'pie_chart', table: 'table_chart', composed: 'analytics', scatter: 'scatter_plot' };

  const filtered = useMemo(() => {
    if (!search.trim()) return QUERY_CATEGORIES;
    const s = search.toLowerCase();
    return QUERY_CATEGORIES.map(c => ({ ...c, queries: c.queries.filter(q => q.name.toLowerCase().includes(s) || q.description.toLowerCase().includes(s)) })).filter(c => c.queries.length);
  }, [search]);

  return (
    <aside className="w-[320px] bg-surface border-r border-outline/20 flex flex-col h-full shrink-0">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-medium uppercase tracking-wider text-secondary">Library</h2>
        </div>
        <div className="relative">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            className="w-full bg-surface-container-high border-none text-[13px] pl-9 pr-4 py-2 rounded focus:ring-1 focus:ring-primary transition-all placeholder:text-secondary/50 text-on-background outline-none"
            placeholder="Filter queries..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar px-2 space-y-4 pb-6">
        {filtered.map(cat => (
          <section key={cat.id}>
            <button onClick={() => setExpanded(p => ({ ...p, [cat.id]: !p[cat.id] }))} className="w-full px-2 mb-1.5 flex items-center justify-between cursor-pointer group">
              <span className="text-[11px] font-semibold text-secondary uppercase tracking-[0.05em] flex items-center gap-1">
                <Icon name={expanded[cat.id] ? 'expand_more' : 'chevron_right'} size={14} />
                {cat.name}
              </span>
              <span className="text-[10px] bg-surface-container-highest px-1.5 py-0.5 rounded text-secondary font-mono">{cat.queries.length}</span>
            </button>
            {expanded[cat.id] && (
              <div className="space-y-0.5">
                {cat.queries.map(q => {
                  const active = activeId === q.id;
                  return (
                    <button
                      key={q.id}
                      onClick={() => onSelect(q)}
                      className={`w-full text-left px-3 py-2.5 rounded transition-all group border-l-2 ${
                        active ? 'bg-surface-container-high border-primary' : 'border-transparent hover:bg-surface-container-high hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[14px] font-medium text-on-background leading-tight">{q.name}</span>
                        <Icon name={iconMap[q.chartType] || 'bar_chart'} size={16} className={`${active ? 'text-primary' : 'text-secondary/40 group-hover:text-primary'}`} />
                      </div>
                      <p className="text-[12px] text-secondary mt-1 line-clamp-1">{q.description}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>
    </aside>
  );
}
