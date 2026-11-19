import { useState } from 'react';
import { Navbar, type AppRoute } from './components/Navbar';
import { useDatasetWorkspace } from './hooks/useDatasetWorkspace';
import { useTheme } from './hooks/useTheme';
import { AboutPage } from './pages/AboutPage';
import { DashboardPage, type DashboardTab } from './pages/DashboardPage';
import { ExportPage } from './pages/ExportPage';
import { LandingPage } from './pages/LandingPage';
import { UploadPage } from './pages/UploadPage';

export default function App() {
  const [activeRoute, setActiveRoute] = useState<AppRoute>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'dashboard';
    }
    return 'landing';
  });
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('overview');

  const { isDark, toggleTheme } = useTheme();
  const {
    bundle,
    cleaningHistory,
    hasOriginalChanges,
    isLoading,
    error,
    applyAnalysisBundle,
    loadSampleDataset,
    runCleaningAction,
    resetToOriginal,
  } = useDatasetWorkspace();

  const handleUseSampleDataset = async (targetTab: DashboardTab = 'overview') => {
    if (!bundle || bundle.dataset.sourceType !== 'sample' || hasOriginalChanges) {
      await loadSampleDataset();
    }
    setDashboardTab(targetTab);
    setActiveRoute('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F8F8FB] text-[#08070B] transition-colors duration-200 dark:bg-[#08070B] dark:text-[#F4F4F6]">
      <Navbar
        activeRoute={activeRoute}
        onNavigate={setActiveRoute}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {activeRoute === 'landing' && (
        <LandingPage
          bundle={bundle}
          isDark={isDark}
          onGetStarted={() => setActiveRoute('upload')}
          onUseSampleDataset={(tab) => void handleUseSampleDataset(tab)}
          onNavigate={setActiveRoute}
        />
      )}

      {activeRoute === 'upload' && (
        <UploadPage
          onBundleLoaded={applyAnalysisBundle}
          onLoadSample={loadSampleDataset}
          onGoToDashboard={() => {
            setDashboardTab('overview');
            setActiveRoute('dashboard');
          }}
        />
      )}

      {activeRoute === 'dashboard' && (
        <DashboardPage
          bundle={bundle}
          isLoading={isLoading}
          error={error}
          isDark={isDark}
          cleaningHistory={cleaningHistory}
          hasOriginalChanges={hasOriginalChanges}
          activeTab={dashboardTab}
          onTabChange={setDashboardTab}
          onApplyCleaning={runCleaningAction}
          onResetOriginal={resetToOriginal}
          onLoadSample={loadSampleDataset}
          onNavigate={setActiveRoute}
        />
      )}

      {activeRoute === 'export' && (
        <ExportPage bundle={bundle} onNavigate={setActiveRoute} />
      )}

      {activeRoute === 'about' && <AboutPage onNavigate={setActiveRoute} />}
    </div>
  );
}
