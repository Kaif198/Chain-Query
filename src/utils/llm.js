/**
 * Utility for interacting with the Anthropic Claude API to generate 
 * Business Narrative Intelligence insights.
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514'; // Matching existing model from AIPanel

/**
 * Helper to call Anthropic API
 */
async function callClaude(apiKey, systemPrompt, userMessage) {
  if (!apiKey) throw new Error("API key is required.");
  
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    }),
  });

  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error?.message || `API ${res.status}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || '';
}

/**
 * Generates a business narrative for raw SQL results.
 * @param {string} apiKey Anthropic API Key
 * @param {string} sql The SQL query that was run
 * @param {Array} columns Result columns
 * @param {Array} rows First 20 rows of results
 * @returns {Promise<Object>} Parsed narrative object { headline, context, impact, action }
 */
export async function generateQueryNarrative(apiKey, sql, columns, rows) {
  const systemPrompt = `You are a Chief Supply Chain Officer and financial analyst.
Your job is to translate SQL query results into a concise business narrative.
The target reader is a VP of Supply Chain or CFO who has never written a SQL query.

You must reply with EXACTLY a JSON object containing these four keys:
{
  "headline": "A single, bold, impactful sentence representing the most critical finding.",
  "context": "2-4 sentences expanding on the headline with context, relying on the data provided.",
  "impact": "Estimated financial or operational impact in currency or units. Write 'Not calculable' if data is insufficient, but try to estimate if plausible based on typical supply chain context.",
  "action": "1-2 sentences suggesting a concrete next step to address the finding."
}

Rules:
- Write in plain, direct business English.
- Be concise (under 150 words total).
- Avoid corporate filler language (e.g. 'It is worth noting that', 'Our analysis shows').
- NEVER use technical jargon, SQL references, or formulas.
- If it's a positive trend, frame the action around protecting or scaling it.
- If it's a risk, frame the action around immediate mitigation.
`;

  const userMessage = `
SQL Executed:
${sql}

Columns:
${columns.join(', ')}

First ${Math.min(rows.length, 20)} Rows of Data:
${JSON.stringify(rows.slice(0, 20))}

Analyze this data and return the JSON narrative.
`;

  const responseText = await callClaude(apiKey, systemPrompt, userMessage);
  
  // Try to parse the resulting JSON
  try {
    const startIdx = responseText.indexOf('{');
    const endIdx = responseText.lastIndexOf('}') + 1;
    const jsonStr = responseText.slice(startIdx, endIdx);
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Failed to parse Claude JSON response for narrative:", responseText);
    // Fallback safe parse
    return {
      headline: "AI encountered an issue interpreting this data.",
      context: "The underlying data structure was not parsed correctly by the narrative generator.",
      impact: "Not calculable",
      action: "Review the raw data table below."
    };
  }
}

/**
 * Generates an Executive Summary for the entire dashboard.
 * @param {string} apiKey Anthropic API Key
 * @param {Object} dashboardState Serialized snapshot of dashboard widgets and their current readable values
 * @returns {Promise<Object>} { rating: 'GREEN'|'AMBER'|'RED', narrative: '...' }
 */
export async function generateExecutiveSummary(apiKey, dashboardState) {
  const systemPrompt = `You are a robotic VP of Supply Chain providing an immediate, high-level briefing to the CEO.
You are given the current snapshot state of our Supply Chain Executive Dashboard.

You must reply with EXACTLY a JSON object:
{
  "rating": "GREEN", "AMBER", or "RED", based on overall supply chain health interpreted from the metrics.
  "narrative": "A concise executive briefing (3-5 sentences) summarizing the operational picture. Identify the main drivers of the rating and finish with a prioritized list of recommended actions. Do not use bullet points, use 'Priority 1:', etc. inline."
}

Rules:
- Write in extreme brevity.
- Focus on what is happening, why it matters, and what to do.
- NEVER explain the dashboard widgets themselves, explain the real-world operational reality they represent.
- Avoid filler words. Be direct.
`;

  const userMessage = `
Current Dashboard Widget Data Snapshot:
${JSON.stringify(dashboardState, null, 2)}

Provide the JSON summary.
`;

  const responseText = await callClaude(apiKey, systemPrompt, userMessage);

  try {
    const startIdx = responseText.indexOf('{');
    const endIdx = responseText.lastIndexOf('}') + 1;
    const jsonStr = responseText.slice(startIdx, endIdx);
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Failed to parse Claude Executive Summary:", responseText);
    return {
      rating: "AMBER",
      narrative: "The dashboard data is currently being re-evaluated. Manual review of widgets is required."
    };
  }
}
