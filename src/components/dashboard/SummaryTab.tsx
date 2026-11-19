import type { Data } from 'plotly.js';
import { useMemo } from 'react';
import { CHART_PALETTE } from '../../config';
import type { StatsResult } from '../../types/analysis';
import { PlotlyChart } from '../PlotlyChart';
import { StatTooltip } from '../StatTooltip';

interface SummaryTabProps {
  summary: StatsResult;
  isDark: boolean;
}

function fmt(val: number | null): string {
  if (val === null) return '—';
  if (Math.abs(val) >= 1000) return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return val.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

export function SummaryTab({ summary, isDark }: SummaryTabProps) {
  const missingChartData = useMemo<Data[]>(() => {
    const cols = summary.missingByColumn.map((m) => m.column);
    const counts = summary.missingByColumn.map((m) => m.missingCount);
    const pcts = summary.missingByColumn.map((m) => `${m.missingPct}%`);

    return [
      {
        type: 'bar',
        x: cols,
        y: counts,
        text: pcts,
        textposition: 'auto',
        marker: {
          color: counts.map((c) => (c > 0 ? CHART_PALETTE[0] : CHART_PALETTE[1])),
          cornerradius: 4,
        },
        hovertemplate: '<b>%{x}</b><br>Missing: %{y} (%{text})<extra></extra>',
      },
    ];
  }, [summary.missingByColumn]);

  const totalMissing = summary.missingByColumn.reduce((acc, m) => acc + m.missingCount, 0);

  return (
    <div className="space-y-8">
      {/* Numeric Statistics Table */}
      <section className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#111118]">
        <div>
          <h3 className="font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
            Numeric Variables Summary
          </h3>
          <p className="mt-1 text-xs text-[#52525B] dark:text-[#9CA3AF]">
            Hover or click any help icon to read plain-English definitions of statistical terms.
          </p>
        </div>

        {summary.numeric.length === 0 ? (
          <p className="mt-6 text-sm text-[#52525B] dark:text-[#9CA3AF]">
            No numeric columns were detected in this dataset.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs font-medium text-[#52525B] dark:border-white/10 dark:text-[#9CA3AF]">
                  <th className="py-2.5 pr-4">Column</th>
                  <th className="px-3 py-2.5 text-right">Count</th>
                  <th className="px-3 py-2.5 text-right">Mean</th>
                  <th className="px-3 py-2.5 text-right">
                    Median
                    <StatTooltip
                      term="Median"
                      explanation="The middle value when numbers are sorted. Less affected by extreme outliers than the mean."
                    />
                  </th>
                  <th className="px-3 py-2.5 text-right">Mode</th>
                  <th className="px-3 py-2.5 text-right">
                    Std Dev
                    <StatTooltip
                      term="Standard Deviation"
                      explanation="Measures how spread out values are around the average. Larger values mean wider variation."
                    />
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    Variance
                    <StatTooltip
                      term="Variance"
                      explanation="Average squared distance from the mean (Standard Deviation squared)."
                    />
                  </th>
                  <th className="px-3 py-2.5 text-right">Min</th>
                  <th className="px-3 py-2.5 text-right">Q1</th>
                  <th className="px-3 py-2.5 text-right">Q3</th>
                  <th className="px-3 py-2.5 text-right">
                    IQR
                    <StatTooltip
                      term="Interquartile Range (IQR)"
                      explanation="Q3 minus Q1 — the spread of the middle 50% of values. Used to flag extreme outliers."
                    />
                  </th>
                  <th className="px-3 py-2.5 text-right">Max</th>
                  <th className="px-3 py-2.5 text-right">
                    Skew
                    <StatTooltip
                      term="Skewness"
                      explanation="Measures asymmetry. Positive skew means a long tail of high values; negative means a long low tail."
                    />
                  </th>
                  <th className="pl-3 py-2.5 text-right">
                    Kurtosis
                    <StatTooltip
                      term="Excess Kurtosis"
                      explanation="Measures tail heaviness. Values above 0 indicate sharper peaks and more extreme outliers than a normal bell curve."
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/6 dark:divide-white/8">
                {summary.numeric.map((row) => (
                  <tr
                    key={row.column}
                    className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  >
                    <td className="py-2.5 pr-4 font-medium text-[#08070B] dark:text-[#F4F4F6]">
                      {row.column}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono-tabular">{row.count}</td>
                    <td className="px-3 py-2.5 text-right font-mono-tabular">{fmt(row.mean)}</td>
                    <td className="px-3 py-2.5 text-right font-mono-tabular">{fmt(row.median)}</td>
                    <td className="px-3 py-2.5 text-right font-mono-tabular">{fmt(row.mode)}</td>
                    <td className="px-3 py-2.5 text-right font-mono-tabular">{fmt(row.std)}</td>
                    <td className="px-3 py-2.5 text-right font-mono-tabular">{fmt(row.variance)}</td>
                    <td className="px-3 py-2.5 text-right font-mono-tabular">{fmt(row.min)}</td>
                    <td className="px-3 py-2.5 text-right font-mono-tabular">{fmt(row.q1)}</td>
                    <td className="px-3 py-2.5 text-right font-mono-tabular">{fmt(row.q3)}</td>
                    <td className="px-3 py-2.5 text-right font-mono-tabular">{fmt(row.iqr)}</td>
                    <td className="px-3 py-2.5 text-right font-mono-tabular">{fmt(row.max)}</td>
                    <td
                      className={`px-3 py-2.5 text-right font-mono-tabular ${
                        row.skewness !== null && Math.abs(row.skewness) >= 1
                          ? 'font-medium text-[#F32E35]'
                          : ''
                      }`}
                    >
                      {fmt(row.skewness)}
                    </td>
                    <td className="pl-3 py-2.5 text-right font-mono-tabular">{fmt(row.kurtosis)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Categorical Columns Summary */}
      <section className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#111118]">
        <h3 className="font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
          Categorical &amp; Datetime Columns
        </h3>
        {summary.categorical.length === 0 ? (
          <p className="mt-4 text-sm text-[#52525B] dark:text-[#9CA3AF]">
            No categorical or datetime columns were detected.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            {summary.categorical.map((cat) => (
              <div
                key={cat.column}
                className="rounded-lg border border-black/10 bg-black/[0.02] p-5 dark:border-white/10 dark:bg-[#08070B]"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="font-semibold text-[#08070B] dark:text-[#F4F4F6]">
                    {cat.column}
                  </h4>
                  <span className="text-xs text-[#52525B] tabular-nums dark:text-[#9CA3AF]">
                    {cat.uniqueCount} unique · {cat.missingCount} missing
                  </span>
                </div>

                {cat.topValues.length === 0 ? (
                  <p className="mt-3 text-xs text-[#52525B] dark:text-[#9CA3AF]">
                    No non-null categories recorded.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-2.5">
                    {cat.topValues.slice(0, 5).map((item) => (
                      <li key={item.value} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate pr-3 font-medium text-[#08070B] dark:text-[#F4F4F6]">
                            {item.value}
                          </span>
                          <span className="font-mono-tabular text-[#52525B] dark:text-[#9CA3AF]">
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                          <div
                            className="h-full rounded-full bg-[#4E50DE]"
                            style={{ width: `${Math.min(100, item.percentage)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Missing Values Chart */}
      <section className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#111118]">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h3 className="font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
            Missing Values by Column
          </h3>
          <span className="text-xs text-[#52525B] tabular-nums dark:text-[#9CA3AF]">
            {totalMissing === 0
              ? 'Zero missing values across all columns'
              : `${totalMissing.toLocaleString()} total missing cells`}
          </span>
        </div>

        <div className="mt-4">
          <PlotlyChart
            data={missingChartData}
            isDark={isDark}
            height={320}
            filename="insightpy-missing-values"
            testId="missing-values-chart"
            layout={{
              xaxis: { title: { text: 'Column' }, tickangle: -20 },
              yaxis: { title: { text: 'Missing Rows' }, rangemode: 'tozero' },
            }}
          />
        </div>
      </section>
    </div>
  );
}
