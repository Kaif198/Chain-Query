// Pre-built supply chain query library

export const QUERY_CATEGORIES = [
  {
    id: 'demand',
    name: 'Demand Planning',
    queries: [
      {
        id: 'demand-vs-forecast',
        name: 'Monthly Demand vs Forecast Accuracy',
        description: 'Compare forecast_qty vs actual_qty by month with accuracy percentage',
        chartType: 'line',
        sql: `SELECT 
  df.forecast_date AS month,
  SUM(df.forecast_qty) AS total_forecast,
  SUM(df.actual_qty) AS total_actual,
  ROUND(AVG(df.forecast_accuracy_pct), 1) AS avg_accuracy_pct
FROM demand_forecast df
WHERE df.actual_qty IS NOT NULL
GROUP BY df.forecast_date
ORDER BY df.forecast_date`
      },
      {
        id: 'demand-by-category',
        name: 'Demand Trend by Product Category',
        description: 'Aggregate demand over time grouped by product category',
        chartType: 'area',
        sql: `SELECT 
  df.forecast_date AS month,
  p.category,
  SUM(df.forecast_qty) AS total_demand
FROM demand_forecast df
JOIN products p ON df.product_id = p.product_id
WHERE df.actual_qty IS NOT NULL
GROUP BY df.forecast_date, p.category
ORDER BY df.forecast_date, p.category`
      },
      {
        id: 'seasonal-pattern',
        name: 'Seasonal Demand Pattern Analysis',
        description: 'Show demand patterns across months to identify seasonality',
        chartType: 'line',
        sql: `SELECT 
  CAST(strftime('%m', df.forecast_date) AS INTEGER) AS month_num,
  CASE CAST(strftime('%m', df.forecast_date) AS INTEGER)
    WHEN 1 THEN 'Jan' WHEN 2 THEN 'Feb' WHEN 3 THEN 'Mar'
    WHEN 4 THEN 'Apr' WHEN 5 THEN 'May' WHEN 6 THEN 'Jun'
    WHEN 7 THEN 'Jul' WHEN 8 THEN 'Aug' WHEN 9 THEN 'Sep'
    WHEN 10 THEN 'Oct' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dec'
  END AS month_name,
  SUM(df.forecast_qty) AS total_demand,
  COUNT(DISTINCT df.product_id) AS products_tracked
FROM demand_forecast df
WHERE df.actual_qty IS NOT NULL
GROUP BY month_num
ORDER BY month_num`
      },
      {
        id: 'top-products-demand',
        name: 'Top 10 Products by Demand Volume',
        description: 'Rank products by total demand volume',
        chartType: 'bar',
        sql: `SELECT 
  p.product_name,
  p.category,
  SUM(df.actual_qty) AS total_demand,
  ROUND(AVG(df.forecast_accuracy_pct), 1) AS avg_accuracy
FROM demand_forecast df
JOIN products p ON df.product_id = p.product_id
WHERE df.actual_qty IS NOT NULL
GROUP BY p.product_id, p.product_name, p.category
ORDER BY total_demand DESC
LIMIT 10`
      },
    ]
  },
  {
    id: 'inventory',
    name: 'Inventory Optimization',
    queries: [
      {
        id: 'inventory-health',
        name: 'Current Inventory Health Dashboard',
        description: 'Show on_hand, days_of_supply, stockout_flag by product',
        chartType: 'bar',
        sql: `SELECT 
  p.product_name,
  p.category,
  SUM(inv.on_hand_qty) AS total_on_hand,
  ROUND(AVG(inv.days_of_supply), 1) AS avg_days_of_supply,
  SUM(inv.stockout_flag) AS stockout_locations,
  p.safety_stock_units
FROM inventory_snapshots inv
JOIN products p ON inv.product_id = p.product_id
WHERE inv.snapshot_date = (SELECT MAX(snapshot_date) FROM inventory_snapshots)
GROUP BY p.product_id, p.product_name, p.category, p.safety_stock_units
ORDER BY avg_days_of_supply ASC`
      },
      {
        id: 'stockout-risk',
        name: 'Stockout Risk Analysis',
        description: 'Products where available qty is below safety stock threshold',
        chartType: 'bar',
        sql: `SELECT 
  p.product_name,
  w.warehouse_name,
  inv.available_qty,
  p.safety_stock_units AS safety_stock,
  inv.days_of_supply,
  CASE 
    WHEN inv.available_qty < p.safety_stock_units * 0.5 THEN 'Critical'
    WHEN inv.available_qty < p.safety_stock_units THEN 'At Risk'
    ELSE 'Healthy'
  END AS risk_level
FROM inventory_snapshots inv
JOIN products p ON inv.product_id = p.product_id
JOIN warehouses w ON inv.warehouse_id = w.warehouse_id
WHERE inv.snapshot_date = (SELECT MAX(snapshot_date) FROM inventory_snapshots)
  AND inv.available_qty < p.safety_stock_units
ORDER BY inv.available_qty * 1.0 / p.safety_stock_units ASC`
      },
      {
        id: 'inventory-turnover',
        name: 'Inventory Turnover by Warehouse',
        description: 'Calculate turnover ratio per warehouse',
        chartType: 'bar',
        sql: `SELECT 
  w.warehouse_name,
  w.city,
  ROUND(SUM(df.actual_qty) * 1.0 / NULLIF(AVG(inv.on_hand_qty), 0), 2) AS turnover_ratio,
  ROUND(AVG(inv.on_hand_qty)) AS avg_inventory,
  SUM(df.actual_qty) AS total_demand
FROM inventory_snapshots inv
JOIN warehouses w ON inv.warehouse_id = w.warehouse_id
LEFT JOIN demand_forecast df ON inv.product_id = df.product_id 
  AND inv.warehouse_id = df.warehouse_id
  AND inv.snapshot_date = df.forecast_date
  AND df.actual_qty IS NOT NULL
GROUP BY w.warehouse_id, w.warehouse_name, w.city
ORDER BY turnover_ratio DESC`
      },
      {
        id: 'dead-stock',
        name: 'Dead Stock Identification',
        description: 'Products with more than 90 days of supply',
        chartType: 'table',
        sql: `SELECT 
  p.product_name,
  p.sku,
  w.warehouse_name,
  inv.on_hand_qty,
  inv.days_of_supply,
  ROUND(inv.on_hand_qty * p.unit_cost, 2) AS tied_up_capital,
  inv.snapshot_date AS as_of
FROM inventory_snapshots inv
JOIN products p ON inv.product_id = p.product_id
JOIN warehouses w ON inv.warehouse_id = w.warehouse_id
WHERE inv.snapshot_date = (SELECT MAX(snapshot_date) FROM inventory_snapshots)
  AND inv.days_of_supply > 90
ORDER BY tied_up_capital DESC`
      },
      {
        id: 'warehouse-utilization',
        name: 'Warehouse Utilization Overview',
        description: 'Current utilization percentage across all warehouses',
        chartType: 'bar',
        sql: `SELECT 
  w.warehouse_name,
  w.city,
  w.region,
  w.max_capacity_units,
  w.current_utilization_pct,
  ROUND(w.max_capacity_units * w.current_utilization_pct / 100) AS units_used,
  ROUND(w.max_capacity_units * (1 - w.current_utilization_pct / 100)) AS units_available,
  w.operating_cost_per_unit
FROM warehouses w
ORDER BY w.current_utilization_pct DESC`
      },
    ]
  },
  {
    id: 'supplier',
    name: 'Supplier Performance',
    queries: [
      {
        id: 'supplier-scorecard',
        name: 'Supplier Scorecard',
        description: 'Aggregate on_time_delivery, quality, and fill_rate by supplier',
        chartType: 'bar',
        sql: `SELECT 
  s.supplier_name,
  s.country,
  ROUND(AVG(sp.on_time_delivery_pct), 1) AS avg_otd,
  ROUND(AVG(sp.quality_score), 1) AS avg_quality,
  ROUND(AVG(sp.fill_rate_pct), 1) AS avg_fill_rate,
  ROUND((AVG(sp.on_time_delivery_pct) + AVG(sp.quality_score) + AVG(sp.fill_rate_pct)) / 3, 1) AS composite_score,
  SUM(sp.incidents_count) AS total_incidents
FROM supplier_performance sp
JOIN suppliers s ON sp.supplier_id = s.supplier_id
GROUP BY s.supplier_id, s.supplier_name, s.country
ORDER BY composite_score DESC`
      },
      {
        id: 'supplier-lead-time',
        name: 'Supplier Lead Time Reliability',
        description: 'Compare promised vs actual lead times by supplier',
        chartType: 'bar',
        sql: `SELECT 
  s.supplier_name,
  s.avg_lead_time_days AS promised_lead_time,
  ROUND(AVG(sp.avg_lead_time_actual), 1) AS actual_avg_lead_time,
  ROUND(AVG(sp.avg_lead_time_actual) - s.avg_lead_time_days, 1) AS variance_days,
  ROUND(AVG(sp.on_time_delivery_pct), 1) AS on_time_pct
FROM supplier_performance sp
JOIN suppliers s ON sp.supplier_id = s.supplier_id
GROUP BY s.supplier_id, s.supplier_name, s.avg_lead_time_days
ORDER BY variance_days DESC`
      },
      {
        id: 'supplier-cost-trend',
        name: 'Supplier Cost Variance Trend',
        description: 'Track cost variance percentage over time by supplier',
        chartType: 'line',
        sql: `SELECT 
  sp.month,
  s.supplier_name,
  sp.cost_variance_pct
FROM supplier_performance sp
JOIN suppliers s ON sp.supplier_id = s.supplier_id
WHERE s.supplier_id IN (1, 2, 4, 7)
ORDER BY sp.month, s.supplier_name`
      },
      {
        id: 'at-risk-suppliers',
        name: 'At-Risk Suppliers',
        description: 'Suppliers with declining performance trends',
        chartType: 'table',
        sql: `WITH recent AS (
  SELECT supplier_id,
    AVG(on_time_delivery_pct) AS recent_otd,
    AVG(quality_score) AS recent_quality,
    SUM(incidents_count) AS recent_incidents
  FROM supplier_performance 
  WHERE month >= '2025-04-01'
  GROUP BY supplier_id
),
earlier AS (
  SELECT supplier_id,
    AVG(on_time_delivery_pct) AS earlier_otd,
    AVG(quality_score) AS earlier_quality,
    SUM(incidents_count) AS earlier_incidents
  FROM supplier_performance 
  WHERE month < '2025-04-01'
  GROUP BY supplier_id
)
SELECT 
  s.supplier_name,
  s.country,
  ROUND(r.recent_otd, 1) AS recent_otd_pct,
  ROUND(e.earlier_otd, 1) AS historical_otd_pct,
  ROUND(r.recent_otd - e.earlier_otd, 1) AS otd_change,
  ROUND(r.recent_quality, 1) AS recent_quality,
  r.recent_incidents,
  CASE 
    WHEN r.recent_otd < e.earlier_otd - 3 THEN 'Declining'
    WHEN r.recent_incidents > e.earlier_incidents THEN 'Watch'
    ELSE 'Stable'
  END AS risk_status
FROM recent r
JOIN earlier e ON r.supplier_id = e.supplier_id
JOIN suppliers s ON r.supplier_id = s.supplier_id
ORDER BY otd_change ASC`
      },
    ]
  },
  {
    id: 'production',
    name: 'Production & S&OP',
    queries: [
      {
        id: 'production-vs-actual',
        name: 'Production Plan vs Actual Output',
        description: 'Compare planned vs actual production quantities',
        chartType: 'composed',
        sql: `SELECT 
  pp.planned_date AS month,
  SUM(pp.planned_qty) AS total_planned,
  SUM(pp.actual_qty) AS total_actual,
  ROUND(AVG(pp.line_efficiency_pct), 1) AS avg_efficiency
FROM production_plans pp
WHERE pp.status IN ('Completed', 'In Progress')
GROUP BY pp.planned_date
ORDER BY pp.planned_date`
      },
      {
        id: 'line-efficiency',
        name: 'Line Efficiency by Warehouse',
        description: 'Average efficiency across production lines per warehouse',
        chartType: 'bar',
        sql: `SELECT 
  w.warehouse_name,
  w.city,
  ROUND(AVG(pp.line_efficiency_pct), 1) AS avg_efficiency,
  ROUND(MIN(pp.line_efficiency_pct), 1) AS min_efficiency,
  ROUND(MAX(pp.line_efficiency_pct), 1) AS max_efficiency,
  COUNT(*) AS production_runs
FROM production_plans pp
JOIN warehouses w ON pp.warehouse_id = w.warehouse_id
WHERE pp.status = 'Completed'
GROUP BY w.warehouse_id, w.warehouse_name, w.city
ORDER BY avg_efficiency DESC`
      },
      {
        id: 'downtime-by-shift',
        name: 'Downtime Analysis by Shift',
        description: 'Total and average downtime hours by shift type',
        chartType: 'bar',
        sql: `SELECT 
  pp.shift,
  ROUND(SUM(pp.downtime_hours), 1) AS total_downtime_hours,
  ROUND(AVG(pp.downtime_hours), 1) AS avg_downtime_hours,
  ROUND(AVG(pp.line_efficiency_pct), 1) AS avg_efficiency,
  COUNT(*) AS total_runs
FROM production_plans pp
WHERE pp.status = 'Completed' AND pp.downtime_hours IS NOT NULL
GROUP BY pp.shift
ORDER BY total_downtime_hours DESC`
      },
    ]
  },
  {
    id: 'procurement',
    name: 'Procurement',
    queries: [
      {
        id: 'open-pos',
        name: 'Open Purchase Orders Summary',
        description: 'All POs with status Open or In Transit',
        chartType: 'table',
        sql: `SELECT 
  po.po_id,
  s.supplier_name,
  p.product_name,
  w.warehouse_name,
  po.order_date,
  po.expected_delivery_date,
  po.qty_ordered,
  po.total_value,
  po.status
FROM purchase_orders po
JOIN suppliers s ON po.supplier_id = s.supplier_id
JOIN products p ON po.product_id = p.product_id
JOIN warehouses w ON po.warehouse_id = w.warehouse_id
WHERE po.status IN ('Open', 'In Transit')
ORDER BY po.expected_delivery_date ASC`
      },
      {
        id: 'delivery-performance',
        name: 'Delivery Performance by Supplier',
        description: 'On-time vs delayed deliveries per supplier',
        chartType: 'bar',
        sql: `SELECT 
  s.supplier_name,
  SUM(CASE WHEN po.status = 'Delivered' THEN 1 ELSE 0 END) AS on_time_deliveries,
  SUM(CASE WHEN po.status = 'Delayed' THEN 1 ELSE 0 END) AS delayed_deliveries,
  SUM(CASE WHEN po.status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled,
  COUNT(*) AS total_orders,
  ROUND(SUM(CASE WHEN po.status = 'Delivered' THEN 1 ELSE 0 END) * 100.0 / 
    NULLIF(SUM(CASE WHEN po.status IN ('Delivered', 'Delayed') THEN 1 ELSE 0 END), 0), 1) AS on_time_pct
FROM purchase_orders po
JOIN suppliers s ON po.supplier_id = s.supplier_id
GROUP BY s.supplier_id, s.supplier_name
ORDER BY on_time_pct DESC`
      },
      {
        id: 'spend-by-category',
        name: 'Spend Analysis by Category',
        description: 'Total procurement spend grouped by product category',
        chartType: 'pie',
        sql: `SELECT 
  p.category,
  ROUND(SUM(po.total_value), 2) AS total_spend,
  COUNT(*) AS order_count,
  ROUND(AVG(po.total_value), 2) AS avg_order_value
FROM purchase_orders po
JOIN products p ON po.product_id = p.product_id
WHERE po.status != 'Cancelled'
GROUP BY p.category
ORDER BY total_spend DESC`
      },
      {
        id: 'po-lead-time',
        name: 'PO Lead Time Analysis',
        description: 'Average days from order to delivery by supplier',
        chartType: 'bar',
        sql: `SELECT 
  s.supplier_name,
  ROUND(AVG(julianday(po.actual_delivery_date) - julianday(po.order_date)), 1) AS avg_total_lead_days,
  ROUND(AVG(julianday(po.expected_delivery_date) - julianday(po.order_date)), 1) AS avg_expected_lead_days,
  ROUND(AVG(julianday(po.actual_delivery_date) - julianday(po.expected_delivery_date)), 1) AS avg_delay_days,
  COUNT(*) AS delivered_orders
FROM purchase_orders po
JOIN suppliers s ON po.supplier_id = s.supplier_id
WHERE po.actual_delivery_date IS NOT NULL AND po.status IN ('Delivered', 'Delayed')
GROUP BY s.supplier_id, s.supplier_name
ORDER BY avg_total_lead_days ASC`
      },
    ]
  },
];

export function getQueryById(id) {
  for (const cat of QUERY_CATEGORIES) {
    const query = cat.queries.find(q => q.id === id);
    if (query) return { ...query, category: cat.name };
  }
  return null;
}

export function getAllQueries() {
  return QUERY_CATEGORIES.flatMap(cat => 
    cat.queries.map(q => ({ ...q, category: cat.name, categoryId: cat.id }))
  );
}
