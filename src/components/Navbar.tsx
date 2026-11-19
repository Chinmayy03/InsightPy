import { Menu, Moon, Sun, X } from 'lucide-react';
import { useState } from 'react';

export type AppRoute = 'landing' | 'upload' | 'dashboard' | 'export' | 'about';

interface NavbarProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const NAV_ITEMS: Array<{ id: AppRoute; label: string }> = [
  { id: 'landing', label: 'Home' },
  { id: 'upload', label: 'Upload' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'export', label: 'Export' },
  { id: 'about', label: 'About' },
];

export function Navbar({ activeRoute, onNavigate, isDark, onToggleTheme }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (route: AppRoute) => {
    onNavigate(route);
    setMobileOpen(false);
  };

  return (
    <header className="no-print sticky top-0 z-40 border-b border-black/10 bg-[#F8F8FB]/95 backdrop-blur-sm dark:border-white/10 dark:bg-[#08070B]/95">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-4 lg:px-10">
        {/* Zone 1: Single text element wordmark in Neon Red */}
        <button
          type="button"
          onClick={() => handleNav('landing')}
          className="font-display-condensed text-2xl font-extrabold tracking-[0.14em] uppercase text-[#F32E35] transition-opacity hover:opacity-85 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4E50DE]"
        >
          INSIGHTPY
        </button>

        {/* Zone 2: 5 concise single-line nav links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const active = activeRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`relative py-1 text-xs font-medium tracking-wide transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4E50DE] sm:text-sm ${
                  active
                    ? 'text-[#08070B] dark:text-[#F4F4F6]'
                    : 'text-[#52525B] hover:text-[#08070B] dark:text-[#9CA3AF] dark:hover:text-[#F4F4F6]'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-[#F32E35]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Theme toggle + Indigo primary CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-black/15 bg-white text-[#08070B] transition-colors hover:border-[#4E50DE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4E50DE] dark:border-white/15 dark:bg-[#111118] dark:text-[#F4F4F6] dark:hover:border-[#4E50DE]"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => handleNav(activeRoute === 'dashboard' ? 'upload' : 'dashboard')}
            className="hidden sm:inline-flex items-center justify-center rounded-md bg-[#4E50DE] px-5 py-2 text-xs font-semibold tracking-wide text-white transition-colors hover:bg-[#5E60EE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F32E35] whitespace-nowrap shrink-0"
          >
            {activeRoute === 'dashboard' ? 'Upload File' : 'Open Studio'}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-black/15 bg-white text-[#08070B] md:hidden dark:border-white/15 dark:bg-[#111118] dark:text-[#F4F4F6]"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-black/10 bg-[#F8F8FB] px-6 py-4 md:hidden dark:border-white/10 dark:bg-[#08070B]"
        >
          <div className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const active = activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`flex items-center justify-between rounded-md px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#4E50DE] text-white'
                      : 'text-[#08070B] hover:bg-black/5 dark:text-[#F4F4F6] dark:hover:bg-white/5'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
