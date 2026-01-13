/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para lidar com caminhos que contêm caracteres especiais
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // Otimizações de performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'date-fns',
    ],
  },

  // Compressão
  compress: true,

  // Otimização de imagens
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 dias
  },

  // Security & Cache headers
  async headers() {
    // Content Security Policy - permite recursos necessários para o app funcionar
    const ContentSecurityPolicy = [
      "default-src 'self'",
      // Scripts: self + inline (Next.js requer) + eval (dev)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://appleid.apple.com",
      // Estilos: self + inline (Tailwind/Radix) + Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fontes: self + Google Fonts
      "font-src 'self' https://fonts.gstatic.com data:",
      // Imagens: self + data + blob + avatares + Supabase storage
      "img-src 'self' data: blob: https://*.googleusercontent.com https://*.supabase.co https://lh3.googleusercontent.com",
      // Conexões: self + Supabase + Google Auth + Apple Auth
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://appleid.apple.com https://api.openai.com",
      // Frames: Google Sign-In + Apple Sign-In
      "frame-src 'self' https://accounts.google.com https://appleid.apple.com",
      // Prevenir clickjacking
      "frame-ancestors 'self'",
      // Forms só para o próprio site
      "form-action 'self'",
      // Base URI
      "base-uri 'self'",
      // Bloquear objetos (Flash, etc)
      "object-src 'none'",
      // Upgrade HTTP para HTTPS
      "upgrade-insecure-requests",
    ].join("; ")

    // Security headers to apply to all routes
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
      // Content Security Policy
      {
        key: 'Content-Security-Policy',
        value: ContentSecurityPolicy,
      },
    ]

    return [
      // Apply security headers to all routes
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Cache static assets
      {
        source: '/:all*(svg|jpg|png|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Otimizações de webpack
  webpack: (config) => {
    config.resolve.symlinks = true
    return config
  },

  // TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Power by header desabilitado
  poweredByHeader: false,

  // Trailing slash consistente
  trailingSlash: false,
}

export default nextConfig
