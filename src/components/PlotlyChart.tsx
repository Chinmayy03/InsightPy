import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';
import type { Config, Data, Layout } from 'plotly.js';
import { useMemo } from 'react';

const Plot = createPlotlyComponent(Plotly);

interface PlotlyChartProps {
  data: Data[];
  layout?: Partial<Layout>;
  isDark: boolean;
  height?: number;
  filename?: string;
  testId?: string;
}

export function PlotlyChart({
  data,
  layout = {},
  isDark,
  height = 380,
  filename = 'insightpy-chart',
  testId,
}: PlotlyChartProps) {
  const mergedLayout = useMemo<Partial<Layout>>(() => {
    const textColor = isDark ? '#F4F4F6' : '#08070B';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(8, 7, 11, 0.08)';
    const {
      xaxis: userXAxis,
      yaxis: userYAxis,
      margin: userMargin,
      ...restLayout
    } = layout;

    return {
      autosize: true,
      height,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: {
        family: 'DM Sans, system-ui, sans-serif',
        size: 12,
        color: textColor,
      },
      margin: { t: 36, r: 24, b: 56, l: 60, ...userMargin },
      hoverlabel: {
        bgcolor: isDark ? '#111118' : '#08070B',
        bordercolor: '#F32E35',
        font: { color: '#F4F4F6', family: 'DM Sans, sans-serif', size: 12 },
      },
      xaxis: {
        gridcolor: gridColor,
        zerolinecolor: gridColor,
        automargin: true,
        ...userXAxis,
      },
      yaxis: {
        gridcolor: gridColor,
        zerolinecolor: gridColor,
        automargin: true,
        ...userYAxis,
      },
      ...restLayout,
    };
  }, [height, isDark, layout]);

  const config = useMemo<Partial<Config>>(
    () => ({
      responsive: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['select2d', 'lasso2d'],
      toImageButtonOptions: {
        format: 'png',
        filename,
        height: 700,
        width: 1100,
        scale: 2,
      },
    }),
    [filename]
  );

  return (
    <div data-testid={testId} className="w-full overflow-hidden">
      <Plot
        data={data}
        layout={mergedLayout}
        config={config}
        useResizeHandler
        style={{ width: '100%', height: `${height}px` }}
      />
    </div>
  );
}
