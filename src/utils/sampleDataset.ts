import type { DataRow } from '../types/analysis';

const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Latin America'];
const CATEGORIES = ['Electronics', 'Home Studio', 'Office Gear', 'Accessories'];
const CHANNELS = ['Direct Web', 'Partner Retail', 'Marketplace'];

/**
 * Deterministic built-in retail sales dataset (120 rows + 3 deliberate duplicates = 123 rows)
 * engineered so users immediately see strong correlations, seasonal datetime trends,
 * missing values, IQR outliers, and actionable cleaning fixes.
 */
export function buildSampleSalesDataset(): DataRow[] {
  const rows: DataRow[] = [];

  // Deterministic pseudo-random helper (LCG)
  let seed = 4219;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const startDate = new Date('2025-01-05T00:00:00Z');

  for (let i = 0; i < 120; i++) {
    const date = new Date(startDate.getTime() + i * 3 * 24 * 60 * 60 * 1000);
    const isoDate = date.toISOString().slice(0, 10);

    // Dominant category (~52% Electronics) to trigger dominant-category or skewed insights
    const catRoll = nextRand();
    const category =
      catRoll < 0.52
        ? CATEGORIES[0]
        : catRoll < 0.72
          ? CATEGORIES[1]
          : catRoll < 0.88
            ? CATEGORIES[2]
            : CATEGORIES[3];

    const region = REGIONS[Math.floor(nextRand() * REGIONS.length)];
    const channel = CHANNELS[Math.floor(nextRand() * CHANNELS.length)];

    // Seasonal upward trend + marketing spend drives revenue strongly
    const seasonalFactor = 1 + (i / 120) * 0.45 + Math.sin(i / 6) * 0.12;
    const marketingSpend = Math.round((450 + nextRand() * 1900) * seasonalFactor);
    const discountPct = Number((nextRand() * 28).toFixed(1));

    // Strong positive correlation: Marketing_Spend -> Revenue & Units_Sold
    let revenue = Math.round(marketingSpend * 4.35 + (nextRand() - 0.5) * 900 + (category === 'Electronics' ? 1400 : 0));
    let unitsSold = Math.max(4, Math.round(revenue / (category === 'Accessories' ? 42 : 115) + (nextRand() - 0.5) * 8));

    // Strong negative correlation: Discount_Pct -> Profit_Margin_Pct
    const profitMargin = Number(
      Math.max(4, 38 - discountPct * 0.88 + (nextRand() - 0.5) * 5.2).toFixed(1)
    );

    let customerRating: number | null = Number(
      Math.min(5.0, Math.max(2.6, 4.1 + (profitMargin > 24 ? 0.35 : -0.25) + (nextRand() - 0.5) * 0.8)).toFixed(1)
    );

    // Inject deliberate IQR outliers on Revenue & Marketing_Spend
    if (i === 18) {
      revenue = 24800;
      unitsSold = 218;
    } else if (i === 74) {
      revenue = 27950;
      unitsSold = 244;
    } else if (i === 103) {
      revenue = 22400;
      unitsSold = 195;
    }

    // Inject realistic missing values (~7% on Customer_Rating, ~5% on Discount_Pct, ~4% on Region)
    const missingRating = i % 15 === 4 ? null : customerRating;
    const missingDiscount = i % 21 === 7 ? null : discountPct;
    const missingRegion = i % 27 === 9 ? null : region;

    rows.push({
      Order_ID: `ORD-${String(1001 + i)}`,
      Order_Date: isoDate,
      Region: missingRegion,
      Category: category,
      Sales_Channel: channel,
      Marketing_Spend: marketingSpend,
      Units_Sold: unitsSold,
      Discount_Pct: missingDiscount,
      Revenue: revenue,
      Profit_Margin_Pct: profitMargin,
      Customer_Rating: missingRating,
    });
  }

  // Inject 3 deliberate duplicate rows for Data Cleaning demo
  rows.push({ ...rows[5] });
  rows.push({ ...rows[22] });
  rows.push({ ...rows[48] });

  return rows;
}
