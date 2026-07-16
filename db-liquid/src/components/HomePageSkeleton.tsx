function Pulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/10 ${className}`} />;
}

function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="aspect-[4/3] animate-pulse bg-gray-200" />
      <div className="p-3.5 space-y-2">
        <div className="h-2.5 w-20 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
        <div className="flex justify-between pt-3 border-t border-gray-100 gap-3">
          <div className="space-y-1.5 flex-1">
            <div className="h-2 w-12 animate-pulse rounded bg-gray-100" />
            <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="space-y-1.5 flex-1 flex flex-col items-end">
            <div className="h-2 w-16 animate-pulse rounded bg-gray-100" />
            <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecommendedSectionSkeleton() {
  return (
    <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-0" aria-busy="true" aria-label="Loading properties">
      <div className="mb-6 space-y-2">
        <Pulse className="h-8 w-64 md:w-80" />
        <Pulse className="h-4 w-48" />
      </div>

      <div className="flex items-center gap-3 mb-8">
        <Pulse className="h-9 w-32 rounded-full" />
        <Pulse className="h-9 w-36 rounded-full" />
      </div>

      <div className="mb-6">
        <Pulse className="h-6 w-72" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="min-h-screen" aria-busy="true" aria-label="Loading home page">
      {/* Header skeleton */}
      <header className="fixed top-0 inset-x-0 z-50 navbar-bar">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 lg:h-[60px] gap-4 lg:gap-8">
            <Pulse className="h-8 w-28 shrink-0" />
            <nav className="hidden lg:flex flex-1 items-center justify-center gap-6">
              <Pulse className="h-3.5 w-20" />
              <Pulse className="h-3.5 w-10" />
              <Pulse className="h-3.5 w-14" />
              <Pulse className="h-3.5 w-20" />
              <Pulse className="h-3.5 w-28" />
            </nav>
            <div className="hidden md:flex items-center gap-3 ml-auto shrink-0">
              <Pulse className="h-3.5 w-14" />
              <Pulse className="h-9 w-28 rounded-full bg-[#FF7A00]/40" />
            </div>
            <Pulse className="md:hidden ml-auto h-8 w-8 rounded-md" />
          </div>
        </div>
      </header>

      <main className="pt-14 lg:pt-[60px]">
        {/* Hero skeleton */}
        <section className="relative w-full mb-16">
          <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#000000]" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-4 z-20 translate-y-1/2">
            <div className="bg-white rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-w-[1000px] mx-auto w-full p-2 md:p-4">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 mb-3">
                <div className="flex items-center gap-6 py-3">
                  <div className="h-4 w-10 animate-pulse rounded bg-gray-200 border-b-2 border-[#FF7A00]" />
                  <div className="h-4 w-10 animate-pulse rounded bg-gray-100" />
                </div>
                <div className="hidden sm:block h-8 w-48 animate-pulse rounded-full bg-[#FF7A00]/30 mb-1" />
              </div>

              <div className="flex flex-col md:flex-row items-center gap-3 px-2 pb-2">
                <div className="h-12 w-full md:w-[220px] animate-pulse rounded-xl bg-gray-100 shrink-0" />
                <div className="h-12 flex-1 w-full animate-pulse rounded-xl bg-gray-100" />
                <div className="h-12 w-full md:w-28 animate-pulse rounded-xl bg-[#FF7A00]/35 shrink-0" />
              </div>
            </div>
          </div>
        </section>

        <RecommendedSectionSkeleton />
      </main>
    </div>
  );
}
