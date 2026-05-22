"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeftIcon, PlusIcon, TrashIcon, PencilIcon, CloseIcon, CheckIcon, UploadIcon } from "@/components/ui/GroomrIcons";
import { Eyebrow } from "@/components/ui/Eyebrow";
import {
  getPortfolioUploadSignature,
  addPortfolioPhoto,
  deletePortfolioPhoto,
  updatePortfolioCaption,
} from "@/app/actions/portfolio";
import type { PortfolioPhoto } from "@/app/actions/portfolio";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

interface Props {
  initialPhotos: PortfolioPhoto[];
}

export function PortfolioClient({ initialPhotos }: Props) {
  const [photos, setPhotos] = useState<PortfolioPhoto[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [lightbox, setLightbox] = useState<PortfolioPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    if (!files.length) return;
    setUploading(true);
    setUploadError(null);

    for (const file of Array.from(files)) {
      try {
        // We need the groomerProfileId for the upload signature — get it from the server action
        const sig = await getPortfolioUploadSignature("me");
        const form = new FormData();
        form.append("file", file);
        form.append("api_key", sig.apiKey);
        form.append("timestamp", String(sig.timestamp));
        form.append("signature", sig.signature);
        form.append("folder", sig.folder);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
          { method: "POST", body: form }
        );
        const json = await res.json();
        if (!json.secure_url) throw new Error("Upload failed");

        const result = await addPortfolioPhoto(json.secure_url, null);
        if (result.error) throw new Error(result.error);
        if (result.photo) setPhotos((p) => [...p, result.photo!]);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
      }
    }
    setUploading(false);
  }

  async function handleDelete(photoId: string) {
    const result = await deletePortfolioPhoto(photoId);
    if (!result.error) setPhotos((p) => p.filter((ph) => ph.id !== photoId));
  }

  function startEdit(photo: PortfolioPhoto) {
    setEditingId(photo.id);
    setEditCaption(photo.caption ?? "");
  }

  async function saveCaption(photoId: string) {
    const result = await updatePortfolioCaption(photoId, editCaption);
    if (!result.error) {
      setPhotos((p) =>
        p.map((ph) => (ph.id === photoId ? { ...ph, caption: editCaption || null } : ph))
      );
    }
    setEditingId(null);
  }

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/groomer"
          className="rounded-full p-2 bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors focus-ring"
          aria-label="Back to dashboard"
        >
          <ChevronLeftIcon size={18} />
        </Link>
        <div>
          <Eyebrow>Groomer dashboard</Eyebrow>
          <h1 className="font-fredoka text-3xl text-deep-slate mt-1">Portfolio</h1>
        </div>
      </div>

      <p className="text-sm text-pebble-grey font-bold mb-6">
        Showcase your best work. Photos appear on your public profile and in search results.
        {photos.length > 0 && ` ${photos.length} photo${photos.length === 1 ? "" : "s"} uploaded.`}
      </p>

      {/* Upload zone */}
      <div
        className="border-2 border-dashed border-pebble-grey/30 rounded-[20px] p-8 flex flex-col items-center gap-3 bg-white mb-6 cursor-pointer hover:border-deep-slate/40 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
      >
        <div className="w-12 h-12 rounded-full bg-alabaster-cream border border-pebble-grey/20 flex items-center justify-center text-sage-leaf">
          {uploading ? (
            <span className="text-xs font-bold text-pebble-grey">...</span>
          ) : (
            <UploadIcon size={22} />
          )}
        </div>
        <p className="font-fredoka text-lg text-deep-slate">
          {uploading ? "Uploading…" : "Drop photos here or click to upload"}
        </p>
        <p className="text-xs font-bold text-pebble-grey">JPG, PNG or WEBP · Multiple files supported</p>
        {uploadError && (
          <p className="text-xs font-bold text-muted-terracotta">{uploadError}</p>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-16 text-pebble-grey font-bold text-sm">
          No photos yet — upload your first one above.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative bg-white border border-pebble-grey/20 rounded-[16px] overflow-hidden">
              {/* Image */}
              <button
                className="w-full aspect-square relative block focus-ring"
                onClick={() => setLightbox(photo)}
                aria-label="View photo"
              >
                <Image
                  src={photo.url}
                  alt={photo.caption ?? "Portfolio photo"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </button>

              {/* Caption */}
              <div className="p-3">
                {editingId === photo.id ? (
                  <div className="flex gap-1.5">
                    <input
                      autoFocus
                      className="field text-xs flex-1 py-1.5"
                      placeholder="Add a caption…"
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveCaption(photo.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button
                      onClick={() => saveCaption(photo.id)}
                      className="rounded-full p-1.5 bg-deep-slate text-white focus-ring"
                      aria-label="Save caption"
                    >
                      <CheckIcon size={12} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-full p-1.5 bg-pebble-grey/10 text-deep-slate focus-ring"
                      aria-label="Cancel"
                    >
                      <CloseIcon size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className="text-xs text-pebble-grey font-bold truncate flex-1 cursor-pointer hover:text-deep-slate"
                      onClick={() => startEdit(photo)}
                    >
                      {photo.caption ?? <span className="italic opacity-50">Add caption…</span>}
                    </p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(photo)}
                        className="rounded-full p-1.5 hover:bg-alabaster-cream focus-ring"
                        aria-label="Edit caption"
                      >
                        <PencilIcon size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(photo.id)}
                        className="rounded-full p-1.5 text-muted-terracotta hover:bg-muted-terracotta/10 focus-ring"
                        aria-label="Delete photo"
                      >
                        <TrashIcon size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add more tile */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-[16px] border-2 border-dashed border-pebble-grey/30 flex flex-col items-center justify-center gap-2 text-pebble-grey hover:border-deep-slate/40 hover:text-deep-slate transition-colors focus-ring"
          >
            <PlusIcon size={24} />
            <span className="text-xs font-bold">Add more</span>
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[300] bg-deep-slate/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 rounded-full p-2 bg-white/10 text-white hover:bg-white/20 focus-ring"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            <CloseIcon size={20} />
          </button>
          <div
            className="relative max-w-3xl max-h-[80vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightbox.url}
              alt={lightbox.caption ?? "Portfolio photo"}
              width={1200}
              height={900}
              className="object-contain rounded-xl max-h-[80vh] w-auto mx-auto"
            />
            {lightbox.caption && (
              <p className="text-center text-white text-sm font-bold mt-3">{lightbox.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
