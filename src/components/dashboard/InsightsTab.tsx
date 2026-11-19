import { AlertTriangle, CheckCircle2, Info, TrendingUp } from 'lucide-react';
import type { Insight, InsightSeverity } from '../../types/analysis';

interface InsightsTabProps {
  insights: Insight[];
}

const SEVERITY_META: Record<
  InsightSeverity,
  { label: string; icon: typeof Info; accentClass: string; borderClass: string }
> = {
  warning: {
    label: 'Attention Needed',
    icon: AlertTriangle,
    accentClass: 'text-[#F32E35]',
    borderClass: 'border-[#F32E35]/35',
  },
  success: {
    label: 'Key Finding',
    icon: CheckCircle2,
    accentClass: 'text-[#4E50DE] dark:text-[#7D80FF]',
    borderClass: 'border-[#4E50DE]/30 dark:border-[#4E50DE]/45',
  },
  info: {
    label: 'Observation',
    icon: Info,
    accentClass: 'text-[#0891B2] dark:text-[#22D3EE]',
    borderClass: 'border-black/10 dark:border-white/10',
  },
};

export function InsightsTab({ insights }: InsightsTabProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#111118]">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h3 className="font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
              Automated Plain-English Insights
            </h3>
            <p className="mt-1 text-xs text-[#52525B] dark:text-[#9CA3AF]">
              Generated automatically from correlations, missingness, skewness, IQR outliers,
              dominant categories, and time-series patterns.
            </p>
          </div>
          <span className="font-mono-tabular text-xs font-medium text-[#52525B] dark:text-[#9CA3AF]">
            {insights.length} findings
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {insights.map((insight) => {
            const meta = SEVERITY_META[insight.severity];
            const Icon = insight.category === 'trend' ? TrendingUp : meta.icon;

            return (
              <article
                key={insight.id}
                className={`rounded-xl border ${meta.borderClass} bg-[#F8F8FB] p-5 transition-colors hover:bg-[#F0F0F5] dark:bg-[#0C0C12] dark:hover:bg-[#14141E]`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className={`inline-flex items-center gap-1.5 font-semibold ${meta.accentClass}`}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{meta.label}</span>
                    <span aria-hidden="true" className="text-[#52525B]/50 dark:text-[#9CA3AF]/50">
                      ·
                    </span>
                    <span className="capitalize text-[#52525B] dark:text-[#9CA3AF]">
                      {insight.category}
                    </span>
                  </span>

                  {insight.metric && (
                    <span className="font-mono-tabular font-semibold text-[#08070B] dark:text-[#F4F4F6]">
                      {insight.metric}
                    </span>
                  )}
                </div>

                <h4 className="mt-3 text-base font-semibold leading-snug text-[#08070B] dark:text-[#F4F4F6]">
                  {insight.title}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-[#52525B] dark:text-[#9CA3AF]">
                  {insight.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
