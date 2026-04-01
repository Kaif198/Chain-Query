import React, { useState, useEffect } from 'react';
import { useDb } from '../../App';
import Icon from '../Icon';

export default function MetricWidget({ config, updateConfig }) {
  const { exec } = useDb();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(!config.query);

  // Local drafted state for the config panel
  const [draft, setDraft] = useState({
    title: config.title || 'New Metric',
    query: config.query || 'SELECT SUM(on_hand_qty) FROM inventory_snapshots;',
    prefix: config.prefix || '',
    suffix: config.suffix || ''
  });

  useEffect(() => {
    if (!isEditing && config.query) {
      runQuery(config.query);
    }
  }, [isEditing, config.query]);

  const runQuery = (sql) => {
    setError(null);
    const result = exec(sql);
    if (result.error) {
       setError(result.error);
       return;
    }
    if (result.rows && result.rows.length > 0 && result.rows[0].length > 0) {
      // Get the top-left value of the result grid
      const scalarIndex = result.rows[0][0];
      // Try to format it if it's a huge number
      let formatted = scalarIndex;
      if (typeof scalarIndex === 'number') {
         if (scalarIndex > 1000000) formatted = (scalarIndex / 1000000).toFixed(1) + 'M';
         else if (scalarIndex > 1000) formatted = (scalarIndex / 1000).toFixed(1) + 'K';
         else formatted = scalarIndex.toLocaleString();
      }
      setData(formatted);
    } else {
      setData('--');
    }
  };

  const handleSave = () => {
    updateConfig(draft);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex flex-col h-full bg-surface-container-lowest p-4 w-full">
        <div className="flex items-center justify-between mb-3 text-secondary">
           <span className="text-[12px] font-semibold uppercase tracking-wider">Configure Metric</span>
           <button onClick={handleSave} className="text-primary hover:brightness-110 flex items-center gap-1 text-[12px] font-medium"><Icon name="check" size={14} /> Done</button>
        </div>
        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          <div className="space-y-1">
             <label className="text-[11px] font-medium text-secondary">Card Title</label>
             <input type="text" value={draft.title} onChange={e => setDraft({...draft, title: e.target.value})} className="w-full bg-surface-container border border-outline/10 text-[13px] px-2 py-1.5 rounded focus:border-primary outline-none" placeholder="e.g. Total Active Inventory" />
          </div>
          <div className="space-y-1">
             <label className="text-[11px] font-medium text-secondary">Scalar SQL Query (Returns 1 value)</label>
             <textarea value={draft.query} onChange={e => setDraft({...draft, query: e.target.value})} className="w-full h-24 bg-surface-container border border-outline/10 text-[12px] font-mono px-2 py-1.5 rounded focus:border-primary outline-none resize-none" placeholder="SELECT count(*) FROM products;" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
               <label className="text-[11px] font-medium text-secondary">Prefix</label>
               <input type="text" value={draft.prefix} onChange={e => setDraft({...draft, prefix: e.target.value})} className="w-full bg-surface-container border border-outline/10 text-[13px] px-2 py-1.5 rounded focus:border-primary outline-none" placeholder="$" />
            </div>
            <div className="space-y-1">
               <label className="text-[11px] font-medium text-secondary">Suffix</label>
               <input type="text" value={draft.suffix} onChange={e => setDraft({...draft, suffix: e.target.value})} className="w-full bg-surface-container border border-outline/10 text-[13px] px-2 py-1.5 rounded focus:border-primary outline-none" placeholder="Units" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full justify-center p-6 relative group">
      <button onClick={() => setIsEditing(true)} className="absolute top-2 right-2 p-1.5 bg-surface-container-high rounded opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-primary z-20">
        <Icon name="edit" size={16} />
      </button>

      <div className="text-[13px] font-medium text-secondary truncate mb-1">{config.title || 'Untitled Metric'}</div>
      
      {error ? (
        <div className="text-error text-[12px] mt-2 border-l-2 border-error pl-2"><Icon name="error" size={12} className="inline mr-1"/>{error}</div>
      ) : (
        <div className="flex items-baseline gap-1 mt-1 truncate">
          {config.prefix && <span className="text-2xl text-secondary">{config.prefix}</span>}
          <span className="text-5xl font-bold tracking-tight text-on-background">{data !== null ? data : '...'}</span>
          {config.suffix && <span className="text-xl text-secondary font-medium ml-1">{config.suffix}</span>}
        </div>
      )}
    </div>
  );
}
