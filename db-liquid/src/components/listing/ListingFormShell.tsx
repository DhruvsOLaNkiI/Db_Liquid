import type { ReactNode } from 'react';

type PosterSlotProps = {
  title?: string;
  subtitle?: string;
  className?: string;
};

/** Tall advertisement / poster flanking the listing wizard. */
export function ListingPosterSlot({
  title = 'Poster',
  subtitle = 'Promotional space',
  className = '',
}: PosterSlotProps) {
  return (
    <aside
      className={`rounded-3xl border-2 border-[#FF7A00]/50 bg-[#FF7A00] overflow-hidden ${className}`}
      aria-label={title}
    >
      <div className="h-full min-h-[min(70vh,640px)] flex flex-col items-center justify-center gap-3 px-5 py-10 text-center">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">
          Poster
        </span>
        <p className="text-lg font-semibold text-white">{title}</p>
        <p className="text-sm text-white/75 max-w-[14rem] leading-relaxed">{subtitle}</p>
      </div>
    </aside>
  );
}

type ShellProps = {
  /** Progress / stepper — rendered above the horizontal poster. */
  progress: ReactNode;
  children: ReactNode;
};

/**
 * Listing form layout:
 * progress (center only)
 * left poster | horizontal banner → form | right poster
 */
export function ListingFormShell({ progress, children }: ShellProps) {
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      {/* Progress sits above the side posters so they align with the horizontal banner */}
      <div className="mx-auto w-full max-w-[440px] xl:max-w-[460px] mb-5">
        {progress}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,440px)_320px] xl:grid-cols-[380px_minmax(0,460px)_380px] lg:justify-center lg:items-start">
        <ListingPosterSlot
          className="hidden lg:block sticky top-16 self-start"
          title="Campaign poster"
          subtitle="Drop your ad creative here"
        />

        <div className="min-w-0 w-full mx-auto">
          <div
            className="mb-8 relative w-full overflow-hidden rounded-2xl border-2 border-[#FF7A00]/50 bg-transparent flex items-center justify-center aspect-[1640/624]"
            aria-label="Top poster banner"
          >
            <img
              src="/banner%202%20copy.jpg"
              alt="DB Liquid campaign banner"
              className="absolute inset-0 w-full h-full object-contain"
            />
            <div className="relative z-10 text-center px-4">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/80">
                Poster
              </p>
              <p className="text-base text-white/90 mt-1.5">Horizontal banner</p>
            </div>
          </div>

          {children}
        </div>

        <ListingPosterSlot
          className="hidden lg:block sticky top-16 self-start"
          title="Campaign poster"
          subtitle="How to find the right buyer"
        />
      </div>
    </div>
  );
}
