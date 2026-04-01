import React, { useMemo, useState, useEffect } from 'react';
import Icon from './Icon';
import DataTablePanel from './DataTablePanel';
import NarrativePanel from './NarrativePanel';
import { transformForChart, getColor } from '../utils/chartUtils';
import { useApi } from '../App';
import { getTemplateNarrative } from '../utils/templateNarratives';
import { generateQueryNarrative } from '../utils/llm';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, ScatterChart, Scatter,
  ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

const CHART_TYPES = ['line', 'bar', 'area', 'pie', 'scatter', 'composed'];

function ChartPanel({ columns, rows, chartType, setChartType }) {
  const { data, config } = useMemo(() => transformForChart(columns, rows, chartType), [columns, rows, chartType]);
  if (!data?.length) return <div className="flex items-center justify-center h-full text-secondary text-[13px]">No data to chart</div>;

  const axisProps = { tick: { fontSize: 11, fill: 'var(--on-surface-variant)' }, axisLine: { stroke: 'var(--outline)' }, tickLine: false };
  const gridStroke = 'var(--outline)';
  const tooltipStyle = { background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 4, fontSize: 12 };

  const renderChart = () => {
    const common = { data, margin: { top: 8, right: 24, left: 8, bottom: 8 } };
    switch (chartType) {
      case 'line': return <LineChart {...common}><CartesianGrid strokeDasharray="3 3" stroke={gridStroke} /><XAxis dataKey={config.xKey} {...axisProps} /><YAxis {...axisProps} /><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12 }} />{config.seriesKeys?.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={getColor(i)} strokeWidth={2} dot={{ r: 3 }} animationDuration={600} />)}</LineChart>;
      case 'area': return <AreaChart {...common}><CartesianGrid strokeDasharray="3 3" stroke={gridStroke} /><XAxis dataKey={config.xKey} {...axisProps} /><YAxis {...axisProps} /><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12 }} />{config.seriesKeys?.map((k, i) => <Area key={k} type="monotone" dataKey={k} stroke={getColor(i)} fill={getColor(i)} fillOpacity={0.15} strokeWidth={2} animationDuration={600} />)}</AreaChart>;
      case 'bar': return <BarChart {...common}><CartesianGrid strokeDasharray="3 3" stroke={gridStroke} /><XAxis dataKey={config.xKey} {...axisProps} interval={0} angle={-30} textAnchor="end" height={60} /><YAxis {...axisProps} /><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12 }} />{config.seriesKeys?.map((k, i) => <Bar key={k} dataKey={k} fill={getColor(i)} radius={[2, 2, 0, 0]} animationDuration={600} />)}</BarChart>;
      case 'pie': return <PieChart><Pie data={data} cx="50%" cy="50%" innerRadius="40%" outerRadius="70%" paddingAngle={3} dataKey={config.valueKey || 'value'} nameKey={config.labelKey || 'name'} animationDuration={600} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>{data.map((_, i) => <Cell key={i} fill={getColor(i)} />)}</Pie><Tooltip contentStyle={tooltipStyle} /><Legend /></PieChart>;
      case 'scatter': return <ScatterChart {...common}><CartesianGrid strokeDasharray="3 3" stroke={gridStroke} /><XAxis dataKey={config.seriesKeys?.[0]} {...axisProps} /><YAxis dataKey={config.seriesKeys?.[1]} {...axisProps} /><Tooltip contentStyle={tooltipStyle} /><Scatter data={data} fill={getColor(0)} /></ScatterChart>;
      case 'composed': return <ComposedChart {...common}><CartesianGrid strokeDasharray="3 3" stroke={gridStroke} /><XAxis dataKey={config.xKey} {...axisProps} /><YAxis {...axisProps} /><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12 }} />{config.seriesKeys?.slice(0, -1).map((k, i) => <Bar key={k} dataKey={k} fill={getColor(i)} radius={[2, 2, 0, 0]} animationDuration={600} />)}{config.seriesKeys?.length > 1 && <Line type="monotone" dataKey={config.seriesKeys[config.seriesKeys.length - 1]} stroke={getColor(config.seriesKeys.length - 1)} strokeWidth={2} dot={{ r: 3 }} />}</ComposedChart>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 px-4 py-2 border-b border-outline/10">
        {CHART_TYPES.map(t => (
          <button key={t} onClick={() => setChartType(t)} className={`text-[11px] font-medium px-3 py-1 rounded capitalize transition-all ${chartType === t ? 'bg-primary text-on-primary' : 'text-secondary hover:bg-surface-container-high'}`}>{t}</button>
        ))}
      </div>
      <div className="flex-1 p-2 min-h-0"><ResponsiveContainer width="100%" height="100%">{renderChart()}</ResponsiveContainer></div>
    </div>
  );
}

export default function ResultsPanel({ result, activeQid, rawSql, chartType, setChartType }) {
  const [view, setView] = useState('split');
  const [narrative, setNarrative] = useState(null);
  const [loadingNarrative, setLoadingNarrative] = useState(false);
  const { apiKey } = useApi();

  useEffect(() => {
    let active = true;
    (async () => {
      if (!result || result.error || !result.rowCount) {
        setNarrative(null);
        return;
      }

      setNarrative(null);
      setLoadingNarrative(true);

      if (activeQid) {
        // Pre-built template
        const tpl = getTemplateNarrative(activeQid, result.rows) || getTemplateNarrative('default', result.rows);
        if (active) setNarrative(tpl);
        setLoadingNarrative(false);
      } else {
        // AI generated
        if (!apiKey) {
          setLoadingNarrative(false);
          return; // Let NarrativePanel handle the "no access" fallback via missingApiKey
        }
        try {
          const aiNar = await generateQueryNarrative(apiKey, rawSql, result.columns, result.rows);
          if (active) setNarrative(aiNar);
        } catch (e) {
          console.error('Failed to generate adhoc narrative:', e);
        }
        setLoadingNarrative(false);
      }
    })();
    return () => { active = false; };
  }, [result, activeQid, rawSql, apiKey]);

  const views = [
    { id: 'table', label: 'Table View', icon: 'table_chart' },
    { id: 'chart', label: 'Chart', icon: 'bar_chart' },
    { id: 'split', label: 'Split View', icon: 'vertical_split' },
  ];

  if (!result) return (
    <div className="flex flex-col items-center justify-center h-full gap-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-secondary/5 to-transparent rounded-full blur-[80px] -ml-48 -mb-48 pointer-events-none" />
      <div className="relative z-10 text-center space-y-4">
        <div className="w-20 h-20 bg-surface-container-high/60 backdrop-blur-xl border border-outline/20 rounded-xl flex items-center justify-center mx-auto">
          <Icon name="database_search" size={40} className="text-primary opacity-70" weight={200} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-on-background">Ready to Analyze</h1>
        <p className="text-secondary text-[14px] max-w-[280px] mx-auto">Select a query from the library or write SQL to see results in this workspace.</p>
      </div>
    </div>
  );

  if (result.error) return (
    <div className="m-4 p-4 bg-error/5 border-l-2 border-error rounded">
      <div className="flex items-center gap-2 mb-2 text-error font-semibold text-[13px]"><Icon name="error" size={16} />Query Error</div>
      <pre className="font-mono text-[12px] text-secondary whitespace-pre-wrap">{result.error}</pre>
    </div>
  );

  if (!result.rowCount) return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-secondary"><p className="text-[14px] font-medium">Query returned no rows</p><p className="text-[12px]">Try adjusting your filters</p></div>
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex-none flex items-center justify-between px-4 bg-surface-container-lowest border-b border-outline/10 z-10">
        <div className="flex gap-6">
          {views.map(v => (
            <button key={v.id} onClick={() => setView(v.id)} className={`relative py-3 text-[12px] font-bold uppercase tracking-[0.1em] transition-colors ${view === v.id ? 'text-primary' : 'text-secondary hover:text-on-surface'}`}>
              {v.label}
              {view === v.id && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />}
            </button>
          ))}
        </div>
      </div>
      
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col p-4 gap-4">
        {/* Narrative Section */}
        <div className="flex-none">
          {loadingNarrative ? (
            <div className="w-full bg-surface-container-lowest border-l-4 border-outline/20 p-5 rounded-r-lg mb-4 flex items-center gap-3">
               <Icon name="auto_awesome" size={20} className="text-secondary animate-pulse" />
               <span className="text-secondary text-[13px] animate-pulse">Generating business narrative...</span>
            </div>
          ) : (
            <NarrativePanel 
               narrative={narrative} 
               isAiGenerated={!activeQid} 
               missingApiKey={!activeQid && !apiKey}
            />
          )}
        </div>

        {/* Data Visualization Section */}
        <div className="flex-none min-h-[600px] bg-surface border border-outline/10 rounded-lg overflow-hidden flex flex-col shadow-sm">
          {view === 'chart' && <div className="flex-1"><ChartPanel columns={result.columns} rows={result.rows} chartType={chartType} setChartType={setChartType} /></div>}
          {view === 'table' && <div className="flex-1"><DataTablePanel columns={result.columns} rows={result.rows} /></div>}
          {view === 'split' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 border-b border-outline/10"><ChartPanel columns={result.columns} rows={result.rows} chartType={chartType} setChartType={setChartType} /></div>
              <div className="flex-1 overflow-hidden"><DataTablePanel columns={result.columns} rows={result.rows} /></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
