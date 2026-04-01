// SQL syntax highlighting utilities

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL',
  'ON', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'AS', 'CASE', 'WHEN', 'THEN',
  'ELSE', 'END', 'GROUP', 'BY', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET',
  'HAVING', 'UNION', 'ALL', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET',
  'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'INDEX', 'DISTINCT',
  'BETWEEN', 'LIKE', 'EXISTS', 'WITH', 'RECURSIVE', 'CROSS', 'NATURAL',
  'USING', 'OVER', 'PARTITION', 'ROWS', 'RANGE', 'PRECEDING', 'FOLLOWING',
  'UNBOUNDED', 'CURRENT', 'ROW', 'CAST', 'INTEGER', 'REAL', 'TEXT', 'BLOB',
]);

const SQL_FUNCTIONS = new Set([
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'COALESCE', 'NULLIF',
  'ABS', 'LOWER', 'UPPER', 'LENGTH', 'SUBSTR', 'REPLACE', 'TRIM',
  'DATE', 'TIME', 'DATETIME', 'STRFTIME', 'JULIANDAY', 'TYPEOF',
  'IFNULL', 'IIF', 'PRINTF', 'INSTR', 'HEX', 'UNICODE', 'QUOTE',
  'GROUP_CONCAT', 'TOTAL',
]);

/**
 * Tokenize and highlight SQL string, returning an array of {text, className} objects
 */
export function highlightSQL(sql) {
  if (!sql) return [];
  
  const tokens = [];
  let i = 0;
  const len = sql.length;
  
  while (i < len) {
    // Whitespace
    if (/\s/.test(sql[i])) {
      let start = i;
      while (i < len && /\s/.test(sql[i])) i++;
      tokens.push({ text: sql.substring(start, i), className: '' });
      continue;
    }
    
    // Single-line comment
    if (sql[i] === '-' && sql[i + 1] === '-') {
      let start = i;
      while (i < len && sql[i] !== '\n') i++;
      tokens.push({ text: sql.substring(start, i), className: 'sql-comment' });
      continue;
    }
    
    // String literal
    if (sql[i] === "'") {
      let start = i;
      i++;
      while (i < len && sql[i] !== "'") i++;
      if (i < len) i++;
      tokens.push({ text: sql.substring(start, i), className: 'sql-string' });
      continue;
    }
    
    // Number
    if (/[0-9]/.test(sql[i]) && (i === 0 || /[\s,()=<>!+\-*/]/.test(sql[i - 1]))) {
      let start = i;
      while (i < len && /[0-9.]/.test(sql[i])) i++;
      tokens.push({ text: sql.substring(start, i), className: 'sql-number' });
      continue;
    }
    
    // Word (keyword, function, or identifier)
    if (/[a-zA-Z_]/.test(sql[i])) {
      let start = i;
      while (i < len && /[a-zA-Z0-9_]/.test(sql[i])) i++;
      const word = sql.substring(start, i);
      const upper = word.toUpperCase();
      
      if (SQL_KEYWORDS.has(upper)) {
        tokens.push({ text: word, className: 'sql-keyword' });
      } else if (SQL_FUNCTIONS.has(upper)) {
        tokens.push({ text: word, className: 'sql-function' });
      } else {
        tokens.push({ text: word, className: '' });
      }
      continue;
    }
    
    // Operators and punctuation
    if ('=<>!+-*/%'.includes(sql[i])) {
      let start = i;
      while (i < len && '=<>!+-*/%'.includes(sql[i])) i++;
      tokens.push({ text: sql.substring(start, i), className: 'sql-operator' });
      continue;
    }
    
    // Other characters (parens, commas, dots, etc.)
    tokens.push({ text: sql[i], className: '' });
    i++;
  }
  
  return tokens;
}

/**
 * Generate schema prompt for AI
 */
export function generateSchemaPrompt() {
  return `You are a SQL assistant for a supply chain planning database running SQLite.

DATABASE SCHEMA:

TABLE products (
  product_id INTEGER PRIMARY KEY,
  product_name TEXT, -- e.g. 'Aluminum Can 330ml', 'Energy Drink 250ml Classic'
  category TEXT, -- 'Raw Materials', 'Packaging', 'Finished Goods', 'Components'
  sku TEXT,
  unit_cost REAL,
  selling_price REAL,
  lead_time_days INTEGER,
  safety_stock_units INTEGER,
  reorder_point INTEGER,
  moq INTEGER -- Minimum Order Quantity
);

TABLE suppliers (
  supplier_id INTEGER PRIMARY KEY,
  supplier_name TEXT, -- e.g. 'AluPack GmbH', 'SweetSource BV'
  country TEXT,
  region TEXT, -- 'EMEA', 'APAC', 'Americas'
  reliability_score REAL, -- 0-100
  avg_lead_time_days INTEGER,
  payment_terms_days INTEGER,
  certified INTEGER -- 0 or 1
);

TABLE warehouses (
  warehouse_id INTEGER PRIMARY KEY,
  warehouse_name TEXT,
  city TEXT, -- Amsterdam, Frankfurt, Singapore, Chicago, Sao Paulo, Dubai
  country TEXT,
  region TEXT,
  max_capacity_units INTEGER,
  current_utilization_pct REAL,
  operating_cost_per_unit REAL
);

TABLE demand_forecast (
  forecast_id INTEGER PRIMARY KEY,
  product_id INTEGER REFERENCES products(product_id),
  warehouse_id INTEGER REFERENCES warehouses(warehouse_id),
  forecast_date TEXT, -- Monthly YYYY-MM-DD format
  forecast_qty INTEGER,
  actual_qty INTEGER, -- NULL for future months
  forecast_accuracy_pct REAL
);

TABLE inventory_snapshots (
  snapshot_id INTEGER PRIMARY KEY,
  product_id INTEGER REFERENCES products(product_id),
  warehouse_id INTEGER REFERENCES warehouses(warehouse_id),
  snapshot_date TEXT,
  on_hand_qty INTEGER,
  in_transit_qty INTEGER,
  allocated_qty INTEGER,
  available_qty INTEGER,
  days_of_supply REAL,
  stockout_flag INTEGER -- 0 or 1
);

TABLE purchase_orders (
  po_id INTEGER PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(supplier_id),
  product_id INTEGER REFERENCES products(product_id),
  warehouse_id INTEGER REFERENCES warehouses(warehouse_id),
  order_date TEXT,
  expected_delivery_date TEXT,
  actual_delivery_date TEXT, -- NULL for open POs
  qty_ordered INTEGER,
  qty_received INTEGER,
  unit_price REAL,
  total_value REAL,
  status TEXT -- 'Open', 'In Transit', 'Delivered', 'Delayed', 'Cancelled'
);

TABLE production_plans (
  plan_id INTEGER PRIMARY KEY,
  product_id INTEGER REFERENCES products(product_id),
  warehouse_id INTEGER REFERENCES warehouses(warehouse_id),
  planned_date TEXT,
  planned_qty INTEGER,
  actual_qty INTEGER,
  line_efficiency_pct REAL,
  downtime_hours REAL,
  shift TEXT, -- 'Day', 'Night'
  status TEXT -- 'Planned', 'In Progress', 'Completed', 'Cancelled'
);

TABLE supplier_performance (
  record_id INTEGER PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(supplier_id),
  month TEXT,
  on_time_delivery_pct REAL,
  quality_score REAL,
  fill_rate_pct REAL,
  avg_lead_time_actual REAL,
  cost_variance_pct REAL,
  incidents_count INTEGER
);

RULES:
- Return ONLY a valid SQLite SELECT query. No markdown, no explanation, no backticks.
- Use proper JOINs when accessing multiple tables.
- Use meaningful column aliases with AS.
- Round decimal values appropriately using ROUND().
- Use strftime() for date operations in SQLite.
- Limit large result sets to reasonable sizes.
- This is a supply chain analytics database for an energy drink company.`;
}
