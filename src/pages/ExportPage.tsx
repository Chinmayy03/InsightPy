import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { useState } from 'react';
import type { AppRoute } from '../components/Navbar';
import { fetchCsvExportFromService } from '../services/analysisService';
import type { AnalysisBundle } from '../types/analysis';

interface ExportPageProps {
  bundle: AnalysisBundle | null;
  onNavigate: (route: AppRoute) => void;
}

function triggerCsvDownload(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ExportPage({ bundle, onNavigate }: ExportPageProps) {
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  if (!bundle) {
    return (
      <div className="mx-auto max-w-[780px] px-6 py-20 text-center">
        <h1 className="font-display-condensed text-4xl font-extrabold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
          Nothing to Export Yet
        </h1>
        <p className="mt-2 text-sm text-[#52525B] dark:text-[#9CA3AF]">
          Upload a dataset or open the sample workspace first to generate downloadable reports.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('upload')}
          className="mt-6 rounded-md bg-[#F32E35] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white"
        >
          Upload a Dataset
        </button>
      </div>
    );
  }

  const baseName = bundle.dataset.name.replace(/\.(csv|xlsx|xls)$/i, '');

  const handleDownloadSummary = async () => {
    const csv = await fetchCsvExportFromService('summary', bundle);
    triggerCsvDownload(`${baseName}_summary_report.csv`, csv);
    setDownloadNotice(`Downloaded ${baseName}_summary_report.csv`);
  };

  const handleDownloadCleaned = async () => {
    const csv = await fetchCsvExportFromService('cleaned', bundle);
    triggerCsvDownload(`${baseName}_cleaned.csv`, csv);
    setDownloadNotice(`Downloaded ${baseName}_cleaned.csv`);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-[1140px] px-6 py-12 lg:px-10">
      <div className="no-print">
        <p className="text-xs font-semibold tracking-[0.16em] uppercase text-[#F32E35]">
          Portable Deliverables
        </p>
        <h1 className="mt-2 font-display-condensed text-4xl font-extrabold uppercase tracking-wide text-[#08070B] sm:text-5xl dark:text-[#F4F4F6]">
          Export Data &amp; Summary Report
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#52525B] dark:text-[#9CA3AF]">
          Download Python-generated statistical summaries, export your cleaned dataset CSV, or
          print an executive-ready PDF report.
        </p>

        {downloadNotice && (
          <div
            role="status"
            className="mt-5 rounded-md border border-[#4E50DE]/40 bg-[#4E50DE]/10 px-4 py-3 text-xs font-medium text-[#08070B] dark:text-[#F4F4F6]"
          >
            {downloadNotice}
          </div>
        )}

        {/* Export Action Cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#111118]">
            <div>
              <FileText className="h-6 w-6 text-[#4E50DE]" />
              <h2 className="mt-4 font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
                Statistical Summary CSV
              </h2>
              <p className="mt-2 text-sm text-[#52525B] dark:text-[#9CA3AF]">
                Exports mean, median, mode, std, variance, quartiles, IQR, skewness, kurtosis, and
                categorical frequencies for every column.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadSummary}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-[#4E50DE] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#5E60EE]"
            >
              <Download className="h-4 w-4" />
              <span>Download Summary CSV</span>
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#111118]">
            <div>
              <FileSpreadsheet className="h-6 w-6 text-[#F32E35]" />
              <h2 className="mt-4 font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
                Cleaned Dataset CSV
              </h2>
              <p className="mt-2 text-sm text-[#52525B] dark:text-[#9CA3AF]">
                Exports all {bundle.dataset.rowCount.toLocaleString()} current rows and{' '}
                {bundle.dataset.columnCount} columns reflecting any applied cleaning fixes.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadCleaned}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-[#4E50DE] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#5E60EE]"
            >
              <Download className="h-4 w-4" />
              <span>Download Cleaned CSV</span>
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#111118]">
            <div>
              <Printer className="h-6 w-6 text-[#F32E35]" />
              <h2 className="mt-4 font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
                Print / Save Report as PDF
              </h2>
              <p className="mt-2 text-sm text-[#52525B] dark:text-[#9CA3AF]">
                Opens your browser&rsquo;s clean print layout formatted specifically for saving as a
                structured PDF briefing.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrintPdf}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-[#F32E35] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#ff4249]"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save report as PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Report Preview */}
      <section className="mt-10 rounded-xl border border-black/10 bg-white p-8 dark:border-white/10 dark:bg-[#111118]">
        <div className="border-b border-black/10 pb-5 dark:border-white/10">
          <p className="text-xs font-medium text-[#52525B] dark:text-[#9CA3AF]">
            InsightPy Executive Data Report
          </p>
          <h2 className="mt-1 font-display-condensed text-3xl font-extrabold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
            {bundle.dataset.name}
          </h2>
          <p className="mt-1 text-xs text-[#52525B] tabular-nums dark:text-[#9CA3AF]">
            {bundle.dataset.rowCount.toLocaleString()} rows · {bundle.dataset.columnCount} columns ·{' '}
            {bundle.dataset.totalMissing} missing cells · {bundle.dataset.duplicateCount} duplicates
          </p>
        </div>

        {/* Key Insights Digest */}
        <div className="mt-6 print-break-avoid">
          <h3 className="font-display-condensed text-xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
            Automated Insights Digest
          </h3>
          <ul className="mt-3 space-y-2.5 text-sm">
            {bundle.insights.map((ins) => (
              <li
                key={ins.id}
                className="rounded-lg border border-black/10 bg-black/[0.02] px-4 py-3 dark:border-white/10 dark:bg-[#08070B]"
              >
                <span className="font-semibold text-[#08070B] dark:text-[#F4F4F6]">
                  {ins.title}:
                </span>{' '}
                <span className="text-[#52525B] dark:text-[#9CA3AF]">{ins.description}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Correlations */}
        {bundle.correlations.pairs.length > 0 && (
          <div className="mt-8 print-break-avoid">
            <h3 className="font-display-condensed text-xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
              Strongest Variable Correlations
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-[#52525B] dark:border-white/10 dark:text-[#9CA3AF]">
                    <th className="py-2 pr-4">Variable Pair</th>
                    <th className="px-4 py-2">Interpretation</th>
                    <th className="pl-4 py-2 text-right">Pearson r</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 dark:divide-white/10">
                  {bundle.correlations.pairs.slice(0, 6).map((p) => (
                    <tr key={`${p.colA}-${p.colB}`}>
                      <td className="py-2 pr-4 font-medium">
                        {p.colA} ↔ {p.colB}
                      </td>
                      <td className="px-4 py-2 capitalize text-[#52525B] dark:text-[#9CA3AF]">
                        {p.label}
                      </td>
                      <td className="pl-4 py-2 text-right font-mono-tabular font-semibold text-[#F32E35]">
                        {p.r.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
