import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import MetricWidget from './widgets/MetricWidget';
import ChartWidget from './widgets/ChartWidget';
import ForecastWidget from './widgets/ForecastWidget';
import ExecutiveSummaryWidget from './ExecutiveSummaryWidget';
import { exportToPDF } from '../utils/exportUtils';

export default function DashboardWorkspace() {
  const [widgets, setWidgets] = useState([]);
  const [exporting, setExporting] = useState(false);
  
  // Debounced LocalStorage save
  const timeoutRef = useRef(null);
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      localStorage.setItem('chainquery_dashboard', JSON.stringify(widgets));
    }, 300);
    return () => clearTimeout(timeoutRef.current);
  }, [widgets]);

  // Initial Load
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chainquery_dashboard');
      if (saved) setWidgets(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to load dashboard from local storage", e);
    }
  }, []);

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(widgets, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "chainquery_dashboard.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (Array.isArray(json)) setWidgets(json);
        else alert('Invalid dashboard file format.');
      } catch (err) {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  const addWidget = (type) => {
    const newWidget = {
      id: `w_${Date.now()}`,
      type,
      size: 'half', // full, half, third, quarter
      config: {}
    };
    setWidgets(prev => [...prev, newWidget]);
  };

  const handleExport = async () => {
    setExporting(true);
    await exportToPDF('dashboard-export-area', 'Executive Dashboard Brief', 'dashboard_executive_brief.pdf');
    setExporting(false);
  };

  return (
    <div className="flex w-full h-full bg-background text-on-background relative overflow-hidden">
      
      {/* Configuration Sidebar */}
      <aside className="w-[320px] bg-surface flex flex-col border-r border-outline/20 z-10">
        <div className="p-4 border-b border-outline/20">
          <h2 className="text-[13px] font-medium uppercase tracking-wider text-secondary flex items-center gap-2">
            <Icon name="space_dashboard" size={16} /> Dashboard Configuration
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
             <h3 className="text-[11px] font-semibold text-secondary uppercase tracking-[0.05em] mb-2">Add Widget</h3>
             <div className="space-y-2">
               <button onClick={() => addWidget('metric')} className="w-full text-left px-3 py-2 bg-surface-container-low hover:bg-surface-container-high rounded border border-outline/10 text-[13px] font-medium transition-colors flex items-center justify-between">
                 <span>Metric KPI Card</span> <Icon name="add" size={16} />
               </button>
               <button onClick={() => addWidget('chart')} className="w-full text-left px-3 py-2 bg-surface-container-low hover:bg-surface-container-high rounded border border-outline/10 text-[13px] font-medium transition-colors flex items-center justify-between">
                 <span>SQL Chart Widget</span> <Icon name="add" size={16} />
               </button>
               <button onClick={() => addWidget('forecast')} className="w-full text-left px-3 py-2 bg-surface-container-low hover:bg-surface-container-high rounded border border-outline/10 text-[13px] font-medium transition-colors flex items-center justify-between">
                 <span>ML Forecast Widget</span> <Icon name="add" size={16} />
               </button>
             </div>
          </section>

          <section>
             <h3 className="text-[11px] font-semibold text-secondary uppercase tracking-[0.05em] mb-2">Import / Export</h3>
             <div className="space-y-2">
                <button onClick={exportJSON} className="w-full px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded font-medium text-[13px] transition-colors flex items-center justify-center gap-2">
                  <Icon name="download" size={16} /> Export JSON
                </button>
                <div className="relative">
                  <input type="file" accept=".json" onChange={importJSON} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <button className="w-full px-3 py-2 bg-surface-container text-on-surface hover:bg-surface-container-high rounded font-medium text-[13px] transition-colors flex items-center justify-center gap-2 pointer-events-none border border-outline/20">
                    <Icon name="upload" size={16} /> Import JSON
                  </button>
                </div>
             </div>
          </section>
        </div>
      </aside>

      {/* Main Auto-Flow Canvas */}
      <main className="flex-1 bg-surface-container-lowest overflow-y-auto p-6" id="dashboard-export-area">
        <div className="max-w-[1600px] mx-auto">
          
          <header className="mb-8 flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-on-background">Executive Overview</h1>
              <p className="text-[14px] text-secondary mt-1 max-w-2xl">A unified view of real-time SQL analytics and ML demand forecasts.</p>
            </div>
            {widgets.length > 0 && (
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-outline/20 rounded text-secondary hover:text-on-surface text-[12px] font-medium disabled:opacity-50 transition-colors"
                >
                  <Icon name="description" size={16} />
                  {exporting ? 'Generating PDF...' : 'Export as Executive Brief'}
                </button>
                <button onClick={() => setWidgets([])} className="text-error bg-error/10 hover:bg-error/20 px-3 py-1.5 rounded text-[12px] font-medium transition-colors">
                  Clear Dashboard
                </button>
              </div>
            )}
          </header>

          <ExecutiveSummaryWidget widgets={widgets} />

          {widgets.length === 0 ? (
            <div className="h-64 rounded-xl border-2 border-dashed border-outline/20 flex flex-col items-center justify-center text-secondary">
               <Icon name="dashboard_customize" size={48} className="opacity-40 mb-3" />
               <p className="text-[14px] font-medium">Your dashboard is empty.</p>
               <p className="text-[12px]">Add widgets from the left sidebar to begin building.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 items-start content-start">
               {widgets.map((widget, idx) => (
                 <div key={widget.id} className={`bg-surface border border-outline/20 rounded-xl shadow-sm transition-all relative group flex flex-col ${
                    widget.size === 'full' ? 'w-full' :
                    widget.size === 'half' ? 'w-[calc(50%-8px)]' :
                    widget.size === 'third' ? 'w-[calc(33.33%-10.66px)]' : 'w-[calc(25%-12px)]'
                 }`}>
                    {/* Widget Header Controls */}
                    <div className="px-3 py-2 border-b border-outline/10 flex items-center justify-between text-secondary bg-surface-container-lowest rounded-t-xl">
                      <div className="text-[11px] font-semibold uppercase tracking-wider">{widget.type}</div>
                      <div className="flex items-center gap-1">
                         <select 
                           value={widget.size}
                           onChange={(e) => {
                             const update = [...widgets];
                             update[idx].size = e.target.value;
                             setWidgets(update);
                           }}
                           className="text-[11px] bg-transparent outline-none cursor-pointer border-none"
                         >
                           <option value="full">Full</option>
                           <option value="half">Half</option>
                           <option value="third">Third</option>
                           <option value="quarter">Quarter</option>
                         </select>
                         
                         {idx > 0 && (
                           <button onClick={() => {
                             const update = [...widgets];
                             const temp = update[idx];
                             update[idx] = update[idx-1];
                             update[idx-1] = temp;
                             setWidgets(update);
                           }} className="hover:text-primary"><Icon name="arrow_upward" size={14}/></button>
                         )}
                         {idx < widgets.length - 1 && (
                           <button onClick={() => {
                             const update = [...widgets];
                             const temp = update[idx];
                             update[idx] = update[idx+1];
                             update[idx+1] = temp;
                             setWidgets(update);
                           }} className="hover:text-primary"><Icon name="arrow_downward" size={14}/></button>
                         )}
                         <button onClick={() => {
                           setWidgets(widgets.filter(w => w.id !== widget.id));
                         }} className="hover:text-error ml-1"><Icon name="close" size={14}/></button>
                      </div>
                    </div>

                    {/* Widget Content Payload */}
                    <div className="flex-1 flex min-h-[120px]">
                       {widget.type === 'metric' ? (
                          <MetricWidget 
                             config={widget.config} 
                             updateConfig={(newConfig) => {
                               const update = [...widgets];
                               update[idx].config = newConfig;
                               setWidgets(update);
                             }} 
                          />
                       ) : widget.type === 'chart' ? (
                          <ChartWidget 
                             config={widget.config} 
                             updateConfig={(newConfig) => {
                               const update = [...widgets];
                               update[idx].config = newConfig;
                               setWidgets(update);
                             }} 
                          />
                       ) : widget.type === 'forecast' ? (
                          <ForecastWidget 
                             config={widget.config} 
                             updateConfig={(newConfig) => {
                               const update = [...widgets];
                               update[idx].config = newConfig;
                               setWidgets(update);
                             }} 
                          />
                       ) : null}
                    </div>

                 </div>
               ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
