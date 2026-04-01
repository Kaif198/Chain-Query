// Database schema creation and seeding with realistic supply chain data

export function seedDatabase(db) {
  // ============================================
  // CREATE TABLES
  // ============================================
  db.run(`
    CREATE TABLE products (
      product_id INTEGER PRIMARY KEY,
      product_name TEXT NOT NULL,
      category TEXT NOT NULL,
      sku TEXT NOT NULL,
      unit_cost REAL NOT NULL,
      selling_price REAL NOT NULL,
      lead_time_days INTEGER NOT NULL,
      safety_stock_units INTEGER NOT NULL,
      reorder_point INTEGER NOT NULL,
      moq INTEGER NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE suppliers (
      supplier_id INTEGER PRIMARY KEY,
      supplier_name TEXT NOT NULL,
      country TEXT NOT NULL,
      region TEXT NOT NULL,
      reliability_score REAL NOT NULL,
      avg_lead_time_days INTEGER NOT NULL,
      payment_terms_days INTEGER NOT NULL,
      certified INTEGER NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE warehouses (
      warehouse_id INTEGER PRIMARY KEY,
      warehouse_name TEXT NOT NULL,
      city TEXT NOT NULL,
      country TEXT NOT NULL,
      region TEXT NOT NULL,
      max_capacity_units INTEGER NOT NULL,
      current_utilization_pct REAL NOT NULL,
      operating_cost_per_unit REAL NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE demand_forecast (
      forecast_id INTEGER PRIMARY KEY,
      product_id INTEGER NOT NULL,
      warehouse_id INTEGER NOT NULL,
      forecast_date TEXT NOT NULL,
      forecast_qty INTEGER NOT NULL,
      actual_qty INTEGER,
      forecast_accuracy_pct REAL,
      FOREIGN KEY (product_id) REFERENCES products(product_id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
    );
  `);

  db.run(`
    CREATE TABLE inventory_snapshots (
      snapshot_id INTEGER PRIMARY KEY,
      product_id INTEGER NOT NULL,
      warehouse_id INTEGER NOT NULL,
      snapshot_date TEXT NOT NULL,
      on_hand_qty INTEGER NOT NULL,
      in_transit_qty INTEGER NOT NULL,
      allocated_qty INTEGER NOT NULL,
      available_qty INTEGER NOT NULL,
      days_of_supply REAL NOT NULL,
      stockout_flag INTEGER NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(product_id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
    );
  `);

  db.run(`
    CREATE TABLE purchase_orders (
      po_id INTEGER PRIMARY KEY,
      supplier_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      warehouse_id INTEGER NOT NULL,
      order_date TEXT NOT NULL,
      expected_delivery_date TEXT NOT NULL,
      actual_delivery_date TEXT,
      qty_ordered INTEGER NOT NULL,
      qty_received INTEGER,
      unit_price REAL NOT NULL,
      total_value REAL NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
      FOREIGN KEY (product_id) REFERENCES products(product_id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
    );
  `);

  db.run(`
    CREATE TABLE production_plans (
      plan_id INTEGER PRIMARY KEY,
      product_id INTEGER NOT NULL,
      warehouse_id INTEGER NOT NULL,
      planned_date TEXT NOT NULL,
      planned_qty INTEGER NOT NULL,
      actual_qty INTEGER,
      line_efficiency_pct REAL,
      downtime_hours REAL,
      shift TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(product_id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
    );
  `);

  db.run(`
    CREATE TABLE supplier_performance (
      record_id INTEGER PRIMARY KEY,
      supplier_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      on_time_delivery_pct REAL NOT NULL,
      quality_score REAL NOT NULL,
      fill_rate_pct REAL NOT NULL,
      avg_lead_time_actual REAL NOT NULL,
      cost_variance_pct REAL NOT NULL,
      incidents_count INTEGER NOT NULL,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
    );
  `);

  // ============================================
  // SEED DATA
  // ============================================

  // Products (15 rows)
  const products = [
    [1, 'Aluminum Can 330ml', 'Packaging', 'PKG-AC330', 0.08, 0.15, 14, 5000, 8000, 10000],
    [2, 'Sugar Syrup Concentrate', 'Raw Materials', 'RAW-SSC01', 2.50, 4.00, 21, 200, 350, 500],
    [3, 'Carbonation CO2 Cylinder', 'Raw Materials', 'RAW-CO2CY', 45.00, 65.00, 7, 50, 80, 20],
    [4, 'Shrink Wrap Film 500m', 'Packaging', 'PKG-SWF50', 12.00, 18.50, 10, 100, 180, 50],
    [5, 'Energy Drink 250ml Classic', 'Finished Goods', 'FIN-ED25C', 0.45, 1.20, 3, 3000, 5000, 2000],
    [6, 'Energy Drink 500ml Tropical', 'Finished Goods', 'FIN-ED50T', 0.62, 1.80, 3, 2000, 3500, 1500],
    [7, 'PET Bottle Preform', 'Components', 'CMP-PBP01', 0.05, 0.10, 18, 8000, 12000, 15000],
    [8, 'Cap Closure 28mm', 'Components', 'CMP-CC28M', 0.02, 0.04, 12, 10000, 15000, 20000],
    [9, 'Corrugated Shipper Box 24pk', 'Packaging', 'PKG-CSB24', 0.85, 1.40, 8, 1500, 2500, 3000],
    [10, 'Flavoring Extract Batch', 'Raw Materials', 'RAW-FEB01', 150.00, 220.00, 28, 30, 50, 10],
    [11, 'Label Roll 10000ct', 'Packaging', 'PKG-LR10K', 25.00, 38.00, 14, 80, 130, 40],
    [12, 'Pallet Wrap 20mu', 'Packaging', 'PKG-PW20M', 8.50, 13.00, 7, 200, 320, 100],
    [13, 'Glass Bottle 250ml', 'Packaging', 'PKG-GB250', 0.18, 0.32, 21, 4000, 6500, 5000],
    [14, 'Crown Cap 26mm', 'Components', 'CMP-CC26M', 0.01, 0.03, 10, 15000, 22000, 25000],
    [15, 'Citric Acid 25kg Bag', 'Raw Materials', 'RAW-CA25K', 35.00, 52.00, 14, 40, 65, 20],
  ];
  const prodStmt = db.prepare('INSERT INTO products VALUES (?,?,?,?,?,?,?,?,?,?)');
  products.forEach(p => prodStmt.run(p));
  prodStmt.free();

  // Suppliers (8 rows)
  const suppliers = [
    [1, 'AluPack GmbH', 'Germany', 'EMEA', 92, 12, 30, 1],
    [2, 'SweetSource BV', 'Netherlands', 'EMEA', 88, 18, 45, 1],
    [3, 'CarbonTech Ltd', 'United Kingdom', 'EMEA', 95, 5, 30, 1],
    [4, 'FlexFilm SpA', 'Italy', 'EMEA', 78, 15, 60, 0],
    [5, 'PackRight Inc', 'United States', 'Americas', 85, 20, 30, 1],
    [6, 'ChemSupply AG', 'Switzerland', 'EMEA', 91, 10, 45, 1],
    [7, 'GlassWorks CZ', 'Czech Republic', 'EMEA', 82, 22, 60, 0],
    [8, 'LogiCrate Oy', 'Finland', 'EMEA', 87, 14, 30, 1],
  ];
  const suppStmt = db.prepare('INSERT INTO suppliers VALUES (?,?,?,?,?,?,?,?)');
  suppliers.forEach(s => suppStmt.run(s));
  suppStmt.free();

  // Warehouses (6 rows)
  const warehouses = [
    [1, 'Amsterdam Central DC', 'Amsterdam', 'Netherlands', 'EMEA', 500000, 72.5, 0.12],
    [2, 'Frankfurt Hub', 'Frankfurt', 'Germany', 'EMEA', 400000, 81.3, 0.14],
    [3, 'Singapore APAC DC', 'Singapore', 'Singapore', 'APAC', 350000, 65.8, 0.18],
    [4, 'Chicago Midwest DC', 'Chicago', 'United States', 'Americas', 600000, 58.2, 0.11],
    [5, 'Sao Paulo LATAM Hub', 'Sao Paulo', 'Brazil', 'Americas', 250000, 88.1, 0.16],
    [6, 'Dubai MEA Gateway', 'Dubai', 'UAE', 'EMEA', 300000, 45.6, 0.20],
  ];
  const whStmt = db.prepare('INSERT INTO warehouses VALUES (?,?,?,?,?,?,?,?)');
  warehouses.forEach(w => whStmt.run(w));
  whStmt.free();

  // ============================================
  // DEMAND FORECAST (procedurally generated)
  // ============================================
  const forecastStmt = db.prepare('INSERT INTO demand_forecast VALUES (?,?,?,?,?,?,?)');
  let forecastId = 1;
  const today = new Date(2025, 9, 1); // Oct 2025 as "current"
  
  // Seasonality multipliers by month (0=Jan, 11=Dec)
  const seasonality = [0.75, 0.80, 0.90, 0.95, 1.00, 1.15, 1.25, 1.20, 1.05, 0.95, 1.10, 1.30];
  
  // Product base demands and trends
  const productDemand = {
    1: { base: 15000, trend: 1.02 },  // Aluminum Can — growing
    2: { base: 400, trend: 1.01 },
    3: { base: 80, trend: 1.00 },
    4: { base: 200, trend: 0.98 },  // Shrink Wrap — declining
    5: { base: 8000, trend: 1.05 },  // Energy Drink Classic — strong growth
    6: { base: 5000, trend: 1.08 },  // Energy Drink Tropical — strong growth
    7: { base: 12000, trend: 1.02 },
    8: { base: 18000, trend: 1.01 },
    9: { base: 3000, trend: 1.00 },
    10: { base: 50, trend: 1.00 },
    11: { base: 120, trend: 0.99 },
    12: { base: 350, trend: 1.01 },
    13: { base: 6000, trend: 0.97 },  // Glass Bottle — declining
    14: { base: 20000, trend: 1.01 },
    15: { base: 60, trend: 1.00 },
  };

  // Warehouse demand distribution
  const whDist = { 1: 0.25, 2: 0.22, 3: 0.18, 4: 0.15, 5: 0.12, 6: 0.08 };

  for (let pid = 1; pid <= 15; pid++) {
    for (let whId = 1; whId <= 6; whId++) {
      // Only generate for a subset of warehouse-product combos to keep data realistic
      if (Math.random() < 0.4 && whId > 3) continue;
      
      for (let year = 2024; year <= 2025; year++) {
        for (let month = 0; month < 12; month++) {
          const date = new Date(year, month, 1);
          const dateStr = date.toISOString().split('T')[0];
          const monthsSinceStart = (year - 2024) * 12 + month;
          const { base, trend } = productDemand[pid];
          
          const trendFactor = Math.pow(trend, monthsSinceStart / 12);
          const seasonal = seasonality[month];
          const whFactor = whDist[whId];
          const noise = 0.85 + Math.random() * 0.30;
          
          const forecastQty = Math.round(base * trendFactor * seasonal * whFactor * noise);
          
          // Actuals exist for past months (before Oct 2025)
          let actualQty = null;
          let accuracy = null;
          if (date < today) {
            const actualNoise = 0.80 + Math.random() * 0.40;
            actualQty = Math.round(forecastQty * actualNoise);
            accuracy = Math.round(Math.min(100, (1 - Math.abs(forecastQty - actualQty) / forecastQty) * 100) * 10) / 10;
          }
          
          forecastStmt.run([forecastId++, pid, whId, dateStr, forecastQty, actualQty, accuracy]);
        }
      }
    }
  }
  forecastStmt.free();

  // ============================================
  // INVENTORY SNAPSHOTS (procedurally generated)
  // ============================================
  const invStmt = db.prepare('INSERT INTO inventory_snapshots VALUES (?,?,?,?,?,?,?,?,?,?)');
  let snapId = 1;

  for (let pid = 1; pid <= 15; pid++) {
    const product = products.find(p => p[0] === pid);
    const safetyStock = product[7];
    
    for (let whId = 1; whId <= 6; whId++) {
      if (Math.random() < 0.3 && whId > 4) continue;
      
      for (let year = 2024; year <= 2025; year++) {
        for (let month = 0; month < 12; month++) {
          if (year === 2025 && month > 10) continue;
          const date = new Date(year, month, 1);
          const dateStr = date.toISOString().split('T')[0];
          
          const seasonal = seasonality[month];
          const baseDemand = productDemand[pid].base * (whDist[whId] || 0.1);
          
          // Inventory inversely correlates with demand
          const invMultiplier = 2.0 - seasonal * 0.8;
          const noise = 0.7 + Math.random() * 0.6;
          const onHand = Math.round(baseDemand * invMultiplier * noise);
          const inTransit = Math.round(baseDemand * 0.3 * Math.random());
          const allocated = Math.round(onHand * 0.2 * Math.random());
          const available = Math.max(0, onHand - allocated);
          const dos = Math.round((available / Math.max(1, baseDemand * seasonal / 30)) * 10) / 10;
          const stockout = available < safetyStock * 0.3 ? 1 : 0;
          
          invStmt.run([snapId++, pid, whId, dateStr, onHand, inTransit, allocated, available, dos, stockout]);
        }
      }
    }
  }
  invStmt.free();

  // ============================================
  // PURCHASE ORDERS (procedurally generated)
  // ============================================
  const poStmt = db.prepare('INSERT INTO purchase_orders VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  
  // Map products to likely suppliers
  const prodSupplier = {
    1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 5, 7: 1, 8: 8,
    9: 8, 10: 6, 11: 4, 12: 4, 13: 7, 14: 8, 15: 6
  };
  
  for (let poId = 1; poId <= 180; poId++) {
    const pid = ((poId - 1) % 15) + 1;
    const product = products.find(p => p[0] === pid);
    const suppId = prodSupplier[pid];
    const whId = ((poId - 1) % 6) + 1;
    
    const dayOffset = Math.floor(Math.random() * 600);
    const orderDate = new Date(2024, 0, 1 + dayOffset);
    const leadTime = product[6] + Math.floor(Math.random() * 10) - 3;
    const expectedDate = new Date(orderDate.getTime() + leadTime * 86400000);
    
    const isDelayed = Math.random() < 0.15;
    const isCancelled = Math.random() < 0.05;
    const isOpen = orderDate > new Date(2025, 8, 1);
    
    let status, actualDate, qtyReceived;
    const qtyOrdered = product[9] + Math.floor(Math.random() * product[9] * 0.5);
    
    if (isCancelled) {
      status = 'Cancelled';
      actualDate = null;
      qtyReceived = 0;
    } else if (isOpen) {
      status = Math.random() < 0.5 ? 'Open' : 'In Transit';
      actualDate = null;
      qtyReceived = null;
    } else if (isDelayed) {
      const delayDays = Math.floor(Math.random() * 14) + 3;
      actualDate = new Date(expectedDate.getTime() + delayDays * 86400000);
      status = 'Delayed';
      qtyReceived = Math.random() < 0.3 ? Math.round(qtyOrdered * (0.7 + Math.random() * 0.3)) : qtyOrdered;
    } else {
      actualDate = new Date(expectedDate.getTime() + (Math.random() * 4 - 2) * 86400000);
      status = 'Delivered';
      qtyReceived = qtyOrdered;
    }
    
    const unitPrice = product[4] * (0.95 + Math.random() * 0.10);
    const totalValue = Math.round(qtyOrdered * unitPrice * 100) / 100;
    
    poStmt.run([
      poId, suppId, pid, whId,
      orderDate.toISOString().split('T')[0],
      expectedDate.toISOString().split('T')[0],
      actualDate ? actualDate.toISOString().split('T')[0] : null,
      qtyOrdered, qtyReceived,
      Math.round(unitPrice * 100) / 100,
      totalValue, status
    ]);
  }
  poStmt.free();

  // ============================================
  // PRODUCTION PLANS (Finished Goods only: products 5, 6)
  // ============================================
  const ppStmt = db.prepare('INSERT INTO production_plans VALUES (?,?,?,?,?,?,?,?,?,?)');
  let planId = 1;
  
  const finishedGoods = [5, 6];
  
  for (const pid of finishedGoods) {
    for (let whId = 1; whId <= 4; whId++) {
      for (let year = 2024; year <= 2025; year++) {
        for (let month = 0; month < 12; month++) {
          for (let week = 0; week < 4; week++) {
            const date = new Date(year, month, 1 + week * 7);
            const dateStr = date.toISOString().split('T')[0];
            const shift = week % 2 === 0 ? 'Day' : 'Night';
            
            const basePlan = pid === 5 ? 2000 : 1500;
            const seasonal = seasonality[month];
            const planned = Math.round(basePlan * seasonal * (0.9 + Math.random() * 0.2));
            
            const isPast = date < today;
            const isCancelled = Math.random() < 0.05;
            
            let status, actual, efficiency, downtime;
            if (isCancelled) {
              status = 'Cancelled';
              actual = null;
              efficiency = null;
              downtime = null;
            } else if (!isPast) {
              status = 'Planned';
              actual = null;
              efficiency = null;
              downtime = null;
            } else {
              const inProgress = Math.random() < 0.05;
              status = inProgress ? 'In Progress' : 'Completed';
              
              // Day shift more efficient
              if (shift === 'Day') {
                efficiency = 85 + Math.random() * 10;
              } else {
                efficiency = 75 + Math.random() * 13;
              }
              efficiency = Math.round(efficiency * 10) / 10;
              actual = Math.round(planned * efficiency / 100);
              downtime = Math.round((100 - efficiency) / 10 * (1 + Math.random()) * 10) / 10;
            }
            
            ppStmt.run([planId++, pid, whId, dateStr, planned, actual, efficiency, downtime, shift, status]);
          }
        }
      }
    }
  }
  ppStmt.free();

  // ============================================
  // SUPPLIER PERFORMANCE
  // ============================================
  const spStmt = db.prepare('INSERT INTO supplier_performance VALUES (?,?,?,?,?,?,?,?,?)');
  let recordId = 1;
  
  for (let suppId = 1; suppId <= 8; suppId++) {
    const supplier = suppliers.find(s => s[0] === suppId);
    const baseReliability = supplier[4];
    
    // Some suppliers decline over time
    const declining = suppId === 4 || suppId === 7;
    
    for (let year = 2024; year <= 2025; year++) {
      for (let month = 0; month < 12; month++) {
        const date = new Date(year, month, 1);
        if (date >= today) continue;
        const dateStr = date.toISOString().split('T')[0];
        const monthIdx = (year - 2024) * 12 + month;
        
        const declineFactor = declining ? Math.max(0.85, 1 - monthIdx * 0.008) : 1;
        const noise = () => 0.95 + Math.random() * 0.10;
        
        const otd = Math.min(100, Math.round(baseReliability * declineFactor * noise() * 10) / 10);
        const quality = Math.min(100, Math.round((baseReliability * 0.95 + 5) * declineFactor * noise() * 10) / 10);
        const fillRate = Math.min(100, Math.round((baseReliability * 0.98) * declineFactor * noise() * 10) / 10);
        const leadActual = Math.round(supplier[5] * (2 - declineFactor) * (0.9 + Math.random() * 0.2) * 10) / 10;
        const costVar = Math.round((Math.random() * 8 - 2 + (declining ? 3 : 0)) * 10) / 10;
        const incidents = declining ? Math.floor(Math.random() * 4) : Math.floor(Math.random() * 2);
        
        spStmt.run([recordId++, suppId, dateStr, otd, quality, fillRate, leadActual, costVar, incidents]);
      }
    }
  }
  spStmt.free();
}

export const SCHEMA_INFO = [
  {
    name: 'products',
    description: 'Product master data with pricing and supply chain parameters',
    columns: [
      { name: 'product_id', type: 'INTEGER', pk: true },
      { name: 'product_name', type: 'TEXT' },
      { name: 'category', type: 'TEXT', note: 'Raw Materials, Packaging, Finished Goods, Components' },
      { name: 'sku', type: 'TEXT' },
      { name: 'unit_cost', type: 'REAL' },
      { name: 'selling_price', type: 'REAL' },
      { name: 'lead_time_days', type: 'INTEGER' },
      { name: 'safety_stock_units', type: 'INTEGER' },
      { name: 'reorder_point', type: 'INTEGER' },
      { name: 'moq', type: 'INTEGER', note: 'Minimum Order Quantity' },
    ]
  },
  {
    name: 'suppliers',
    description: 'Supplier master data with performance metrics',
    columns: [
      { name: 'supplier_id', type: 'INTEGER', pk: true },
      { name: 'supplier_name', type: 'TEXT' },
      { name: 'country', type: 'TEXT' },
      { name: 'region', type: 'TEXT', note: 'EMEA, APAC, Americas' },
      { name: 'reliability_score', type: 'REAL', note: '0-100' },
      { name: 'avg_lead_time_days', type: 'INTEGER' },
      { name: 'payment_terms_days', type: 'INTEGER' },
      { name: 'certified', type: 'INTEGER', note: 'Boolean (0/1)' },
    ]
  },
  {
    name: 'warehouses',
    description: 'Warehouse locations and capacity information',
    columns: [
      { name: 'warehouse_id', type: 'INTEGER', pk: true },
      { name: 'warehouse_name', type: 'TEXT' },
      { name: 'city', type: 'TEXT' },
      { name: 'country', type: 'TEXT' },
      { name: 'region', type: 'TEXT' },
      { name: 'max_capacity_units', type: 'INTEGER' },
      { name: 'current_utilization_pct', type: 'REAL' },
      { name: 'operating_cost_per_unit', type: 'REAL' },
    ]
  },
  {
    name: 'demand_forecast',
    description: 'Monthly demand forecasts with actuals where available',
    columns: [
      { name: 'forecast_id', type: 'INTEGER', pk: true },
      { name: 'product_id', type: 'INTEGER', fk: 'products.product_id' },
      { name: 'warehouse_id', type: 'INTEGER', fk: 'warehouses.warehouse_id' },
      { name: 'forecast_date', type: 'TEXT', note: 'Monthly, YYYY-MM-DD' },
      { name: 'forecast_qty', type: 'INTEGER' },
      { name: 'actual_qty', type: 'INTEGER', note: 'NULL for future months' },
      { name: 'forecast_accuracy_pct', type: 'REAL' },
    ]
  },
  {
    name: 'inventory_snapshots',
    description: 'Monthly inventory position snapshots',
    columns: [
      { name: 'snapshot_id', type: 'INTEGER', pk: true },
      { name: 'product_id', type: 'INTEGER', fk: 'products.product_id' },
      { name: 'warehouse_id', type: 'INTEGER', fk: 'warehouses.warehouse_id' },
      { name: 'snapshot_date', type: 'TEXT' },
      { name: 'on_hand_qty', type: 'INTEGER' },
      { name: 'in_transit_qty', type: 'INTEGER' },
      { name: 'allocated_qty', type: 'INTEGER' },
      { name: 'available_qty', type: 'INTEGER' },
      { name: 'days_of_supply', type: 'REAL' },
      { name: 'stockout_flag', type: 'INTEGER', note: 'Boolean (0/1)' },
    ]
  },
  {
    name: 'purchase_orders',
    description: 'Purchase order tracking with delivery status',
    columns: [
      { name: 'po_id', type: 'INTEGER', pk: true },
      { name: 'supplier_id', type: 'INTEGER', fk: 'suppliers.supplier_id' },
      { name: 'product_id', type: 'INTEGER', fk: 'products.product_id' },
      { name: 'warehouse_id', type: 'INTEGER', fk: 'warehouses.warehouse_id' },
      { name: 'order_date', type: 'TEXT' },
      { name: 'expected_delivery_date', type: 'TEXT' },
      { name: 'actual_delivery_date', type: 'TEXT', note: 'NULL for open POs' },
      { name: 'qty_ordered', type: 'INTEGER' },
      { name: 'qty_received', type: 'INTEGER' },
      { name: 'unit_price', type: 'REAL' },
      { name: 'total_value', type: 'REAL' },
      { name: 'status', type: 'TEXT', note: 'Open, In Transit, Delivered, Delayed, Cancelled' },
    ]
  },
  {
    name: 'production_plans',
    description: 'Production planning and execution tracking',
    columns: [
      { name: 'plan_id', type: 'INTEGER', pk: true },
      { name: 'product_id', type: 'INTEGER', fk: 'products.product_id' },
      { name: 'warehouse_id', type: 'INTEGER', fk: 'warehouses.warehouse_id' },
      { name: 'planned_date', type: 'TEXT' },
      { name: 'planned_qty', type: 'INTEGER' },
      { name: 'actual_qty', type: 'INTEGER' },
      { name: 'line_efficiency_pct', type: 'REAL' },
      { name: 'downtime_hours', type: 'REAL' },
      { name: 'shift', type: 'TEXT', note: 'Day, Night' },
      { name: 'status', type: 'TEXT', note: 'Planned, In Progress, Completed, Cancelled' },
    ]
  },
  {
    name: 'supplier_performance',
    description: 'Monthly supplier performance tracking',
    columns: [
      { name: 'record_id', type: 'INTEGER', pk: true },
      { name: 'supplier_id', type: 'INTEGER', fk: 'suppliers.supplier_id' },
      { name: 'month', type: 'TEXT' },
      { name: 'on_time_delivery_pct', type: 'REAL' },
      { name: 'quality_score', type: 'REAL' },
      { name: 'fill_rate_pct', type: 'REAL' },
      { name: 'avg_lead_time_actual', type: 'REAL' },
      { name: 'cost_variance_pct', type: 'REAL' },
      { name: 'incidents_count', type: 'INTEGER' },
    ]
  },
];
