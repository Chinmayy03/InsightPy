import { useCallback, useEffect, useState } from 'react';
import {
  analyzeDataset,
  cleanDataset,
  loadSampleDatasetFromService,
  resetDatasetOnService,
} from '../services/analysisService';
import type { AnalysisBundle, CleaningAction, DataRow, Dataset } from '../types/analysis';

export function useDatasetWorkspace() {
  const [bundle, setBundle] = useState<AnalysisBundle | null>(null);
  const [originalDataset, setOriginalDataset] = useState<Dataset | null>(null);
  const [cleaningHistory, setCleaningHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const applyAnalysisBundle = useCallback((result: AnalysisBundle) => {
    setBundle(result);
    setOriginalDataset(result.dataset);
    setCleaningHistory([]);
    setError(null);
    return result;
  }, []);

  const loadRows = useCallback(
    async (params: {
      id: string;
      name: string;
      sourceType: 'sample' | 'csv' | 'excel';
      rows: DataRow[];
      sheetName?: string;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await analyzeDataset(params);
        return applyAnalysisBundle(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to analyze this dataset.';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [applyAnalysisBundle]
  );

  const loadSampleDataset = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loadSampleDatasetFromService();
      return applyAnalysisBundle(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to load sample dataset.';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [applyAnalysisBundle]);

  const runCleaningAction = useCallback(
    async (action: CleaningAction) => {
      if (!bundle) return null;
      setIsLoading(true);
      setError(null);
      try {
        const nextBundle = await cleanDataset(bundle.dataset, action);
        setBundle(nextBundle);
        setCleaningHistory((prev) => [
          ...prev,
          action.column ? `${action.label} (${action.column})` : action.label,
        ]);
        return nextBundle;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to apply data cleaning fix.';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [bundle]
  );

  const resetToOriginal = useCallback(async () => {
    if (!originalDataset) return null;
    setIsLoading(true);
    setError(null);
    try {
      const restored = await resetDatasetOnService(originalDataset);
      setBundle(restored);
      setCleaningHistory([]);
      return restored;
    } finally {
      setIsLoading(false);
    }
  }, [originalDataset]);

  const clearDataset = useCallback(() => {
    setBundle(null);
    setOriginalDataset(null);
    setCleaningHistory([]);
    setError(null);
  }, []);

  // Preload Python-analyzed sample dataset on startup
  useEffect(() => {
    void loadSampleDataset();
  }, [loadSampleDataset]);

  return {
    bundle,
    cleaningHistory,
    hasOriginalChanges: cleaningHistory.length > 0,
    isLoading,
    error,
    applyAnalysisBundle,
    loadRows,
    loadSampleDataset,
    runCleaningAction,
    resetToOriginal,
    clearDataset,
  };
}
