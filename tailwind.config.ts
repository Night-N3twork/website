import scrollbar from 'tailwind-scrollbar';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			animation: {
				'fade-in': 'fadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
				'slide-up': 'slideUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) both',
				'slide-down':
					'slideDown 0.65s cubic-bezier(0.16, 1, 0.3, 1) both',
				'pulse-subtle':
					'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0', transform: 'translateY(8px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				slideUp: {
					'0%': { transform: 'translateY(12px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				slideDown: {
					'0%': { transform: 'translateY(-12px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				pulseSubtle: {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' }
				}
			},
			colors: {
				mocha: {
					base: '#1e1e2e',
					mantle: '#181825',
					crust: '#11111b',
					surface0: '#313244',
					surface1: '#45475a',
					surface2: '#585b70',
					overlay0: '#6c7086',
					overlay1: '#7f849c',
					overlay2: '#9399b2',
					subtext0: '#a6adc8',
					subtext1: '#bac2de',
					text: '#cdd6f4',
					lavender: '#b4befe',
					blue: '#89b4fa',
					sapphire: '#74c7ec',
					sky: '#89dceb',
					teal: '#94e2d5',
					green: '#a6e3a1',
					yellow: '#f9e2af',
					peach: '#fab387',
					maroon: '#eba0ac',
					red: '#f38ba8',
					mauve: '#cba6f7',
					pink: '#f5c2e7',
					flamingo: '#f2cdcd',
					rosewater: '#f5e0dc'
				}
			}
		},
		screens: {
			xs: '320px',
			sm: '640px',
			md: '768px',
			lg: '1024px',
			xl: '1280px',
			'2xl': '1536px'
		}
	},
	plugins: [scrollbar({ nocompatible: true })]
};
