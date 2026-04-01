import React, { useState } from 'react';
import Icon from './Icon';
import { SCHEMA_INFO } from '../db/seed';

export default function SchemaPanel({ open, onClose, previewFn }) {
  const [exp, setExp] = useState({});
  const [previewing, setPreviewing] = useState(null);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-60" onClick={onClose} style={{ zIndex: 60 }} />
      <div className="fixed top-0 right-0 bottom-0 w-[380px] bg-surface border-l border-outline/20 z-70 flex flex-col overflow-hidden" style={{ zIndex: 70 }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline/20">
          <h2 className="text-[14px] font-semibold text-on-background">Schema Explorer</h2>
          <button onClick={onClose} className="p-1 text-secondary hover:text-on-surface"><Icon name="close" size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {SCHEMA_INFO.map(t => {
            const prev = previewing === t.name ? previewFn(t.name) : null;
            return (
              <div key={t.name} className="border-b border-outline/10">
                <button onClick={() => setExp(p => ({ ...p, [t.name]: !p[t.name] }))} className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-surface-container-high/50 transition-colors">
                  <Icon name={exp[t.name] ? 'expand_more' : 'chevron_right'} size={14} className="text-secondary" />
                  <span className="font-mono text-[13px] font-semibold text-on-surface">{t.name}</span>
                </button>
                {exp[t.name] && (
                  <div className="px-4 pb-3 pl-10">
                    <p className="text-[11px] text-secondary mb-2">{t.description}</p>
                    {t.columns.map(c => (
                      <div key={c.name} className="flex items-center gap-2 py-1 text-[12px]">
                        <span className="font-mono font-medium text-on-surface">{c.name}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-secondary">{c.type}</span>
                        {c.pk && <Icon name="key" size={10} className="text-yellow-500" />}
                        {c.fk && <Icon name="link" size={10} className="text-primary" />}
                      </div>
                    ))}
                    <button onClick={() => setPreviewing(p => p === t.name ? null : t.name)} className="mt-2 text-[11px] text-primary hover:underline flex items-center gap-1">
                      <Icon name="visibility" size={12} />{previewing === t.name ? 'Hide' : 'Preview'}
                    </button>
                    {prev && prev.rows.length > 0 && (
                      <div className="mt-2 overflow-auto rounded border border-outline/20">
                        <table className="w-full text-[10px] font-mono border-collapse">
                          <thead><tr>{prev.columns.map(c => <th key={c} className="px-2 py-1 bg-surface-container-high text-secondary text-left font-semibold whitespace-nowrap">{c}</th>)}</tr></thead>
                          <tbody>{prev.rows.map((r, ri) => <tr key={ri}>{r.map((v, ci) => <td key={ci} className="px-2 py-1 border-t border-outline/10 text-on-surface whitespace-nowrap">{v === null ? <span className="text-secondary/40">NULL</span> : String(v)}</td>)}</tr>)}</tbody>
                        </table>
                        <div className="px-2 py-1 text-[10px] text-secondary bg-surface-container-high">{prev.rowCount} total rows</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
