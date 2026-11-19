import { CheckCircle2, RotateCcw, Sparkles, Wrench } from 'lucide-react';
import type { CleaningAction, CleaningIssue, Dataset } from '../../types/analysis';

interface CleaningTabProps {
  dataset: Dataset;
  issues: CleaningIssue[];
  cleaningHistory: string[];
  hasOriginalChanges: boolean;
  isBusy: boolean;
  onApplyAction: (action: CleaningAction) => Promise<unknown>;
  onResetOriginal: () => Promise<unknown>;
}

export function CleaningTab({
  dataset,
  issues,
  cleaningHistory,
  hasOriginalChanges,
  isBusy,
  onApplyAction,
  onResetOriginal,
}: CleaningTabProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#111118]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
              Data Quality & One-Click Cleaning
            </h3>
            <p className="mt-1 font-mono-tabular text-xs text-[#52525B] dark:text-[#9CA3AF]">
              {dataset.rowCount.toLocaleString()} rows · {dataset.totalMissing.toLocaleString()}{' '}
              missing cells · {dataset.duplicateCount.toLocaleString()} duplicate rows
            </p>
          </div>

          {hasOriginalChanges && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void onResetOriginal()}
              className="inline-flex items-center gap-2 rounded-sm border border-black/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#08070B] transition-colors hover:border-[#F32E35] hover:text-[#F32E35] disabled:opacity-50 whitespace-nowrap shrink-0 dark:border-white/20 dark:text-[#F4F4F6] dark:hover:border-[#F32E35] dark:hover:text-[#F32E35]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restore Original Data</span>
            </button>
          )}
        </div>

        {cleaningHistory.length > 0 && (
          <div className="mt-4 rounded-lg border border-[#4E50DE]/30 bg-[#4E50DE]/5 px-4 py-3 text-xs text-[#08070B] dark:border-[#4E50DE]/40 dark:bg-[#4E50DE]/10 dark:text-[#F4F4F6]">
            <span className="font-semibold text-[#4E50DE] dark:text-[#7D80FF]">
              Applied fixes ({cleaningHistory.length}):
            </span>{' '}
            <span>{cleaningHistory.join(' → ')}</span>
          </div>
        )}

        {issues.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-xl border border-black/10 bg-[#F8F8FB] px-6 py-12 text-center dark:border-white/10 dark:bg-[#0C0C12]">
            <CheckCircle2 className="h-10 w-10 text-[#4E50DE] dark:text-[#7D80FF]" />
            <h4 className="mt-3 font-display-condensed text-2xl font-bold uppercase tracking-wide text-[#08070B] dark:text-[#F4F4F6]">
              Dataset Quality Looks Clean
            </h4>
            <p className="mt-1 max-w-md text-sm text-[#52525B] dark:text-[#9CA3AF]">
              No duplicate rows, empty columns, or missing values remain in this table. You can
              head to Export to download the cleaned CSV.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="rounded-xl border border-black/10 bg-[#F8F8FB] p-5 dark:border-white/10 dark:bg-[#0C0C12]"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <Wrench
                        className={`h-3.5 w-3.5 ${
                          issue.severity === 'warning'
                            ? 'text-[#F32E35]'
                            : 'text-[#4E50DE] dark:text-[#7D80FF]'
                        }`}
                      />
                      <span
                        className={
                          issue.severity === 'warning'
                            ? 'text-[#F32E35]'
                            : 'text-[#4E50DE] dark:text-[#7D80FF]'
                        }
                      >
                        {issue.severity === 'warning' ? 'Quality Warning' : 'Cleanup Option'}
                      </span>
                      <span aria-hidden="true" className="text-[#52525B]/40 dark:text-[#9CA3AF]/40">
                        ·
                      </span>
                      <span className="font-mono-tabular text-[#52525B] dark:text-[#9CA3AF]">
                        {issue.affectedCount.toLocaleString()} affected
                      </span>
                    </div>
                    <h4 className="mt-1.5 text-base font-semibold text-[#08070B] dark:text-[#F4F4F6]">
                      {issue.title}
                    </h4>
                    <p className="mt-1 text-sm text-[#52525B] dark:text-[#9CA3AF]">
                      {issue.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    {issue.actions.map((action, actionIdx) => (
                      <button
                        key={`${issue.id}-${action.type}`}
                        type="button"
                        disabled={isBusy}
                        title={action.description}
                        onClick={() => void onApplyAction(action)}
                        className={`inline-flex items-center gap-1.5 rounded-sm px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 ${
                          actionIdx === 0
                            ? 'bg-[#4E50DE] hover:bg-[#3F41C9]'
                            : 'bg-[#F32E35] hover:bg-[#D92329]'
                        }`}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
