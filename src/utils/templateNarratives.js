/**
 * Narrative templates for pre-built queries.
 * Each function takes the rows resulting from the specific query and returns a Narrative object
 * { headline, context, impact, action }.
 */

export const getTemplateNarrative = (queryId, rows) => {
  if (!rows || rows.length === 0) return null;

  switch (queryId) {
    case 'demand-vs-forecast': {
      const latest = rows[rows.length - 1];
      const month = latest[0];
      const accuracy = parseFloat(latest[3]);
      return {
        headline: `Forecast accuracy trended at ${accuracy}% for the most recent period (${month}).`,
        context: `Over the analyzed timeline, total aggregate demand consistently compared against forecast baselines. In ${month}, actual demand achieved an accuracy percentage of ${accuracy}%.`,
        impact: `A ${100 - accuracy}% variance drives holding costs or stockouts proportionate to the total volume error.`,
        action: `Review S&OP protocols for ${month} to identify causes of the ${100 - accuracy}% variance and adjust near-term procurement.`
      };
    }
    case 'top-products-demand': {
      const top = rows[0];
      return {
        headline: `${top[0]} emerged as the highest volume demand driver.`,
        context: `The top 10 products represent your most critical volume movers. ${top[0]} leading the ${top[1]} category generated ${top[2]} total units in demand with a forecast accuracy of ${top[3]}%.`,
        impact: `High-volume items carry disproportionate revenue impact; even minor stockouts here rapidly compound lost sales.`,
        action: `Ensure safety stock parameters for ${top[0]} are reviewed monthly rather than quarterly.`
      };
    }
    case 'inventory-health': {
      // Find lowest days of supply
      const lowest = [...rows].sort((a, b) => a[3] - b[3])[0];
      return {
        headline: `${lowest[0]} shows critically low buffer with only ${lowest[3]} Days of Supply.`,
        context: `Inventory health across the portfolio is mixed. ${lowest[0]} stands out as highly vulnerable, carrying only ${lowest[3]} days of supply while experiencing stockout flags at ${lowest[4]} locations.`,
        impact: `Not calculable exactly, but near-term lost sales are highly probable for ${lowest[0]} within the week.`,
        action: `Expedite emergency replenishment for ${lowest[0]} and review the target safety stock logic.`
      };
    }
    case 'stockout-risk': {
      const criticalCount = rows.filter(r => r[5] === 'Critical').length;
      if (criticalCount === 0) return {
        headline: `No products currently flag at Critical stockout risk.`,
        context: `All monitored products maintain available inventory above 50% of their safety stock thresholds.`,
        impact: `Protects core revenue streams and avoids emergency freight premiums.`,
        action: `Maintain current replenishment schedules.`
      };
      
      const worst = rows[0]; // Ordered by risk ascending
      return {
        headline: `${criticalCount} products are at Critical stockout risk, depleting safety stock buffers.`,
        context: `${worst[0]} at ${worst[1]} is the most constrained, showing only ${worst[2]} available units against a required safety stock of ${worst[3]}.`,
        impact: `Immediate revenue at risk proportional to ${worst[0]}'s daily sales velocity at ${worst[1]}.`,
        action: `Trigger priority air-freight or inter-warehouse transfers to ${worst[1]} for ${worst[0]}.`
      };
    }
    case 'inventory-turnover': {
      const avgTurnover = (rows.reduce((acc, r) => acc + parseFloat(r[2]), 0) / rows.length).toFixed(1);
      const best = [...rows].sort((a,b) => b[2] - a[2])[0];
      return {
        headline: `Network-wide inventory turnover averages ${avgTurnover}x, led by ${best[0]}.`,
        context: `Turnover velocity indicates capital efficiency. ${best[0]} (${best[1]}) is turning inventory at ${best[2]}x, significantly outperforming regional averages driven by total demand of ${best[4]} units.`,
        impact: `Higher turnover at ${best[0]} reduces localized carrying costs by preventing stagnant capital.`,
        action: `Replicate ${best[0]}'s replenishment frequency and lot-size strategies across other underperforming DCs.`
      };
    }
    case 'dead-stock': {
      const totalCapital = rows.reduce((acc, r) => acc + parseFloat(r[5]), 0);
      return {
        headline: `${rows.length} SKUs identified as Dead Stock, tying up EUR ${totalCapital.toLocaleString()} in working capital.`,
        context: `These products possess over 90 days of supply without sufficient demand velocity. The highest offender is ${rows[0][0]} at ${rows[0][2]}, consuming ${rows[0][5]} in capital.`,
        impact: `EUR ${totalCapital.toLocaleString()} trapped capital incurring approximately EUR ${(totalCapital * 0.2).toLocaleString()} in annual carrying costs.`,
        action: `Initiate SKU rationalization or targeted discounting campaigns to liquidate ${rows[0][0]} inventory.`
      };
    }
    case 'supplier-scorecard': {
      const worst = [...rows].sort((a, b) => a[5] - b[5])[0];
      return {
        headline: `${worst[0]} ranks as the lowest-performing supplier with a composite score of ${worst[5]}.`,
        context: `Supplier reliabilty spans OTD, Quality, and Fill Rate. ${worst[0]} scored ${worst[2]}% on-time and accrued ${worst[6]} total incident flags across recent periods.`,
        impact: `Low OTD requires inflating your own safety stock to compensate, directly increasing carrying costs.`,
        action: `Issue formal corrective action request to ${worst[0]} regarding delivery and quality metrics.`
      };
    }
    case 'at-risk-suppliers': {
      const declining = rows.filter(r => r[7] === 'Declining');
      if (declining.length === 0) return {
        headline: `Supplier performance trends remain broadly stable relative to historical baselines.`,
        context: `No strategic suppliers are flagging severe systemic deterioration in On-Time Delivery or Incident counts.`,
        impact: `Provides supply chain continuity.`,
        action: `Continue standard quarterly business reviews.`
      };
      return {
        headline: `${declining.length} suppliers show declining delivery reliability compared to historical performance.`,
        context: `Specifically, ${declining[0][0]} dropped by ${Math.abs(declining[0][4])} percentage points in OTD compared to their earlier track record.`,
        impact: `Heightened risk of manufacturing line stoppages or raw material stockouts.`,
        action: `Mandate a supplier review meeting with ${declining[0][0]} and prepare dual-sourcing contingencies.`
      };
    }
    case 'line-efficiency': {
      const best = rows[0];
      return {
        headline: `${best[0]} achieved ${best[2]}% average Overall Equipment Effectiveness (OEE).`,
        context: `Production line efficiency translates directly to unit cost structure. ${best[0]} completed ${best[5]} production runs peaking at ${best[4]}% maximum efficiency.`,
        impact: `High efficiency dilutes fixed manufacturing overheads, improving gross margins per unit produced.`,
        action: `Standardize the operating procedures from ${best[0]} across the network.`
      };
    }
    case 'spend-by-category': {
      return {
        headline: `${rows[0][0]} constitutes the largest segment of procurement spend at EUR ${parseFloat(rows[0][1]).toLocaleString()}.`,
        context: `Across all POs, ${rows[0][0]} materials accounted for ${rows[0][2]} distinct orders. The average order value within this category is EUR ${parseFloat(rows[0][3]).toLocaleString()}.`,
        impact: `Every 1% cost savings negotiated in the ${rows[0][0]} category yields EUR ${(parseFloat(rows[0][1]) * 0.01).toLocaleString()} direct to bottom line.`,
        action: `Prioritize strategic sourcing events and volume-discount renegotiations specifically for ${rows[0][0]}.`
      };
    }
    default:
      return {
        headline: `Analysis covering ${rows.length} distinct data points and metrics.`,
        context: `The query results provide specialized insight into supply chain operations based on the selected parameters.`,
        impact: `Not calculable without further contextual breakdown.`,
        action: `Review the results table below to identify specific outliers or optimization candidates.`
      };
  }
};
