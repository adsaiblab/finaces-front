# FinaCES — Frontend (Angular)

> Interface utilisateur moderne pour l'analyse financière et le scoring de crédit.

[![CI/CD — FinaCES Frontend](https://github.com/adsa/finaces-front/actions/workflows/deploy.yml/badge.svg)](https://github.com/adsa/finaces-front/actions/workflows/deploy.yml)

## 🚀 Stack Technique

- **Framework**: [Angular 17+](https://angular.dev/)
- **Architecture**: Standalone Components, [Signals](https://angular.dev/guide/signals)
- **UI & Styles**: [Angular Material](https://material.angular.io/), [Tailwind CSS](https://tailwindcss.com/)
- **Performance**: Lazy-loading par route et par bloc
- **Monitoring**: [Sentry](https://sentry.io/) (Gestion d'erreurs et Replays)

---

## 🛠 Prérequis

- **Node.js 20.x** (LTS)
- **npm** 10.x

---

## 💻 Setup Local

```bash
# 1. Cloner le repo
git clone https://github.com/adsa/finaces-front.git && cd finaces-front

# 2. Installer les dépendances
npm install

# 3. Lancer l'application
ng serve
```

L'application est disponible sur : [http://localhost:4200](http://localhost:4200)

---

## ⚙️ Configuration

L'application utilise les fichiers d'environnement Angular standards :
- `src/environments/environment.ts` : Développement local (API sur `localhost:8000`)
- `src/environments/environment.staging.ts` : Staging (API sur `staging.adsa.cloud`)

---

## 📖 Commandes Utiles

```bash
# Lancer les tests unitaires (Vitest)
ng test

# Lancer les tests end-to-end (Playwright)
ng e2e

# Build de production
ng build --configuration production
```

---

## 📁 Structure des Features (Blocs)

L'application est organisée selon la nomenclature métier de FinaCES :

| Bloc | Feature | Composant |
|---|---|---|
| **0** | Cockpit | `cockpit-component` |
| **1-2** | Initialisation | `case-create-component` |
| **3** | État Civil | `normalization-component` |
| **4** | Ratios | `ratio-analysis-component` |
| **5** | Scoring | `scoring-mcc-component` |
| **6-7** | IA Predictor | `ia-predictor-component` |
| **8** | Export | `rapport-component` |
| **9** | Expert Review | `expert-component` |
| **10-11** | Audit | `audit-trail-component` |
| **12** | Consortium | `consortium-component` |

---

## 🌍 Déploiement

Déployé automatiquement sur le VPS via GitHub Actions (Docker + Nginx).
Lien de staging : [https://staging.adsa.cloud](https://staging.adsa.cloud)
