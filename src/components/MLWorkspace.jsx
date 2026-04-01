import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { useDb } from '../App';
import { runSMA, runWMA, runExponentialSmoothing, runLinearRegression, runSeasonalDecomposition } from '../models/demand';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import NarrativePanel from './NarrativePanel';
import { exportToPDF } from '../utils/exportUtils';

const MODELS = [
  { id: 'sma', category: 'Demand Forecasting', name: 'Simple Moving Average (SMA)', desc: 'Forecast future demand using a rolling historical average window.' },
  { id: 'wma', category: 'Demand Forecasting', name: 'Weighted Moving Average (WMA)', desc: 'Forecast using varying weights for recent historical periods.' },
  { id: 'es', category: 'Demand Forecasting', name: 'Exponential Smoothing', desc: 'Forecast using level, trend, and seasonal smoothing (Holt-Winters).' },
  { id: 'lr', category: 'Demand Forecasting', name: 'Linear Regression Forecast', desc: 'Project demand using a linear least-squares best fit line.' },
  { id: 'sd', category: 'Demand Forecasting', name: 'Seasonal Decomposition', desc: 'Decomposes demand time series into trend, seasonal pattern, and residual components.' },
];

function generateMLNarrative(modelId, productLabel, warehouseLabel, result) {
  if (!result || !result.metrics) return null;
  const { MAPE, RMSE, MAE } = result.metrics;
  
  // Forecast Models
  if (['sma', 'wma', 'es', 'lr'].includes(modelId)) {
    const mapeVal = parseFloat(MAPE);
    let reliability = '';
    let recommendation = '';
    
    if (mapeVal < 10) {
      reliability = 'highly reliable';
      recommendation = 'This forecast is highly reliable and suitable for direct use in procurement planning and setting safety stock limits without major manual overrides.';
    } else if (mapeVal <= 20) {
      reliability = 'moderately reliable';
      recommendation = 'This forecast shows moderate reliability. Consider supplementing with qualitative market intelligence before making large procurement commitments.';
    } else {
      reliability = 'unreliable';
      recommendation = 'This forecast has limited reliability for this product. The high variability suggests external factors (promotions, market shifts, supply disruptions) are influencing demand. Manual review is recommended before acting on these projections.';
    }
    
    // Find trend direction
    const forecastVals = result.chartData.filter(d => d.Forecast !== undefined);
    let direction = 'remain stable';
    let pctDesc = '';
    
    if (forecastVals.length > 0) {
      const first = forecastVals[0].Forecast;
      const last = forecastVals[forecastVals.length - 1].Forecast;
      const change = last - first;
      if (Math.abs(change) / (first || 1) > 0.05) {
        direction = change > 0 ? 'increase' : 'decrease';
        pctDesc = ` by ${Math.round(Math.abs(change)/(first||1) * 100)}%`;
      }
    }
    
    return {
      headline: `Demand for ${productLabel} at ${warehouseLabel} is projected to ${direction}${pctDesc} over the forecast horizon.`,
      context: `The chosen model evaluated historical data to project future requirements. The forecast model has demonstrated a ${reliability} track record with an accuracy rate of ${Math.max(0, 100 - mapeVal).toFixed(1)}% over the validation period (MAPE: ${mapeVal}%, RMSE: ${Number(RMSE).toFixed(1)} units).`,
      impact: `Depending on product margin, higher accuracy directly translates to reduced safety stock carrying costs while maintaining service levels.`,
      action: recommendation
    };
  }
  
  if (modelId === 'sd') {
    return {
      headline: `Demand for ${productLabel} at ${warehouseLabel} has been decomposed to separate trend and seasonal drivers.`,
      context: `The Seasonal Decomposition model extracts underlying business trends from recurring cyclic patterns. The residual data points represent pure volatility or unpredicted anomalies.`,
      impact: `Not calculable.`,
      action: `Use the isolated 'Trend' component rather than raw actuals to set long-term inventory policy, discounting the 'Seasonal' noise.`
    };
  }

  return null;
}

export default function MLWorkspace() {
  const { exec } = useDb();
  const [activeModel, setActiveModel] = useState(MODELS[0]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  
  // Params
  const [product, setProduct] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [window, setWindow] = useState(6);
  const [alpha, setAlpha] = useState(0.5);
  const [beta, setBeta] = useState(0.1);
  const [gamma, setGamma] = useState(0.5);
  const [seasonLength, setSeasonLength] = useState(12);
  const [wmaWeights, setWmaWeights] = useState([0.1, 0.1, 0.2, 0.2, 0.2, 0.2]);
  
  // Output
  const [result, setResult] = useState(null);
  const [narrative, setNarrative] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    // Load dropdowns
    const p = exec("SELECT product_id, product_name FROM products ORDER BY product_name");
    const w = exec("SELECT warehouse_id, warehouse_name FROM warehouses ORDER BY warehouse_name");
    if (!p.error) setProducts(p.rows || []);
    if (!w.error) setWarehouses(w.rows || []);
    if (p.rows?.[0]) setProduct(p.rows[0][0]);
    if (w.rows?.[0]) setWarehouse(w.rows[0][0]);
  }, [exec]);

  const runModel = () => {
    const pName = products.find(p => p[0] === product)?.[1] || product;
    const wName = warehouses.find(w => w[0] === warehouse)?.[1] || warehouse;

    // 1. Fetch historical demand
    const sql = `
      SELECT forecast_date, COALESCE(actual_qty, forecast_qty) as qty 
      FROM demand_forecast 
      WHERE product_id = '${product}' 
      AND warehouse_id = '${warehouse}' 
      ORDER BY forecast_date ASC
    `;
    const data = exec(sql);
    if (data.error || !data.rows.length) {
      setResult({ error: 'No demand data found for this combination.' });
      return;
    }

    const actuals = data.rows.map(r => r[1]);
    const labels = data.rows.map(r => r[0]);

    if (activeModel.id === 'sma') {
      const { fitted, forecast, futureLabels, metrics } = runSMA(actuals, labels, window, 6);
      formatAndSetResult(labels, actuals, fitted, futureLabels, forecast, metrics, pName, wName);
    } else if (activeModel.id === 'wma') {
      const { fitted, forecast, futureLabels, metrics } = runWMA(actuals, labels, wmaWeights, 6);
      formatAndSetResult(labels, actuals, fitted, futureLabels, forecast, metrics, pName, wName);
    } else if (activeModel.id === 'es') {
      const { fitted, forecast, futureLabels, metrics } = runExponentialSmoothing(actuals, labels, alpha, beta, gamma, seasonLength, 6);
      formatAndSetResult(labels, actuals, fitted, futureLabels, forecast, metrics, pName, wName);
    } else if (activeModel.id === 'lr') {
      const { fitted, forecast, futureLabels, metrics } = runLinearRegression(actuals, labels, 6);
      formatAndSetResult(labels, actuals, fitted, futureLabels, forecast, metrics, pName, wName);
    } else if (activeModel.id === 'sd') {
      const res = runSeasonalDecomposition(actuals, labels, seasonLength);
      setResult(res);
      setNarrative(generateMLNarrative('sd', pName, wName, res));
    } else {
      setResult({ error: 'Model implementation pending.' });
    }
  };

  const formatAndSetResult = (labels, actuals, fitted, futureLabels, forecast, metrics, pName, wName) => {
    // Combine into Recharts format
    const chartData = [];
    labels.forEach((l, i) => {
      chartData.push({ month: l, 'Historical Actuals': actuals[i], 'Model Fit': fitted[i] });
    });
    futureLabels.forEach((l, i) => {
      chartData.push({ month: l, 'Forecast': forecast[i] });
    });
    setResult({ chartData, metrics });
    setNarrative(generateMLNarrative(activeModel.id, pName, wName, { chartData, metrics }));
  };

  const handleExport = async () => {
    setExporting(true);
    await exportToPDF('ml-export-area', `${activeModel.name} Intelligence Report`, 'ml_insights_report.pdf');
    setExporting(false);
  };

  return (
    <div className="flex w-full h-full bg-background text-on-background">
      {/* Sidebar */}
      <aside className="w-[320px] bg-surface border-r border-outline/20 flex flex-col pt-4">
        <h2 className="px-4 text-[13px] font-medium uppercase tracking-wider text-secondary mb-3">ML Models</h2>
        <div className="flex-1 overflow-y-auto px-2 space-y-4">
          {Array.from(new Set(MODELS.map(m => m.category))).map(cat => (
            <div key={cat}>
              <h3 className="text-[11px] font-semibold text-secondary uppercase tracking-[0.05em] px-2 mb-1.5 flex items-center gap-1">
                <Icon name="expand_more" size={14} />{cat}
              </h3>
              <div className="space-y-0.5">
                {MODELS.filter(m => m.category === cat).map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setActiveModel(m); setResult(null); }}
                    className={`w-full text-left px-3 py-2.5 rounded transition-all group border-l-2 ${
                      activeModel.id === m.id ? 'bg-surface-container-high border-primary' : 'border-transparent hover:bg-surface-container-high'
                    }`}
                  >
                    <div className="font-medium text-[14px] leading-tight text-on-background">{m.name}</div>
                    <div className="text-[12px] text-secondary mt-1 line-clamp-2">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-background p-8" id="ml-export-area">
        <header className="mb-6 max-w-4xl flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-on-background mb-2">{activeModel.name}</h1>
            <p className="text-[14px] text-secondary leading-relaxed">{activeModel.desc}</p>
          </div>
          {result && !result.error && (
            <button 
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-outline/20 rounded-lg text-secondary hover:text-on-surface text-[13px] font-medium disabled:opacity-50"
            >
              <Icon name="summarize" size={18} />
              {exporting ? 'Generating PDF...' : 'Export Insights Report'}
            </button>
          )}
        </header>

        {/* Config Panel */}
        <section className="bg-surface border border-outline/20 rounded-xl p-6 mb-8 max-w-4xl shadow-sm">
          <h2 className="text-[14px] font-semibold text-on-background mb-4 flex items-center gap-2"><Icon name="tune" size={18} /> Configuration</h2>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-secondary">Product</label>
              <select value={product} onChange={e => setProduct(e.target.value)} className="w-full bg-surface-container-highest border-none text-[13px] p-2 rounded focus:ring-1 focus:ring-primary outline-none">
                {products.map(p => <option key={p[0]} value={p[0]}>{p[1]}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-secondary">Warehouse</label>
              <select value={warehouse} onChange={e => setWarehouse(e.target.value)} className="w-full bg-surface-container-highest border-none text-[13px] p-2 rounded focus:ring-1 focus:ring-primary outline-none">
                {warehouses.map(w => <option key={w[0]} value={w[0]}>{w[1]}</option>)}
              </select>
            </div>
            {activeModel.id === 'sma' && (
              <div className="space-y-1 col-span-2">
                <label className="text-[12px] font-medium text-secondary flex justify-between"><span>Rolling Window Size (Months)</span><span>{window}</span></label>
                <input type="range" min="2" max="12" value={window} onChange={e => setWindow(Number(e.target.value))} className="w-full accent-primary" />
              </div>
            )}
            {activeModel.id === 'es' && (
              <>
                <div className="space-y-1 col-span-2">
                  <label className="text-[12px] font-medium text-secondary flex justify-between"><span>Level Smoothing (Alpha)</span><span>{alpha.toFixed(2)}</span></label>
                  <input type="range" min="0" max="1" step="0.05" value={alpha} onChange={e => setAlpha(Number(e.target.value))} className="w-full accent-primary" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[12px] font-medium text-secondary flex justify-between"><span>Trend Smoothing (Beta)</span><span>{beta.toFixed(2)}</span></label>
                  <input type="range" min="0" max="1" step="0.05" value={beta} onChange={e => setBeta(Number(e.target.value))} className="w-full accent-primary" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[12px] font-medium text-secondary flex justify-between"><span>Seasonal Smoothing (Gamma)</span><span>{gamma.toFixed(2)}</span></label>
                  <input type="range" min="0" max="1" step="0.05" value={gamma} onChange={e => setGamma(Number(e.target.value))} className="w-full accent-primary" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[12px] font-medium text-secondary flex justify-between"><span>Season Length</span><span>{seasonLength}</span></label>
                  <input type="range" min="2" max="24" value={seasonLength} onChange={e => setSeasonLength(Number(e.target.value))} className="w-full accent-primary" />
                </div>
              </>
            )}
            {activeModel.id === 'wma' && (
               <div className="space-y-1 col-span-2">
                 <label className="text-[12px] font-medium text-secondary flex justify-between"><span>Weights (Comma separated sum to 1.0)</span><span>Current sum: {wmaWeights.reduce((a,b)=>a+b,0).toFixed(2)}</span></label>
                 <input type="text" value={wmaWeights.join(', ')} onChange={e => setWmaWeights(e.target.value.split(',').map(n => Number(n.trim()) || 0))} className="w-full bg-surface-container-highest border-none text-[13px] p-2 rounded focus:ring-1 focus:ring-primary outline-none" />
               </div>
            )}
          </div>
          <button onClick={runModel} className="bg-primary text-on-primary px-6 py-2 rounded font-semibold text-[13px] hover:brightness-110 active:scale-95 transition-all w-full md:w-auto">
            Calculate Model
          </button>
        </section>

        {/* Results */}
        {result && !result.error && (
          <section className="bg-surface border border-outline/20 rounded-xl p-6 max-w-4xl shadow-sm">
            <h2 className="text-[14px] font-semibold text-on-background mb-4 flex items-center gap-2"><Icon name="analytics" size={18} /> Model Output</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              {Object.entries(result.metrics).map(([k, v]) => (
                <div key={k} className="bg-surface-container-lowest border border-outline/10 p-4 rounded-lg">
                  <div className="text-[11px] font-semibold text-secondary uppercase tracking-widest">{k}</div>
                  <div className="text-2xl font-bold mt-1 text-on-background">{Number(v).toFixed(2)}{k === 'MAPE' ? '%' : ''}</div>
                </div>
              ))}
            </div>

            <div className="h-[400px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--outline)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--on-surface-variant)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--on-surface-variant)' }} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 4, fontSize: 12 }} />
                  <Legend />
                  {activeModel.id === 'sd' ? (
                    <>
                      <Line type="monotone" dataKey="Original" stroke="var(--primary)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Trend" stroke="var(--secondary)" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Seasonal" stroke="var(--tertiary, #10b981)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Residual" stroke="var(--error, #ef4444)" strokeWidth={1} dot={{ r: 2 }} />
                    </>
                  ) : (
                    <>
                      <Line type="monotone" dataKey="Historical Actuals" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Model Fit" stroke="var(--secondary)" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Forecast" stroke="var(--tertiary, #10b981)" strokeWidth={3} dot={{ r: 4 }} />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Narrative Component */}
            <div className="mt-8">
               <NarrativePanel narrative={narrative} isAiGenerated={false} />
            </div>

          </section>
        )}
        {result?.error && (
           <div className="p-4 bg-error/10 text-error rounded-xl max-w-4xl border border-error/20 flex items-center gap-2">
             <Icon name="error" /> {result.error}
           </div>
        )}
      </main>
    </div>
  );
}
