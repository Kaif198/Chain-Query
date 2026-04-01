import React, { useRef } from 'react';
import { highlightSQL } from '../utils/sqlUtils';

export default function SQLEditorPanel({ sql, setSql, onRun }) {
  const tokens = highlightSQL(sql);
  const lines = sql.split('\n');
  const taRef = useRef(null);
  const preRef = useRef(null);

  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); onRun(); }
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = e.target.selectionStart, end = e.target.selectionEnd;
      setSql(sql.substring(0, s) + '  ' + sql.substring(end));
      requestAnimationFrame(() => { e.target.selectionStart = e.target.selectionEnd = s + 2; });
    }
  };

  const sync = () => { if (preRef.current && taRef.current) { preRef.current.scrollTop = taRef.current.scrollTop; preRef.current.scrollLeft = taRef.current.scrollLeft; } };

  return (
    <div className="flex-1 flex font-mono text-sm leading-relaxed overflow-hidden bg-surface">
      {/* Gutter */}
      <div className="w-10 bg-surface-container-lowest text-secondary/40 text-right py-4 pr-3 select-none flex flex-col text-[12px]">
        {lines.map((_, i) => <span key={i}>{i + 1}</span>)}
      </div>
      {/* Code area */}
      <div className="flex-1 relative overflow-hidden">
        <pre ref={preRef} className="absolute inset-0 p-4 overflow-auto whitespace-pre-wrap break-words pointer-events-none text-on-surface" aria-hidden="true">
          {tokens.map((t, i) => <span key={i} className={t.className ? `syntax-${t.className.replace('sql-', '')}` : ''}>{t.text}</span>)}
        </pre>
        <textarea
          ref={taRef}
          value={sql}
          onChange={e => setSql(e.target.value)}
          onKeyDown={onKeyDown}
          onScroll={sync}
          spellCheck={false}
          className="absolute inset-0 w-full h-full p-4 font-mono text-sm leading-relaxed bg-transparent text-transparent caret-primary outline-none resize-none whitespace-pre-wrap break-words"
          placeholder="-- Write your SQL query here..."
        />
      </div>
    </div>
  );
}
