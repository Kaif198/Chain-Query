import React, { useState, useEffect, useMemo } from 'react';
import { useDb } from '../../App';
import Icon from '../Icon';
import { detectChartType, transformForChart } from '../../utils/chartUtils';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function ChartWidget({ config, updateConfig }) {
  const { exec } = useDb();
  const [data, setData] = useState({ columns: [], values: [] });
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(!config.query);

  const [draft, setDraft] = useState({
    title: config.title || 'SQL Chart',
    query: config.query || 'SELECT forecast_date, forecast_qty, actual_qty FROM demand_forecast WHERE product_id=1 ORDER BY forecast_date LIMIT 12;',
    chartType: config.chartType || 'Line', // 'Line', 'Bar', 'Area', 'Scatter', 'Pie'
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
       setData({columns: [], values: []});
       return;
    }
    setData({
      columns: result.columns || [],
      values: result.rows || []
    });
  };

  const handleSave = () => {
    updateConfig(draft);
    setIsEditing(false);
  };

  const renderChart = () => {
    if (!data.columns.length || !data.values.length) return <div className="text-secondary text-[13px] flex items-center justify-center min-h-[120px]">No data available</div>;

    const autoType = detectChartType(data.columns, data.values);
    const chartType = draft.chartType ? draft.chartType.toLowerCase() : autoType;
    
    if (chartType === 'table' || autoType === 'table') {
      return (
        <div className="flex flex-col items-center justify-center text-secondary h-full text-[13px] min-h-[120px]">
          <Icon name="table_chart" size={32} className="opacity-30 mb-2" />
          <p>Result set not suitable for graphical charting.</p>
          <p className="text-[11px] opacity-75">Require 1 label column and at least 1 numeric column.</p>
        </div>
      );
    }

    const { data: chartData, config: chartConfig } = transformForChart(data.columns, data.values, chartType);

    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-surface border border-outline/20 p-2 rounded shadow-sm text-xs">
            <p className="font-semibold mb-1 text-on-surface">{label}</p>
            {payload.map(p => (
              <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</p>
            ))}
          </div>
        );
      }
      return null;
    };

    if (chartType === 'pie') {
       return (
          <ResponsiveContainer width="100%" height={260}>
             <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
               <Pie data={chartData} dataKey={chartConfig.valueKey} nameKey={chartConfig.labelKey} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2}>
                 {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={chartConfig.colors[index % chartConfig.colors.length]} />)}
               </Pie>
               <Tooltip content={<CustomTooltip />} />
               <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--on-surface)' }} />
             </PieChart>
          </ResponsiveContainer>
       );
    }

    const ChartComponent = chartType === 'bar' ? BarChart : chartType === 'area' ? AreaChart : chartType === 'scatter' ? ScatterChart : LineChart;
    const DataComponent = chartType === 'bar' ? Bar : chartType === 'area' ? Area : chartType === 'scatter' ? Scatter : Line;

    return (
      <ResponsiveContainer width="100%" height={260}>
        <ChartComponent data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--outline)" opacity={0.5} />
          <XAxis dataKey={chartConfig.xKey} tick={{ fontSize: 10, fill: 'var(--on-surface-variant)' }} tickMargin={8} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--on-surface-variant)' }} tickMargin={8} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          {chartConfig.seriesKeys.map((key, idx) => (
             <DataComponent key={key} type="monotone" dataKey={key} fill={chartType !== 'line' ? chartConfig.colors[idx % chartConfig.colors.length] : 'none'} stroke={chartType !== 'bar' ? chartConfig.colors[idx % chartConfig.colors.length] : 'none'} strokeWidth={2} dot={chartType === 'line' ? {r:3} : false} activeDot={{r:5}} />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  if (isEditing) {
    return (
      <div className="flex flex-col h-full bg-surface-container-lowest p-4 w-full">
        <div className="flex items-center justify-between mb-3 text-secondary">
           <span className="text-[12px] font-semibold uppercase tracking-wider">Configure Chart</span>
           <button onClick={handleSave} className="text-primary hover:brightness-110 flex items-center gap-1 text-[12px] font-medium"><Icon name="check" size={14} /> Done</button>
        </div>
        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          <div className="space-y-1">
             <label className="text-[11px] font-medium text-secondary">Chart Title</label>
             <input type="text" value={draft.title} onChange={e => setDraft({...draft, title: e.target.value})} className="w-full bg-surface-container border border-outline/10 text-[13px] px-2 py-1.5 rounded focus:border-primary outline-none" />
          </div>
          <div className="space-y-1">
             <label className="text-[11px] font-medium text-secondary">SQL Query (Needs 1 Label Column, N Numeric Columns)</label>
             <textarea value={draft.query} onChange={e => setDraft({...draft, query: e.target.value})} className="w-full h-24 bg-surface-container border border-outline/10 text-[12px] font-mono px-2 py-1.5 rounded focus:border-primary outline-none resize-none" />
          </div>
          <div className="space-y-1">
             <label className="text-[11px] font-medium text-secondary">Preferred Chart Type</label>
             <select value={draft.chartType} onChange={e => setDraft({...draft, chartType: e.target.value})} className="w-full bg-surface-container border border-outline/10 text-[13px] px-2 py-1.5 rounded focus:border-primary outline-none">
               <option value="Line">Line</option>
               <option value="Bar">Bar</option>
               <option value="Area">Area</option>
               <option value="Pie">Pie</option>
             </select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full p-4 relative group">
      <button onClick={() => setIsEditing(true)} className="absolute top-2 right-2 p-1.5 bg-surface-container-high rounded opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-primary z-20">
        <Icon name="edit" size={16} />
      </button>

      <div className="text-[14px] font-semibold text-on-background truncate mb-4">{config.title || 'Untitled Chart'}</div>
      
      {error ? (
        <div className="text-error text-[12px] border-l-2 border-error pl-2"><Icon name="error" size={12} className="inline mr-1"/>{error}</div>
      ) : (
        <div className="flex-1 w-full min-h-[200px]">
          {renderChart()}
        </div>
      )}
    </div>
  );
}
