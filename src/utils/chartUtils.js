// Auto-chart detection and configuration

const CHART_COLORS = [
  '#2563EB', '#059669', '#D97706', '#7C3AED',
  '#DB2777', '#0891B2', '#EA580C', '#0D9488'
];

export function getChartColors() {
  return CHART_COLORS;
}

export function getColor(index) {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/**
 * Detect the best chart type for given data
 */
export function detectChartType(columns, rows) {
  if (!columns || columns.length === 0 || !rows || rows.length === 0) {
    return 'table';
  }

  const colTypes = columns.map((col, i) => analyzeColumn(col, rows.map(r => r[i])));

  const dateCol = colTypes.find(c => c.isDate);
  const numericCols = colTypes.filter(c => c.isNumeric);
  const categoricalCols = colTypes.filter(c => c.isCategorical);

  // Date + numeric → line chart
  if (dateCol && numericCols.length >= 1) {
    return 'line';
  }

  // Few categories + single numeric → pie
  if (categoricalCols.length === 1 && numericCols.length === 1 && rows.length <= 8) {
    return 'pie';
  }

  // Two numeric → scatter
  if (numericCols.length >= 2 && categoricalCols.length === 0 && !dateCol) {
    return 'scatter';
  }

  // Categorical + numeric → bar
  if (categoricalCols.length >= 1 && numericCols.length >= 1) {
    return 'bar';
  }

  // Multiple numeric values → bar
  if (numericCols.length >= 2) {
    return 'bar';
  }

  return 'table';
}

function analyzeColumn(name, values) {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNullValues.length === 0) return { name, isDate: false, isNumeric: false, isCategorical: false };

  const nameLower = name.toLowerCase();
  
  // Date detection
  const isDate = nameLower.includes('date') || nameLower.includes('month') || nameLower.includes('year') ||
    nameLower === 'forecast_date' || nameLower === 'snapshot_date' || nameLower === 'planned_date' ||
    nonNullValues.every(v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v));
  
  // Numeric detection
  const isNumeric = nonNullValues.every(v => typeof v === 'number' || (!isNaN(Number(v)) && v !== ''));
  
  // Skip columns that are IDs
  const isId = nameLower.endsWith('_id') || nameLower === 'id';
  
  const isCategorical = !isDate && !isNumeric && !isId;

  return { name, isDate, isNumeric: isNumeric && !isId, isCategorical, isId };
}

/**
 * Transform query results into chart-friendly data format
 */
export function transformForChart(columns, rows, chartType) {
  if (!columns || !rows || rows.length === 0) return { data: [], config: {} };

  const colTypes = columns.map((col, i) => analyzeColumn(col, rows.map(r => r[i])));

  if (chartType === 'pie') {
    return transformForPie(columns, rows, colTypes);
  }

  // For line/area/bar/composed/scatter – transform to array of objects
  const data = rows.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      let val = row[i];
      // Truncate long labels for chart display
      if (typeof val === 'string' && val.length > 25 && !colTypes[i].isDate) {
        val = val.substring(0, 22) + '...';
      }
      obj[col] = val;
    });
    return obj;
  });

  // Determine x-axis key and series keys  
  const xKey = colTypes.find(c => c.isDate)?.name || colTypes.find(c => c.isCategorical)?.name || columns[0];
  const seriesKeys = colTypes.filter(c => c.isNumeric).map(c => c.name);

  return {
    data,
    config: {
      xKey,
      seriesKeys,
      colors: CHART_COLORS,
    }
  };
}

function transformForPie(columns, rows, colTypes) {
  const labelCol = colTypes.find(c => c.isCategorical) || colTypes[0];
  const valueCol = colTypes.find(c => c.isNumeric);

  if (!labelCol || !valueCol) {
    return { data: [], config: {} };
  }

  const labelIdx = columns.indexOf(labelCol.name);
  const valueIdx = columns.indexOf(valueCol.name);

  const data = rows.map((row, i) => ({
    name: String(row[labelIdx]),
    value: Number(row[valueIdx]),
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return {
    data,
    config: {
      labelKey: 'name',
      valueKey: 'value',
      colors: CHART_COLORS,
    }
  };
}

/**
 * Format a value for display
 */
export function formatValue(value, columnName) {
  if (value === null || value === undefined) return '—';
  
  const name = (columnName || '').toLowerCase();
  
  if (typeof value === 'number') {
    if (name.includes('pct') || name.includes('percent') || name.includes('accuracy') || 
        name.includes('efficiency') || name.includes('utilization') || name.includes('rate') ||
        name.includes('variance')) {
      return value.toFixed(1) + '%';
    }
    if (name.includes('cost') || name.includes('price') || name.includes('value') || 
        name.includes('spend') || name.includes('capital')) {
      return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (Number.isInteger(value)) {
      return value.toLocaleString('en-US');
    }
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  
  // Date formatting
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: undefined });
  }
  
  return String(value);
}

/**
 * Check if a column contains numeric data
 */
export function isNumericColumn(columnName, rows, colIndex) {
  if (!rows || rows.length === 0) return false;
  return rows.slice(0, 10).every(row => {
    const val = row[colIndex];
    return val === null || val === undefined || typeof val === 'number';
  });
}
