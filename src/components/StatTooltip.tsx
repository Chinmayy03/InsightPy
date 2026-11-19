import { HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface StatTooltipProps {
  term: string;
  explanation: string;
}

export function StatTooltip({ term, explanation }: StatTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center align-middle">
      <button
        type="button"
        aria-label={`Explain ${term}`}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-[#52525B] transition-colors hover:text-[#4E50DE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4E50DE] dark:text-[#9CA3AF] dark:hover:text-white"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>

      {open && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-60 -translate-x-1/2 rounded-lg border border-white/15 bg-[#08070B] px-3 py-2 text-left text-xs font-normal leading-relaxed text-[#F4F4F6] shadow-xl"
        >
          <span className="block font-semibold text-[#F32E35]">{term}</span>
          <span>{explanation}</span>
        </span>
      )}
    </span>
  );
}
