import type { Data } from 'plotly.js';
import { useMemo } from 'react';
import type { CorrelationResult } from '../../types/analysis';
import { PlotlyChart } from '../PlotlyChart';
import { StatTooltip } from '../StatTooltip';

interface CorrelationsTabProps {
  correlations: CorrelationResult;
  isDark: boolean;
}

export function CorrelationsTab({ correlations, isDark }: CorrelationsTabProps) {
  const heatmapData = useMemo<Data[]>(() => {
    if (correlations.columns.length < 2) return [];
    const textMatrix = correlations.matrix.map((row) =>
      row.map((val) => (val === null ? 'N/A' : val.toFixed(2)))
    );

    return [
      {
        type: 'heatmap',
        x: correlations.columns,
        y: correlations.columns,
        z: correlations.matrix,
        text: textMatrix as unknown as string[],
        texttemplate: '%{text}',
        zmin: -1,
        zmax: 1,
        colorscale: [
          [0, '#F32E35'],
          [0.5, isDark ? '#14141D' : '#F4F4F7'],
          [1, '#4E50DE'],
        ],
        hovertemplate: '<b>%{x}</b> vs <b>%{y}</b><br>Pearson r = %{z:.3f}<extra></extra>',
      },
    ];
  }, [correlations, isDark]);

  if (correlations.columns.length < 2) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-10 text-center dark:border-white/10 dark:bg-[#111118]">
        <h3 className="font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
          Not Enough Numeric Columns for Correlation
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#52525B] dark:text-[#9CA3AF]">
          Pearson correlation requires at least two non-empty numeric columns. Upload a dataset with
          two or more numeric variables to explore variable relationships.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#111118]">
        <div>
          <h3 className="font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
            Pearson Correlation Heatmap
            <StatTooltip
              term="Pearson Correlation (r)"
              explanation="Ranges from -1.0 (perfect negative relationship) to +1.0 (perfect positive relationship). Near 0 means no linear link."
            />
          </h3>
          <p className="mt-1 text-xs text-[#52525B] dark:text-[#9CA3AF]">
            Indigo indicates strong positive alignment; Neon Red indicates strong inverse
            relationships.
          </p>
        </div>

        <div className="mt-4">
          <PlotlyChart
            data={heatmapData}
            isDark={isDark}
            height={Math.max(360, correlations.columns.length * 52)}
            filename="insightpy-correlation-heatmap"
            testId="correlation-heatmap"
            layout={{
              margin: { t: 28, r: 24, b: 80, l: 120 },
              xaxis: { tickangle: -25 },
              yaxis: { autorange: 'reversed' },
            }}
          />
        </div>
      </section>

      <section className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#111118]">
        <h3 className="font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
          Ranked Variable Relationships
        </h3>
        <p className="mt-1 text-xs text-[#52525B] dark:text-[#9CA3AF]">
          Pairs ordered from strongest linear association to weakest.
        </p>

        <div className="mt-4 divide-y divide-black/10 dark:divide-white/10">
          {correlations.pairs.map((pair) => {
            const isPositive = pair.r >= 0;
            const barWidth = Math.round(pair.absR * 100);
            return (
              <div
                key={`${pair.colA}-${pair.colB}`}
                className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#08070B] dark:text-[#F4F4F6]">
                    {pair.colA}{' '}
                    <span className="text-[#52525B] dark:text-[#9CA3AF]">↔</span>{' '}
                    {pair.colB}
                  </p>
                  <p className="mt-0.5 text-xs text-[#52525B] capitalize dark:text-[#9CA3AF]">
                    {pair.label} · n = {pair.sampleSize.toLocaleString()} paired observations
                  </p>
                </div>

                <div className="flex items-center gap-4 sm:w-64">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                    <div
                      className={`h-full rounded-full ${
                        isPositive ? 'bg-[#4E50DE]' : 'bg-[#F32E35]'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span
                    className={`w-16 text-right font-mono-tabular text-sm font-semibold ${
                      isPositive ? 'text-[#4E50DE] dark:text-[#8183FF]' : 'text-[#F32E35]'
                    }`}
                  >
                    {pair.r >= 0 ? '+' : ''}
                    {pair.r.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
