import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCleaningAction,
  buildDatasetObject,
  computeCorrelations,
  computeInsights,
  computeNumericColumnStats,
  computeOutliers,
  computeSummary,
  datasetToCsv,
  detectCleaningIssues,
  inferColumnType,
  pearsonCorrelation,
  summaryToCsv,
} from './statsMath';
import { buildSampleSalesDataset } from './sampleDataset';
import { analyzeDataset, cleanDataset } from '../services/analysisService';

test('inferColumnType handles numeric, datetime, categorical, all-null, and mixed types', () => {
  assert.equal(inferColumnType([10, 20, '30.5', '$40']).type, 'numeric');
  assert.equal(inferColumnType(['2025-01-01', '2025-02-14', '2025-03-30']).type, 'datetime');
  assert.equal(inferColumnType(['North', 'South', 'East']).type, 'categorical');

  const allNull = inferColumnType([null, '', 'N/A', undefined]);
  assert.equal(allNull.allNull, true);

  const mixed = inferColumnType([10, 'hello', 20, 'world', 30]);
  assert.equal(mixed.mixedTypes, true);
});

test('computeNumericColumnStats computes exact descriptive metrics, quartiles, and IQR', () => {
  // Known small sequence: [2, 4, 4, 4, 5, 5, 7, 9] -> mean 5, median 4.5, mode 4, q1=4, q3=5.5, iqr=1.5
  const stats = computeNumericColumnStats('Score', [2, 4, 4, 4, 5, 5, 7, 9, null]);
  assert.equal(stats.count, 8);
  assert.equal(stats.missingCount, 1);
  assert.equal(stats.mean, 5);
  assert.equal(stats.median, 4.5);
  assert.equal(stats.mode, 4);
  assert.equal(stats.min, 2);
  assert.equal(stats.max, 9);
  assert.equal(stats.q1, 4);
  assert.equal(stats.q3, 5.5);
  assert.equal(stats.iqr, 1.5);
  assert.ok(stats.std !== null && stats.std > 2 && stats.std < 2.2);
  assert.ok(stats.skewness !== null);
  assert.ok(stats.kurtosis !== null);
});

test('pearsonCorrelation returns +1 for perfect linear positive and -1 for negative', () => {
  assert.equal(pearsonCorrelation([1, 2, 3, 4], [10, 20, 30, 40]), 1);
  assert.equal(pearsonCorrelation([1, 2, 3, 4], [40, 30, 20, 10]), -1);
  assert.equal(pearsonCorrelation([1, 1, 1], [2, 3, 4]), null);
});

test('sample dataset produces rich stats, correlations, outliers, insights, and cleaning actions', async () => {
  const rows = buildSampleSalesDataset();
  const bundle = await analyzeDataset({
    id: 'sample-test',
    name: 'Retail_Sales_Sample.csv',
    sourceType: 'sample',
    rows,
  });

  assert.equal(bundle.dataset.rowCount, 123);
  assert.equal(bundle.dataset.duplicateCount, 3);
  assert.ok(bundle.dataset.totalMissing > 0);
  assert.ok(bundle.correlations.pairs.length > 0);
  assert.ok(bundle.correlations.pairs[0].absR > 0.7);
  assert.ok(bundle.outliers.totalOutliers >= 3);
  assert.ok(bundle.insights.length >= 4);
  assert.ok(bundle.issues.length >= 2);

  // Clean duplicates and verify duplicateCount drops to 0
  const afterDup = await cleanDataset(bundle.dataset, {
    type: 'remove_duplicates',
    label: 'Remove Duplicates',
    description: 'Remove duplicates',
  });
  assert.equal(afterDup.dataset.duplicateCount, 0);
  assert.equal(afterDup.dataset.rowCount, 120);

  // Fill missing Customer_Rating with median
  const afterFill = await cleanDataset(afterDup.dataset, {
    type: 'fill_median',
    column: 'Customer_Rating',
    label: 'Fill with Median',
    description: 'Fill missing ratings',
  });
  const ratingCol = afterFill.dataset.columns.find((c) => c.name === 'Customer_Rating');
  assert.equal(ratingCol?.missingCount, 0);
});

test('edge cases: empty dataset, single-column file, all-null column, and 50,000+ row cap', () => {
  const emptyDs = buildDatasetObject('e1', 'empty.csv', 'csv', []);
  assert.equal(emptyDs.rowCount, 0);
  assert.equal(emptyDs.columnCount, 0);
  const emptySummary = computeSummary(emptyDs);
  const emptyInsights = computeInsights(
    emptyDs,
    emptySummary,
    computeCorrelations(emptyDs),
    computeOutliers(emptyDs, emptySummary)
  );
  assert.equal(emptyInsights.length, 1);

  const singleCol = buildDatasetObject('s1', 'single.csv', 'csv', [
    { OnlyCol: 10 },
    { OnlyCol: 20 },
    { OnlyCol: 30 },
  ]);
  assert.equal(singleCol.columnCount, 1);
  assert.equal(computeCorrelations(singleCol).pairs.length, 0);

  const allNullDs = buildDatasetObject('n1', 'nullcol.csv', 'csv', [
    { Keep: 1, EmptyCol: null },
    { Keep: 2, EmptyCol: '' },
  ]);
  assert.equal(allNullDs.columns.find((c) => c.name === 'EmptyCol')?.allNull, true);
  const issues = detectCleaningIssues(allNullDs);
  assert.ok(issues.some((i) => i.id === 'issue-all-null-cols'));
  const dropped = applyCleaningAction(allNullDs, {
    type: 'drop_all_null_columns',
    label: 'Drop Empty Columns',
    description: 'Drop all-null columns',
  });
  assert.equal(dropped.columnCount, 1);

  // Large dataset capping above 50,000 rows
  const hugeRows = Array.from({ length: 50500 }, (_, idx) => ({ ID: idx, Val: idx % 100 }));
  const hugeDs = buildDatasetObject('big', 'huge.csv', 'csv', hugeRows);
  assert.equal(hugeDs.rowCount, 50000);
  assert.equal(hugeDs.isLargeSampled, true);

  // CSV serialization works cleanly
  const csv = datasetToCsv(singleCol);
  assert.ok(csv.includes('OnlyCol'));
  const summaryCsv = summaryToCsv(singleCol, computeSummary(singleCol));
  assert.ok(summaryCsv.includes('Mean'));
});
