import React, { useState, useMemo } from 'react';
import Icon from './Icon';
import { formatValue, isNumericColumn } from '../utils/chartUtils';

export default function DataTablePanel({ columns, rows }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const numFlags = useMemo(() => columns?.map((c, i) => isNumericColumn(c, rows, i)) || [], [columns, rows]);

  const sorted = useMemo(() => {
    if (!rows || sortCol === null) return rows || [];
    return [...rows].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (av == null) return 1; if (bv == null) return -1;
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [rows, sortCol, sortDir]);

  const toggleSort = (i) => { sortCol === i ? setSortDir(d => d === 'asc' ? 'desc' : 'asc') : (setSortCol(i), setSortDir('asc')); };

  if (!columns?.length) return <div className="flex items-center justify-center h-full text-secondary text-[13px]">No data</div>;

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 z-10 bg-surface-container-high">
          <tr className="border-b border-outline/20">
            {columns.map((c, i) => (
              <th key={i} onClick={() => toggleSort(i)} className={`px-4 py-2.5 text-[12px] font-semibold text-secondary uppercase tracking-widest cursor-pointer hover:text-on-surface ${numFlags[i] ? 'text-right' : ''}`}>
                <span className="inline-flex items-center gap-1">{c}{sortCol === i && <Icon name={sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'} size={12} />}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, ri) => (
            <tr key={ri} className={`hover:bg-surface-container-high/50 transition-colors ${ri % 2 ? 'bg-surface/50' : ''}`}>
              {row.map((val, ci) => (
                <td key={ci} className={`px-4 py-2 text-[13px] text-on-surface border-b border-outline/5 ${numFlags[ci] ? 'text-right font-mono tabular-nums' : ''}`}>
                  {formatValue(val, columns[ci])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
