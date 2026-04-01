// Mathematical and statistical utilities for the ML engine

export function calculateMetrics(actuals, forecasts) {
  let aeTotal = 0, apeTotal = 0, seTotal = 0, count = 0;
  
  for (let i = 0; i < actuals.length; i++) {
    const a = actuals[i];
    const f = forecasts[i];
    if (a != null && f != null) {
      const err = Math.abs(a - f);
      aeTotal += err;
      seTotal += err * err;
      if (a !== 0) {
        apeTotal += (err / Math.abs(a));
      }
      count++;
    }
  }

  if (count === 0) return { MAE: 0, MAPE: 0, RMSE: 0 };
  
  return {
    MAE: aeTotal / count,
    MAPE: (apeTotal / count) * 100, // percentage
    RMSE: Math.sqrt(seTotal / count)
  };
}

export function generateFutureLabels(lastLabel, periods = 6) {
  // Simple heuristic: if label is "YYYY-MM", increment month
  try {
    const parts = String(lastLabel).split('-');
    if (parts.length === 2 && parts[0].length === 4) {
      let year = parseInt(parts[0], 10);
      let month = parseInt(parts[1], 10);
      const res = [];
      for (let i = 0; i < periods; i++) {
        month++;
        if (month > 12) { year++; month = 1; }
        res.push(`${year}-${month.toString().padStart(2, '0')}`);
      }
      return res;
    }
  } catch (e) {}
  
  // Fallback: Just return +1, +2, +3...
  return Array.from({ length: periods }, (_, i) => `Future +${i + 1}`);
}
