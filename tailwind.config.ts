import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'SF Mono', 'monospace'],
      },
      fontSize: {
        // Apple Typography Scale
        'display': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'title': ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
        'callout': ['0.9375rem', { lineHeight: '1.4' }],
        'subhead': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],
        'footnote': ['0.8125rem', { lineHeight: '1.4' }],
        'caption': ['0.75rem', { lineHeight: '1.3' }],
        // Keep standard sizes
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      colors: {
        // Base colors using CSS variables
        background: 'var(--background)',
        foreground: 'var(--foreground)',

        // Apple Primary Blue
        primary: {
          DEFAULT: '#007AFF',
          hover: '#0066CC',
          light: 'rgba(0, 122, 255, 0.12)',
          foreground: '#FFFFFF',
        },

        // Secondary
        secondary: {
          DEFAULT: 'var(--background-secondary)',
          foreground: 'var(--foreground-secondary)',
        },

        // Muted
        muted: {
          DEFAULT: 'var(--background-secondary)',
          foreground: 'var(--foreground-secondary)',
        },

        // Cards & Surfaces
        card: {
          DEFAULT: 'var(--card)',
          hover: 'var(--card-hover)',
          border: 'var(--card-border)',
          foreground: 'var(--foreground)',
        },

        // Popover
        popover: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--foreground)',
        },

        // Accent
        accent: {
          DEFAULT: 'var(--background-secondary)',
          foreground: 'var(--foreground)',
        },

        // Border & Input
        border: 'var(--card-border)',
        input: 'var(--card-border)',
        ring: '#007AFF',

        // Semantic Colors - Apple Palette
        success: {
          DEFAULT: '#34C759',
          light: 'rgba(52, 199, 89, 0.12)',
          foreground: '#FFFFFF',
        },
        warning: {
          DEFAULT: '#FF9500',
          light: 'rgba(255, 149, 0, 0.12)',
          foreground: '#FFFFFF',
        },
        danger: {
          DEFAULT: '#FF3B30',
          light: 'rgba(255, 59, 48, 0.12)',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#FF3B30',
          foreground: '#FFFFFF',
        },

        // Financial Colors
        income: '#34C759',
        expense: '#FF3B30',
        investment: '#5856D6',
        transfer: '#007AFF',

        // Category Colors - Apple Palette
        category: {
          blue: '#007AFF',
          purple: '#5856D6',
          pink: '#FF2D55',
          red: '#FF3B30',
          orange: '#FF9500',
          yellow: '#FFCC00',
          green: '#34C759',
          teal: '#5AC8FA',
          indigo: '#5856D6',
          gray: '#8E8E93',
        },

        // Charts
        chart: {
          '1': '#007AFF',
          '2': '#34C759',
          '3': '#FF9500',
          '4': '#FF3B30',
          '5': '#5856D6',
        },

        // Glassmorphism
        glass: {
          DEFAULT: 'var(--glass)',
          border: 'var(--glass-border)',
        },
      },

      spacing: {
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
      },

      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        'full': '9999px',
      },

      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'xl': '0 16px 48px rgba(0, 0, 0, 0.16)',
        'card': '0 0 0 1px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)',
        'card-hover': '0 0 0 1px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.1)',
        'modal': '0 24px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.04)',
        'none': 'none',
      },

      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '350ms',
        'slower': '500ms',
      },

      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      animation: {
        'fade-in': 'fadeIn 250ms ease-out',
        'scale-in': 'scaleIn 250ms cubic-bezier(0.175, 0.885, 0.32, 1.1)',
        'slide-up': 'slideUp 250ms ease-out',
        'count-up': 'countUp 400ms ease-out',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        countUp: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
