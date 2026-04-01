import { linearRegression, linearRegressionLine } from 'simple-statistics';
import { calculateMetrics, generateFutureLabels } from './mathUtils';

// -----------------------------------------
// Simple Moving Average
// -----------------------------------------
export function runSMA(actuals, labels, window = 6, forecastPeriods = 6) {
  const fitted = []; // length matches actuals
  for (let i = 0; i < actuals.length; i++) {
    if (i < window) {
      fitted.push(null); // not enough history
    } else {
      let sum = 0;
      for (let j = 1; j <= window; j++) sum += actuals[i - j] || 0;
      fitted.push(sum / window);
    }
  }

  // Project forward
  const forecast = [];
  const futureLabels = generateFutureLabels(labels[labels.length - 1], forecastPeriods);
  const track = [...actuals];
  
  for (let i = 0; i < forecastPeriods; i++) {
    let sum = 0;
    for (let j = 1; j <= window; j++) sum += track[track.length - j];
    const avg = sum / window;
    forecast.push(avg);
    track.push(avg);
  }

  const metrics = calculateMetrics(actuals.slice(window), fitted.slice(window));

  return { fitted, forecast, futureLabels, metrics };
}

// -----------------------------------------
// Weighted Moving Average
// -----------------------------------------
export function runWMA(actuals, labels, weights, forecastPeriods = 6) {
  const fitted = [];
  const w = weights.length;
  for (let i = 0; i < actuals.length; i++) {
    if (i < w) {
      fitted.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < w; j++) sum += (actuals[i - w + j] || 0) * weights[j];
      fitted.push(sum);
    }
  }

  const forecast = [];
  const futureLabels = generateFutureLabels(labels[labels.length - 1], forecastPeriods);
  const track = [...actuals];
  
  for (let i = 0; i < forecastPeriods; i++) {
    let sum = 0;
    for (let j = 0; j < w; j++) sum += track[track.length - w + j] * weights[j];
    forecast.push(sum);
    track.push(sum);
  }

  const metrics = calculateMetrics(actuals.slice(w), fitted.slice(w));
  return { fitted, forecast, futureLabels, metrics };
}

// -----------------------------------------
// Exponential Smoothing (Holt-Winters)
// -----------------------------------------
export function runExponentialSmoothing(actuals, labels, alpha = 0.5, beta = 0.0, gamma = 0.0, seasonLength = 12, forecastPeriods = 6) {
  const n = actuals.length;
  let level = actuals[0];
  let trend = actuals[1] - actuals[0];
  let seasonal = new Array(seasonLength).fill(1); // Ratio
  
  if (gamma > 0 && n >= seasonLength) {
    // Initial seasonal
    const initAvg = actuals.slice(0, seasonLength).reduce((a, b) => a + b, 0) / seasonLength;
    for (let i = 0; i < seasonLength; i++) {
      seasonal[i] = actuals[i] / initAvg;
    }
  }

  const fitted = [level];
  for (let t = 1; t < n; t++) {
    const sIdx = t % seasonLength;
    const y = actuals[t];
    
    // Fitted based on t-1 state
    const prevSeason = gamma > 0 ? seasonal[sIdx] : 1;
    fitted.push((level + trend) * prevSeason);
    
    const lastLevel = level;
    
    // Update state
    level = alpha * (y / prevSeason) + (1 - alpha) * (level + trend);
    trend = beta * (level - lastLevel) + (1 - beta) * trend;
    if (gamma > 0) seasonal[sIdx] = gamma * (y / level) + (1 - gamma) * seasonal[sIdx];
  }

  // Forecast
  const forecast = [];
  const futureLabels = generateFutureLabels(labels[n - 1], forecastPeriods);
  for (let f = 1; f <= forecastPeriods; f++) {
    const sIdx = (n - 1 + f) % seasonLength;
    const sVal = gamma > 0 ? seasonal[sIdx] : 1;
    forecast.push((level + f * trend) * sVal);
  }

  const metrics = calculateMetrics(actuals, fitted);
  return { fitted, forecast, futureLabels, metrics, components: { level, trend, seasonal } };
}

// -----------------------------------------
// Linear Regression
// -----------------------------------------
export function runLinearRegression(actuals, labels, forecastPeriods = 6) {
  const data = actuals.map((val, idx) => [idx, val]);
  const result = linearRegression(data);
  const predict = linearRegressionLine(result);
  
  const fitted = actuals.map((_, idx) => predict(idx));
  const forecast = Array.from({ length: forecastPeriods }, (_, i) => predict(actuals.length + i));
  const futureLabels = generateFutureLabels(labels[labels.length - 1], forecastPeriods);

  const metrics = calculateMetrics(actuals, fitted);
  return { fitted, forecast, futureLabels, metrics, slope: result.m, intercept: result.b };
}

// -----------------------------------------
// Seasonal Decomposition
// -----------------------------------------
export function runSeasonalDecomposition(actuals, labels, seasonLength = 12) {
  const n = actuals.length;
  if (n < seasonLength * 2) return { error: 'Not enough data for decomposition (need at least 2 full seasons).' };

  const trend = new Array(n).fill(null);
  for (let i = Math.floor(seasonLength / 2); i < n - Math.floor(seasonLength / 2); i++) {
    let sum = 0;
    for (let j = Math.floor(-seasonLength / 2); j < Math.ceil(seasonLength / 2); j++) sum += actuals[i + j];
    trend[i] = sum / seasonLength;
  }

  const detrended = actuals.map((v, i) => trend[i] !== null ? v - trend[i] : null);

  let seasonal = new Array(seasonLength).fill(0);
  let counts = new Array(seasonLength).fill(0);
  for (let i = 0; i < n; i++) {
    if (detrended[i] !== null) {
      seasonal[i % seasonLength] += detrended[i];
      counts[i % seasonLength]++;
    }
  }
  seasonal = seasonal.map((s, i) => counts[i] ? s / counts[i] : 0);
  
  const seasonAvg = seasonal.reduce((a, b) => a + b, 0) / seasonLength;
  seasonal = seasonal.map(s => s - seasonAvg);

  const fullSeasonal = Array.from({ length: n }, (_, i) => seasonal[i % seasonLength]);
  const residual = actuals.map((v, i) => trend[i] !== null ? v - trend[i] - fullSeasonal[i] : null);

  const chartData = labels.map((l, i) => ({
    month: l,
    Original: actuals[i],
    Trend: trend[i],
    Seasonal: fullSeasonal[i],
    Residual: residual[i]
  }));

  return { chartData, metrics: { SeasonalAvg: seasonAvg, TrendSlope: 0, NoiseMag: 0 } };
}
