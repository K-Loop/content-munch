import React, { useState } from 'react';

/**
 * ImageWithFallback handles loading states and gracefully falls back
 * to a styled placeholder if an external photo fails to load.
 */
export default function ImageWithFallback({
  src,
  alt = '',
  className = '',
  aspectRatio = 'aspect-video',
  fallbackText = 'Studio Photography'
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError || !src) {
    return (
      <div className={`bg-studio-cream-dark border border-studio-border flex flex-col items-center justify-center p-6 text-center text-studio-muted ${aspectRatio} ${className}`}>
        <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs uppercase tracking-wider font-semibold text-studio-charcoal">{fallbackText}</span>
        <span className="text-xs text-studio-muted mt-1">Content Munch Studio • Chennai</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-studio-cream-dark ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-studio-cream-dark animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-studio-coral border-t-transparent animate-spin"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
}
