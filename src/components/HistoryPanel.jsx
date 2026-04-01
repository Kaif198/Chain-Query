import React from 'react';
import Icon from './Icon';

export default function HistoryPanel({ open, onClose, history, onReplay }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} style={{ zIndex: 60 }} />
      <div className="fixed top-0 right-0 bottom-0 w-[340px] bg-surface border-l border-outline/20 flex flex-col overflow-hidden" style={{ zIndex: 70 }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline/20">
          <h2 className="text-[14px] font-semibold text-on-background">Query History</h2>
          <button onClick={onClose} className="p-1 text-secondary hover:text-on-surface"><Icon name="close" size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {!history.length ? <div className="flex items-center justify-center h-48 text-secondary text-[13px]">No queries yet</div> :
            history.map((h, i) => (
              <button key={i} onClick={() => { onReplay(h); onClose(); }} className="w-full text-left px-4 py-3 border-b border-outline/10 hover:bg-surface-container-high/50 transition-colors">
                <div className="font-mono text-[12px] text-on-surface truncate mb-1">{h.sql.substring(0, 60)}{h.sql.length > 60 ? '...' : ''}</div>
                <div className="flex items-center gap-3 text-[11px] text-secondary">
                  <span className="flex items-center gap-1"><Icon name={h.error ? 'error' : 'check_circle'} size={10} className={h.error ? 'text-error' : 'text-green-500'} />{h.error ? 'Error' : `${h.rowCount} rows`}</span>
                  <span>{h.ms}ms</span>
                  <span>{h.time}</span>
                </div>
              </button>
            ))
          }
        </div>
      </div>
    </>
  );
}
