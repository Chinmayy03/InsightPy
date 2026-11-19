import { Compass, Cpu, Database, Lock, Sparkles, Target } from 'lucide-react';
import type { AppRoute } from '../components/Navbar';

interface AboutPageProps {
  onNavigate: (route: AppRoute) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="mx-auto max-w-[1140px] px-6 py-12 lg:px-10 lg:py-16">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.16em] uppercase text-[#F32E35]">
          About InsightPy
        </p>
        <h1 className="mt-2 font-display-condensed text-4xl font-extrabold uppercase tracking-wide text-[#08070B] sm:text-6xl dark:text-[#F4F4F6]">
          Making exploratory data analysis approachable for everyone.
        </h1>
        <p className="mt-5 text-base leading-relaxed text-[#52525B] dark:text-[#9CA3AF]">
          InsightPy is an Intelligent Python-Based Data Analysis and Visualization Platform crafted
          for students, academic researchers, and small businesses who need rigorous statistical
          answers without writing pandas scripts or debugging notebooks.
        </p>
      </div>

      {/* Objectives & Architecture */}
      <section className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        <article className="rounded-xl border border-black/10 bg-white p-7 dark:border-white/10 dark:bg-[#111118]">
          <Target className="h-5 w-5 text-[#F32E35]" />
          <h2 className="mt-4 font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
            Core Objectives
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#52525B] dark:text-[#9CA3AF]">
            Automate schema inference, descriptive statistics, Pearson correlation mapping, outlier
            detection, and one-click data hygiene behind a focused interface.
          </p>
        </article>

        <article className="rounded-xl border border-black/10 bg-white p-7 dark:border-white/10 dark:bg-[#111118]">
          <Lock className="h-5 w-5 text-[#4E50DE]" />
          <h2 className="mt-4 font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
            Python Core Engine
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#52525B] dark:text-[#9CA3AF]">
            File parsing, schema inference, statistics, Pearson correlations, IQR outlier detection,
            and dataset cleaning run in Python using Pandas, NumPy, SciPy, and OpenPyXL.
          </p>
        </article>

        <article className="rounded-xl border border-black/10 bg-white p-7 dark:border-white/10 dark:bg-[#111118]">
          <Database className="h-5 w-5 text-[#4E50DE]" />
          <h2 className="mt-4 font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
            FastAPI Service Layer
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#52525B] dark:text-[#9CA3AF]">
            All frontend requests route through <code className="font-mono-tabular">analysisService</code>{' '}
            to the live Python FastAPI endpoints (<code className="font-mono-tabular">/upload-file</code>,{' '}
            <code className="font-mono-tabular">/summary</code>, <code className="font-mono-tabular">/clean</code>).
          </p>
        </article>
      </section>

      {/* Future Scope */}
      <section className="mt-14 rounded-xl border border-white/10 bg-[#0D0D13] p-8 text-[#F4F4F6] sm:p-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-[#F32E35]">
              Roadmap &amp; Research
            </p>
            <h2 className="mt-1 font-display-condensed text-3xl font-extrabold uppercase tracking-wide sm:text-4xl">
              Future Scope
            </h2>
          </div>
          <span className="text-xs text-[#9CA3AF]">Plug-in ML Architecture Ready</span>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-[#08070B] p-6">
            <Compass className="h-5 w-5 text-[#F32E35]" />
            <h3 className="mt-3 font-display-condensed text-xl font-bold uppercase tracking-wide">
              Predictive Analytics
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">
              Point-and-click regression and time-series forecasting allowing teams to predict
              demand, churn, or exam outcomes with confidence intervals.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#08070B] p-6">
            <Sparkles className="h-5 w-5 text-[#4E50DE]" />
            <h3 className="mt-3 font-display-condensed text-xl font-bold uppercase tracking-wide">
              AI-Generated Insights
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">
              Natural-language narrative executive summaries and conversational follow-up questions
              grounded directly in computed statistical tables.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#08070B] p-6">
            <Cpu className="h-5 w-5 text-[#22D3EE]" />
            <h3 className="mt-3 font-display-condensed text-xl font-bold uppercase tracking-wide">
              ML Model Recommendations
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">
              Automated algorithm selection, cross-validation benchmarking, and feature-importance
              explanations tailored to dataset size and target distribution.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="rounded-md bg-[#F32E35] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#ff4249]"
          >
            Open Analysis Workspace
          </button>
          <button
            type="button"
            onClick={() => onNavigate('upload')}
            className="rounded-md border border-white/25 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#F4F4F6] transition-colors hover:border-[#4E50DE] hover:text-white"
          >
            Upload Your Spreadsheet
          </button>
        </div>
      </section>
    </div>
  );
}
