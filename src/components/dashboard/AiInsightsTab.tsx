import { Activity, Cpu, Layers, Lock } from 'lucide-react';
import { mlService } from '../../services/mlService';

const ICON_MAP = {
  'predictive-regression': Activity,
  'kmeans-clustering': Layers,
  'anomaly-forest': Cpu,
} as const;

export function AiInsightsTab() {
  const capabilities = mlService.listCapabilities();

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#111118]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h3 className="font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
              AI & Machine Learning Modules (Coming Soon)
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-[#52525B] dark:text-[#9CA3AF]">
              These automated scikit-learn modeling pipelines are scaffolded behind our{' '}
              <code className="font-mono-tabular text-xs text-[#4E50DE] dark:text-[#7D80FF]">
                mlService
              </code>{' '}
              adapter and will connect once the Python ML backend is enabled.
            </p>
          </div>
          <span className="font-mono-tabular text-xs font-semibold uppercase tracking-widest text-[#F32E35]">
            Roadmap Preview
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {capabilities.map((cap) => {
            const Icon = ICON_MAP[cap.id];
            return (
              <article
                key={cap.id}
                className="flex flex-col justify-between rounded-xl border border-black/10 bg-[#F8F8FB] p-6 dark:border-white/10 dark:bg-[#0C0C12]"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#52525B] dark:text-[#9CA3AF]">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#4E50DE] dark:text-[#7D80FF]">
                      <Icon className="h-4 w-4" />
                      <span>{cap.subtitle}</span>
                    </span>
                    <span className="font-mono-tabular uppercase tracking-wider text-[11px]">
                      Coming Soon
                    </span>
                  </div>

                  <h4 className="mt-3 font-display-condensed text-xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
                    {cap.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-[#52525B] dark:text-[#9CA3AF]">
                    {cap.description}
                  </p>
                  <p className="mt-4 text-xs text-[#52525B] dark:text-[#9CA3AF]">
                    {cap.recommendedInputs}
                  </p>
                </div>

                <div className="mt-6 border-t border-black/10 pt-4 dark:border-white/10">
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-sm border border-black/15 bg-black/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#52525B] opacity-75 dark:border-white/15 dark:bg-white/5 dark:text-[#9CA3AF]"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Available in Upcoming Release</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
