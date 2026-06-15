import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toCoverPhotoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.includes("res.cloudinary.com")) return url;
  return url.replace("/upload/", "/upload/c_pad,b_f9f8f4,w_1200,h_720,q_auto:good/");
}

export function toProfilePhotoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.includes("res.cloudinary.com")) return url;
  return url.replace("/upload/", "/upload/c_fill,g_face,w_500,h_500,q_auto:good/");
}
