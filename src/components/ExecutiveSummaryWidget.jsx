import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { useDb, useApi } from '../App';
import { generateExecutiveSummary } from '../utils/llm';
import GlossaryTooltip from './GlossaryTooltip';

export default function ExecutiveSummaryWidget({ widgets }) {
  const { exec } = useDb();
  const { apiKey } = useApi();
  
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!apiKey) return;
    if (widgets.length === 0) {
      setSummary({ rating: 'GREEN', narrative: 'The dashboard is currently empty. Add widgets to generate an executive summary.' });
      return;
    }

    setLoading(true);
    
    // 1. Gather data from all widgets
    const dashboardContext = widgets.map(w => {
      if (w.type === 'metric' || w.type === 'chart') {
        const title = w.config?.title || 'Untitled Widget';
        let dataStr = 'No data';
        if (w.config?.sql) {
          const res = exec(w.config.sql);
          if (res && res.rows) {
            // Keep it small, just the first few rows or key aggregates
            dataStr = JSON.stringify(res.rows.slice(0, 5)); 
          }
        }
        return { widgetTitle: title, type: w.type, data: dataStr };
      }
      return { widgetTitle: 'Forecast Widget', type: w.type, details: w.config };
    });

    // 2. Call LLM
    try {
      const data = await generateExecutiveSummary(apiKey, dashboardContext);
      setSummary(data);
    } catch (e) {
      console.error(e);
      setSummary({ rating: 'AMBER', narrative: 'Failed to generate AI executive summary due to a network or API error.' });
    }
    
    setLoading(false);
  };

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgets]);

  // Graceful degradation
  if (!apiKey) {
    return (
      <div className="w-full bg-surface-container-lowest border-l-4 border-outline/20 p-6 rounded-xl shadow-sm mb-6 flex flex-col justify-center gap-2">
        <h3 className="text-[16px] font-semibold text-primary">Executive Summary</h3>
        <span className="text-secondary text-[14px]">
          Connect your API key to generate an Executive Summary.
        </span>
      </div>
    );
  }

  if (!summary && !loading) return null;

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(`Dashboard Rating: ${summary.rating}\n\n${summary.narrative}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBorderColor = () => {
    if (summary?.rating === 'GREEN') return 'border-success';
    if (summary?.rating === 'AMBER') return 'border-warning';
    if (summary?.rating === 'RED') return 'border-error';
    return 'border-outline/20';
  };

  const getBadgeStyle = () => {
    if (summary?.rating === 'GREEN') return 'bg-success/10 text-success';
    if (summary?.rating === 'AMBER') return 'bg-warning/10 text-warning';
    if (summary?.rating === 'RED') return 'bg-error/10 text-error';
    return 'bg-outline/10 text-secondary';
  };

  const getRatingLabel = () => {
    if (summary?.rating === 'GREEN') return 'HEALTHY';
    if (summary?.rating === 'AMBER') return 'ATTENTION REQUIRED';
    if (summary?.rating === 'RED') return 'CRITICAL';
    return 'UNKNOWN';
  };

  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className={`w-full bg-surface-container-lowest border-l-4 ${getBorderColor()} rounded-r-xl shadow-sm mb-6 transition-all`}>
      <div className="p-6 md:px-7">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-semibold text-on-background">Executive Summary</h2>
            <span className="text-secondary">•</span>
            <span className="text-[13px] text-secondary">{currentDate}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={generate} 
              disabled={loading}
              className="p-1.5 text-tertiary hover:bg-surface-container-high hover:text-on-surface rounded transition-colors disabled:opacity-50"
              title="Refresh Summary"
            >
              <Icon name="refresh" size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={handleCopy}
              className="p-1.5 text-tertiary hover:bg-surface-container-high hover:text-on-surface rounded transition-colors"
              title="Copy Summary"
            >
              {copied ? <Icon name="check" size={20} className="text-success" /> : <Icon name="content_copy" size={20} />}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3 py-2">
            <div className="h-6 w-32 bg-surface-container-high rounded animate-pulse" />
            <div className="h-4 w-full bg-surface-container-high rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-surface-container-high rounded animate-pulse" />
          </div>
        ) : summary && (
          <div className="flex flex-col items-start gap-4">
            
            {/* Traffic Light Badge */}
            <div className={`px-3 py-1 rounded-full text-[12px] font-semibold uppercase tracking-wider ${getBadgeStyle()}`}>
              {getRatingLabel()}
            </div>
            
            {/* Narrative Content */}
            {!collapsed && (
              <div className="text-[14px] text-on-surface font-normal line-height-[1.65] max-w-4xl space-y-2 animate-in fade-in duration-300">
                <GlossaryTooltip text={summary.narrative} />
              </div>
            )}
            
            {collapsed && (
              <div className="text-[14px] text-secondary font-normal truncate max-w-xl">
                 {summary.narrative.split('.')[0]}.
              </div>
            )}

            {/* Collapse Toggle */}
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="text-[13px] font-medium text-primary hover:underline mt-1"
            >
              {collapsed ? 'Read full summary' : 'Collapse summary'}
            </button>

          </div>
        )}
        
      </div>
    </div>
  );
}
