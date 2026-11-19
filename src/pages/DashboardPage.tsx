import {
  AlertCircle,
  BarChart3,
  Bot,
  Download,
  FileSpreadsheet,
  GitCompare,
  LayoutDashboard,
  Lightbulb,
  Sigma,
  Sparkles,
  Upload,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import { AiInsightsTab } from '../components/dashboard/AiInsightsTab';
import { CleaningTab } from '../components/dashboard/CleaningTab';
import { CorrelationsTab } from '../components/dashboard/CorrelationsTab';
import { InsightsTab } from '../components/dashboard/InsightsTab';
import { OverviewTab } from '../components/dashboard/OverviewTab';
import { SummaryTab } from '../components/dashboard/SummaryTab';
import { VisualizationsTab } from '../components/dashboard/VisualizationsTab';
import type { AppRoute } from '../components/Navbar';
import type { AnalysisBundle, CleaningAction } from '../types/analysis';

export type DashboardTab =
  | 'overview'
  | 'summary'
  | 'correlations'
  | 'visualizations'
  | 'insights'
  | 'cleaning'
  | 'ai';

interface DashboardPageProps {
  bundle: AnalysisBundle | null;
  isLoading: boolean;
  error: string | null;
  isDark: boolean;
  cleaningHistory: string[];
  hasOriginalChanges: boolean;
  activeTab?: DashboardTab;
  onTabChange?: (tab: DashboardTab) => void;
  onApplyCleaning: (action: CleaningAction) => Promise<unknown>;
  onResetOriginal: () => Promise<unknown>;
  onLoadSample: () => Promise<unknown>;
  onNavigate: (route: AppRoute) => void;
}

const TABS: Array<{ id: DashboardTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'summary', label: 'Statistical Summary', icon: Sigma },
  { id: 'correlations', label: 'Correlations', icon: GitCompare },
  { id: 'visualizations', label: 'Visualizations', icon: BarChart3 },
  { id: 'insights', label: 'Auto Insights', icon: Lightbulb },
  { id: 'cleaning', label: 'Data Cleaning', icon: Wrench },
  { id: 'ai', label: 'AI Insights', icon: Bot },
];

export function DashboardPage({
  bundle,
  isLoading,
  error,
  isDark,
  cleaningHistory,
  hasOriginalChanges,
  activeTab: controlledTab,
  onTabChange,
  onApplyCleaning,
  onResetOriginal,
  onLoadSample,
  onNavigate,
}: DashboardPageProps) {
  const [internalTab, setInternalTab] = useState<DashboardTab>('overview');
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (tab: DashboardTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  if (isLoading && !bundle) {
    return (
      <div className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="h-96 animate-pulse rounded-xl bg-black/10 lg:col-span-3 dark:bg-[#111118]" />
          <div className="space-y-6 lg:col-span-9">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-24 animate-pulse rounded-xl bg-white dark:bg-[#111118]"
                />
              ))}
            </div>
            <div className="h-80 animate-pulse rounded-xl bg-white dark:bg-[#111118]" />
          </div>
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="mx-auto max-w-[780px] px-6 py-20 text-center">
        <FileSpreadsheet className="mx-auto h-12 w-12 text-[#F32E35]" />
        <h1 className="mt-4 font-display-condensed text-4xl font-extrabold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
          No Active Dataset Loaded
        </h1>
        <p className="mt-2 text-sm text-[#52525B] dark:text-[#9CA3AF]">
          Upload your own CSV or Excel spreadsheet, or load the built-in retail sales dataset to
          start exploring immediately.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('upload')}
            className="inline-flex items-center gap-2 rounded-md bg-[#F32E35] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white"
          >
            <Upload className="h-4 w-4" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => void onLoadSample()}
            className="inline-flex items-center gap-2 rounded-md border border-black/20 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#08070B] dark:border-white/20 dark:text-[#F4F4F6]"
          >
            <Sparkles className="h-4 w-4 text-[#4E50DE]" />
            <span>Load Sample Dataset</span>
          </button>
        </div>
      </div>
    );
  }

  const currentTabMeta = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-10 lg:py-8">
      {/* Obsidian Sidebar */}
      <aside
        aria-label="Dashboard sections"
        className="w-full shrink-0 rounded-xl border border-white/10 bg-[#0D0D13] p-5 text-[#F4F4F6] lg:w-64 lg:self-start lg:sticky lg:top-24"
      >
        <div className="border-b border-white/10 pb-4">
          <p className="text-xs font-medium text-[#9CA3AF]">Active Dataset</p>
          <h2 className="mt-1 truncate text-sm font-semibold text-white" title={bundle.dataset.name}>
            {bundle.dataset.name}
          </h2>
          <p className="mt-1 text-xs text-[#9CA3AF] tabular-nums">
            {bundle.dataset.rowCount.toLocaleString()} rows · {bundle.dataset.columnCount} cols
          </p>
        </div>

        <nav className="mt-4 flex flex-wrap gap-1.5 lg:flex-col lg:flex-nowrap">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors whitespace-nowrap shrink-0 sm:text-sm lg:px-3.5 lg:py-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4E50DE] ${
                  isActive
                    ? 'bg-[#4E50DE] text-white'
                    : 'text-[#9CA3AF] hover:bg-white/6 hover:text-white'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-[#9CA3AF]'}`}
                />
                <span>{tab.label}</span>
                {tab.id === 'cleaning' && bundle.issues.length > 0 && (
                  <span
                    className={`ml-1 font-mono-tabular text-xs font-semibold lg:ml-auto ${
                      isActive ? 'text-white' : 'text-[#F32E35]'
                    }`}
                  >
                    {bundle.issues.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-6 hidden border-t border-white/10 pt-4 lg:block space-y-2">
          <button
            type="button"
            onClick={() => onNavigate('upload')}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-white/20 px-3 py-2 text-xs font-medium text-[#F4F4F6] transition-colors hover:border-[#4E50DE] hover:text-white"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Switch File</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('export')}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#F32E35] px-3 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#ff4249]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 space-y-6">
        <div className="flex flex-col gap-2 border-b border-black/10 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
          <div>
            <p className="text-xs font-medium text-[#52525B] dark:text-[#9CA3AF]">
              Analysis Workspace ·{' '}
              {bundle.executionMode === 'python-backend' ? 'Python FastAPI' : 'In-Browser Mode'}
            </p>
            <h1 className="mt-0.5 font-display-condensed text-3xl font-extrabold uppercase tracking-wide text-[#08070B] sm:text-4xl dark:text-[#F4F4F6]">
              {currentTabMeta.label}
            </h1>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => onNavigate('upload')}
              className="rounded-md border border-black/20 px-3 py-1.5 text-xs font-medium text-[#08070B] dark:border-white/20 dark:text-[#F4F4F6]"
            >
              Switch File
            </button>
            <button
              type="button"
              onClick={() => onNavigate('export')}
              className="rounded-md bg-[#F32E35] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white"
            >
              Export
            </button>
          </div>
        </div>

        {bundle.backendFallbackReason && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-[#F32E35]/40 bg-[#F32E35]/10 px-4 py-3 text-xs text-[#08070B] dark:text-[#F4F4F6]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#F32E35]" />
            <span>{bundle.backendFallbackReason}</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-[#F32E35]/40 bg-[#F32E35]/10 px-4 py-3 text-sm text-[#08070B] dark:text-[#F4F4F6]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#F32E35]" />
            <span>{error}</span>
          </div>
        )}

        {activeTab === 'overview' && <OverviewTab dataset={bundle.dataset} />}
        {activeTab === 'summary' && <SummaryTab summary={bundle.summary} isDark={isDark} />}
        {activeTab === 'correlations' && (
          <CorrelationsTab correlations={bundle.correlations} isDark={isDark} />
        )}
        {activeTab === 'visualizations' && (
          <VisualizationsTab dataset={bundle.dataset} isDark={isDark} />
        )}
        {activeTab === 'insights' && <InsightsTab insights={bundle.insights} />}
        {activeTab === 'cleaning' && (
          <CleaningTab
            dataset={bundle.dataset}
            issues={bundle.issues}
            cleaningHistory={cleaningHistory}
            hasOriginalChanges={hasOriginalChanges}
            isBusy={isLoading}
            onApplyAction={onApplyCleaning}
            onResetOriginal={onResetOriginal}
          />
        )}
        {activeTab === 'ai' && <AiInsightsTab />}
      </main>
    </div>
  );
}
