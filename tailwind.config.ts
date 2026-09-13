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
				night: {
					base: '#141419',
					mantle: '#101014',
					crust: '#08080a',
					surface0: '#1b1b22',
					surface1: '#24242c',
					surface2: '#2a2a32',
					overlay0: '#8f8c99',
					overlay1: '#a29eaa',
					overlay2: '#b9b5c3',
					subtext0: '#b9b5c3',
					subtext1: '#c5c1cd',
					text: '#d4d0dc',
					lavender: '#d69aff',
					blue: '#6ba8ff',
					sapphire: '#70c6ff',
					sky: '#6bfff5',
					teal: '#6bfff5',
					green: '#6bff95',
					yellow: '#ffe66b',
					peach: '#ffb86b',
					maroon: '#ff8a8a',
					red: '#ff6b6b',
					mauve: '#c77dff',
					pink: '#ed9aff',
					flamingo: '#ff9eb5',
					rosewater: '#ffd0df'
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
