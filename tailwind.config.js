/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{html,ts,tsx,jsx,js}',
    ],
    theme: {
        extend: {
            colors: {
                surface: {
                    default: 'var(--surface-default)',
                    card: 'var(--surface-card)',
                    sidebar: 'var(--surface-sidebar)',
                    hover: 'var(--surface-hover)',
                },
                content: {
                    primary: 'var(--content-primary)',
                    secondary: 'var(--content-secondary)',
                    disabled: 'var(--content-disabled)',
                },
                sidebar: {
                    content: 'var(--sidebar-content)',
                    'content-active': 'var(--sidebar-content-active)',
                    'surface-active': 'var(--sidebar-surface-active)',
                },
                border: {
                    default: 'var(--border-default)',
                    strong: 'var(--border-strong)',
                },
                primary: 'var(--primary)',
                success: 'var(--success)',
                warning: 'var(--warning)',
                error: 'var(--error)',
                info: 'var(--info)',
                mcc: {
                    low: 'var(--mcc-low)',
                    moderate: 'var(--mcc-moderate)',
                    high: 'var(--mcc-high)',
                    critical: 'var(--mcc-critical)',
                    surface: 'var(--mcc-surface)',
                    border: 'var(--mcc-border)',
                },
                ia: {
                    low: 'var(--ia-low)',
                    moderate: 'var(--ia-moderate)',
                    high: 'var(--ia-high)',
                    critical: 'var(--ia-critical)',
                }
            },
            fontFamily: {
                sans: ['var(--font-sans)'],
                mono: ['var(--font-mono)'],
            },
            boxShadow: {
                sm: 'var(--shadow-sm)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)',
                card: 'var(--shadow-card)',
            },
            spacing: {
                micro: '4px',
            },
            width: {
                sidebar: 'var(--sidebar-width)',
            },
            maxWidth: {
                container: 'var(--max-width-content)',
            },
            height: {
                topbar: 'var(--topbar-height)',
            },
        },
    },
    plugins: [],
};