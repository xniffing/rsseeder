import { defineConfig, presetUno } from 'unocss';
import presetTypography from '@unocss/preset-typography';
import transformerDirectives from '@unocss/transformer-directives';

export default defineConfig({
	presets: [presetUno(), presetTypography()],
	transformers: [transformerDirectives()],
	theme: {
		colors: {
			background: '#f9f9f9',
			surface: '#f9f9f9',
			'surface-bright': '#f9f9f9',
			'surface-dim': '#dadada',
			'surface-variant': '#e2e2e2',
			'surface-container-lowest': '#ffffff',
			'surface-container-low': '#f3f3f3',
			'surface-container': '#eeeeee',
			'surface-container-high': '#e8e8e8',
			'surface-container-highest': '#e2e2e2',
			'on-background': '#1a1c1c',
			'on-surface': '#1a1c1c',
			'on-surface-variant': '#474747',
			outline: '#777777',
			'outline-variant': '#c6c6c6',
			secondary: '#5e5e5e',
			tertiary: '#3b3b3b',
			primary: '#000000',
			'primary-container': '#7e0000',
			'primary-fixed': '#c00000',
			'primary-fixed-dim': '#930000',
			error: '#ba1a1a'
		},
		fontFamily: {
			headline: 'Space Grotesk, sans-serif',
			label: 'Space Grotesk, sans-serif',
			body: 'Newsreader, serif'
		},
		borderRadius: {
			none: '0px'
		}
	},
	shortcuts: {
		'app-link':
			"font-label text-10px tracking-[0.18rem] uppercase text-secondary transition-colors hover:text-primary-fixed",
		'nav-link':
			"font-label text-xs font-bold uppercase tracking-[0.12rem] text-secondary transition-colors hover:text-primary-fixed",
		'nav-link-active': 'text-primary-fixed',
		'icon-button':
			'grid h-11 w-11 place-items-center border border-transparent text-on-surface-variant transition-colors hover:border-outline-variant hover:text-primary-fixed',
		'primary-button':
			'inline-flex items-center justify-center border border-primary bg-primary px-6 py-3 font-label text-10px font-bold uppercase tracking-[0.22rem] text-surface transition-colors hover:bg-primary-fixed hover:border-primary-fixed disabled:cursor-not-allowed disabled:opacity-50',
		'secondary-button':
			'inline-flex items-center justify-center border border-outline px-6 py-3 font-label text-10px font-bold uppercase tracking-[0.22rem] text-on-surface transition-colors hover:bg-surface-container-low',
		'editorial-kicker':
			'font-label text-10px uppercase tracking-[0.28rem] text-secondary',
		'page-title':
			'font-headline text-5xl font-bold leading-none tracking-[-0.06em] md:text-7xl',
		'surface-panel': 'border border-outline-variant/60 bg-surface-container-lowest',
		'status-dot': 'h-2 w-2 rounded-full bg-primary-fixed',
		'section-rule': 'h-px w-full bg-outline-variant/50',
		'reading-progress': 'fixed left-0 top-0 z-60 h-[2px] bg-primary-fixed'
	},
	safelist: ['font-headline', 'font-body', 'font-label']
});
