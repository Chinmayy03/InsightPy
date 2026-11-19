import { APP_CONFIG } from '../config';
import type {
  CategoricalStats,
  CellValue,
  ChartConfig,
  ChartType,
  CleaningAction,
  CleaningIssue,
  ColumnMeta,
  ColumnType,
  CorrelationPair,
  CorrelationResult,
  CorrelationStrengthLabel,
  DataRow,
  Dataset,
  Insight,
  NumericStats,
  OutlierColumnSummary,
  OutlierResult,
  StatsResult,
} from '../types/analysis';

const NULL_TOKENS = new Set(['', 'null', 'na', 'n/a', 'nan', 'none', 'undefined', '-']);

export function isNullish(val: CellValue): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === 'number') return Number.isNaN(val);
  if (typeof val === 'string') return NULL_TOKENS.has(val.trim().toLowerCase());
  return false;
}

export function parseNumericValue(val: CellValue): number | null {
  if (isNullish(val)) return null;
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  if (typeof val === 'boolean') return null;
  const cleaned = String(val)
    .trim()
    .replace(/[$€£¥,\s]/g, '')
    .replace(/%$/, '');
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

const DATE_PATTERN =
  /^(\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:[T\s]\d{1,2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:?\d{2})?)?|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})$/i;

export function parseDatetimeValue(val: CellValue): number | null {
  if (isNullish(val)) return null;
  if (typeof val === 'number' || typeof val === 'boolean') return null;
  const str = String(val).trim();
  if (!DATE_PATTERN.test(str)) return null;
  const ts = Date.parse(str);
  return Number.isFinite(ts) ? ts : null;
}

export function inferColumnType(values: CellValue[]): {
  type: ColumnType;
  allNull: boolean;
  mixedTypes: boolean;
} {
  const nonNull = values.filter((v) => !isNullish(v));
  if (nonNull.length === 0) {
    return { type: 'categorical', allNull: true, mixedTypes: false };
  }

  let numericCount = 0;
  let datetimeCount = 0;
  let stringCount = 0;

  for (const v of nonNull) {
    if (parseNumericValue(v) !== null) {
      numericCount++;
    } else if (parseDatetimeValue(v) !== null) {
      datetimeCount++;
    } else {
      stringCount++;
    }
  }

  const total = nonNull.length;
  const numRatio = numericCount / total;
  const dateRatio = datetimeCount / total;

  const activeKinds = [numericCount > 0, datetimeCount > 0, stringCount > 0].filter(Boolean).length;
  const mixedTypes = activeKinds > 1 && Math.max(numRatio, dateRatio, stringCount / total) < 0.95;

  if (numRatio >= 0.8) {
    return { type: 'numeric', allNull: false, mixedTypes };
  }
  if (dateRatio >= 0.8) {
    return { type: 'datetime', allNull: false, mixedTypes };
  }
  return { type: 'categorical', allNull: false, mixedTypes };
}

export function buildDatasetObject(
  id: string,
  name: string,
  sourceType: 'sample' | 'csv' | 'excel',
  rawRows: DataRow[],
  sheetName?: string
): Dataset {
  const isLargeSampled = rawRows.length > APP_CONFIG.LARGE_ROW_CAP;
  const rows = rawRows.slice(0, APP_CONFIG.LARGE_ROW_CAP);

  // Collect union of column names preserving insertion order
  const colNameSet = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      const trimmed = key.trim();
      if (trimmed) colNameSet.add(key);
    }
  }
  const colNames = Array.from(colNameSet);

  let totalMissing = 0;
  const columns: ColumnMeta[] = colNames.map((colName) => {
    const colValues = rows.map((r) => r[colName]);
    const { type, allNull, mixedTypes } = inferColumnType(colValues);

    let missingCount = 0;
    const uniqueSet = new Set<string>();
    const sampleValues: string[] = [];

    for (const val of colValues) {
      if (isNullish(val)) {
        missingCount++;
      } else {
        const s = String(val).trim();
        uniqueSet.add(s);
        if (sampleValues.length < 5 && !sampleValues.includes(s)) {
          sampleValues.push(s);
        }
      }
    }

    totalMissing += missingCount;
    const nonNullCount = rows.length - missingCount;
    const missingPct = rows.length > 0 ? Number(((missingCount / rows.length) * 100).toFixed(1)) : 0;

    return {
      name: colName,
      type,
      nonNullCount,
      missingCount,
      missingPct,
      uniqueCount: uniqueSet.size,
      sampleValues,
      allNull,
      mixedTypes,
    };
  });

  // Duplicate row detection via canonical serialized key
  const seenRows = new Set<string>();
  let duplicateCount = 0;
  for (const row of rows) {
    const key = colNames.map((c) => (isNullish(row[c]) ? '∅' : String(row[c]).trim())).join('\u0001');
    if (seenRows.has(key)) {
      duplicateCount++;
    } else {
      seenRows.add(key);
    }
  }

  // Approximate memory footprint in bytes
  let byteEstimate = 0;
  for (const row of rows) {
    for (const col of colNames) {
      const val = row[col];
      if (typeof val === 'number') byteEstimate += 8;
      else if (typeof val === 'string') byteEstimate += val.length * 2 + 16;
      else byteEstimate += 8;
    }
  }

  return {
    id,
    name,
    sourceType,
    sheetName,
    rows,
    columns,
    rowCount: rows.length,
    columnCount: columns.length,
    duplicateCount,
    totalMissing,
    memoryEstimateBytes: byteEstimate,
    isLargeSampled,
    uploadedAt: new Date().toISOString(),
  };
}

export function quantile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const weight = idx - lo;
  return sorted[lo] * (1 - weight) + sorted[hi] * weight;
}

export function roundStat(n: number | null, decimals = 3): number | null {
  if (n === null || !Number.isFinite(n)) return null;
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

export function computeNumericColumnStats(column: string, rawValues: CellValue[]): NumericStats {
  const nums: number[] = [];
  let missingCount = 0;

  for (const v of rawValues) {
    if (isNullish(v)) {
      missingCount++;
    } else {
      const parsed = parseNumericValue(v);
      if (parsed !== null) {
        nums.push(parsed);
      } else {
        missingCount++;
      }
    }
  }

  const n = nums.length;
  if (n === 0) {
    return {
      column,
      count: 0,
      missingCount,
      mean: null,
      median: null,
      mode: null,
      std: null,
      variance: null,
      min: null,
      max: null,
      q1: null,
      q3: null,
      iqr: null,
      skewness: null,
      kurtosis: null,
    };
  }

  const sorted = [...nums].sort((a, b) => a - b);
  const sum = nums.reduce((acc, x) => acc + x, 0);
  const mean = sum / n;
  const median = quantile(sorted, 0.5)!;
  const q1 = quantile(sorted, 0.25)!;
  const q3 = quantile(sorted, 0.75)!;
  const iqr = q3 - q1;
  const min = sorted[0];
  const max = sorted[n - 1];

  // Mode (most frequent value; tie-break by smallest value)
  const freq = new Map<number, number>();
  let modeVal = sorted[0];
  let bestCount = 0;
  for (const x of sorted) {
    const c = (freq.get(x) ?? 0) + 1;
    freq.set(x, c);
    if (c > bestCount) {
      bestCount = c;
      modeVal = x;
    }
  }

  // Sample variance & std (ddof=1 when n > 1)
  let m2 = 0;
  let m3 = 0;
  let m4 = 0;
  for (const x of nums) {
    const d = x - mean;
    const d2 = d * d;
    m2 += d2;
    m3 += d2 * d;
    m4 += d2 * d2;
  }

  const variance = n > 1 ? m2 / (n - 1) : 0;
  const std = Math.sqrt(variance);

  // Population-moment skewness & excess kurtosis when std > 0 and n >= 3 / 4
  const popStd = Math.sqrt(m2 / n);
  let skewness: number | null = null;
  let kurtosis: number | null = null;

  if (n >= 3 && popStd > 0) {
    const g1 = (m3 / n) / Math.pow(popStd, 3);
    // Adjusted Fisher-Pearson sample skewness
    skewness = (Math.sqrt(n * (n - 1)) / (n - 2)) * g1;
  } else if (n >= 3) {
    skewness = 0;
  }

  if (n >= 4 && popStd > 0) {
    const g2 = (m4 / n) / Math.pow(popStd, 4) - 3;
    // Excess kurtosis with sample bias adjustment
    kurtosis = ((n - 1) / ((n - 2) * (n - 3))) * ((n + 1) * g2 + 6);
  } else if (n >= 4) {
    kurtosis = 0;
  }

  return {
    column,
    count: n,
    missingCount,
    mean: roundStat(mean),
    median: roundStat(median),
    mode: roundStat(modeVal),
    std: roundStat(std),
    variance: roundStat(variance),
    min: roundStat(min),
    max: roundStat(max),
    q1: roundStat(q1),
    q3: roundStat(q3),
    iqr: roundStat(iqr),
    skewness: roundStat(skewness),
    kurtosis: roundStat(kurtosis),
  };
}

export function computeCategoricalColumnStats(
  column: string,
  rawValues: CellValue[]
): CategoricalStats {
  const counts = new Map<string, number>();
  let missingCount = 0;
  let count = 0;

  for (const v of rawValues) {
    if (isNullish(v)) {
      missingCount++;
    } else {
      const label = String(v).trim();
      count++;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }

  const sortedEntries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const topValues = sortedEntries.slice(0, 8).map(([value, c]) => ({
    value,
    count: c,
    percentage: count > 0 ? Number(((c / count) * 100).toFixed(1)) : 0,
  }));

  return {
    column,
    count,
    missingCount,
    uniqueCount: counts.size,
    topValue: sortedEntries[0]?.[0] ?? null,
    topFrequency: sortedEntries[0]?.[1] ?? 0,
    topValues,
  };
}

export function computeSummary(dataset: Dataset): StatsResult {
  const numeric: NumericStats[] = [];
  const categorical: CategoricalStats[] = [];

  for (const col of dataset.columns) {
    const values = dataset.rows.map((r) => r[col.name]);
    if (col.type === 'numeric') {
      numeric.push(computeNumericColumnStats(col.name, values));
    } else {
      categorical.push(computeCategoricalColumnStats(col.name, values));
    }
  }

  const missingByColumn = dataset.columns.map((c) => ({
    column: c.name,
    missingCount: c.missingCount,
    missingPct: c.missingPct,
  }));

  return {
    datasetId: dataset.id,
    numeric,
    categorical,
    missingByColumn,
  };
}

export function getCorrelationStrengthLabel(r: number): CorrelationStrengthLabel {
  const abs = Math.abs(r);
  if (abs < 0.2) return 'negligible';
  if (abs < 0.4) return r >= 0 ? 'weak positive' : 'weak negative';
  if (abs < 0.7) return r >= 0 ? 'moderate positive' : 'moderate negative';
  return r >= 0 ? 'strong positive' : 'strong negative';
}

export function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 2) return null;

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const denom = Math.sqrt(denX * denY);
  if (denom === 0) return null;
  const r = num / denom;
  return Math.max(-1, Math.min(1, Number(r.toFixed(4))));
}

export function computeCorrelations(dataset: Dataset): CorrelationResult {
  const numericCols = dataset.columns.filter((c) => c.type === 'numeric' && !c.allNull).map((c) => c.name);
  const k = numericCols.length;
  const matrix: (number | null)[][] = Array.from({ length: k }, () => Array(k).fill(null));
  const pairs: CorrelationPair[] = [];

  for (let i = 0; i < k; i++) {
    matrix[i][i] = 1;
    for (let j = i + 1; j < k; j++) {
      const colA = numericCols[i];
      const colB = numericCols[j];
      const xs: number[] = [];
      const ys: number[] = [];

      for (const row of dataset.rows) {
        const vx = parseNumericValue(row[colA]);
        const vy = parseNumericValue(row[colB]);
        if (vx !== null && vy !== null) {
          xs.push(vx);
          ys.push(vy);
        }
      }

      const r = pearsonCorrelation(xs, ys);
      matrix[i][j] = r;
      matrix[j][i] = r;

      if (r !== null) {
        pairs.push({
          colA,
          colB,
          r,
          absR: Math.abs(r),
          label: getCorrelationStrengthLabel(r),
          sampleSize: xs.length,
        });
      }
    }
  }

  pairs.sort((a, b) => b.absR - a.absR);

  return {
    columns: numericCols,
    matrix,
    pairs,
  };
}

export function computeOutliers(dataset: Dataset, summary: StatsResult): OutlierResult {
  const columns: OutlierColumnSummary[] = [];
  let totalOutliers = 0;

  for (const stat of summary.numeric) {
    if (
      stat.q1 === null ||
      stat.q3 === null ||
      stat.iqr === null ||
      stat.count < 4
    ) {
      continue;
    }

    const lowerBound = roundStat(stat.q1 - 1.5 * stat.iqr)!;
    const upperBound = roundStat(stat.q3 + 1.5 * stat.iqr)!;

    const outlierVals: number[] = [];
    for (const row of dataset.rows) {
      const num = parseNumericValue(row[stat.column]);
      if (num !== null && (num < lowerBound || num > upperBound)) {
        outlierVals.push(num);
      }
    }

    if (outlierVals.length > 0) {
      totalOutliers += outlierVals.length;
      columns.push({
        column: stat.column,
        q1: stat.q1,
        q3: stat.q3,
        iqr: stat.iqr,
        lowerBound,
        upperBound,
        outlierCount: outlierVals.length,
        outlierPct: Number(((outlierVals.length / stat.count) * 100).toFixed(1)),
        sampleOutliers: outlierVals.slice(0, 6),
      });
    }
  }

  columns.sort((a, b) => b.outlierCount - a.outlierCount);

  return {
    totalOutliers,
    columns,
  };
}

export function computeInsights(
  dataset: Dataset,
  summary: StatsResult,
  correlations: CorrelationResult,
  outliers: OutlierResult
): Insight[] {
  const insights: Insight[] = [];

  if (dataset.rowCount === 0 || dataset.columnCount === 0) {
    return [
      {
        id: 'empty-dataset',
        title: 'Dataset contains no analyzable records',
        description: 'Upload a file with at least one column and one row to generate insights.',
        severity: 'warning',
        category: 'quality',
      },
    ];
  }

  // 1. Strongest correlations
  const topCorr = correlations.pairs.filter((p) => p.absR >= 0.45).slice(0, 2);
  for (const pair of topCorr) {
    const direction = pair.r >= 0 ? 'move together' : 'move in opposite directions';
    insights.push({
      id: `corr-${pair.colA}-${pair.colB}`,
      title: `${pair.colA} and ${pair.colB} show a ${pair.label} relationship`,
      description: `Pearson correlation r = ${pair.r.toFixed(2)}. As ${pair.colA} increases, ${pair.colB} tends to ${pair.r >= 0 ? 'increase' : 'decrease'} (${direction}).`,
      severity: pair.absR >= 0.7 ? 'success' : 'info',
      category: 'correlation',
      metric: `r = ${pair.r.toFixed(2)}`,
    });
  }

  // 2. High missing values (> 5% or all-null)
  const highMissing = dataset.columns.filter((c) => c.missingPct >= 5);
  for (const col of highMissing.slice(0, 3)) {
    insights.push({
      id: `missing-${col.name}`,
      title: col.allNull
        ? `Column "${col.name}" is completely empty`
        : `"${col.name}" has ${col.missingPct}% missing values`,
      description: col.allNull
        ? `Every row in "${col.name}" is null. Consider dropping this column in Data Cleaning.`
        : `${col.missingCount} of ${dataset.rowCount} rows are missing "${col.name}". Imputing with median or mode can stabilize downstream charts.`,
      severity: 'warning',
      category: 'missing',
      metric: `${col.missingCount} missing`,
    });
  }

  // 3. Skewed numeric distributions (|skewness| >= 1)
  for (const stat of summary.numeric) {
    if (stat.skewness !== null && Math.abs(stat.skewness) >= 1) {
      const dir = stat.skewness > 0 ? 'right-skewed (high-end tail)' : 'left-skewed (low-end tail)';
      insights.push({
        id: `skew-${stat.column}`,
        title: `"${stat.column}" distribution is strongly ${dir}`,
        description: `Skewness is ${stat.skewness.toFixed(2)}. The median (${stat.median}) is a more reliable typical value than the mean (${stat.mean}).`,
        severity: 'info',
        category: 'skewness',
        metric: `skew = ${stat.skewness.toFixed(2)}`,
      });
    }
  }

  // 4. IQR Outliers
  for (const out of outliers.columns.slice(0, 2)) {
    insights.push({
      id: `outlier-${out.column}`,
      title: `${out.outlierCount} statistical outlier${out.outlierCount > 1 ? 's' : ''} detected in "${out.column}"`,
      description: `${out.outlierPct}% of values fall outside the expected IQR fence [${out.lowerBound}, ${out.upperBound}] (examples: ${out.sampleOutliers.slice(0, 3).join(', ')}).`,
      severity: 'warning',
      category: 'outlier',
      metric: `${out.outlierCount} outliers`,
    });
  }

  // 5. Dominant categories (> 50% share)
  for (const cat of summary.categorical) {
    if (cat.topValues.length > 1 && cat.topValues[0].percentage >= 50) {
      insights.push({
        id: `dom-${cat.column}`,
        title: `"${cat.topValue}" dominates "${cat.column}"`,
        description: `The category "${cat.topValue}" represents ${cat.topValues[0].percentage}% of all non-missing records (${cat.topFrequency} of ${cat.count} rows).`,
        severity: 'info',
        category: 'dominance',
        metric: `${cat.topValues[0].percentage}% share`,
      });
    }
  }

  // 6. Datetime trends against primary numeric metric
  const dateCol = dataset.columns.find((c) => c.type === 'datetime' && !c.allNull);
  const primaryNum = summary.numeric.find((s) => s.count >= 6);
  if (dateCol && primaryNum) {
    const timePairs: Array<{ ts: number; val: number }> = [];
    for (const row of dataset.rows) {
      const ts = parseDatetimeValue(row[dateCol.name]);
      const val = parseNumericValue(row[primaryNum.column]);
      if (ts !== null && val !== null) {
        timePairs.push({ ts, val });
      }
    }
    if (timePairs.length >= 6) {
      timePairs.sort((a, b) => a.ts - b.ts);
      const mid = Math.floor(timePairs.length / 2);
      const firstHalfAvg =
        timePairs.slice(0, mid).reduce((s, p) => s + p.val, 0) / mid;
      const secondHalfAvg =
        timePairs.slice(mid).reduce((s, p) => s + p.val, 0) / (timePairs.length - mid);
      if (firstHalfAvg !== 0) {
        const pctChange = ((secondHalfAvg - firstHalfAvg) / Math.abs(firstHalfAvg)) * 100;
        if (Math.abs(pctChange) >= 8) {
          insights.push({
            id: `trend-${dateCol.name}-${primaryNum.column}`,
            title: `"${primaryNum.column}" shows an ${pctChange > 0 ? 'upward' : 'downward'} trend over "${dateCol.name}"`,
            description: `Average "${primaryNum.column}" shifted by ${pctChange > 0 ? '+' : ''}${pctChange.toFixed(1)}% from the earlier half to the later half of the timeline.`,
            severity: pctChange > 0 ? 'success' : 'info',
            category: 'trend',
            metric: `${pctChange > 0 ? '+' : ''}${pctChange.toFixed(1)}%`,
          });
        }
      }
    }
  }

  // 7. Duplicate / Quality summary
  if (dataset.duplicateCount > 0) {
    insights.push({
      id: 'quality-duplicates',
      title: `${dataset.duplicateCount} exact duplicate row${dataset.duplicateCount > 1 ? 's' : ''} found`,
      description: `Duplicate rows can inflate counts and bias averages. You can remove them in one click under Data Cleaning.`,
      severity: 'warning',
      category: 'quality',
      metric: `${dataset.duplicateCount} duplicates`,
    });
  } else if (dataset.totalMissing === 0) {
    insights.push({
      id: 'quality-clean',
      title: 'Dataset has zero missing values or duplicates',
      description: `All ${dataset.rowCount.toLocaleString()} rows across ${dataset.columnCount} columns are complete and unique.`,
      severity: 'success',
      category: 'quality',
      metric: '100% complete',
    });
  }

  return insights;
}

export function detectCleaningIssues(dataset: Dataset): CleaningIssue[] {
  const issues: CleaningIssue[] = [];

  if (dataset.duplicateCount > 0) {
    issues.push({
      id: 'issue-duplicates',
      title: 'Duplicate Rows Detected',
      description: `${dataset.duplicateCount} identical row${dataset.duplicateCount > 1 ? 's appear' : ' appears'} more than once in the dataset.`,
      severity: 'warning',
      affectedCount: dataset.duplicateCount,
      actions: [
        {
          type: 'remove_duplicates',
          label: 'Remove Duplicates',
          description: `Keep first occurrence and remove ${dataset.duplicateCount} duplicate rows.`,
        },
      ],
    });
  }

  const allNullCols = dataset.columns.filter((c) => c.allNull);
  if (allNullCols.length > 0) {
    issues.push({
      id: 'issue-all-null-cols',
      title: 'Empty (All-Null) Columns',
      description: `${allNullCols.length} column${allNullCols.length > 1 ? 's contain' : ' contains'} no values at all: ${allNullCols.map((c) => c.name).join(', ')}.`,
      severity: 'warning',
      affectedCount: allNullCols.length,
      actions: [
        {
          type: 'drop_all_null_columns',
          label: 'Drop Empty Columns',
          description: 'Remove columns that contain 100% missing values.',
        },
      ],
    });
  }

  for (const col of dataset.columns) {
    if (col.missingCount > 0 && !col.allNull) {
      const actions: CleaningAction[] = [];
      if (col.type === 'numeric') {
        actions.push(
          {
            type: 'fill_mean',
            column: col.name,
            label: 'Fill with Mean',
            description: `Replace missing values in "${col.name}" with column average.`,
          },
          {
            type: 'fill_median',
            column: col.name,
            label: 'Fill with Median',
            description: `Replace missing values in "${col.name}" with column median (robust to outliers).`,
          }
        );
      } else {
        actions.push({
          type: 'fill_mode',
          column: col.name,
          label: 'Fill with Mode',
          description: `Replace missing values in "${col.name}" with the most frequent value.`,
        });
      }

      actions.push({
        type: 'drop_missing_rows',
        column: col.name,
        label: 'Drop Missing Rows',
        description: `Delete the ${col.missingCount} row(s) where "${col.name}" is missing.`,
      });

      issues.push({
        id: `issue-missing-${col.name}`,
        title: `Missing Values in "${col.name}"`,
        description: `${col.missingCount} missing cell${col.missingCount > 1 ? 's' : ''} (${col.missingPct}% of rows) in this ${col.type} column.`,
        severity: col.missingPct >= 10 ? 'warning' : 'info',
        affectedCount: col.missingCount,
        column: col.name,
        actions,
      });
    }
  }

  if (dataset.totalMissing > 0) {
    const rowsWithAnyMissing = dataset.rows.filter((row) =>
      dataset.columns.some((col) => isNullish(row[col.name]))
    ).length;
    if (rowsWithAnyMissing > 0) {
      issues.push({
        id: 'issue-global-missing',
        title: 'Global Missing-Row Cleanup',
        description: `${rowsWithAnyMissing} row${rowsWithAnyMissing > 1 ? 's contain' : ' contains'} at least one missing cell across the table.`,
        severity: 'info',
        affectedCount: rowsWithAnyMissing,
        actions: [
          {
            type: 'drop_missing_rows',
            label: 'Drop All Incomplete Rows',
            description: `Remove all ${rowsWithAnyMissing} row(s) that have any missing value.`,
          },
        ],
      });
    }
  }

  return issues;
}

export function applyCleaningAction(dataset: Dataset, action: CleaningAction): Dataset {
  const colNames = dataset.columns.map((c) => c.name);
  let nextRows: DataRow[] = dataset.rows.map((r) => ({ ...r }));

  switch (action.type) {
    case 'remove_duplicates': {
      const seen = new Set<string>();
      nextRows = nextRows.filter((row) => {
        const key = colNames
          .map((c) => (isNullish(row[c]) ? '∅' : String(row[c]).trim()))
          .join('\u0001');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      break;
    }

    case 'drop_all_null_columns': {
      const emptyCols = new Set(dataset.columns.filter((c) => c.allNull).map((c) => c.name));
      nextRows = nextRows.map((row) => {
        const copy: DataRow = {};
        for (const key of Object.keys(row)) {
          if (!emptyCols.has(key)) copy[key] = row[key];
        }
        return copy;
      });
      break;
    }

    case 'drop_missing_rows': {
      if (action.column) {
        nextRows = nextRows.filter((row) => !isNullish(row[action.column!]));
      } else {
        nextRows = nextRows.filter((row) => colNames.every((c) => !isNullish(row[c])));
      }
      break;
    }

    case 'fill_mean':
    case 'fill_median': {
      if (!action.column) break;
      const stats = computeNumericColumnStats(
        action.column,
        nextRows.map((r) => r[action.column!])
      );
      const fillVal = action.type === 'fill_mean' ? stats.mean : stats.median;
      if (fillVal !== null) {
        nextRows = nextRows.map((row) =>
          isNullish(row[action.column!]) ? { ...row, [action.column!]: fillVal } : row
        );
      }
      break;
    }

    case 'fill_mode': {
      if (!action.column) break;
      const catStats = computeCategoricalColumnStats(
        action.column,
        nextRows.map((r) => r[action.column!])
      );
      const fillVal = catStats.topValue;
      if (fillVal !== null) {
        nextRows = nextRows.map((row) =>
          isNullish(row[action.column!]) ? { ...row, [action.column!]: fillVal } : row
        );
      }
      break;
    }
  }

  return buildDatasetObject(
    dataset.id,
    dataset.name,
    dataset.sourceType,
    nextRows,
    dataset.sheetName
  );
}

export function suggestChartsForColumns(
  columns: ColumnMeta[],
  xColName?: string,
  yColName?: string
): Array<{ chartType: ChartType; reason: string }> {
  const xCol = columns.find((c) => c.name === xColName);
  const yCol = columns.find((c) => c.name === yColName);

  if (!xCol) {
    return [
      { chartType: 'bar', reason: 'Compare category totals at a glance' },
      { chartType: 'histogram', reason: 'Inspect numeric value distribution' },
    ];
  }

  if (xCol.type === 'datetime' && yCol?.type === 'numeric') {
    return [
      { chartType: 'line', reason: 'Best for tracking numeric trends over time' },
      { chartType: 'bar', reason: 'Compare periodic intervals side by side' },
    ];
  }

  if (xCol.type === 'numeric' && yCol?.type === 'numeric') {
    return [
      { chartType: 'scatter', reason: 'Reveal linear relationships & clusters between two metrics' },
      { chartType: 'line', reason: 'Connect ordered numeric series' },
      { chartType: 'heatmap', reason: 'Visualize bivariate density across both metrics' },
    ];
  }

  if (xCol.type === 'categorical' && yCol?.type === 'numeric') {
    return [
      { chartType: 'bar', reason: 'Compare mean or total metric values across categories' },
      { chartType: 'box', reason: 'Inspect spread, medians, and outliers per category' },
      { chartType: 'pie', reason: 'Show proportional share across top categories' },
    ];
  }

  if (xCol.type === 'numeric' && !yCol) {
    return [
      { chartType: 'histogram', reason: 'Inspect distribution shape and skewness' },
      { chartType: 'box', reason: 'Spot IQR quartiles and extreme outliers' },
    ];
  }

  return [
    { chartType: 'bar', reason: 'Count frequencies across categories' },
    { chartType: 'pie', reason: 'Display category composition shares' },
  ];
}

export function buildDefaultChartConfig(dataset: Dataset): ChartConfig {
  const cols = dataset.columns;
  const dateCol = cols.find((c) => c.type === 'datetime' && !c.allNull);
  const catCol = cols.find((c) => c.type === 'categorical' && !c.allNull && c.uniqueCount <= 20);
  const numCols = cols.filter((c) => c.type === 'numeric' && !c.allNull);

  if (numCols.length >= 2) {
    return {
      chartType: 'scatter',
      xColumn: numCols[0].name,
      yColumn: numCols[numCols.length - 1].name,
      colorColumn: catCol?.name ?? '',
    };
  }
  if (dateCol && numCols.length >= 1) {
    return {
      chartType: 'line',
      xColumn: dateCol.name,
      yColumn: numCols[0].name,
      colorColumn: '',
    };
  }
  if (catCol && numCols.length >= 1) {
    return {
      chartType: 'bar',
      xColumn: catCol.name,
      yColumn: numCols[0].name,
      colorColumn: '',
    };
  }
  if (numCols.length >= 1) {
    return {
      chartType: 'histogram',
      xColumn: numCols[0].name,
      yColumn: '',
      colorColumn: '',
    };
  }
  return {
    chartType: 'bar',
    xColumn: cols[0]?.name ?? '',
    yColumn: '',
    colorColumn: '',
  };
}

export function escapeCsvCell(value: CellValue): string {
  if (isNullish(value)) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function datasetToCsv(dataset: Dataset): string {
  const headers = dataset.columns.map((c) => c.name);
  const lines = [headers.map(escapeCsvCell).join(',')];
  for (const row of dataset.rows) {
    lines.push(headers.map((h) => escapeCsvCell(row[h])).join(','));
  }
  return lines.join('\n');
}

export function summaryToCsv(dataset: Dataset, summary: StatsResult): string {
  const lines: string[] = [];
  lines.push(
    [
      'Column',
      'Type',
      'Count',
      'Missing',
      'Mean',
      'Median',
      'Mode',
      'StdDev',
      'Variance',
      'Min',
      'Q1',
      'Q3',
      'IQR',
      'Max',
      'Skewness',
      'Kurtosis',
      'UniqueCount',
      'TopValue',
      'TopFrequency',
    ].join(',')
  );

  for (const num of summary.numeric) {
    lines.push(
      [
        num.column,
        'numeric',
        num.count,
        num.missingCount,
        num.mean,
        num.median,
        num.mode,
        num.std,
        num.variance,
        num.min,
        num.q1,
        num.q3,
        num.iqr,
        num.max,
        num.skewness,
        num.kurtosis,
        '',
        '',
        '',
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  for (const cat of summary.categorical) {
    const colMeta = dataset.columns.find((c) => c.name === cat.column);
    lines.push(
      [
        cat.column,
        colMeta?.type ?? 'categorical',
        cat.count,
        cat.missingCount,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        cat.uniqueCount,
        cat.topValue,
        cat.topFrequency,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  return lines.join('\n');
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
