import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { OptimizedImage } from '../OptimizedImage';

export type PropertyMediaSlide = {
  type: 'image' | 'video';
  url: string;
};

type Props = {
  /** Prefer `media`; `images` kept for older call sites. */
  media?: PropertyMediaSlide[];
  images?: string[];
  alt: string;
  className?: string;
};

export function PropertyImageSlider({ media, images, alt, className = '' }: Props) {
  const slides: PropertyMediaSlide[] =
    media && media.length > 0
      ? media
      : (images ?? []).map((url) => ({ type: 'image' as const, url }));

  const [index, setIndex] = useState(0);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    thumbRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [index]);

  if (slides.length === 0) return null;

  const multiple = slides.length > 1;
  const current = slides[index] ?? slides[0];
  const coverImage = slides.find((s) => s.type === 'image')?.url;

  function go(delta: number) {
    setIndex((prev) => (prev + delta + slides.length) % slides.length);
  }

  function select(i: number) {
    setIndex(i);
  }

  return (
    <div className={`flex flex-col bg-gray-100 ${className}`}>
      <div className="relative w-full aspect-[4/3] max-h-[min(70vh,420px)] overflow-hidden bg-black/5">
        {current.type === 'video' ? (
          <video
            key={current.url}
            src={current.url}
            controls
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-contain bg-black"
            aria-label={alt}
          />
        ) : (
          <OptimizedImage
            key={current.url}
            src={current.url}
            alt={alt}
            className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300"
            loading={index === 0 ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : 'auto'}
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
        )}

        {multiple && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous media"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-white transition-colors z-10 text-black"
            >
              <ChevronLeft size={22} strokeWidth={2.5} className="text-black" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next media"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-white transition-colors z-10 text-black"
            >
              <ChevronRight size={22} strokeWidth={2.5} className="text-black" />
            </button>

            <span className="absolute top-3 right-3 text-[11px] font-medium bg-black/45 text-white px-2 py-0.5 rounded-full backdrop-blur-sm z-10">
              {current.type === 'video' ? 'Video' : `${index + 1} / ${slides.length}`}
            </span>
          </>
        )}

        {!multiple && current.type === 'video' && (
          <span className="absolute top-3 right-3 text-[11px] font-medium bg-black/45 text-white px-2 py-0.5 rounded-full backdrop-blur-sm z-10">
            Video
          </span>
        )}
      </div>

      {multiple && (
        <div
          className="flex gap-2 overflow-x-auto px-3 py-2.5 bg-[#0b1220]/90 border-t border-white/10 hide-scrollbar"
          role="tablist"
          aria-label="Property photos and video"
        >
          {slides.map((slide, i) => {
            const selected = i === index;
            const isVideo = slide.type === 'video';

            return (
              <button
                key={`${slide.type}-${slide.url}-${i}`}
                ref={(el) => {
                  thumbRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={isVideo ? 'Select video' : `Select photo ${i + 1}`}
                onClick={() => select(i)}
                className={`relative shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  selected
                    ? 'border-[#FF7A00] ring-1 ring-[#FF7A00]/40'
                    : 'border-white/20 hover:border-white/50 opacity-80 hover:opacity-100'
                }`}
              >
                {isVideo ? (
                  <>
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-800" />
                    )}
                    <span className="absolute inset-0 bg-black/45" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-7 h-7 rounded-full bg-white/95 text-[#FF7A00] flex items-center justify-center shadow-sm">
                        <Play size={14} fill="currentColor" className="ml-0.5" />
                      </span>
                    </span>
                    <span className="absolute bottom-0.5 left-0.5 right-0.5 text-[9px] font-semibold text-white truncate text-center drop-shadow">
                      Video
                    </span>
                  </>
                ) : (
                  <img
                    src={slide.url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
