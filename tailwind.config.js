/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{html,ts,tsx,jsx,js}',
    ],
    // Dark mode piloté par l'attribut data-theme="dark" (ThemeService Angular)
    darkMode: ['selector', '[data-theme="dark"]'],
    theme: {
        extend: {
            // 1. SURFACES — Les fonds (bg-...)
            backgroundColor: {
                'default':          'var(--bg-default)',
                'card':             'var(--bg-card)',
                'sidebar':          'var(--bg-sidebar)',
                'sidebar-active-bg':'var(--sidebar-active-bg)',
            },
            // 2. CONTENTS — Les textes (text-...)
            textColor: {
                'primary':        'var(--text-primary)',
                'secondary':      'var(--text-secondary)',
                'disabled':       'var(--text-disabled)',
                'inverse':        'var(--text-inverse)',
                'sidebar':        'var(--sidebar-text)',
                'sidebar-active': 'var(--sidebar-active)',
            },
            // 3. BORDERS — Les bordures (border-...)
            borderColor: {
                DEFAULT:        'var(--border)',
                'strong':       'var(--border-strong)',
                'sidebar-text': 'var(--sidebar-text)',
            },
            // 4. COULEURS MÉTIER & FONCTIONNELLES
            colors: {
                // Brand
                'primary':       'var(--primary)',
                'primary-light': 'var(--primary-light)',

                // Statuts fonctionnels
                'success': 'var(--success)',
                'warning': 'var(--warning)',
                'error':   'var(--error)',
                'info':    'var(--info)',

                // MCC Rail
                'mcc-low':      'var(--mcc-low)',
                'mcc-moderate': 'var(--mcc-moderate)',
                'mcc-high':     'var(--mcc-high)',
                'mcc-critical': 'var(--mcc-critical)',
                'mcc-surface':  'var(--mcc-surface)',
                'mcc-border':   'var(--mcc-border)',

                // IA Rail
                'ia-low':      'var(--ia-low)',
                'ia-moderate': 'var(--ia-moderate)',
                'ia-high':     'var(--ia-high)',
                'ia-critical': 'var(--ia-critical)',
            },
            fontFamily: {
                'sans': ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
                'mono': ['JetBrains Mono', 'Monaco', 'monospace'],
            },
            spacing: {
                'micro': '4px',
                '0.5':   '4px',
            },
            width: {
                'sidebar': '240px',
            },
            height: {
                'topbar': '64px',
            },
        },
    },
    plugins: [],
};
