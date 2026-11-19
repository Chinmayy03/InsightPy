import { APP_CONFIG } from '../config';
import type {
  AnalysisBundle,
  CleaningAction,
  CorrelationResult,
  DataRow,
  Dataset,
  Insight,
  OutlierResult,
  StatsResult,
} from '../types/analysis';
import {
  extractSheetRows,
  inspectExcelWorkbook,
  parseCsvFile,
  validateUploadFile,
} from '../utils/fileParser';
import { buildSampleSalesDataset } from '../utils/sampleDataset';
import {
  applyCleaningAction,
  buildDatasetObject,
  computeCorrelations,
  computeInsights,
  computeOutliers,
  computeSummary,
  datasetToCsv,
  detectCleaningIssues,
  summaryToCsv,
} from '../utils/statsMath';

export type FileUploadWorkflowResult =
  | { status: 'ready'; bundle: AnalysisBundle }
  | {
      status: 'sheet_selection_required';
      fileId?: string;
      fileName: string;
      sheetNames: string[];
      localWorkbook?: unknown;
    };

async function fetchBackendJson<T>(
  path: string,
  options?: RequestInit,
  timeoutMs = 10000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${APP_CONFIG.BACKEND_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });
    if (!res.ok) {
      let detail = `Backend responded with status ${res.status}`;
      try {
        const body = (await res.json()) as { detail?: string };
        if (body?.detail) detail = body.detail;
      } catch {
        // Keep status error message
      }
      const err = new Error(detail) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function buildLocalBundle(
  dataset: Dataset,
  fallbackReason?: string
): AnalysisBundle {
  const summary = computeSummary(dataset);
  const correlations = computeCorrelations(dataset);
  const outliers = computeOutliers(dataset, summary);
  const insights = computeInsights(dataset, summary, correlations, outliers);
  const issues = detectCleaningIssues(dataset);

  return {
    dataset,
    summary,
    correlations,
    outliers,
    insights,
    issues,
    executionMode: 'browser',
    backendFallbackReason: fallbackReason,
  };
}

export async function loadSampleDatasetFromService(): Promise<AnalysisBundle> {
  if (APP_CONFIG.USE_PYTHON_BACKEND) {
    try {
      return await fetchBackendJson<AnalysisBundle>('/sample');
    } catch (err) {
      const sampleRows = buildSampleSalesDataset();
      const dataset = buildDatasetObject(
        'sample-retail-sales-2025',
        'Retail_Sales_Performance_Sample.csv',
        'sample',
        sampleRows
      );
      return buildLocalBundle(
        dataset,
        `Python backend (${APP_CONFIG.BACKEND_URL}) was unreachable (${
          err instanceof Error ? err.message : 'connection refused'
        }). Loaded sample locally.`
      );
    }
  }

  const sampleRows = buildSampleSalesDataset();
  const dataset = buildDatasetObject(
    'sample-retail-sales-2025',
    'Retail_Sales_Performance_Sample.csv',
    'sample',
    sampleRows
  );
  return buildLocalBundle(dataset);
}

export async function uploadSpreadsheetFile(file: File): Promise<FileUploadWorkflowResult> {
  const validationError = validateUploadFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  if (APP_CONFIG.USE_PYTHON_BACKEND) {
    try {
      const formData = new FormData();
      formData.append('file', file, file.name);

      const response = await fetchBackendJson<
        | { status: 'ready'; bundle: AnalysisBundle }
        | {
            status: 'sheet_selection_required';
            fileId: string;
            fileName: string;
            sheetNames: string[];
          }
      >(
        '/upload-file',
        {
          method: 'POST',
          body: formData,
        },
        30000
      );

      return response;
    } catch (err) {
      // If Python explicitly rejected invalid file/sheet (4xx), surface the Python error directly
      const status = (err as { status?: number })?.status;
      if (status && status >= 400 && status < 500) {
        throw err;
      }
      // Network/5xx unreachable -> fall back cleanly to local parser
    }
  }

  const lower = file.name.toLowerCase();
  if (lower.endsWith('.csv')) {
    const parsed = await parseCsvFile(file);
    const dataset = buildDatasetObject(
      `csv-${Date.now()}`,
      parsed.fileName,
      'csv',
      parsed.rows
    );
    return {
      status: 'ready',
      bundle: buildLocalBundle(
        dataset,
        APP_CONFIG.USE_PYTHON_BACKEND
          ? `Python backend (${APP_CONFIG.BACKEND_URL}) was unreachable during upload. Parsed in-browser.`
          : undefined
      ),
    };
  }

  const { workbook, sheetNames } = await inspectExcelWorkbook(file);
  if (sheetNames.length === 1) {
    const rows = extractSheetRows(workbook, sheetNames[0]);
    const dataset = buildDatasetObject(
      `xlsx-${Date.now()}`,
      file.name,
      'excel',
      rows,
      sheetNames[0]
    );
    return {
      status: 'ready',
      bundle: buildLocalBundle(
        dataset,
        APP_CONFIG.USE_PYTHON_BACKEND
          ? `Python backend (${APP_CONFIG.BACKEND_URL}) was unreachable during upload. Parsed in-browser.`
          : undefined
      ),
    };
  }

  return {
    status: 'sheet_selection_required',
    fileName: file.name,
    sheetNames,
    localWorkbook: workbook,
  };
}

export async function selectExcelSheetFromService(params: {
  fileId?: string;
  fileName: string;
  sheetName: string;
  localWorkbook?: unknown;
}): Promise<AnalysisBundle> {
  if (APP_CONFIG.USE_PYTHON_BACKEND && params.fileId) {
    const response = await fetchBackendJson<{ status: 'ready'; bundle: AnalysisBundle }>(
      '/upload-excel-sheet',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: params.fileId,
          sheetName: params.sheetName,
        }),
      },
      30000
    );
    return response.bundle;
  }

  if (!params.localWorkbook) {
    throw new Error('Missing workbook context for worksheet extraction.');
  }
  const rows = extractSheetRows(
    params.localWorkbook as Parameters<typeof extractSheetRows>[0],
    params.sheetName
  );
  const dataset = buildDatasetObject(
    `xlsx-${Date.now()}`,
    params.fileName,
    'excel',
    rows,
    params.sheetName
  );
  return buildLocalBundle(dataset);
}

export async function getSummary(dataset: Dataset): Promise<StatsResult> {
  if (APP_CONFIG.USE_PYTHON_BACKEND) {
    try {
      return await fetchBackendJson<StatsResult>(`/summary/${encodeURIComponent(dataset.id)}`);
    } catch {
      return computeSummary(dataset);
    }
  }
  return computeSummary(dataset);
}

export async function getCorrelations(dataset: Dataset): Promise<CorrelationResult> {
  if (APP_CONFIG.USE_PYTHON_BACKEND) {
    try {
      return await fetchBackendJson<CorrelationResult>(
        `/correlations/${encodeURIComponent(dataset.id)}`
      );
    } catch {
      return computeCorrelations(dataset);
    }
  }
  return computeCorrelations(dataset);
}

export async function detectOutliers(
  dataset: Dataset,
  summary?: StatsResult
): Promise<OutlierResult> {
  if (APP_CONFIG.USE_PYTHON_BACKEND) {
    try {
      return await fetchBackendJson<OutlierResult>(
        `/outliers/${encodeURIComponent(dataset.id)}`
      );
    } catch {
      const resolvedSummary = summary ?? computeSummary(dataset);
      return computeOutliers(dataset, resolvedSummary);
    }
  }
  const resolvedSummary = summary ?? computeSummary(dataset);
  return computeOutliers(dataset, resolvedSummary);
}

export async function generateInsights(
  dataset: Dataset,
  summary?: StatsResult,
  correlations?: CorrelationResult,
  outliers?: OutlierResult
): Promise<Insight[]> {
  if (APP_CONFIG.USE_PYTHON_BACKEND) {
    try {
      return await fetchBackendJson<Insight[]>(`/insights/${encodeURIComponent(dataset.id)}`);
    } catch {
      const s = summary ?? computeSummary(dataset);
      const c = correlations ?? computeCorrelations(dataset);
      const o = outliers ?? computeOutliers(dataset, s);
      return computeInsights(dataset, s, c, o);
    }
  }
  const s = summary ?? computeSummary(dataset);
  const c = correlations ?? computeCorrelations(dataset);
  const o = outliers ?? computeOutliers(dataset, s);
  return computeInsights(dataset, s, c, o);
}

export async function analyzeDataset(
  input:
    | Dataset
    | {
        id: string;
        name: string;
        sourceType: 'sample' | 'csv' | 'excel';
        rows: DataRow[];
        sheetName?: string;
      }
): Promise<AnalysisBundle> {
  const dataset: Dataset =
    'columns' in input
      ? input
      : buildDatasetObject(input.id, input.name, input.sourceType, input.rows, input.sheetName);

  if (APP_CONFIG.USE_PYTHON_BACKEND) {
    try {
      const uploaded = await fetchBackendJson<{ dataset: Dataset; bundle?: AnalysisBundle }>(
        '/upload',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: dataset.id,
            name: dataset.name,
            sourceType: dataset.sourceType,
            sheetName: dataset.sheetName,
            rows: dataset.rows,
          }),
        },
        20000
      );

      if (uploaded.bundle) {
        return uploaded.bundle;
      }

      const resolvedDs = uploaded.dataset ?? dataset;
      return await fetchBackendJson<AnalysisBundle>(
        `/analyze/${encodeURIComponent(resolvedDs.id)}`
      );
    } catch (err) {
      return buildLocalBundle(
        dataset,
        `Python backend (${APP_CONFIG.BACKEND_URL}) is unreachable (${
          err instanceof Error ? err.message : 'connection refused'
        }). Switched automatically to offline fallback analysis.`
      );
    }
  }

  return buildLocalBundle(dataset);
}

export async function cleanDataset(
  dataset: Dataset,
  action: CleaningAction
): Promise<AnalysisBundle> {
  if (APP_CONFIG.USE_PYTHON_BACKEND) {
    try {
      const updated = await fetchBackendJson<{ dataset: Dataset; bundle?: AnalysisBundle }>(
        `/clean/${encodeURIComponent(dataset.id)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action),
        }
      );
      if (updated?.bundle) {
        return updated.bundle;
      }
      if (updated?.dataset) {
        return analyzeDataset(updated.dataset);
      }
    } catch {
      const cleaned = applyCleaningAction(dataset, action);
      return buildLocalBundle(
        cleaned,
        `Python backend (${APP_CONFIG.BACKEND_URL}) was unreachable during cleaning. Applied cleaning in-browser.`
      );
    }
  }

  const cleaned = applyCleaningAction(dataset, action);
  return buildLocalBundle(cleaned);
}

export async function resetDatasetOnService(originalDataset: Dataset): Promise<AnalysisBundle> {
  if (APP_CONFIG.USE_PYTHON_BACKEND) {
    try {
      return await fetchBackendJson<AnalysisBundle>(
        `/reset/${encodeURIComponent(originalDataset.id)}`,
        { method: 'POST' }
      );
    } catch {
      return buildLocalBundle(
        originalDataset,
        `Python backend (${APP_CONFIG.BACKEND_URL}) was unreachable during reset. Restored in-browser.`
      );
    }
  }
  return buildLocalBundle(originalDataset);
}

export async function fetchCsvExportFromService(
  type: 'cleaned' | 'summary',
  bundle: AnalysisBundle
): Promise<string> {
  if (APP_CONFIG.USE_PYTHON_BACKEND && bundle.executionMode === 'python-backend') {
    try {
      const endpoint =
        type === 'cleaned'
          ? `/export/cleaned/${encodeURIComponent(bundle.dataset.id)}`
          : `/export/summary/${encodeURIComponent(bundle.dataset.id)}`;
      const res = await fetch(`${APP_CONFIG.BACKEND_URL}${endpoint}`);
      if (res.ok) {
        return await res.text();
      }
    } catch {
      // Fallback to local CSV serialization if offline
    }
  }
  return type === 'cleaned'
    ? datasetToCsv(bundle.dataset)
    : summaryToCsv(bundle.dataset, bundle.summary);
}
