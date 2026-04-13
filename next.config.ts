import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* ── Output ─────────────────────────────────────────────────────────── */
  // 'standalone' produit un dossier autonome — idéal pour Docker / Vercel
  output: 'standalone',

  /* ── Images ─────────────────────────────────────────────────────────── */
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Avatars Supabase Storage
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  /* ── En-têtes de sécurité ───────────────────────────────────────────── */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prévient le clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Empêche le MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Force HTTPS pendant 2 ans, inclut les sous-domaines
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Contrôle les infos envoyées dans le Referer
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Désactive les fonctionnalités non utilisées
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // 'unsafe-eval' requis par Next.js dev
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              `connect-src 'self' https://*.supabase.co wss://*.supabase.co`,
              "img-src 'self' data: blob: https://*.supabase.co",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
      // Cache statique agressif pour les assets immuables
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Pas de cache pour les pages HTML
      {
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ]
  },

  /* ── Redirections ────────────────────────────────────────────────────── */
  async redirects() {
    return [
      // Redirige la racine vers le tableau de bord si connecté (géré par middleware)
      // Redirige les anciens chemins éventuels
      {
        source: '/dashboard',
        destination: '/tableau-de-bord',
        permanent: true,
      },
      {
        source: '/signin',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/inscription',
        permanent: true,
      },
    ]
  },

  /* ── Performances ────────────────────────────────────────────────────── */
  compress: true,
  poweredByHeader: false, // Supprime le header X-Powered-By: Next.js

  /* ── TypeScript en production ───────────────────────────────────────── */
  typescript: {
    // Les erreurs TypeScript bloquent le build en production
    ignoreBuildErrors: false,
  },
}

export default nextConfig
