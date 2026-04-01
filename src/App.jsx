import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { seedDatabase } from './db/seed';
import { detectChartType } from './utils/chartUtils';

// Components
import Icon from './components/Icon';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import SQLEditorPanel from './components/SQLEditorPanel';
import AIPanel from './components/AIPanel';
import ResultsPanel from './components/ResultsPanel';
import SchemaPanel from './components/SchemaPanel';
import HistoryPanel from './components/HistoryPanel';
import GlossaryPanel from './components/GlossaryPanel';

import MLWorkspace from './components/MLWorkspace';
import DashboardWorkspace from './components/DashboardWorkspace';

// ============================================
// Database & API Contexts
// ============================================
export const DbContext = createContext(null);
export const ApiContext = createContext({ apiKey: '', setApiKey: () => {} });

function DbProvider({ children }) {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const SQL = await initSqlJs({
          locateFile: () => sqlWasmUrl
        });
        const database = new SQL.Database();
        seedDatabase(database);
        setDb(database);
      } catch (e) {
        console.error('DB init failed:', e);
      }
      setLoading(false);
    })();
  }, []);

  const exec = useCallback((sql) => {
    if (!db) return { columns: [], rows: [], rowCount: 0, executionTime: 0, error: 'Database not ready' };
    const t0 = performance.now();
    try {
      const r = db.exec(sql);
      const ms = Math.round((performance.now() - t0) * 10) / 10;
      if (!r.length) return { columns: [], rows: [], rowCount: 0, executionTime: ms, error: null };
      return { columns: r[0].columns, rows: r[0].values, rowCount: r[0].values.length, executionTime: ms, error: null };
    } catch (e) {
      return { columns: [], rows: [], rowCount: 0, executionTime: Math.round((performance.now() - t0) * 10) / 10, error: e.message.replace(/.*SQLITE_ERROR:\\s*/, '') };
    }
  }, [db]);

  const preview = useCallback((table) => {
    if (!db) return null;
    try {
      const c = db.exec(`SELECT COUNT(*) FROM ${table}`);
      const p = db.exec(`SELECT * FROM ${table} LIMIT 5`);
      return { rowCount: c[0]?.values[0]?.[0] || 0, columns: p[0]?.columns || [], rows: p[0]?.values || [] };
    } catch { return null; }
  }, [db]);

  return <DbContext.Provider value={{ loading, exec, preview }}>{children}</DbContext.Provider>;
}

export function useDb() { return useContext(DbContext); }
export function useApi() { return useContext(ApiContext); }

// ============================================
// Main App Content
// ============================================
function AppContent({ onReset }) {
  const { loading, exec, preview } = useDb();
  const [theme, setTheme] = useState(() => localStorage.getItem('cq-theme') || 'dark');
  const [mode, setMode] = useState('library');
  const [sql, setSql] = useState('SELECT * FROM products LIMIT 10;');
  const [result, setResult] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [running, setRunning] = useState(false);
  const [activeQid, setActiveQid] = useState(null);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => { document.documentElement.className = theme; localStorage.setItem('cq-theme', theme); }, [theme]);

  const runSQL = useCallback((s) => {
    const toRun = s || sql;
    if (!toRun.trim()) return;
    setRunning(true);
    setTimeout(() => {
      const r = exec(toRun);
      setResult(r);
      if (!r.error && r.columns.length) setChartType(detectChartType(r.columns, r.rows));
      setHistory(p => [{ sql: toRun, rowCount: r.rowCount, ms: r.executionTime, error: r.error, time: new Date().toLocaleTimeString() }, ...p].slice(0, 20));
      setRunning(false);
    }, 60);
  }, [sql, exec]);

  const selectQuery = useCallback((q) => {
    setSql(q.sql); setActiveQid(q.id);
    setRunning(true);
    setTimeout(() => {
      const r = exec(q.sql);
      setResult(r);
      setChartType(q.chartType || detectChartType(r.columns, r.rows));
      setHistory(p => [{ sql: q.sql, rowCount: r.rowCount, ms: r.executionTime, error: r.error, time: new Date().toLocaleTimeString() }, ...p].slice(0, 20));
      setRunning(false);
    }, 60);
  }, [exec]);

  const replayHistory = useCallback((h) => { setSql(h.sql); setMode('editor'); setTimeout(() => runSQL(h.sql), 50); }, [runSQL]);

  const exportCSV = useCallback(() => {
    if (!result?.columns.length) return;
    const csv = [result.columns.join(','), ...result.rows.map(r => r.map(v => { const s = String(v ?? ''); return s.includes(',') ? `"${s}"` : s; }).join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'query-results.csv'; a.click();
  }, [result]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
      <div className="animate-spin"><Icon name="progress_activity" size={32} className="text-primary" /></div>
      <span className="text-secondary text-[14px]">Initializing supply chain database...</span>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background text-on-background">
      <TopBar onReset={onReset} mode={mode} setMode={setMode} theme={theme} toggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} openSchema={() => setSchemaOpen(true)} openHistory={() => setHistoryOpen(true)} openGlossary={() => setGlossaryOpen(true)} />
      
      <div className="flex flex-1 h-[calc(100vh-48px)] overflow-hidden">
        
        {/* VIEW: Library */}
        {mode === 'library' && <Sidebar activeId={activeQid} onSelect={selectQuery} />}
        {/* VIEW: Dashboards */}
        {mode === 'dashboard' && <DashboardWorkspace />}

        {/* VIEW: ML Models */}
        {mode === 'ml' ? (
          <MLWorkspace />
        ) : (
          <main className="flex-1 flex flex-col overflow-hidden bg-background">
            {/* Input Panels */}
            {mode === 'ai' ? (
              <section className="bg-surface" style={{ minHeight: 120, maxHeight: 300 }}>
                <AIPanel onQuery={(s) => { setSql(s); runSQL(s); }} />
              </section>
            ) : (
              <section className="flex flex-col bg-surface" style={{ height: 240 }}>
                <div className="flex items-center justify-between px-4 py-2 bg-surface-container-low border-b border-outline/10">
                  <div className="flex items-center gap-2"><Icon name="code" size={18} className="text-primary" /><span className="font-mono text-[13px] text-secondary">query.sql</span></div>
                </div>
                <SQLEditorPanel sql={sql} setSql={setSql} onRun={runSQL} />
                <div className="h-12 px-4 flex items-center justify-between bg-surface border-t border-outline/10">
                  <div className="flex items-center gap-3">
                    <button onClick={() => runSQL()} disabled={running} className="flex items-center gap-2 bg-primary hover:brightness-110 text-on-primary px-5 py-1.5 font-semibold text-[13px] transition-all active:scale-[0.98] disabled:opacity-40">
                      <Icon name="play_arrow" size={18} fill />{running ? 'Running...' : 'Run Query'}
                    </button>
                    <div className="h-5 w-px bg-outline/20" />
                    <button onClick={() => navigator.clipboard.writeText(sql)} className="flex items-center gap-1.5 text-secondary hover:text-on-surface text-[13px] transition-colors"><Icon name="content_copy" size={16} />Copy SQL</button>
                    <button onClick={exportCSV} disabled={!result?.rowCount} className="flex items-center gap-1.5 text-secondary hover:text-on-surface text-[13px] transition-colors disabled:opacity-30"><Icon name="file_download" size={16} />Export CSV</button>
                  </div>
                  <div className="flex items-center gap-4 font-mono text-[12px] text-secondary uppercase tracking-tighter">
                    {result && !result.error && <><span className="flex items-center gap-1"><Icon name="schedule" size={14} />{result.executionTime}ms</span><span className="flex items-center gap-1"><Icon name="list_alt" size={14} />{result.rowCount.toLocaleString()} rows</span></>}
                  </div>
                </div>
              </section>
            )}

            {/* Results Panel */}
            <section className="flex-1 overflow-hidden border-t border-outline/10">
              {running ? (
                <div className="p-6 space-y-3">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-5 bg-surface-container-high rounded animate-pulse" style={{ width: `${90 - i * 10}%`, animationDelay: `${i * 0.1}s` }} />)}
                </div>
              ) : (
                <ResultsPanel result={result} activeQid={activeQid} rawSql={sql} chartType={chartType} setChartType={setChartType} />
              )}
            </section>
          </main>
        )}
      </div>

      <SchemaPanel open={schemaOpen} onClose={() => setSchemaOpen(false)} previewFn={preview} />
      <HistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} history={history} onReplay={replayHistory} />
      <GlossaryPanel open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
    </div>
  );
}

export default function App({ onReset }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('cq-api-key') || '');
  useEffect(() => { if (apiKey) localStorage.setItem('cq-api-key', apiKey); }, [apiKey]);

  return (
    <ApiContext.Provider value={{ apiKey, setApiKey }}>
      <DbProvider><AppContent onReset={onReset} /></DbProvider>
    </ApiContext.Provider>
  );
}
