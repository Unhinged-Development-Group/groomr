"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface GalleryGridProps {
  images: string[];
  groomerName: string;
}

export function GalleryGrid({ images, groomerName }: GalleryGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") setLightboxIndex((i) => i === null ? null : (i + 1) % images.length);
      if (e.key === "ArrowLeft") setLightboxIndex((i) => i === null ? null : (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, images.length]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((url, i) => (
          <button
            key={i}
            onClick={() => setLightboxIndex(i)}
            className="aspect-square rounded-2xl overflow-hidden focus-ring hover:opacity-90 transition-opacity"
            aria-label={`View photo ${i + 1}`}
          >
            <Image
              src={url}
              alt={`${groomerName} photo ${i + 1}`}
              width={300}
              height={300}
              className="object-cover w-full h-full"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxIndex(null)}
            aria-label="Close photo"
            className="absolute top-5 right-5 text-white/80 hover:text-white transition-colors bg-white/10 rounded-full p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image */}
          <div
            className="relative max-w-3xl w-full mx-4 sm:mx-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-2xl overflow-hidden" style={{ maxHeight: "80vh" }}>
              <Image
                src={images[lightboxIndex]}
                alt={`${groomerName} photo ${lightboxIndex + 1}`}
                width={900}
                height={675}
                className="object-contain w-full"
                style={{ maxHeight: "80vh" }}
              />
            </div>
            <p className="text-center text-white/60 text-sm mt-3 font-bold">
              {lightboxIndex + 1} / {images.length}
            </p>
          </div>

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
                }}
                aria-label="Previous photo"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((lightboxIndex + 1) % images.length);
                }}
                aria-label="Next photo"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
