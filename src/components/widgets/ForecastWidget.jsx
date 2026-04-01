import React, { useState, useEffect } from 'react';
import { useDb } from '../../App';
import Icon from '../Icon';
import { runSMA, runWMA, runExponentialSmoothing, runLinearRegression } from '../../models/demand';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ForecastWidget({ config, updateConfig }) {
  const { exec } = useDb();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(!config.product);

  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Draft config
  const [draft, setDraft] = useState({
    title: config.title || 'Demand Forecast',
    product: config.product || 1,
    warehouse: config.warehouse || 1,
    model: config.model || 'es', // sma, es, lr
  });

  // Load dropdowns for edit mode
  useEffect(() => {
    if (isEditing) {
      const p = exec("SELECT product_id, product_name FROM products ORDER BY product_name");
      const w = exec("SELECT warehouse_id, warehouse_name FROM warehouses ORDER BY warehouse_name");
      if (!p.error) setProducts(p.rows || []);
      if (!w.error) setWarehouses(w.rows || []);
    }
  }, [isEditing, exec]);

  // Run model on load or config change
  useEffect(() => {
    if (!isEditing && config.product) {
      runModelLogic();
    }
  }, [isEditing, config]);

  const runModelLogic = () => {
    setError(null);
    const sql = `
      SELECT forecast_date, COALESCE(actual_qty, forecast_qty) as qty 
      FROM demand_forecast 
      WHERE product_id = '${config.product}' 
      AND warehouse_id = '${config.warehouse}' 
      ORDER BY forecast_date ASC
    `;
    const res = exec(sql);
    if (res.error || !res.rows.length) {
      setError('Insufficient data for forecasting.');
      return;
    }

    const labels = res.rows.map(r => r[0]);
    const actuals = res.rows.map(r => r[1]);
    
    let result = null;
    try {
      if (config.model === 'sma') result = runSMA(actuals, labels, 6, 6);
      else if (config.model === 'lr') result = runLinearRegression(actuals, labels, 6);
      else result = runExponentialSmoothing(actuals, labels, 0.5, 0.1, 0.5, 12, 6);
    } catch (e) {
      setError('Model execution failed.');
      return;
    }

    const { fitted, forecast, futureLabels, metrics } = result;

    const chartData = [];
    labels.forEach((l, i) => chartData.push({ month: l, Actual: actuals[i], Fit: fitted[i] }));
    futureLabels.forEach((l, i) => chartData.push({ month: l, Forecast: forecast[i] }));

    // Fetch product name for narrative
    const pNameRes = exec(`SELECT product_name FROM products WHERE product_id = '${config.product}'`);
    const pName = pNameRes.rows?.[0]?.[0] || 'Selected product';
    const wNameRes = exec(`SELECT warehouse_name FROM warehouses WHERE warehouse_id = '${config.warehouse}'`);
    const wName = wNameRes.rows?.[0]?.[0] || 'selected facility';

    const narrative = generateNarrative(pName, wName, config.model, metrics, actuals, forecast);
    setData({ chartData, narrative, metrics });
  };

  const generateNarrative = (pName, wName, modelId, metrics, actuals, forecast) => {
    const startVal = actuals[actuals.length - 1];
    const endVal = forecast[forecast.length - 1];
    const pctChange = (((endVal - startVal) / startVal) * 100).toFixed(1);
    const direction = endVal >= startVal ? 'increase' : 'decrease';
    
    let confidence = 'high';
    if (metrics.MAPE > 20) confidence = 'low';
    else if (metrics.MAPE > 10) confidence = 'moderate';

    const modelName = modelId === 'sma' ? 'Moving Average' : modelId === 'lr' ? 'Linear Regression' : 'Holt-Winters';

    return `Demand for ${pName} at ${wName} is projected to ${direction} by ${Math.abs(pctChange)}% over the next 6 periods. The ${modelName} model achieved a MAPE of ${metrics.MAPE.toFixed(1)}%, indicating ${confidence} forecast confidence. Planners should review safety stock parameters to align with this ${direction} trend.`;
  };

  if (isEditing) {
    return (
      <div className="flex flex-col h-full bg-surface-container-lowest p-4 w-full">
        <div className="flex items-center justify-between mb-3 text-secondary">
           <span className="text-[12px] font-semibold uppercase tracking-wider">Configure Forecast</span>
           <button onClick={() => { updateConfig(draft); setIsEditing(false); }} className="text-primary hover:brightness-110 flex items-center gap-1 text-[12px] font-medium"><Icon name="check" size={14} /> Done</button>
        </div>
        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          <div className="space-y-1">
             <label className="text-[11px] font-medium text-secondary">Widget Title</label>
             <input type="text" value={draft.title} onChange={e => setDraft({...draft, title: e.target.value})} className="w-full bg-surface-container border border-outline/10 text-[13px] px-2 py-1.5 rounded focus:border-primary outline-none" />
          </div>
          <div className="space-y-1">
             <label className="text-[11px] font-medium text-secondary">Product</label>
             <select value={draft.product} onChange={e => setDraft({...draft, product: e.target.value})} className="w-full bg-surface-container border border-outline/10 text-[13px] px-2 py-1.5 rounded focus:border-primary outline-none">
               {products.map(p => <option key={p[0]} value={p[0]}>{p[1]}</option>)}
             </select>
          </div>
          <div className="space-y-1">
             <label className="text-[11px] font-medium text-secondary">Warehouse</label>
             <select value={draft.warehouse} onChange={e => setDraft({...draft, warehouse: e.target.value})} className="w-full bg-surface-container border border-outline/10 text-[13px] px-2 py-1.5 rounded focus:border-primary outline-none">
               {warehouses.map(w => <option key={w[0]} value={w[0]}>{w[1]}</option>)}
             </select>
          </div>
          <div className="space-y-1">
             <label className="text-[11px] font-medium text-secondary">Algorithm</label>
             <select value={draft.model} onChange={e => setDraft({...draft, model: e.target.value})} className="w-full bg-surface-container border border-outline/10 text-[13px] px-2 py-1.5 rounded focus:border-primary outline-none">
               <option value="es">Exponential Smoothing</option>
               <option value="sma">Simple Moving Average</option>
               <option value="lr">Linear Regression</option>
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

      <div className="text-[14px] font-semibold text-on-background truncate mb-4">{config.title}</div>
      
      {error && <div className="text-error text-[12px] border-l-2 border-error pl-2 mb-2"><Icon name="error" size={12} className="inline mr-1"/>{error}</div>}
      
      {data && !error && (
        <div className="flex flex-col flex-1">
          <div className="flex-1 w-full min-h-[160px]">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--outline)" opacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--on-surface-variant)' }} tickMargin={8} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--on-surface-variant)' }} tickMargin={8} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 4, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Actual" stroke="var(--primary)" strokeWidth={2} dot={{r:2}} />
                <Line type="monotone" dataKey="Fit" stroke="var(--secondary)" strokeDasharray="4 4" strokeWidth={1} dot={false} />
                <Line type="monotone" dataKey="Forecast" stroke="var(--tertiary, #10b981)" strokeWidth={3} dot={{r:3}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-3 border-t border-outline/10 text-[12px] text-secondary leading-relaxed font-medium">
             {data.narrative}
          </div>
        </div>
      )}
    </div>
  );
}
