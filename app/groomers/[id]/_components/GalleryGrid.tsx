"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const PREVIEW_COUNT = 8;

interface GalleryGridProps {
  images: string[];
  groomerName: string;
}

export function GalleryGrid({ images, groomerName }: GalleryGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  // Lightbox keyboard nav
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

  // Gallery modal keyboard close
  useEffect(() => {
    if (!galleryOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setGalleryOpen(false); };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [galleryOpen]);

  if (images.length === 0) return null;

  const preview = images.slice(0, PREVIEW_COUNT);
  const hasMore = images.length > PREVIEW_COUNT;

  return (
    <>
      {/* Preview grid */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {preview.map((url, i) => (
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

        {/* View all button */}
        {hasMore && (
          <div className="flex justify-end">
            <button
              onClick={() => setGalleryOpen(true)}
              className="btn-secondary font-nunito font-bold py-2 px-5 rounded-full text-sm focus-ring"
            >
              View all {images.length} photos
            </button>
          </div>
        )}
      </div>

      {/* ── Full gallery modal ─────────────────────────────────────────────── */}
      {galleryOpen && (
        <div className="fixed inset-0 z-[150] flex flex-col bg-alabaster-cream">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-pebble-grey/20 bg-white shrink-0">
            <h2 className="font-fredoka text-xl text-deep-slate">
              All photos · {images.length}
            </h2>
            <button
              onClick={() => setGalleryOpen(false)}
              aria-label="Close gallery"
              className="text-pebble-grey hover:text-muted-terracotta transition-colors focus-ring rounded-full p-2 bg-pebble-grey/10 min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable photo list */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {images.map((url, i) => (
                <button
                  key={i}
                  onClick={() => { setGalleryOpen(false); setLightboxIndex(i); }}
                  className="w-full rounded-2xl overflow-hidden focus-ring hover:opacity-95 transition-opacity"
                  aria-label={`View photo ${i + 1} of ${images.length}`}
                >
                  <Image
                    src={url}
                    alt={`${groomerName} photo ${i + 1}`}
                    width={600}
                    height={450}
                    className="object-cover w-full"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ───────────────────────────────────────────────────────── */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            aria-label="Close photo"
            className="absolute top-5 right-5 text-white/80 hover:text-white transition-colors bg-white/10 rounded-full p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

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
