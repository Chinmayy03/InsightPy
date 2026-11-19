export type ColumnType = 'numeric' | 'categorical' | 'datetime';

export type CellValue = string | number | boolean | null | undefined;

export type DataRow = Record<string, CellValue>;

export interface ColumnMeta {
  name: string;
  type: ColumnType;
  nonNullCount: number;
  missingCount: number;
  missingPct: number;
  uniqueCount: number;
  sampleValues: string[];
  allNull: boolean;
  mixedTypes: boolean;
}

export interface Dataset {
  id: string;
  name: string;
  sourceType: 'sample' | 'csv' | 'excel';
  sheetName?: string;
  rows: DataRow[];
  columns: ColumnMeta[];
  rowCount: number;
  columnCount: number;
  duplicateCount: number;
  totalMissing: number;
  memoryEstimateBytes: number;
  isLargeSampled: boolean;
  uploadedAt: string;
}

export interface NumericStats {
  column: string;
  count: number;
  missingCount: number;
  mean: number | null;
  median: number | null;
  mode: number | null;
  std: number | null;
  variance: number | null;
  min: number | null;
  max: number | null;
  q1: number | null;
  q3: number | null;
  iqr: number | null;
  skewness: number | null;
  kurtosis: number | null;
}

export interface CategoryFrequency {
  value: string;
  count: number;
  percentage: number;
}

export interface CategoricalStats {
  column: string;
  count: number;
  missingCount: number;
  uniqueCount: number;
  topValue: string | null;
  topFrequency: number;
  topValues: CategoryFrequency[];
}

export interface StatsResult {
  datasetId: string;
  numeric: NumericStats[];
  categorical: CategoricalStats[];
  missingByColumn: Array<{
    column: string;
    missingCount: number;
    missingPct: number;
  }>;
}

export type CorrelationStrengthLabel =
  | 'strong positive'
  | 'moderate positive'
  | 'weak positive'
  | 'negligible'
  | 'weak negative'
  | 'moderate negative'
  | 'strong negative';

export interface CorrelationPair {
  colA: string;
  colB: string;
  r: number;
  absR: number;
  label: CorrelationStrengthLabel;
  sampleSize: number;
}

export interface CorrelationResult {
  columns: string[];
  matrix: (number | null)[][];
  pairs: CorrelationPair[];
}

export interface OutlierColumnSummary {
  column: string;
  q1: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
  outlierCount: number;
  outlierPct: number;
  sampleOutliers: number[];
}

export interface OutlierResult {
  totalOutliers: number;
  columns: OutlierColumnSummary[];
}

export type InsightSeverity = 'info' | 'warning' | 'success';

export type InsightCategory =
  | 'correlation'
  | 'missing'
  | 'skewness'
  | 'outlier'
  | 'dominance'
  | 'trend'
  | 'quality';

export interface Insight {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  category: InsightCategory;
  metric?: string;
}

export type CleaningActionType =
  | 'drop_missing_rows'
  | 'fill_mean'
  | 'fill_median'
  | 'fill_mode'
  | 'remove_duplicates'
  | 'drop_all_null_columns';

export interface CleaningAction {
  type: CleaningActionType;
  column?: string;
  label: string;
  description: string;
}

export interface CleaningIssue {
  id: string;
  title: string;
  description: string;
  severity: 'warning' | 'info';
  affectedCount: number;
  column?: string;
  actions: CleaningAction[];
}

export interface AnalysisBundle {
  dataset: Dataset;
  summary: StatsResult;
  correlations: CorrelationResult;
  outliers: OutlierResult;
  insights: Insight[];
  issues: CleaningIssue[];
  executionMode: 'browser' | 'python-backend';
  backendFallbackReason?: string;
}

export type ChartType =
  | 'bar'
  | 'line'
  | 'scatter'
  | 'histogram'
  | 'box'
  | 'heatmap'
  | 'pie';

export interface ChartConfig {
  chartType: ChartType;
  xColumn: string;
  yColumn?: string;
  colorColumn?: string;
}

export interface ParsedFileResult {
  fileName: string;
  sourceType: 'csv' | 'excel';
  sheetNames: string[];
  selectedSheet?: string;
  rows: DataRow[];
}
