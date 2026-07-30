import type { ReactNode } from 'react';

type PosterSlotProps = {
  src: string;
  alt: string;
  className?: string;
};

/** Tall advertisement / poster flanking the listing wizard. */
export function ListingPosterSlot({ src, alt, className = '' }: PosterSlotProps) {
  return (
    <aside
      className={`rounded-3xl overflow-hidden bg-transparent w-full max-w-[420px] xl:max-w-[480px] ${className}`}
      aria-label={alt}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-auto aspect-[631/946] object-contain"
      />
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
    <div className="mx-auto w-full max-w-[1800px]">
      {/* Progress sticks below the fixed navbar with a frosted blur so it pops above content */}
      <div className="sticky top-16 z-40 mx-auto w-full max-w-[560px] xl:max-w-[620px] mb-5 rounded-2xl px-3 py-3 bg-white/10 backdrop-blur-xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        {progress}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,620px)_minmax(0,1fr)] lg:items-start">
        <ListingPosterSlot
          className="hidden lg:block sticky top-16 justify-self-start self-start"
          src="/Banner%20Side%20panal%20step.jpg"
          alt="How it works — steps"
        />

        <div className="min-w-0 w-full mx-auto">
          <div
            className="mb-8 relative w-full overflow-hidden rounded-2xl bg-transparent flex items-center justify-center aspect-[1640/624]"
            aria-label="Top poster banner"
          >
            <img
              src="/banner%202%20copy.jpg"
              alt="Sell your property for free"
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] px-5 py-6 sm:px-6 sm:py-8">
            {children}
          </div>
        </div>

        <ListingPosterSlot
          className="hidden lg:block sticky top-16 justify-self-end self-start"
          src="/Banner-Side-panel-right.jpg"
          alt="Tips on selling a property online"
        />
      </div>
    </div>
  );
}
