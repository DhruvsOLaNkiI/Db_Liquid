import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  images: string[];
  alt: string;
  className?: string;
};

export function PropertyImageSlider({ images, alt, className = '' }: Props) {
  const slides = images.length > 0 ? images : [];
  const [index, setIndex] = useState(0);

  if (slides.length === 0) return null;

  const multiple = slides.length > 1;
  const current = slides[index] ?? slides[0];

  function go(delta: number) {
    setIndex((prev) => (prev + delta + slides.length) % slides.length);
  }

  return (
    <div
      className={`relative aspect-[4/3] lg:aspect-auto lg:min-h-[360px] overflow-hidden bg-gray-100 ${className}`}
    >
      <img
        key={current}
        src={current}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {multiple && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-gray-800 shadow-md flex items-center justify-center hover:bg-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-gray-800 shadow-md flex items-center justify-center hover:bg-white transition-colors"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Photo ${i + 1}`}
                className={`rounded-full transition-all ${
                  i === index ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          <span className="absolute top-3 right-3 text-[11px] font-medium bg-black/45 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
            {index + 1} / {slides.length}
          </span>
        </>
      )}
    </div>
  );
}
