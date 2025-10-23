import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}"
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'montserrat': ['Montserrat', 'sans-serif'],
				'roboto': ['Roboto', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				neon: {
					pink: 'hsl(var(--neon-pink))',
					cyan: 'hsl(var(--neon-cyan))',
					yellow: 'hsl(var(--neon-yellow))',
					purple: 'hsl(var(--electric-purple))',
				},
				gold: 'hsl(var(--gold))',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'plane-fly': {
					'0%': { transform: 'translate(0, 0) rotate(45deg)', opacity: '1' },
					'100%': { transform: 'translate(300px, -300px) rotate(45deg)', opacity: '0' }
				},
				'crash': {
					'0%': { transform: 'rotate(45deg) scale(1)' },
					'50%': { transform: 'rotate(180deg) scale(1.2)' },
					'100%': { transform: 'rotate(360deg) scale(0)', opacity: '0' }
				},
				'neon-pulse': {
					'0%, 100%': { opacity: '1', filter: 'brightness(1)' },
					'50%': { opacity: '0.8', filter: 'brightness(1.5)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'plane-fly': 'plane-fly 3s ease-in infinite',
				'crash': 'crash 0.5s ease-out forwards',
				'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
				'float': 'float 3s ease-in-out infinite'
			},
			boxShadow: {
				'neon-pink': '0 0 10px hsl(var(--neon-pink)), 0 0 20px hsl(var(--neon-pink)), 0 0 30px hsl(var(--neon-pink))',
				'neon-cyan': '0 0 10px hsl(var(--neon-cyan)), 0 0 20px hsl(var(--neon-cyan)), 0 0 30px hsl(var(--neon-cyan))',
				'neon-yellow': '0 0 10px hsl(var(--gold)), 0 0 20px hsl(var(--gold))',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;