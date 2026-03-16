═══════════════════════════════════════════════════════════════════════════════
PROMPT 1 — SETUP ANGULAR + TAILWIND + ANGULAR MATERIAL + DESIGN TOKENS
═══════════════════════════════════════════════════════════════════════════════

**Dépend de:** Aucun (point de départ)
**Peut être parallélisé avec:** Aucun
**Livré à:** fin de ce prompt

---

## CONTEXTE

Première étape de construction du projet FinaCES from scratch. Ce prompt met en place:
1. Projet Angular 17+ standalone components
2. Tailwind CSS configuré avec thème custom FinaCES
3. Angular Material installé et thème custom appliqué
4. Tous les design tokens (CSS custom properties + JSON export)
5. Environnements de développement et production

À l'issue de ce prompt, le projet compile (`ng serve`) sans erreur et est prêt pour l'ajout des services/modèles (PROMPT 2).

---

## RÈGLES MÉTIER APPLICABLES

Aucune règle métier — infrastructure uniquement.

**Constraints couleurs :**
- Rails MCC: --mcc-low (#22C55E) → --mcc-moderate (#F59E0B) → --mcc-high (#F97316) → --mcc-critical (#EF4444)
- Rails IA: --ia-low (#3B82F6) → --ia-moderate (#6366F1) → --ia-high (#8B5CF6) → --ia-critical (#A855F7)
- Tension: --tension-none (#22C55E), --tension-mild (#3B82F6), --tension-moderate (#F59E0B), --tension-severe (#EF4444)
- Neutres: --primary (#1E3A5F), --text-primary (#0F172A), --bg-default (#F8FAFC), etc.

**Typography standards :**
```
Font: Inter, -apple-system, sans-serif
Mono: JetBrains Mono
H1: 28px / 700 / line-height 1.3
H2: 22px / 600 / line-height 1.3
H3: 18px / 600 / line-height 1.4
H4: 14px / 600 / uppercase / letter-spacing 0.05em
Body: 14px / 400 / line-height 1.6
Body Small: 12px / 400 / line-height 1.5
Label: 12px / 500 / uppercase / letter-spacing 0.04em
Code: 13px / JetBrains Mono
Score Large: 40px / 700
Score Medium: 28px / 700
```

**Grid et spacing (8pt base):**
- Micro: 4px
- xs: 8px
- sm: 12px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px

**Layout desktop:**
- Max width: 1440px
- Grid: 12 colonnes
- Gutters: 24px
- Margins: 32px
- Sidebar: 240px fixed
- Topbar: 64px fixed
- Main content: max-width 1160px, centered, padding 32px

---

## FICHIERS À CRÉER / MODIFIER

### Fichiers à créer (8 total):
1. `angular.json` — configuration projet Angular
2. `tailwind.config.js` — Tailwind custom theme avec tokens FinaCES
3. `src/styles.scss` — global styles entrypoint
4. `src/styles/_variables.scss` — ALL CSS custom properties
5. `src/styles/_typography.scss` — typographic scale
6. `src/styles/_spacing.scss` — 8pt grid utilities
7. `src/assets/tokens/tokens.json` — design tokens JSON export
8. `src/environments/environment.ts` — dev environment
9. `src/environments/environment.prod.ts` — prod environment

Modifications:
- `package.json` — ajouter Tailwind, Angular Material, dépendances dev
- `angular.json` — configurer SCSS, Tailwind, assets

---

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### 1. SETUP INITIAL

**Prerequisites:**
```bash
node --version  # >= 18.13.0
npm --version   # >= 9.2.0
ng version      # Angular 17+
```

**Créer le projet:**
```bash
ng new finaces-front --package-manager=npm --style=scss --skip-git
cd finaces-front
```

**Dépendances à installer:**
```bash
npm install -D tailwindcss postcss autoprefixer
npm install @angular/material @angular/cdk
npm install -D sass
# Material icons (Google)
npm install @angular/material-icon-font
# Utility first approach
npm install -D tailwindcss@latest
```

### 2. FILE: angular.json

Structure complète avec styles, assets, build optimisations:

```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "finaces-front": {
      "projectType": "application",
      "schematics": {
        "@schematics/angular:component": {
          "style": "scss",
          "standalone": true
        },
        "@schematics/angular:application": {
          "strict": true
        }
      },
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist/finaces-front",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": ["zone.js"],
            "tsConfig": "tsconfig.app.json",
            "inlineStyleLanguage": "scss",
            "assets": [
              "src/favicon.ico",
              "src/assets"
            ],
            "styles": [
              "src/styles.scss"
            ],
            "scripts": [],
            "optimization": true,
            "outputHashing": "all",
            "sourceMap": false,
            "namedChunks": false,
            "aot": true,
            "extractLicenses": false,
            "vendorChunk": false,
            "buildOptimizer": true
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "2mb",
                  "maximumError": "5mb"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "2kb",
                  "maximumError": "4kb"
                }
              ]
            },
            "development": {
              "buildOptimizer": false,
              "optimization": false,
              "vendorChunk": true,
              "extractLicenses": false,
              "sourceMap": true,
              "namedChunks": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "configurations": {
            "production": {
              "buildTarget": "finaces-front:build:production"
            },
            "development": {
              "buildTarget": "finaces-front:build:development"
            }
          },
          "defaultConfiguration": "development"
        }
      }
    }
  },
  "cli": {
    "defaultCollection": "@schematics/angular",
    "packageManager": "npm",
    "strict": true,
    "analytics": false
  }
}
```

### 3. FILE: tailwind.config.js

Custom theme extending Tailwind with FinaCES colors and typography:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts,tsx,jsx,js}',
  ],
  theme: {
    extend: {
      colors: {
        // MCC Rail (Green → Red)
        'mcc-low': '#22C55E',
        'mcc-moderate': '#F59E0B',
        'mcc-high': '#F97316',
        'mcc-critical': '#EF4444',
        'mcc-surface': '#F8FAFC',
        'mcc-border': '#E2E8F0',
        'mcc-surface-low': '#F0FDF4',
        'mcc-surface-mod': '#FFFBEB',
        'mcc-surface-high': '#FFF7ED',
        'mcc-surface-crit': '#FEF2F2',

        // IA Rail (Blue → Violet)
        'ia-low': '#3B82F6',
        'ia-moderate': '#6366F1',
        'ia-high': '#8B5CF6',
        'ia-critical': '#A855F7',
        'ia-surface': '#F0F4FF',
        'ia-border': '#C7D2FE',

        // Tension
        'tension-none': '#22C55E',
        'tension-mild': '#3B82F6',
        'tension-moderate': '#F59E0B',
        'tension-severe': '#EF4444',
        'tension-severe-bg': '#FEF2F2',
        'tension-severe-border': '#FECACA',

        // Neutral palette
        'primary': '#1E3A5F',
        'primary-light': '#2D5B8E',
        'secondary': '#64748B',
        'bg-default': '#F8FAFC',
        'bg-card': '#FFFFFF',
        'bg-sidebar': '#0F172A',
        'sidebar-text': '#94A3B8',
        'sidebar-active': '#FFFFFF',
        'sidebar-active-bg': '#1E3A5F',
        'text-primary': '#0F172A',
        'text-secondary': '#475569',
        'text-disabled': '#94A3B8',
        'border': '#E2E8F0',
        'border-strong': '#CBD5E1',
        'success': '#22C55E',
        'warning': '#F59E0B',
        'error': '#EF4444',
        'info': '#3B82F6',
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Monaco', 'monospace'],
      },
      fontSize: {
        'h1': ['28px', { lineHeight: '1.3', fontWeight: '700' }],
        'h2': ['22px', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'h4': ['14px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }],
        'body': ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '1.5', fontWeight: '400' }],
        'label': ['12px', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.04em', textTransform: 'uppercase' }],
        'code': ['13px', { lineHeight: '1.5', fontWeight: '400', fontFamily: 'JetBrains Mono' }],
        'score-lg': ['40px', { lineHeight: '1.2', fontWeight: '700' }],
        'score-md': ['28px', { lineHeight: '1.2', fontWeight: '700' }],
      },
      spacing: {
        'micro': '4px',
        '0.5': '4px',
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.10)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'sm': '4px',
        'base': '6px',
        'md': '8px',
        'lg': '12px',
      },
      maxWidth: {
        'container': '1160px',
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
```

### 4. FILE: src/styles.scss

Global styles entrypoint:

```scss
// Design Tokens
@import 'styles/variables';
@import 'styles/typography';
@import 'styles/spacing';

// Tailwind CSS
@tailwind base;
@tailwind components;
@tailwind utilities;

// Global styles
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: var(--font-sans);
  background-color: var(--bg-default);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

// Reset defaults
h1, h2, h3, h4, h5, h6 {
  margin: 0;
  padding: 0;
}

p {
  margin: 0;
}

// Scrollbar styling
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-default);
}

::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 4px;

  &:hover {
    background: var(--text-secondary);
  }
}

// Material overrides
.mat-mdc-toolbar {
  background-color: var(--primary) !important;
  color: white !important;
}

.mat-drawer-side {
  background-color: var(--bg-sidebar) !important;
}

.mat-drawer-content {
  background-color: var(--bg-default);
}

// Utility classes
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

### 5. FILE: src/styles/_variables.scss

ALL CSS custom properties from spec (Section 3.2):

```scss
// ═══════════════════════════════════════════════════════════
// DESIGN TOKENS — CSS CUSTOM PROPERTIES
// ═══════════════════════════════════════════════════════════

:root {
  // ─────────────────────────────────────────────────────────
  // MCC RAIL — Green → Orange → Red
  // ─────────────────────────────────────────────────────────
  --mcc-low: #22C55E;           // Green — FAIBLE
  --mcc-moderate: #F59E0B;      // Orange — MODÉRÉ
  --mcc-high: #F97316;          // Orange-Red — ÉLEVÉ
  --mcc-critical: #EF4444;      // Red — CRITIQUE

  // MCC Surface backgrounds
  --mcc-surface: #F8FAFC;       // Neutral background
  --mcc-border: #E2E8F0;        // Neutral border
  --mcc-surface-low: #F0FDF4;   // Light green background
  --mcc-surface-mod: #FFFBEB;   // Light orange background
  --mcc-surface-high: #FFF7ED;  // Light orange-red background
  --mcc-surface-crit: #FEF2F2;  // Light red background

  // ─────────────────────────────────────────────────────────
  // IA RAIL — Blue → Indigo → Violet
  // ─────────────────────────────────────────────────────────
  --ia-low: #3B82F6;            // Blue — FAIBLE
  --ia-moderate: #6366F1;       // Indigo — MODÉRÉ
  --ia-high: #8B5CF6;           // Violet — ÉLEVÉ
  --ia-critical: #A855F7;       // Magenta-Violet — CRITIQUE

  // IA Surface backgrounds
  --ia-surface: #F0F4FF;        // Light blue background
  --ia-border: #C7D2FE;         // Light blue border

  // ─────────────────────────────────────────────────────────
  // TENSION MATRIX
  // ─────────────────────────────────────────────────────────
  --tension-none: #22C55E;      // Green — concordance parfaite
  --tension-mild: #3B82F6;      // Blue — léger désaccord
  --tension-moderate: #F59E0B;  // Orange — tension modérée
  --tension-severe: #EF4444;    // Red — divergence critique
  --tension-severe-bg: #FEF2F2; // Light red background for severe
  --tension-severe-border: #FECACA; // Light red border for severe

  // ─────────────────────────────────────────────────────────
  // PRIMARY PALETTE
  // ─────────────────────────────────────────────────────────
  --primary: #1E3A5F;           // Dark blue — brand primary
  --primary-light: #2D5B8E;     // Medium blue — primary hover
  --secondary: #64748B;         // Gray-blue — secondary actions

  // ─────────────────────────────────────────────────────────
  // SEMANTIC BACKGROUNDS
  // ─────────────────────────────────────────────────────────
  --bg-default: #F8FAFC;        // Page background
  --bg-card: #FFFFFF;           // Card background
  --bg-sidebar: #0F172A;        // Sidebar background (dark)
  --bg-input: #FFFFFF;          // Input/form background
  --bg-disabled: #F1F5F9;       // Disabled element background
  --bg-hover: #F0F4FF;          // Hover state background

  // ─────────────────────────────────────────────────────────
  // SEMANTIC TEXT
  // ─────────────────────────────────────────────────────────
  --text-primary: #0F172A;      // Main text
  --text-secondary: #475569;    // Secondary text
  --text-disabled: #94A3B8;     // Disabled text
  --text-inverse: #FFFFFF;      // Text on dark backgrounds
  --sidebar-text: #94A3B8;      // Sidebar inactive text
  --sidebar-active: #FFFFFF;    // Sidebar active text
  --sidebar-active-bg: #1E3A5F; // Sidebar active background

  // ─────────────────────────────────────────────────────────
  // BORDERS
  // ─────────────────────────────────────────────────────────
  --border: #E2E8F0;            // Light border
  --border-strong: #CBD5E1;     // Strong border
  --border-input: #E2E8F0;      // Input border
  --border-focus: #3B82F6;      // Focus border (blue)

  // ─────────────────────────────────────────────────────────
  // SEMANTIC COLORS (ISO 9545)
  // ─────────────────────────────────────────────────────────
  --success: #22C55E;           // Green — success/valid
  --warning: #F59E0B;           // Orange — warning/caution
  --error: #EF4444;             // Red — error/danger
  --info: #3B82F6;              // Blue — info/neutral

  // ─────────────────────────────────────────────────────────
  // SHADOWS
  // ─────────────────────────────────────────────────────────
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.10);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.06);

  // ─────────────────────────────────────────────────────────
  // FONTS
  // ─────────────────────────────────────────────────────────
  --font-sans: Inter, -apple-system, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', Monaco, monospace;

  // ─────────────────────────────────────────────────────────
  // SPACING (8px BASE GRID)
  // ─────────────────────────────────────────────────────────
  --space-micro: 4px;
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  // ─────────────────────────────────────────────────────────
  // LAYOUT
  // ─────────────────────────────────────────────────────────
  --sidebar-width: 240px;
  --topbar-height: 64px;
  --max-width: 1440px;
  --max-width-content: 1160px;
  --gutter: 24px;
  --margin: 32px;

  // ─────────────────────────────────────────────────────────
  // RADIUS
  // ─────────────────────────────────────────────────────────
  --radius-sm: 4px;
  --radius-base: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  // ─────────────────────────────────────────────────────────
  // TRANSITIONS
  // ─────────────────────────────────────────────────────────
  --transition-fast: 150ms ease-out;
  --transition-base: 250ms ease-out;
  --transition-slow: 350ms ease-out;

  // ─────────────────────────────────────────────────────────
  // Z-INDEX SCALE
  // ─────────────────────────────────────────────────────────
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-tooltip: 600;
  --z-notification: 700;
}

// Dark mode support (future)
@media (prefers-color-scheme: dark) {
  :root {
    // For future dark mode implementation
    // --bg-default: #0F172A;
    // --bg-card: #1E293B;
    // --text-primary: #F1F5F9;
    // etc.
  }
}
```

### 6. FILE: src/styles/_typography.scss

Typographic scale and classes:

```scss
// ═══════════════════════════════════════════════════════════
// TYPOGRAPHY SCALE
// ═══════════════════════════════════════════════════════════

// Headings
h1, .h1 {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

h2, .h2 {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-primary);
  letter-spacing: -0.005em;
}

h3, .h3 {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--text-primary);
}

h4, .h4 {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

// Body text
p, .body {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
  color: var(--text-primary);
}

.body-small, small {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--text-secondary);
}

// Labels
label, .label {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

// Code
code, .code {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--error);
  background-color: var(--bg-card);
  padding: 2px 4px;
  border-radius: var(--radius-base);
}

pre {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
  background-color: #1E293B;
  color: #F1F5F9;
  padding: var(--space-md);
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin: var(--space-md) 0;

  code {
    background: none;
    color: inherit;
    padding: 0;
  }
}

// Scores
.score-large {
  font-size: 40px;
  font-weight: 700;
  line-height: 1.2;
}

.score-medium {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

// Utility text classes
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-disabled { color: var(--text-disabled); }
.text-inverse { color: var(--text-inverse); }
.text-success { color: var(--success); }
.text-warning { color: var(--warning); }
.text-error { color: var(--error); }
.text-info { color: var(--info); }

// Font weights
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }
.font-normal { font-weight: 400; }
.font-light { font-weight: 300; }

// Text transforms
.uppercase { text-transform: uppercase; }
.lowercase { text-transform: lowercase; }
.capitalize { text-transform: capitalize; }

// Text alignment
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-justify { text-align: justify; }
```

### 7. FILE: src/styles/_spacing.scss

8pt grid utilities:

```scss
// ═══════════════════════════════════════════════════════════
// SPACING UTILITIES — 8PT GRID
// ═══════════════════════════════════════════════════════════

// Margin utilities
@for $i from 0 through 16 {
  $space: $i * 8px;
  .m-#{$i * 8} { margin: $space; }
  .mt-#{$i * 8} { margin-top: $space; }
  .mr-#{$i * 8} { margin-right: $space; }
  .mb-#{$i * 8} { margin-bottom: $space; }
  .ml-#{$i * 8} { margin-left: $space; }
  .mx-#{$i * 8} { margin-left: $space; margin-right: $space; }
  .my-#{$i * 8} { margin-top: $space; margin-bottom: $space; }
}

// Padding utilities
@for $i from 0 through 16 {
  $space: $i * 8px;
  .p-#{$i * 8} { padding: $space; }
  .pt-#{$i * 8} { padding-top: $space; }
  .pr-#{$i * 8} { padding-right: $space; }
  .pb-#{$i * 8} { padding-bottom: $space; }
  .pl-#{$i * 8} { padding-left: $space; }
  .px-#{$i * 8} { padding-left: $space; padding-right: $space; }
  .py-#{$i * 8} { padding-top: $space; padding-bottom: $space; }
}

// Gap utilities (flex/grid)
@for $i from 0 through 12 {
  $space: $i * 8px;
  .gap-#{$i * 8} { gap: $space; }
  .gap-x-#{$i * 8} { column-gap: $space; }
  .gap-y-#{$i * 8} { row-gap: $space; }
}

// Common spacing shortcuts
.space-micro { --space: var(--space-micro); }
.space-xs { --space: var(--space-xs); }
.space-sm { --space: var(--space-sm); }
.space-md { --space: var(--space-md); }
.space-lg { --space: var(--space-lg); }
.space-xl { --space: var(--space-xl); }
.space-2xl { --space: var(--space-2xl); }
.space-3xl { --space: var(--space-3xl); }

// Container utilities
.container {
  width: 100%;
  max-width: var(--max-width-content);
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--margin);
  padding-right: var(--margin);
}

// Grid and flex utilities (Tailwind will handle most)
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.flex-1 { flex: 1 1 0%; }
.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
```

### 8. FILE: src/assets/tokens/tokens.json

JSON export for design tokens (for potential use in scripts, docs, etc.):

```json
{
  "version": "1.0.0",
  "colors": {
    "mcc": {
      "low": "#22C55E",
      "moderate": "#F59E0B",
      "high": "#F97316",
      "critical": "#EF4444",
      "surface": "#F8FAFC",
      "border": "#E2E8F0",
      "surfaces": {
        "low": "#F0FDF4",
        "moderate": "#FFFBEB",
        "high": "#FFF7ED",
        "critical": "#FEF2F2"
      }
    },
    "ia": {
      "low": "#3B82F6",
      "moderate": "#6366F1",
      "high": "#8B5CF6",
      "critical": "#A855F7",
      "surface": "#F0F4FF",
      "border": "#C7D2FE"
    },
    "tension": {
      "none": "#22C55E",
      "mild": "#3B82F6",
      "moderate": "#F59E0B",
      "severe": "#EF4444",
      "severeBg": "#FEF2F2",
      "severeBorder": "#FECACA"
    },
    "primary": {
      "default": "#1E3A5F",
      "light": "#2D5B8E"
    },
    "secondary": "#64748B",
    "backgrounds": {
      "default": "#F8FAFC",
      "card": "#FFFFFF",
      "sidebar": "#0F172A",
      "input": "#FFFFFF",
      "disabled": "#F1F5F9",
      "hover": "#F0F4FF"
    },
    "text": {
      "primary": "#0F172A",
      "secondary": "#475569",
      "disabled": "#94A3B8",
      "inverse": "#FFFFFF"
    },
    "sidebar": {
      "text": "#94A3B8",
      "activeText": "#FFFFFF",
      "activeBg": "#1E3A5F"
    },
    "borders": {
      "default": "#E2E8F0",
      "strong": "#CBD5E1",
      "input": "#E2E8F0",
      "focus": "#3B82F6"
    },
    "semantic": {
      "success": "#22C55E",
      "warning": "#F59E0B",
      "error": "#EF4444",
      "info": "#3B82F6"
    }
  },
  "shadows": {
    "sm": "0 1px 3px rgba(0, 0, 0, 0.08)",
    "md": "0 4px 12px rgba(0, 0, 0, 0.10)",
    "lg": "0 8px 24px rgba(0, 0, 0, 0.12)",
    "card": "0 2px 8px rgba(0, 0, 0, 0.06)"
  },
  "typography": {
    "headings": {
      "h1": {
        "fontSize": "28px",
        "fontWeight": 700,
        "lineHeight": 1.3
      },
      "h2": {
        "fontSize": "22px",
        "fontWeight": 600,
        "lineHeight": 1.3
      },
      "h3": {
        "fontSize": "18px",
        "fontWeight": 600,
        "lineHeight": 1.4
      },
      "h4": {
        "fontSize": "14px",
        "fontWeight": 600,
        "lineHeight": 1.4,
        "textTransform": "uppercase",
        "letterSpacing": "0.05em"
      }
    },
    "body": {
      "default": {
        "fontSize": "14px",
        "fontWeight": 400,
        "lineHeight": 1.6
      },
      "small": {
        "fontSize": "12px",
        "fontWeight": 400,
        "lineHeight": 1.5
      }
    },
    "label": {
      "fontSize": "12px",
      "fontWeight": 500,
      "lineHeight": 1.4,
      "letterSpacing": "0.04em"
    },
    "code": {
      "fontSize": "13px",
      "fontWeight": 400,
      "fontFamily": "JetBrains Mono"
    },
    "score": {
      "large": {
        "fontSize": "40px",
        "fontWeight": 700,
        "lineHeight": 1.2
      },
      "medium": {
        "fontSize": "28px",
        "fontWeight": 700,
        "lineHeight": 1.2
      }
    }
  },
  "spacing": {
    "micro": "4px",
    "xs": "8px",
    "sm": "12px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px",
    "2xl": "48px",
    "3xl": "64px"
  },
  "layout": {
    "sidebarWidth": "240px",
    "topbarHeight": "64px",
    "maxWidth": "1440px",
    "maxWidthContent": "1160px",
    "gutter": "24px",
    "margin": "32px"
  },
  "radius": {
    "sm": "4px",
    "base": "6px",
    "md": "8px",
    "lg": "12px"
  },
  "transitions": {
    "fast": "150ms ease-out",
    "base": "250ms ease-out",
    "slow": "350ms ease-out"
  },
  "zIndex": {
    "base": 0,
    "dropdown": 100,
    "sticky": 200,
    "fixed": 300,
    "modalBackdrop": 400,
    "modal": 500,
    "tooltip": 600,
    "notification": 700
  }
}
```

### 9. FILE: src/environments/environment.ts

Development environment:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1',
  apiTimeout: 30000, // ms
  logLevel: 'debug',
  features: {
    mockData: false,
    debugMode: true,
    analyticsEnabled: false,
  },
};
```

### 10. FILE: src/environments/environment.prod.ts

Production environment:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.finaces.io/api/v1',
  apiTimeout: 30000, // ms
  logLevel: 'error',
  features: {
    mockData: false,
    debugMode: false,
    analyticsEnabled: true,
  },
};
```

---

## CONTRAINTES ANGULAR

**Version:** Angular 17+ avec standalone components
**Style:** SCSS pour tous les composants
**Module système:** Modules Angular optionnels, préférer standalone
**Material:** Toujours utiliser `@angular/material` pour UI components (buttons, inputs, etc.)
**TypeScript:** Strict mode activé (`strict: true` dans tsconfig.json)
**Linting:** ESLint standard Angular

---

## BINDING API

Les tokens CSS/SCSS sont bindés via:
1. **CSS Variables:** `color: var(--primary)` (dynamique à runtime)
2. **Tailwind utilities:** Classes comme `text-primary-light`, `bg-mcc-low`
3. **SCSS mixins:** Pour les composants stylisés (future)
4. **JSON tokens:** Peut être consommé par scripts de documentation

**Ordre de préférence:**
1. CSS variables pour les UI dynamiques
2. Tailwind utilities dans les templates
3. SCSS dans les `.component.scss` si besoin de logique complexe

---

## CRITÈRES DE VALIDATION

À la fin de ce prompt, vérifier:

✓ `npm install` réussit
✓ `ng serve` compile sans erreur
✓ Application ouvre sur `http://localhost:4200`
✓ Tous les tokens CSS sont disponibles globalement (`var(--primary)`, etc.)
✓ Tailwind utilities fonctionnent (class `text-mcc-critical` affiche en rouge)
✓ Angular Material thème appliqué (boutons, inputs avec couleur --primary)
✓ Variables SCSS importées dans tous les `.component.scss` (via `@import 'styles/variables'`)
✓ JSON tokens contient tous les tokens spécifiés
✓ Assets peuvent être servis depuis `src/assets/`
✓ Aucun warning ou error dans la console

---

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

Total: **10 fichiers** créés/modifiés

```
finaces-front/
├── angular.json ...................... Configuration projet Angular
├── tailwind.config.js ............... Thème Tailwind custom
├── src/
│   ├── styles.scss .................. Entrypoint styles global
│   ├── styles/
│   │   ├── _variables.scss ......... ALL tokens CSS custom properties
│   │   ├── _typography.scss ........ Typographic scale
│   │   └── _spacing.scss ........... 8pt grid utilities
│   ├── assets/
│   │   └── tokens/
│   │       └── tokens.json ......... Design tokens JSON export
│   └── environments/
│       ├── environment.ts .......... Dev environment
│       └── environment.prod.ts .... Prod environment
└── package.json ..................... Dépendances (Tailwind, Material, etc.)
```

---

## PROCHAINES ÉTAPES

Passez à **PROMPT 2** (P02_architecture_services_models.md) pour:
- Créer tous les services HTTP typés
- Créer tous les modèles TypeScript
- Configurer les interceptors
- Créer les pipes partagés

