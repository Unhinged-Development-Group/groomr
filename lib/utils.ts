import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toCoverPhotoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.includes("res.cloudinary.com")) return url;
  // c_fill always outputs exactly 1200x720 (5:3), cropping overflow — so any
  // upload fills the cover band identically everywhere. g_auto keeps the most
  // salient region centred in frame; f_auto serves webp/avif where supported.
  // b_whitesmoke (#F5F5F5, closest CSS-named colour to brand cream — Cloudinary
  // can't take a bare hex, see CLAUDE.md) flattens transparent PNG covers (e.g.
  // a logo) onto a near-cream backing instead of showing through to the page.
  return url.replace("/upload/", "/upload/b_whitesmoke,c_fill,g_auto,w_1200,h_720,q_auto,f_auto/");
}

export function toProfilePhotoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.includes("res.cloudinary.com")) return url;
  // c_fill always outputs exactly 500x500; g_face keeps a detected face centred,
  // falling back to centre crop when none is found. b_whitesmoke flattens
  // transparent PNG logos onto a near-cream backing (matches the avatar circle)
  // instead of showing black — same delivery-layer model as the cover.
  return url.replace("/upload/", "/upload/b_whitesmoke,c_fill,g_face,w_500,h_500,q_auto:good,f_auto/");
}
