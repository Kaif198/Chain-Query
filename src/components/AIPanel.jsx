import React, { useState } from 'react';
import Icon from './Icon';
import { highlightSQL, generateSchemaPrompt } from '../utils/sqlUtils';
import { useApi } from '../App';

export default function AIPanel({ onQuery }) {
  const { apiKey, setApiKey } = useApi();
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [genSQL, setGenSQL] = useState('');
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!q.trim()) return;
    if (!apiKey) { setErr('Enter your Anthropic API key below.'); return; }
    setLoading(true); setErr(''); setGenSQL('');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: generateSchemaPrompt(),
          messages: [{ role: 'user', content: q }]
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error?.message || `API ${res.status}`);
      }
      const data = await res.json();
      let sql = (data.content?.[0]?.text || '').trim().replace(/^```sql?\n?/i, '').replace(/\n?```$/i, '').trim();
      setGenSQL(sql);
      onQuery(sql);
    } catch (e) {
      setErr(e.message);
    }
    setLoading(false);
  };

  const tokens = highlightSQL(genSQL);

  return (
    <div className="flex flex-col gap-3 p-4 h-full">
      <div className="flex items-center gap-2 bg-surface-container-high rounded px-3 py-2">
        <Icon name="bolt" size={18} className="text-primary" />
        <input
          value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submit(); }}
          placeholder="Ask about your supply chain data..."
          disabled={loading}
          className="flex-1 bg-transparent outline-none text-on-surface text-[13px] placeholder:text-secondary/50"
        />
        <button onClick={submit} disabled={loading || !q.trim()} className="bg-primary text-on-primary px-4 py-1.5 rounded text-[13px] font-semibold disabled:opacity-40 hover:brightness-110 transition-all">
          {loading ? 'Generating...' : 'Ask'}
        </button>
      </div>
      {!apiKey && (
        <input type="password" value={apiKey || ''} onChange={e => setApiKey(e.target.value)} placeholder="Anthropic API key..." className="bg-surface-container-high rounded px-3 py-2 text-[12px] text-on-surface outline-none border-none focus:ring-1 focus:ring-primary" />
      )}
      {err && <div className="text-error text-[13px] px-3 py-2 bg-error/10 rounded border-l-2 border-error">{err}</div>}
      {genSQL && (
        <div className="bg-surface-container-lowest rounded border border-outline/20 overflow-hidden flex-1">
          <div className="flex items-center justify-between px-3 py-2 border-b border-outline/10">
            <span className="text-[11px] font-semibold text-secondary uppercase tracking-widest">Generated SQL</span>
            <button onClick={() => navigator.clipboard.writeText(genSQL)} className="text-[12px] text-secondary hover:text-on-surface flex items-center gap-1"><Icon name="content_copy" size={14} />Copy</button>
          </div>
          <pre className="p-3 font-mono text-[13px] text-on-surface leading-relaxed overflow-auto max-h-48">
            {tokens.map((t, i) => <span key={i} className={t.className ? `syntax-${t.className.replace('sql-', '')}` : ''}>{t.text}</span>)}
          </pre>
        </div>
      )}
    </div>
  );
}
