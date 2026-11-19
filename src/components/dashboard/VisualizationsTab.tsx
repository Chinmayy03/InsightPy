import { Lightbulb } from 'lucide-react';
import type { Data, Layout } from 'plotly.js';
import { useEffect, useMemo, useState } from 'react';
import { CHART_PALETTE } from '../../config';
import type { ChartConfig, ChartType, Dataset } from '../../types/analysis';
import {
  buildDefaultChartConfig,
  isNullish,
  parseNumericValue,
  suggestChartsForColumns,
} from '../../utils/statsMath';
import { PlotlyChart } from '../PlotlyChart';

interface VisualizationsTabProps {
  dataset: Dataset;
  isDark: boolean;
}

const CHART_OPTIONS: Array<{ value: ChartType; label: string }> = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'scatter', label: 'Scatter Plot' },
  { value: 'histogram', label: 'Histogram' },
  { value: 'box', label: 'Box Plot' },
  { value: 'heatmap', label: '2D Density Heatmap' },
  { value: 'pie', label: 'Pie / Composition' },
];

export function VisualizationsTab({ dataset, isDark }: VisualizationsTabProps) {
  const [config, setConfig] = useState<ChartConfig>(() => buildDefaultChartConfig(dataset));

  useEffect(() => {
    const colNames = new Set(dataset.columns.map((c) => c.name));
    if (!colNames.has(config.xColumn)) {
      setConfig(buildDefaultChartConfig(dataset));
    }
  }, [dataset, config.xColumn]);

  const suggestions = useMemo(
    () => suggestChartsForColumns(dataset.columns, config.xColumn, config.yColumn),
    [dataset.columns, config.xColumn, config.yColumn]
  );

  const needsY =
    config.chartType === 'scatter' ||
    config.chartType === 'line' ||
    config.chartType === 'heatmap';

  const { traces, layout } = useMemo<{ traces: Data[]; layout: Partial<Layout> }>(() => {
    const xCol = config.xColumn;
    const yCol = config.yColumn || '';
    const colorCol = config.colorColumn || '';
    const rows = dataset.rows;

    if (!xCol || rows.length === 0) {
      return { traces: [], layout: {} };
    }

    const xMeta = dataset.columns.find((c) => c.name === xCol);
    const yMeta = dataset.columns.find((c) => c.name === yCol);

    const groupKeys = colorCol
      ? Array.from(
          new Set(
            rows
              .map((r) => (isNullish(r[colorCol]) ? 'Missing' : String(r[colorCol])))
              .slice(0, 2000)
          )
        ).slice(0, 8)
      : ['__all__'];

    if (config.chartType === 'pie') {
      const counts = new Map<string, number>();
      for (const r of rows) {
        const key = isNullish(r[xCol]) ? 'Missing' : String(r[xCol]);
        const val = yCol && yMeta?.type === 'numeric' ? (parseNumericValue(r[yCol]) ?? 0) : 1;
        counts.set(key, (counts.get(key) ?? 0) + val);
      }
      const top = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      return {
        traces: [
          {
            type: 'pie',
            labels: top.map(([k]) => k),
            values: top.map(([, v]) => v),
            hole: 0.36,
            marker: { colors: [...CHART_PALETTE] },
            textinfo: 'label+percent',
          },
        ],
        layout: {
          title: { text: yCol ? `${yCol} share by ${xCol}` : `Composition of ${xCol}` },
        },
      };
    }

    if (config.chartType === 'histogram') {
      const traces: Data[] = groupKeys.map((g, idx) => {
        const subset = colorCol
          ? rows.filter((r) => (isNullish(r[colorCol]) ? 'Missing' : String(r[colorCol])) === g)
          : rows;
        const vals = subset
          .map((r) => (xMeta?.type === 'numeric' ? parseNumericValue(r[xCol]) : r[xCol]))
          .filter((v) => v !== null && v !== undefined);

        return {
          type: 'histogram',
          name: g === '__all__' ? xCol : g,
          x: vals as (number | string)[],
          opacity: colorCol ? 0.72 : 0.9,
          marker: { color: CHART_PALETTE[idx % CHART_PALETTE.length] },
        };
      });

      return {
        traces,
        layout: {
          barmode: colorCol ? 'overlay' : 'stack',
          title: { text: `Distribution of ${xCol}` },
          xaxis: { title: { text: xCol } },
          yaxis: { title: { text: 'Frequency' } },
        },
      };
    }

    if (config.chartType === 'box') {
      const targetNumCol =
        yCol && yMeta?.type === 'numeric'
          ? yCol
          : xMeta?.type === 'numeric'
            ? xCol
            : dataset.columns.find((c) => c.type === 'numeric')?.name ?? '';

      if (!targetNumCol) return { traces: [], layout: {} };

      const useGroupCol = xMeta?.type !== 'numeric' ? xCol : colorCol;
      if (useGroupCol) {
        const categories = Array.from(
          new Set(rows.map((r) => (isNullish(r[useGroupCol]) ? 'Missing' : String(r[useGroupCol]))))
        ).slice(0, 12);

        return {
          traces: categories.map((cat, idx) => ({
            type: 'box',
            name: cat,
            y: rows
              .filter((r) => (isNullish(r[useGroupCol]) ? 'Missing' : String(r[useGroupCol])) === cat)
              .map((r) => parseNumericValue(r[targetNumCol]))
              .filter((n): n is number => n !== null),
            marker: { color: CHART_PALETTE[idx % CHART_PALETTE.length] },
            boxpoints: 'outliers',
          })),
          layout: {
            title: { text: `${targetNumCol} spread across ${useGroupCol}` },
            yaxis: { title: { text: targetNumCol } },
          },
        };
      }

      return {
        traces: [
          {
            type: 'box',
            name: targetNumCol,
            y: rows
              .map((r) => parseNumericValue(r[targetNumCol]))
              .filter((n): n is number => n !== null),
            marker: { color: CHART_PALETTE[0] },
            boxpoints: 'outliers',
          },
        ],
        layout: {
          title: { text: `Box Plot of ${targetNumCol}` },
          yaxis: { title: { text: targetNumCol } },
        },
      };
    }

    if (config.chartType === 'heatmap') {
      const xs: (string | number)[] = [];
      const ys: (string | number)[] = [];
      for (const r of rows) {
        const xv = xMeta?.type === 'numeric' ? parseNumericValue(r[xCol]) : r[xCol];
        const yv = yCol && yMeta?.type === 'numeric' ? parseNumericValue(r[yCol]) : r[yCol];
        if (!isNullish(xv) && !isNullish(yv)) {
          xs.push(xv as string | number);
          ys.push(yv as string | number);
        }
      }
      return {
        traces: [
          {
            type: 'histogram2d',
            x: xs,
            y: ys,
            colorscale: [
              [0, isDark ? '#08070B' : '#F4F4F7'],
              [0.5, '#4E50DE'],
              [1, '#F32E35'],
            ],
          },
        ],
        layout: {
          title: { text: `Density Heatmap: ${xCol} vs ${yCol || xCol}` },
          xaxis: { title: { text: xCol } },
          yaxis: { title: { text: yCol || xCol } },
        },
      };
    }

    if (config.chartType === 'scatter') {
      const resolvedY =
        yCol ||
        dataset.columns.find((c) => c.type === 'numeric' && c.name !== xCol)?.name ||
        xCol;

      const traces: Data[] = groupKeys.map((g, idx) => {
        const subset = colorCol
          ? rows.filter((r) => (isNullish(r[colorCol]) ? 'Missing' : String(r[colorCol])) === g)
          : rows;
        const xs: (string | number)[] = [];
        const ys: (string | number)[] = [];
        for (const r of subset) {
          const xv = xMeta?.type === 'numeric' ? parseNumericValue(r[xCol]) : r[xCol];
          const yv = parseNumericValue(r[resolvedY]) ?? r[resolvedY];
          if (!isNullish(xv) && !isNullish(yv)) {
            xs.push(xv as string | number);
            ys.push(yv as string | number);
          }
        }
        return {
          type: 'scatter',
          mode: 'markers',
          name: g === '__all__' ? `${xCol} vs ${resolvedY}` : g,
          x: xs,
          y: ys,
          marker: {
            size: 8,
            opacity: 0.85,
            color: CHART_PALETTE[idx % CHART_PALETTE.length],
          },
        };
      });

      return {
        traces,
        layout: {
          title: { text: `${resolvedY} vs ${xCol}` },
          xaxis: { title: { text: xCol } },
          yaxis: { title: { text: resolvedY } },
        },
      };
    }

    if (config.chartType === 'line') {
      const resolvedY =
        yCol || dataset.columns.find((c) => c.type === 'numeric' && c.name !== xCol)?.name || '';
      const traces: Data[] = groupKeys.map((g, idx) => {
        const subset = colorCol
          ? rows.filter((r) => (isNullish(r[colorCol]) ? 'Missing' : String(r[colorCol])) === g)
          : rows;

        const grouped = new Map<string, { sum: number; count: number }>();
        for (const r of subset) {
          if (isNullish(r[xCol])) continue;
          const xKey = String(r[xCol]);
          const yVal = resolvedY ? parseNumericValue(r[resolvedY]) : 1;
          if (yVal === null) continue;
          const prev = grouped.get(xKey) ?? { sum: 0, count: 0 };
          grouped.set(xKey, { sum: prev.sum + yVal, count: prev.count + 1 });
        }

        const sortedKeys = Array.from(grouped.keys()).sort();
        return {
          type: 'scatter',
          mode: 'lines+markers',
          name: g === '__all__' ? resolvedY || 'Count' : g,
          x: sortedKeys,
          y: sortedKeys.map((k) => {
            const entry = grouped.get(k)!;
            return Number((entry.sum / entry.count).toFixed(2));
          }),
          line: { width: 2.5, color: CHART_PALETTE[idx % CHART_PALETTE.length] },
          marker: { size: 5 },
        };
      });

      return {
        traces,
        layout: {
          title: { text: `${resolvedY ? `Average ${resolvedY}` : 'Count'} over ${xCol}` },
          xaxis: { title: { text: xCol } },
          yaxis: { title: { text: resolvedY || 'Count' } },
        },
      };
    }

    const traces: Data[] = groupKeys.map((g, idx) => {
      const subset = colorCol
        ? rows.filter((r) => (isNullish(r[colorCol]) ? 'Missing' : String(r[colorCol])) === g)
        : rows;

      const agg = new Map<string, { sum: number; count: number }>();
      for (const r of subset) {
        const xKey = isNullish(r[xCol]) ? 'Missing' : String(r[xCol]);
        const yVal = yCol && yMeta?.type === 'numeric' ? parseNumericValue(r[yCol]) : 1;
        if (yVal === null) continue;
        const prev = agg.get(xKey) ?? { sum: 0, count: 0 };
        agg.set(xKey, { sum: prev.sum + yVal, count: prev.count + 1 });
      }

      const entries = Array.from(agg.entries())
        .sort((a, b) => b[1].sum - a[1].sum)
        .slice(0, 18);

      return {
        type: 'bar',
        name: g === '__all__' ? (yCol ? `Avg ${yCol}` : 'Count') : g,
        x: entries.map(([k]) => k),
        y: entries.map(([, v]) =>
          yCol && yMeta?.type === 'numeric' ? Number((v.sum / v.count).toFixed(2)) : v.count
        ),
        marker: { color: CHART_PALETTE[idx % CHART_PALETTE.length], cornerradius: 4 },
      };
    });

    return {
      traces,
      layout: {
        barmode: colorCol ? 'group' : 'stack',
        title: {
          text:
            yCol && yMeta?.type === 'numeric'
              ? `Average ${yCol} by ${xCol}`
              : `Record Count by ${xCol}`,
        },
        xaxis: { title: { text: xCol }, tickangle: -20 },
        yaxis: { title: { text: yCol && yMeta?.type === 'numeric' ? `Avg ${yCol}` : 'Count' } },
      },
    };
  }, [config, dataset.columns, dataset.rows, isDark]);

  return (
    <div className="space-y-6">
      {/* Chart Builder Controls */}
      <section className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#111118]">
        <h3 className="font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
          Interactive Chart Builder
        </h3>
        <p className="mt-1 text-xs text-[#52525B] dark:text-[#9CA3AF]">
          Hover to inspect values, drag to zoom, pan across axes, or click the camera icon in the
          chart toolbar to download a PNG.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="chart-type-select"
              className="block text-xs font-medium text-[#52525B] dark:text-[#9CA3AF]"
            >
              Chart Type
            </label>
            <select
              id="chart-type-select"
              value={config.chartType}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, chartType: e.target.value as ChartType }))
              }
              className="mt-1.5 w-full rounded-md border border-black/15 bg-black/[0.02] px-3 py-2 text-sm text-[#08070B] focus:border-[#4E50DE] focus:outline-none dark:border-white/15 dark:bg-[#08070B] dark:text-[#F4F4F6]"
            >
              {CHART_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="chart-x-select"
              className="block text-xs font-medium text-[#52525B] dark:text-[#9CA3AF]"
            >
              X Axis / Primary Variable
            </label>
            <select
              id="chart-x-select"
              value={config.xColumn}
              onChange={(e) => setConfig((prev) => ({ ...prev, xColumn: e.target.value }))}
              className="mt-1.5 w-full rounded-md border border-black/15 bg-black/[0.02] px-3 py-2 text-sm text-[#08070B] focus:border-[#4E50DE] focus:outline-none dark:border-white/15 dark:bg-[#08070B] dark:text-[#F4F4F6]"
            >
              {dataset.columns.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="chart-y-select"
              className="block text-xs font-medium text-[#52525B] dark:text-[#9CA3AF]"
            >
              Y Axis {needsY ? '(Required)' : '(Optional)'}
            </label>
            <select
              id="chart-y-select"
              value={config.yColumn ?? ''}
              onChange={(e) => setConfig((prev) => ({ ...prev, yColumn: e.target.value }))}
              className="mt-1.5 w-full rounded-md border border-black/15 bg-black/[0.02] px-3 py-2 text-sm text-[#08070B] focus:border-[#4E50DE] focus:outline-none dark:border-white/15 dark:bg-[#08070B] dark:text-[#F4F4F6]"
            >
              <option value="">None / Record Count</option>
              {dataset.columns.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="chart-color-select"
              className="block text-xs font-medium text-[#52525B] dark:text-[#9CA3AF]"
            >
              Color / Group By (Optional)
            </label>
            <select
              id="chart-color-select"
              value={config.colorColumn ?? ''}
              onChange={(e) => setConfig((prev) => ({ ...prev, colorColumn: e.target.value }))}
              className="mt-1.5 w-full rounded-md border border-black/15 bg-black/[0.02] px-3 py-2 text-sm text-[#08070B] focus:border-[#4E50DE] focus:outline-none dark:border-white/15 dark:bg-[#08070B] dark:text-[#F4F4F6]"
            >
              <option value="">No grouping</option>
              {dataset.columns
                .filter((c) => c.type === 'categorical' && c.uniqueCount <= 20)
                .map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.uniqueCount} groups)
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Sensible chart recommendations */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-black/10 pt-4 dark:border-white/10">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#08070B] dark:text-[#F4F4F6]">
            <Lightbulb className="h-3.5 w-3.5 text-[#F32E35]" />
            <span>Suggested for your columns:</span>
          </span>
          {suggestions.map((s) => {
            const active = config.chartType === s.chartType;
            const label =
              CHART_OPTIONS.find((opt) => opt.value === s.chartType)?.label ?? s.chartType;
            return (
              <button
                key={s.chartType}
                type="button"
                title={s.reason}
                onClick={() => setConfig((prev) => ({ ...prev, chartType: s.chartType }))}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#4E50DE] text-white'
                    : 'border border-black/15 bg-black/[0.02] text-[#08070B] hover:border-[#4E50DE] dark:border-white/15 dark:bg-[#08070B] dark:text-[#F4F4F6]'
                }`}
              >
                {label} — {s.reason}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Plotly Canvas */}
      <section className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#111118]">
        {traces.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#52525B] dark:text-[#9CA3AF]">
            Select valid columns above to render an interactive chart.
          </div>
        ) : (
          <PlotlyChart
            data={traces}
            layout={layout}
            isDark={isDark}
            height={460}
            filename={`insightpy-${config.chartType}-${config.xColumn}`}
            testId="custom-builder-chart"
          />
        )}
      </section>
    </div>
  );
}
