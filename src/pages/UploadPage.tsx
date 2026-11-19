import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, Sparkles, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  selectExcelSheetFromService,
  uploadSpreadsheetFile,
} from '../services/analysisService';
import type { AnalysisBundle } from '../types/analysis';

interface UploadPageProps {
  onBundleLoaded: (bundle: AnalysisBundle) => void;
  onLoadSample: () => Promise<unknown>;
  onGoToDashboard: () => void;
}

interface PendingExcelState {
  fileId?: string;
  fileName: string;
  sheetNames: string[];
  selectedSheet: string;
  localWorkbook?: unknown;
}

export function UploadPage({
  onBundleLoaded,
  onLoadSample,
  onGoToDashboard,
}: UploadPageProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingExcel, setPendingExcel] = useState<PendingExcelState | null>(null);

  const processFile = async (file: File) => {
    setErrorMessage(null);
    setPendingExcel(null);
    setIsParsing(true);

    try {
      const outcome = await uploadSpreadsheetFile(file);
      if (outcome.status === 'ready') {
        onBundleLoaded(outcome.bundle);
        onGoToDashboard();
      } else {
        setPendingExcel({
          fileId: outcome.fileId,
          fileName: outcome.fileName,
          sheetNames: outcome.sheetNames,
          selectedSheet: outcome.sheetNames[0],
          localWorkbook: outcome.localWorkbook,
        });
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Could not parse this file. Please ensure it is a valid CSV or Excel spreadsheet.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmSheet = async () => {
    if (!pendingExcel) return;
    setIsParsing(true);
    setErrorMessage(null);
    try {
      const bundle = await selectExcelSheetFromService({
        fileId: pendingExcel.fileId,
        fileName: pendingExcel.fileName,
        sheetName: pendingExcel.selectedSheet,
        localWorkbook: pendingExcel.localWorkbook,
      });
      onBundleLoaded(bundle);
      onGoToDashboard();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to extract the selected worksheet.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1040px] px-6 py-12 lg:px-10 lg:py-16">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.16em] uppercase text-[#F32E35]">
          Upload Dataset
        </p>
        <h1 className="mt-2 font-display-condensed text-4xl font-extrabold uppercase tracking-wide text-[#08070B] sm:text-5xl dark:text-[#F4F4F6]">
          Drop a CSV or Excel workbook to begin
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#52525B] sm:text-base dark:text-[#9CA3AF]">
          Supports <code className="font-mono-tabular">.csv</code>,{' '}
          <code className="font-mono-tabular">.xlsx</code>, and{' '}
          <code className="font-mono-tabular">.xls</code> files up to 50 MB. Files are parsed and
          analyzed by the Python FastAPI + Pandas engine, with multi-sheet worksheet selection.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void processFile(file);
        }}
        className={`mt-8 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
          isDragging
            ? 'border-[#F32E35] bg-[#F32E35]/8'
            : 'border-black/20 bg-white dark:border-white/20 dark:bg-[#111118]'
        }`}
      >
        <input
          ref={inputRef}
          id="dataset-file-input"
          type="file"
          accept=".csv,.xlsx,.xls"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void processFile(file);
            e.target.value = '';
          }}
        />

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#4E50DE]/12 text-[#4E50DE]">
          {isParsing ? (
            <Loader2 className="h-7 w-7 animate-spin text-[#F32E35]" />
          ) : (
            <UploadCloud className="h-7 w-7" />
          )}
        </div>

        <h2 className="mt-4 font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
          {isParsing ? 'Analyzing in Python FastAPI...' : 'Drag & drop your spreadsheet here'}
        </h2>
        <p className="mt-1.5 text-sm text-[#52525B] dark:text-[#9CA3AF]">
          or browse from your computer
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={isParsing}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md bg-[#F32E35] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#ff4249] disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Choose CSV or Excel File</span>
          </button>

          <button
            type="button"
            disabled={isParsing}
            onClick={async () => {
              await onLoadSample();
              onGoToDashboard();
            }}
            className="inline-flex items-center gap-2 rounded-md border border-black/20 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#08070B] transition-colors hover:border-[#4E50DE] hover:text-[#4E50DE] disabled:opacity-50 dark:border-white/20 dark:text-[#F4F4F6] dark:hover:border-[#4E50DE]"
          >
            <Sparkles className="h-4 w-4 text-[#4E50DE]" />
            <span>Load Sample Sales Data</span>
          </button>
        </div>
      </div>

      {/* Friendly Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-xl border border-[#F32E35]/40 bg-[#F32E35]/10 p-4 text-sm text-[#08070B] dark:text-[#F4F4F6]"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#F32E35]" />
          <div>
            <p className="font-semibold text-[#F32E35]">Unable to load file</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Multi-Sheet Excel Selector */}
      {pendingExcel && (
        <section className="mt-6 rounded-xl border border-black/15 bg-white p-6 dark:border-white/15 dark:bg-[#111118]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#4E50DE]">
                <CheckCircle2 className="h-4 w-4" />
                <span>Multi-Sheet Workbook Detected</span>
              </div>
              <h3 className="mt-1 font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
                Select a worksheet from {pendingExcel.fileName}
              </h3>
              <p className="mt-0.5 text-xs text-[#52525B] dark:text-[#9CA3AF]">
                Found {pendingExcel.sheetNames.length} sheets. Choose the sheet you want to analyze.
              </p>
            </div>

            <button
              type="button"
              disabled={isParsing}
              onClick={() => void handleConfirmSheet()}
              className="rounded-md bg-[#F32E35] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#ff4249] disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              Analyze Selected Sheet
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {pendingExcel.sheetNames.map((sheet) => {
              const selected = pendingExcel.selectedSheet === sheet;
              return (
                <button
                  key={sheet}
                  type="button"
                  onClick={() =>
                    setPendingExcel((prev) => (prev ? { ...prev, selectedSheet: sheet } : prev))
                  }
                  className={`flex items-center justify-between rounded-md border px-4 py-3 text-left text-sm font-medium transition-colors ${
                    selected
                      ? 'border-[#4E50DE] bg-[#4E50DE] text-white'
                      : 'border-black/15 bg-black/[0.02] text-[#08070B] hover:border-[#4E50DE] dark:border-white/15 dark:bg-white/[0.03] dark:text-[#F4F4F6]'
                  }`}
                >
                  <span className="truncate">{sheet}</span>
                  {selected && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
