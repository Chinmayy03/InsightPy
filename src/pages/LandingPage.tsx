import { ArrowRight, BarChart3, FileSpreadsheet, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import type { Data } from 'plotly.js';
import { useMemo } from 'react';
import type { AppRoute } from '../components/Navbar';
import { PlotlyChart } from '../components/PlotlyChart';
import type { AnalysisBundle } from '../types/analysis';
import type { DashboardTab } from './DashboardPage';

interface LandingPageProps {
  bundle: AnalysisBundle | null;
  isDark: boolean;
  onGetStarted: () => void;
  onUseSampleDataset: (tab?: DashboardTab) => void;
  onNavigate: (route: AppRoute) => void;
}

const WORKSPACE_SHORTCUTS: Array<{ label: string; tab: DashboardTab }> = [
  { label: 'Summary', tab: 'summary' },
  { label: 'Correlations', tab: 'correlations' },
  { label: 'Charts', tab: 'visualizations' },
  { label: 'Clean Data', tab: 'cleaning' },
];

export function LandingPage({
  bundle,
  isDark,
  onGetStarted,
  onUseSampleDataset,
  onNavigate,
}: LandingPageProps) {
  const heroChartData = useMemo<Data[]>(() => {
    if (!bundle) return [];
    const rows = bundle.dataset.rows.slice(0, 75);
    return [
      {
        type: 'scatter',
        mode: 'markers',
        name: 'Orders',
        x: rows.map((r) => Number(r.Marketing_Spend ?? 0)),
        y: rows.map((r) => Number(r.Revenue ?? 0)),
        marker: {
          size: 8,
          color: rows.map((_, i) => (i % 3 === 0 ? '#F32E35' : '#4E50DE')),
          opacity: 0.9,
          line: { width: 1, color: isDark ? '#08070B' : '#FFFFFF' },
        },
        hovertemplate: 'Spend: $%{x:,.0f}<br>Revenue: $%{y:,.0f}<extra></extra>',
      },
    ];
  }, [bundle, isDark]);

  const topPair = bundle?.correlations.pairs[0];

  return (
    <div className="bg-[#F8F8FB] text-[#08070B] dark:bg-[#08070B] dark:text-[#F4F4F6]">
      {/* Hero Section matching Deep Black + Neon Red + Indigo reference architecture */}
      <section className="relative overflow-hidden border-b border-black/10 dark:border-white/10">
        {/* Subtle indigo ambient lighting behind right showcase */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-0 h-[520px] w-[680px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(78,80,222,0.28)_0%,rgba(243,46,53,0.08)_45%,rgba(8,7,11,0)_72%)] blur-2xl"
        />

        <div className="relative mx-auto max-w-[1440px] px-6 pt-10 pb-14 lg:px-10 lg:pt-16 lg:pb-20">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            {/* Left Column: Kicker + Stacked Neon Red / Indigo Condensed Headline + Copy + CTAs + 3 Stats */}
            <div className="lg:col-span-6">
              <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#52525B] dark:text-[#9CA3AF]">
                Zero-Code Exploratory Analysis · Python FastAPI + Pandas
              </p>

              <h1
                className="mt-4 font-display-condensed font-extrabold uppercase leading-[0.88] tracking-[-0.01em]"
                style={{ fontSize: 'clamp(3.6rem, 7.6vw, 6.4rem)' }}
              >
                <span className="block text-[#F32E35]">Built For</span>
                <span className="block text-[#4E50DE]">Data Clarity.</span>
              </h1>

              <p className="mt-6 max-w-lg text-sm leading-relaxed text-[#52525B] sm:text-base dark:text-[#9CA3AF]">
                Upload any CSV or Excel workbook to uncover correlations, statistical summaries,
                quality fixes, and interactive visualizations powered by Python, Pandas, and SciPy.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="inline-flex items-center gap-2 rounded-md bg-[#F32E35] px-7 py-3.5 text-xs font-bold tracking-wider uppercase text-white transition-all hover:bg-[#ff4249] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4E50DE] whitespace-nowrap shrink-0"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onUseSampleDataset('overview')}
                  className="inline-flex items-center gap-2 rounded-md border border-black/20 bg-transparent px-6 py-3.5 text-xs font-semibold tracking-wider uppercase text-[#08070B] transition-colors hover:border-[#4E50DE] hover:text-[#4E50DE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F32E35] whitespace-nowrap shrink-0 dark:border-white/20 dark:text-[#F4F4F6] dark:hover:border-[#4E50DE] dark:hover:text-white"
                >
                  <span>Use sample dataset</span>
                </button>
              </div>

              {/* Bottom-Left 3-Stat Row */}
              <div className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-black/10 pt-6 dark:border-white/10">
                <div>
                  <p className="font-display-condensed text-3xl font-extrabold text-[#F32E35] tabular-nums">
                    10+
                  </p>
                  <p className="mt-0.5 text-xs text-[#52525B] dark:text-[#9CA3AF]">Chart Types</p>
                </div>

                <div>
                  <p className="font-display-condensed text-3xl font-extrabold text-[#F32E35] tabular-nums">
                    0
                  </p>
                  <p className="mt-0.5 text-xs text-[#52525B] dark:text-[#9CA3AF]">
                    Lines of Code
                  </p>
                </div>

                <div>
                  <p className="font-display-condensed text-3xl font-extrabold text-[#F32E35] tabular-nums">
                    100%
                  </p>
                  <p className="mt-0.5 text-xs text-[#52525B] dark:text-[#9CA3AF]">Python Core</p>
                </div>
              </div>
            </div>

            {/* Right Column: Illuminated Obsidian Focal Stage + Live Plotly Showcase */}
            <div className="lg:col-span-6">
              <div className="relative rounded-xl border border-black/10 bg-white p-5 shadow-2xl dark:border-white/12 dark:bg-[#101016]">
                {/* Indigo rim highlight line along bottom edge */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-8 -bottom-px h-px bg-gradient-to-r from-transparent via-[#4E50DE] to-transparent"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-3 dark:border-white/10">
                  <div>
                    <p className="text-xs font-medium text-[#52525B] dark:text-[#9CA3AF]">
                      Preloaded Sample · Retail Sales
                    </p>
                    <h2 className="mt-0.5 font-display-condensed text-xl font-bold tracking-wide uppercase text-[#08070B] dark:text-[#F4F4F6]">
                      Marketing Spend vs. Revenue
                    </h2>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="font-mono-tabular text-xs font-semibold text-[#F32E35]">
                      {bundle ? `${bundle.dataset.rowCount} rows` : 'Loading'}
                    </span>
                    {topPair && (
                      <p className="font-mono-tabular text-xs text-[#4E50DE] dark:text-[#8183FF]">
                        Strongest r = {topPair.r.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  {heroChartData.length > 0 ? (
                    <PlotlyChart
                      data={heroChartData}
                      isDark={isDark}
                      height={295}
                      filename="insightpy-hero-preview"
                      testId="landing-hero-chart"
                      layout={{
                        margin: { t: 16, r: 16, b: 44, l: 52 },
                        xaxis: { title: { text: 'Marketing Spend ($)' } },
                        yaxis: { title: { text: 'Revenue ($)' } },
                      }}
                    />
                  ) : (
                    <div className="h-[295px] animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
                  )}
                </div>

                {/* Bottom-Right Framed Workspace Quick-Jumps */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-3 dark:border-white/10">
                  <span className="text-xs text-[#52525B] tabular-nums dark:text-[#9CA3AF]">
                    {bundle ? `${bundle.insights.length} automated insights ready` : 'Preparing'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {WORKSPACE_SHORTCUTS.map((item) => (
                      <button
                        key={item.tab}
                        type="button"
                        onClick={() => onUseSampleDataset(item.tab)}
                        className="rounded border border-black/15 px-2.5 py-1 text-xs font-medium text-[#08070B] transition-colors hover:border-[#4E50DE] hover:bg-[#4E50DE] hover:text-white dark:border-white/15 dark:text-[#F4F4F6] dark:hover:border-[#4E50DE] dark:hover:bg-[#4E50DE]"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Asymmetric Grid */}
      <section className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.16em] uppercase text-[#F32E35]">
            Platform Capabilities
          </p>
          <h2 className="mt-2 font-display-condensed text-3xl font-extrabold tracking-wide uppercase text-[#08070B] sm:text-5xl dark:text-[#F4F4F6]">
            From Raw Spreadsheet To Clear Decisions.
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <article className="rounded-xl border border-black/10 bg-white p-8 lg:col-span-2 dark:border-white/10 dark:bg-[#111118]">
            <div className="flex items-center justify-between text-xs font-medium text-[#52525B] dark:text-[#9CA3AF]">
              <span>01. Exploratory Statistics &amp; Correlations</span>
              <BarChart3 className="h-4 w-4 text-[#F32E35]" />
            </div>
            <h3 className="mt-4 font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
              Descriptive metrics with plain-English tooltips
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#52525B] dark:text-[#9CA3AF]">
              Every numeric column receives count, mean, median, mode, standard deviation, variance,
              quartiles, IQR, skewness, and kurtosis. Categorical columns report unique counts and
              dominant frequencies, paired with interactive Pearson correlation heatmaps.
            </p>
          </article>

          <article className="rounded-xl border border-black/10 bg-white p-8 dark:border-white/10 dark:bg-[#111118]">
            <div className="flex items-center justify-between text-xs font-medium text-[#52525B] dark:text-[#9CA3AF]">
              <span>02. Multi-Sheet Upload</span>
              <FileSpreadsheet className="h-4 w-4 text-[#4E50DE]" />
            </div>
            <h3 className="mt-4 font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
              CSV &amp; Excel Ready
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#52525B] dark:text-[#9CA3AF]">
              Drag and drop <code className="font-mono-tabular">.csv</code>,{' '}
              <code className="font-mono-tabular">.xlsx</code>, or{' '}
              <code className="font-mono-tabular">.xls</code> files, pick worksheets from
              multi-sheet workbooks, and inspect up to 50,000 rows smoothly.
            </p>
          </article>

          <article className="rounded-xl border border-black/10 bg-white p-8 dark:border-white/10 dark:bg-[#111118]">
            <div className="flex items-center justify-between text-xs font-medium text-[#52525B] dark:text-[#9CA3AF]">
              <span>03. Automated Insights</span>
              <Sparkles className="h-4 w-4 text-[#F32E35]" />
            </div>
            <h3 className="mt-4 font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
              Signals In Plain Prose
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#52525B] dark:text-[#9CA3AF]">
              Spot high missingness, skewed tails, IQR outliers, dominant categories, and
              time-series shifts without writing a line of code.
            </p>
          </article>

          <article className="rounded-xl border border-black/10 bg-white p-8 lg:col-span-2 dark:border-white/10 dark:bg-[#111118]">
            <div className="flex items-center justify-between text-xs font-medium text-[#52525B] dark:text-[#9CA3AF]">
              <span>04. One-Click Cleaning &amp; Portable Reports</span>
              <Wand2 className="h-4 w-4 text-[#4E50DE]" />
            </div>
            <h3 className="mt-4 font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
              Clean Data &amp; Export CSV or PDF
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#52525B] dark:text-[#9CA3AF]">
              Impute missing numeric values using mean or median, fill categories with mode, or
              deduplicate rows—then immediately re-run analysis and export your cleaned CSV or
              printable PDF summary report.
            </p>
          </article>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-black/10 px-6 py-8 dark:border-white/10 lg:px-10">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 text-xs text-[#52525B] dark:text-[#9CA3AF]">
            <span className="font-display-condensed text-lg font-extrabold tracking-wider uppercase text-[#F32E35]">
              INSIGHTPY
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#4E50DE]" />
              <span>Powered by Python FastAPI, Pandas, NumPy &amp; SciPy</span>
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs font-medium text-[#52525B] dark:text-[#9CA3AF]">
            <button
              type="button"
              onClick={() => onNavigate('upload')}
              className="hover:text-[#08070B] dark:hover:text-white"
            >
              Upload
            </button>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="hover:text-[#08070B] dark:hover:text-white"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => onNavigate('export')}
              className="hover:text-[#08070B] dark:hover:text-white"
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => onNavigate('about')}
              className="hover:text-[#08070B] dark:hover:text-white"
            >
              About
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
