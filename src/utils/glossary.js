/**
 * Supply Chain Terms Glossary
 * Used to power intelligent contextual tooltips across the application elements.
 */

export const GLOSSARY = [
  // Demand Planning
  {
    term: "MAPE",
    definition: "Mean Absolute Percentage Error — measures forecast accuracy as a percentage deviation from actual demand.",
    whyItMatters: "Lower MAPE means more reliable forecasts, which directly reduces safety stock requirements and stockout risk.",
    benchmark: "Below 10% is excellent. 10-20% is acceptable. Above 20% needs review."
  },
  {
    term: "MAE",
    definition: "Mean Absolute Error — measures the average magnitude of errors in a set of forecasts, without considering their direction.",
    whyItMatters: "Provides a straightforward metric (in actual units) to evaluate the financial cost of an inaccurate forecast.",
    benchmark: "Lower is better; target depends entirely on average product volume."
  },
  {
    term: "RMSE",
    definition: "Root Mean Square Error — a measure of the differences between sample and population values predicted by a model.",
    whyItMatters: "RMSE penalizes large errors more heavily than MAE, making it useful when significant deviations are particularly costly.",
    benchmark: "Lower is better; benchmark is relative to average volume."
  },
  {
    term: "Forecast Bias",
    definition: "A tendency for a forecast to be consistently higher or lower than actual demand.",
    whyItMatters: "Consistent over-forecasting balloons inventory holding costs, while under-forecasting drives systemic customer service failures.",
    benchmark: "A perfect bias is zero. Acceptable limits are ±5% depending on total volume."
  },
  {
    term: "Tracking Signal",
    definition: "A measure that indicates whether the forecast error is randomly distributed over time or has a systematic bias.",
    whyItMatters: "Acts as an early warning mechanism. When the signal trips, planners know a structural change has occurred and intervention is needed.",
    benchmark: "Usually acceptable between -4 and +4."
  },
  {
    term: "Seasonal Index",
    definition: "A measure of how a particular season compares with average demand.",
    whyItMatters: "Critical for differentiating between a structural change in baseline demand versus an expected seasonal spike.",
    benchmark: "An index of 1.0 means average demand; 1.25 means 25% above average."
  },
  {
    term: "Demand Sensing",
    definition: "The translation of downstream data (POS, weather, macro events) into short-term probabilistic demand forecasts.",
    whyItMatters: "Enables supply chains to react within days or hours rather than waiting for next month's S&OP cycle.",
    benchmark: "Typically improves short-term (1-4 week) forecast accuracy by 15-30%."
  },
  {
    term: "Consensus Forecast",
    definition: "A single, agreed-upon operational plan merging statistical forecasts with sales, marketing, and executive insights.",
    whyItMatters: "Aligns all business functions to a 'one number' plan to prevent misaligned inventory positioning and budget shortfalls.",
    benchmark: "Should be the formal output of every monthly S&OP cycle."
  },

  // Inventory
  {
    term: "Days of Supply",
    definition: "The number of days current inventory would last at the current or forecasted rate of demand.",
    whyItMatters: "A healthy range depends on the product category — fast-moving finished goods typically target 14-30 days, while raw materials may target 30-60 days.",
    benchmark: "14-30 days for finished goods; 30-60 days for raw materials."
  },
  {
    term: "Safety Stock",
    definition: "Extra inventory held to mitigate risk of stockouts caused by uncertainties in supply and demand.",
    whyItMatters: "Acts as an insurance policy. The correct level optimizes the trade-off between customer service and carrying cost.",
    benchmark: "Highly variable depending on standard deviations of lead time and demand."
  },
  {
    term: "Reorder Point",
    definition: "The inventory level that triggers an action to replenish that particular inventory stock.",
    whyItMatters: "Ensures material will arrive before the on-hand inventory drops to zero or below safety stock limits.",
    benchmark: "Calculated as (Lead Time Demand) + Safety Stock."
  },
  {
    term: "MOQ",
    definition: "Minimum Order Quantity — the lowest quantity of a certain product that a supplier is willing to sell.",
    whyItMatters: "High MOQs force companies into higher average inventory levels, tying up working capital and increasing obsolescence risk.",
    benchmark: "Specific to contracts, but lower is generally better for working capital."
  },
  {
    term: "EOQ",
    definition: "Economic Order Quantity — the ideal order quantity a company should purchase to minimize inventory costs.",
    whyItMatters: "Mathematically balances the cost of holding inventory against the fixed costs of placing an order.",
    benchmark: "Calculated based on annual demand, ordering cost, and carrying cost."
  },
  {
    term: "ABC Classification",
    definition: "Categorizes inventory purely by volume or financial value (A=High, B=Medium, C=Low).",
    whyItMatters: "Ensures procurement effort and working capital are focused disproportionately on the items that drive the majority of value.",
    benchmark: "A items typically make up 10-20% of SKUs but 70-80% of total value."
  },
  {
    term: "XYZ Classification",
    definition: "Categorizes inventory by predictability of demand (X=Stable, Y=Variable, Z=Highly Erratic).",
    whyItMatters: "Dictates the forecasting approach and safety stock policy. An AX item needs a tight forecast; a CZ item might be switched to 'make to order'.",
    benchmark: "X items have CV < 0.2; Y have CV 0.2 - 0.5; Z have CV > 0.5."
  },
  {
    term: "Inventory Turnover",
    definition: "A ratio showing how many times a company has sold and replaced inventory during a given period.",
    whyItMatters: "High turnover implies strong sales and optimal inventory management, freeing up cash flow.",
    benchmark: "Varies by industry: FMCG (10-20x), Automotive (6-8x), Heavy Machinery (2-4x)."
  },
  {
    term: "Fill Rate",
    definition: "The percentage of customer orders fulfilled completely from available stock, without backorders or partial shipments.",
    whyItMatters: "Directly correlates to customer satisfaction and determines if you are meeting contractual service level agreements.",
    benchmark: "Target is typically 95-98% for A-class products."
  },
  {
    term: "Stockout",
    definition: "The complete depletion of inventory for a specific SKU at a specific location.",
    whyItMatters: "Results in direct lost sales, emergency expediting costs, and long-term brand damage.",
    benchmark: "Target is 0 occurrences for critical (A-class) products."
  },
  {
    term: "Dead Stock",
    definition: "Inventory that has not moved over a considerable time and is unlikely to sell at full price.",
    whyItMatters: "Traps working capital, consumes warehouse space, and must eventually be written down, hurting the P&L.",
    benchmark: "< 5% of total inventory valuation."
  },
  {
    term: "Carrying Cost",
    definition: "The total cost of holding inventory, including warehousing, insurance, obsolescence, and opportunity cost of capital.",
    whyItMatters: "Often vastly underestimated by operations teams. Reducing inventory by EUR 1M usually boosts bottom-line profit by EUR 200k annually.",
    benchmark: "Typically estimated at 20-30% of inventory value annually."
  },
  {
    term: "Cycle Stock",
    definition: "The portion of inventory available to meet normal demand during a given period, excluding safety stock.",
    whyItMatters: "Represents the 'working' part of inventory. It is directly controlled by order quantities and frequencies.",
    benchmark: "Equal to half the order quantity (Q/2)."
  },

  // Supplier
  {
    term: "On-Time Delivery",
    definition: "The percentage of supplier shipments delivered by the promised date.",
    whyItMatters: "Poor OTD directly forces buyers to inflate safety stock levels, increasing capital costs to buffer against unreliability.",
    benchmark: "Target > 95% for strategic tier-1 suppliers."
  },
  {
    term: "Lead Time",
    definition: "The total time from the placement of an order until it is received into inventory.",
    whyItMatters: "Long lead times compound forecast error and drastically increase the safety stock required to cover the replenishment window.",
    benchmark: "Shorter is strictly better; targets vary significantly by geography and mode."
  },
  {
    term: "Cost Variance",
    definition: "The difference between actual purchasing costs and the standard or baseline costs established in the budget.",
    whyItMatters: "Unfavorable variances rapidly erode gross margins. Tracking this highlights inflationary pressures early.",
    benchmark: "< 2% variance from standard cost benchmark."
  },
  {
    term: "Quality Score",
    definition: "A composite metric indicating the defect rate of incoming raw materials or finished goods.",
    whyItMatters: "Poor supplier quality causes massive downstream disruptions, including production line stoppages and customer returns.",
    benchmark: "Often tracked using DPMO (Defects Per Million Opportunities)."
  },
  {
    term: "Supplier Risk Score",
    definition: "An aggregated metric capturing financial stability, geographic risk, and past performance reliability.",
    whyItMatters: "Essential for proactive risk management. High risk scores should trigger immediate dual-sourcing strategies.",
    benchmark: "Organization-specific, but generally tracked on a 1-100 scale."
  },
  {
    term: "Dual Sourcing",
    definition: "The practice of using two suppliers for a single critical component or service.",
    whyItMatters: "Provides immediate supply chain resilience. If one supplier faces a catastrophic disruption, production can continue.",
    benchmark: "Mandatory practice for any components mapped to Ax products."
  },

  // Production
  {
    term: "OEE",
    definition: "Overall Equipment Effectiveness — a combined measure of how well a production line is performing.",
    whyItMatters: "It multiplies availability, performance, and quality rates. It clearly highlights hidden capacity losses.",
    benchmark: "World-class OEE is 85% or above. Below 65% indicates significant room for improvement."
  },
  {
    term: "Availability",
    definition: "The fraction of planned production time during which the equipment is operating.",
    whyItMatters: "Exposes losses from unplanned breakdowns and excessive setup or changeover times.",
    benchmark: "World-class availability is > 90%."
  },
  {
    term: "Performance Rate",
    definition: "The ratio of actual operating speed to the equipment's maximum standard speed.",
    whyItMatters: "Highlights micro-stops, machine wear, operator inefficiency, or substandard material feeds slowering the line.",
    benchmark: "World-class performance is > 95%."
  },
  {
    term: "Quality Rate",
    definition: "The proportion of good units produced out of the total units started.",
    whyItMatters: "Quality failures in production cost raw materials, machine capacity, and labor hours that cannot be recovered.",
    benchmark: "World-class quality is > 99.9%."
  },
  {
    term: "Downtime",
    definition: "Periods when equipment is unavailable for production due to maintenance, breakdowns, or lack of material.",
    whyItMatters: "Directly limits the revenue-generating capacity of a manufacturing asset.",
    benchmark: "Minimal unplanned downtime is expected."
  },
  {
    term: "Line Efficiency",
    definition: "A ratio of the standard hours earned by producing goods divided by actual hours worked.",
    whyItMatters: "Identifies labor productivity and line balancing issues.",
    benchmark: "> 85% utilization of standard hours."
  },
  {
    term: "Capacity Utilization",
    definition: "The extent to which an enterprise or a nation uses its installed productive capacity.",
    whyItMatters: "Highlights capital efficiency. Too low means wasted capital; too high (e.g., > 95%) means dangerous fragility to demand spikes.",
    benchmark: "Typically targeted between 80% and 90% to allow for flexibility."
  },
  {
    term: "Shift Yield",
    definition: "Total accepted finished goods produced during a standard employment shift.",
    whyItMatters: "A fundamental measure for comparing historical performance between different shifts or work crews.",
    benchmark: "Consistent yields across different shifts."
  },

  // General 
  {
    term: "S&OP",
    definition: "Sales and Operations Planning — an integrated business management process for alignment.",
    whyItMatters: "The single most important leadership cadence to ensure a company's sales forecasts are fully supported by supply capabilities.",
    benchmark: "A rigid, monthly process involving executive leadership."
  },
  {
    term: "Service Level",
    definition: "The expected probability of not hitting a stockout during the next replenishment cycle.",
    whyItMatters: "A 99% SL drives exponentially higher safety stock holding costs than a 95% SL. This trade-off is central to supply chain strategy.",
    benchmark: "98% for A items, 95% for B items, 90% for C items."
  },
  {
    term: "Coefficient of Variation",
    definition: "The ratio of the standard deviation to the mean; a standardized measure of data dispersion.",
    whyItMatters: "Determines demand volatility. High CV items are erratic and notoriously difficult to forecast quantitatively.",
    benchmark: "CV < 0.2 indicates steady, predictable demand."
  },
  {
    term: "Bullwhip Effect",
    definition: "A supply chain phenomenon describing how small fluctuations in retail demand cause progressively larger fluctuations in wholesale, distributor, and manufacturer inventory.",
    whyItMatters: "Destroys supply chain efficiency via massive overproduction followed by prolonged shutdowns.",
    benchmark: "Mitigated through better data sharing and collaborative planning."
  },
  {
    term: "SKU Rationalization",
    definition: "The process of reducing a company's product portfolio by eliminating low-performing items.",
    whyItMatters: "Prunes complexity, freeing up warehousing space, working capital, and planner time to focus on high-margin products.",
    benchmark: "An annual or biannual discipline cutting the bottom 5-10% of 'tail' SKUs."
  }
];

/**
 * Escapes regex special characters
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Creates a regex matching any of the glossary terms case-insensitively,
 * bounded by word boundaries to prevent partial word matches.
 */
export function getGlossaryRegex() {
  const terms = GLOSSARY.map(g => escapeRegExp(g.term)).sort((a,b)=>b.length - a.length); // Sort longest first
  return new RegExp(`\\b(${terms.join('|')})\\b`, 'gi');
}
