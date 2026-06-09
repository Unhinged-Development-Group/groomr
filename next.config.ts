import type { NextConfig } from "next";

const CSP = [
  "default-src 'self'",
  // Next.js requires unsafe-inline for hydration scripts; unsafe-eval for dev HMR
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com https://*.clerk.com https://*.clerk.dev https://full-jaguar-15.clerk.accounts.dev",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://img.clerk.com https://full-jaguar-15.clerk.accounts.dev https://lh3.googleusercontent.com https://images.unsplash.com https://avatars.githubusercontent.com https://maps.gstatic.com https://maps.googleapis.com",
  "font-src 'self'",
  // Stripe PaymentElement renders inside an iframe served from js.stripe.com
  "frame-src https://js.stripe.com https://full-jaguar-15.clerk.accounts.dev",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://maps.googleapis.com https://maps.gstatic.com https://*.clerk.com https://*.clerk.dev https://full-jaguar-15.clerk.accounts.dev",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

// Policy HTML pages are standalone documents — more restrictive than the app CSP
// (no Clerk, Stripe, or Maps) since they load no external scripts or fonts.
const POLICY_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: https://res.cloudinary.com",
  "frame-src 'none'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
      {
        source: "/(privacy-policy|cookie-policy|acceptable-use|verification-policy)",
        headers: [
          { key: "Content-Security-Policy", value: POLICY_CSP },
        ],
      },
      {
        source: "/terms/:doc(platform|owner|groomer)",
        headers: [
          { key: "Content-Security-Policy", value: POLICY_CSP },
        ],
      },
    ];
  },
  images: {
    contentDispositionType: "attachment",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
