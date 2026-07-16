type Props = {
  src: string;
  alt: string;
  className?: string;
  /** Card / below-fold defaults to lazy; hero can pass "eager". */
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  sizes?: string;
  width?: number;
  height?: number;
  decoding?: 'async' | 'auto' | 'sync';
};

/**
 * PERF-008 — consistent lazy-loading + responsive hints for property images.
 */
export function OptimizedImage({
  src,
  alt,
  className,
  loading = 'lazy',
  fetchPriority = 'auto',
  sizes = '(max-width: 768px) 100vw, 33vw',
  width,
  height,
  decoding = 'async',
}: Props) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      sizes={sizes}
      width={width}
      height={height}
    />
  );
}
