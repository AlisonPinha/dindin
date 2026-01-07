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
  			sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
  			heading: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
  		},
  		fontSize: {
  			xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
  			sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
  			base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
  			lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
  			xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
  			'2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
  			'3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			// Semantic colors
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))'
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				foreground: 'hsl(var(--warning-foreground))'
  			},
  			danger: {
  				DEFAULT: 'hsl(var(--danger))',
  				foreground: 'hsl(var(--danger-foreground))'
  			},
  			income: 'hsl(var(--income))',
  			expense: 'hsl(var(--expense))',
  			investment: 'hsl(var(--investment))'
  		},
  		borderRadius: {
  			sm: '0.375rem',   // 6px
  			md: '0.5rem',     // 8px
  			lg: '0.75rem',    // 12px
  			xl: '1rem',       // 16px
  			'2xl': '1.5rem',  // 24px
  			'3xl': '2rem',    // 32px
  		},
  		boxShadow: {
  			sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  			DEFAULT: '0 2px 4px rgba(0, 0, 0, 0.06)',
  			md: '0 4px 6px rgba(0, 0, 0, 0.07)',
  			lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  			xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  			'2xl': '0 25px 50px rgba(0, 0, 0, 0.15)',
  			inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
  			none: 'none',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
