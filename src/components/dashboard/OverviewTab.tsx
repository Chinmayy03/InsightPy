import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { APP_CONFIG } from '../../config';
import type { Dataset } from '../../types/analysis';
import { formatBytes, isNullish, parseNumericValue } from '../../utils/statsMath';
import { StatTooltip } from '../StatTooltip';

interface OverviewTabProps {
  dataset: Dataset;
}

export function OverviewTab({ dataset }: OverviewTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const typeCounts = useMemo(() => {
    const counts = { numeric: 0, categorical: 0, datetime: 0 };
    for (const c of dataset.columns) {
      counts[c.type]++;
    }
    return counts;
  }, [dataset.columns]);

  const filteredAndSortedRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let rows = dataset.rows;
    if (q) {
      rows = rows.filter((row) =>
        dataset.columns.some((col) => {
          const v = row[col.name];
          return !isNullish(v) && String(v).toLowerCase().includes(q);
        })
      );
    }

    if (sortCol) {
      const colMeta = dataset.columns.find((c) => c.name === sortCol);
      const isNum = colMeta?.type === 'numeric';
      rows = [...rows].sort((a, b) => {
        const av = a[sortCol];
        const bv = b[sortCol];
        const aNull = isNullish(av);
        const bNull = isNullish(bv);
        if (aNull && bNull) return 0;
        if (aNull) return 1;
        if (bNull) return -1;

        if (isNum) {
          const an = parseNumericValue(av) ?? 0;
          const bn = parseNumericValue(bv) ?? 0;
          return sortDir === 'asc' ? an - bn : bn - an;
        }
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }, [dataset.columns, dataset.rows, searchQuery, sortCol, sortDir]);

  const pageSize = APP_CONFIG.PREVIEW_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = filteredAndSortedRows.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const toggleSort = (colName: string) => {
    setPage(1);
    if (sortCol === colName) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(colName);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-8">
      {dataset.isLargeSampled && (
        <div
          role="status"
          className="rounded-xl border border-[#F32E35]/40 bg-[#F32E35]/10 px-5 py-3.5 text-sm text-[#08070B] dark:text-[#F4F4F6]"
        >
          <span className="font-semibold text-[#F32E35]">Large dataset notice:</span> This file
          exceeded {APP_CONFIG.LARGE_ROW_CAP.toLocaleString()} rows. In-browser preview and analysis
          are capped at the first {APP_CONFIG.LARGE_ROW_CAP.toLocaleString()} rows for responsive
          performance.
        </div>
      )}

      {/* Primary KPI Grid */}
      <section aria-label="Dataset summary metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#111118]">
          <p className="text-xs font-medium text-[#52525B] dark:text-[#9CA3AF]">Total Rows</p>
          <p className="mt-2 font-mono-tabular text-2xl font-bold text-[#08070B] dark:text-[#F4F4F6]">
            {dataset.rowCount.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#111118]">
          <p className="text-xs font-medium text-[#52525B] dark:text-[#9CA3AF]">Columns</p>
          <p className="mt-2 font-mono-tabular text-2xl font-bold text-[#08070B] dark:text-[#F4F4F6]">
            {dataset.columnCount.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#111118]">
          <p className="text-xs font-medium text-[#52525B] dark:text-[#9CA3AF]">
            Memory Estimate
            <StatTooltip
              term="Memory Estimate"
              explanation="Approximate RAM size of the parsed table held privately inside your browser."
            />
          </p>
          <p className="mt-2 font-mono-tabular text-2xl font-bold text-[#4E50DE] dark:text-[#8183FF]">
            {formatBytes(dataset.memoryEstimateBytes)}
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#111118]">
          <p className="text-xs font-medium text-[#52525B] dark:text-[#9CA3AF]">Missing Values</p>
          <p
            className={`mt-2 font-mono-tabular text-2xl font-bold ${
              dataset.totalMissing > 0
                ? 'text-[#F32E35]'
                : 'text-[#08070B] dark:text-[#F4F4F6]'
            }`}
          >
            {dataset.totalMissing.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#111118]">
          <p className="text-xs font-medium text-[#52525B] dark:text-[#9CA3AF]">Duplicate Rows</p>
          <p
            className={`mt-2 font-mono-tabular text-2xl font-bold ${
              dataset.duplicateCount > 0
                ? 'text-[#F32E35]'
                : 'text-[#08070B] dark:text-[#F4F4F6]'
            }`}
          >
            {dataset.duplicateCount.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#111118]">
          <p className="text-xs font-medium text-[#52525B] dark:text-[#9CA3AF]">Column Mix</p>
          <p className="mt-2 text-xs font-medium leading-relaxed text-[#08070B] tabular-nums dark:text-[#F4F4F6]">
            <span className="block">{typeCounts.numeric} numeric</span>
            <span className="block">
              {typeCounts.categorical} categorical · {typeCounts.datetime} date
            </span>
          </p>
        </div>
      </section>

      {/* Column Schema Directory */}
      <section className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#111118]">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h3 className="font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
            Column Schema &amp; Data Types
          </h3>
          <p className="text-xs text-[#52525B] dark:text-[#9CA3AF]">
            {dataset.name}
            {dataset.sheetName ? ` · Sheet: ${dataset.sheetName}` : ''}
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-xs font-medium text-[#52525B] dark:border-white/10 dark:text-[#9CA3AF]">
                <th className="py-2.5 pr-4">Column</th>
                <th className="px-4 py-2.5">Detected Type</th>
                <th className="px-4 py-2.5 text-right">Non-Null</th>
                <th className="px-4 py-2.5 text-right">Missing</th>
                <th className="px-4 py-2.5 text-right">Unique</th>
                <th className="pl-4 py-2.5">Sample Values</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/6 dark:divide-white/8">
              {dataset.columns.map((col) => (
                <tr
                  key={col.name}
                  className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                >
                  <td className="py-2.5 pr-4 font-medium text-[#08070B] dark:text-[#F4F4F6]">
                    {col.name}
                    {col.mixedTypes && (
                      <span className="ml-2 text-xs font-normal text-[#F32E35]">(mixed types)</span>
                    )}
                    {col.allNull && (
                      <span className="ml-2 text-xs font-normal text-[#F32E35]">(all empty)</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 capitalize text-[#52525B] dark:text-[#9CA3AF]">
                    {col.type}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono-tabular text-[#08070B] dark:text-[#F4F4F6]">
                    {col.nonNullCount.toLocaleString()}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right font-mono-tabular ${
                      col.missingCount > 0
                        ? 'font-medium text-[#F32E35]'
                        : 'text-[#52525B] dark:text-[#9CA3AF]'
                    }`}
                  >
                    {col.missingCount} ({col.missingPct}%)
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono-tabular text-[#08070B] dark:text-[#F4F4F6]">
                    {col.uniqueCount.toLocaleString()}
                  </td>
                  <td className="pl-4 py-2.5 text-xs text-[#52525B] dark:text-[#9CA3AF]">
                    {col.sampleValues.length > 0 ? col.sampleValues.slice(0, 3).join(' · ') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive Data Preview Table */}
      <section className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#111118]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
              Data Preview
            </h3>
            <p className="mt-0.5 text-xs text-[#52525B] tabular-nums dark:text-[#9CA3AF]">
              Showing {filteredAndSortedRows.length.toLocaleString()} matching rows · Click any
              column header to sort
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <label htmlFor="preview-search" className="sr-only">
              Search rows
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#52525B] dark:text-[#9CA3AF]" />
            <input
              id="preview-search"
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search values across columns..."
              className="w-full rounded-md border border-black/15 bg-black/[0.02] py-2 pr-3 pl-10 text-sm text-[#08070B] placeholder:text-[#52525B]/75 focus:border-[#4E50DE] focus:outline-none dark:border-white/15 dark:bg-[#08070B] dark:text-[#F4F4F6] dark:placeholder:text-[#9CA3AF]/60 dark:focus:border-[#4E50DE]"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 bg-black/[0.03] text-xs font-medium text-[#52525B] dark:border-white/10 dark:bg-[#08070B] dark:text-[#9CA3AF]">
                <th className="px-3 py-2.5 text-right font-mono-tabular">#</th>
                {dataset.columns.map((col) => {
                  const isSorted = sortCol === col.name;
                  return (
                    <th key={col.name} className="px-3 py-2.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleSort(col.name)}
                        className="inline-flex items-center gap-1.5 font-medium text-[#08070B] hover:text-[#F32E35] focus-visible:outline-2 focus-visible:outline-[#4E50DE] dark:text-[#F4F4F6]"
                      >
                        <span>{col.name}</span>
                        {isSorted ? (
                          sortDir === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5 text-[#F32E35]" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-[#F32E35]" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-45" />
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/6 dark:divide-white/8">
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={dataset.columns.length + 1}
                    className="py-10 text-center text-sm text-[#52525B] dark:text-[#9CA3AF]"
                  >
                    No rows match &ldquo;{searchQuery}&rdquo;.
                  </td>
                </tr>
              ) : (
                visibleRows.map((row, idx) => {
                  const rowNum = (safePage - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={rowNum}
                      className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                    >
                      <td className="px-3 py-2 text-right font-mono-tabular text-xs text-[#52525B] dark:text-[#9CA3AF]">
                        {rowNum}
                      </td>
                      {dataset.columns.map((col) => {
                        const raw = row[col.name];
                        const missing = isNullish(raw);
                        return (
                          <td
                            key={col.name}
                            className={`px-3 py-2 whitespace-nowrap ${
                              col.type === 'numeric' ? 'text-right font-mono-tabular' : ''
                            } ${
                              missing
                                ? 'italic text-[#F32E35]'
                                : 'text-[#08070B] dark:text-[#F4F4F6]'
                            }`}
                          >
                            {missing ? 'Missing' : String(raw)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-black/10 pt-4 text-xs text-[#52525B] sm:flex-row dark:border-white/10 dark:text-[#9CA3AF]">
          <span className="tabular-nums">
            Page {safePage} of {totalPages} ({filteredAndSortedRows.length.toLocaleString()} rows)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-md border border-black/15 px-3 py-1.5 font-medium text-[#08070B] transition-colors hover:border-[#4E50DE] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:text-[#F4F4F6]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-md border border-black/15 px-3 py-1.5 font-medium text-[#08070B] transition-colors hover:border-[#4E50DE] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:text-[#F4F4F6]"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
