# FinaCES Frontend — Tableau Récapitulatif des 22 Prompts de Développement

**Projet :** FinaCES (Financial Capacity Evaluation System) — Frontend Angular 17+
**Version spec :** 1.0 — 2026-03-16
**Architecture :** Double Rail (MCC officiel + IA challenge)

---

## TABLEAU RÉCAPITULATIF

| N° | Titre | Phase | Fichiers produits | Dépend de | Parallélisable | Extension routing |
|----|-------|-------|-------------------|-----------|----------------|-------------------|
| P1 | Setup Angular + Tailwind + Angular Material + Tokens SCSS | 0 — Infrastructure | ~10 fichiers | — | — | — |
| P2 | Architecture Modules, Services HTTP, Modèles TypeScript | 0 — Infrastructure | ~21 fichiers | P1 | — | — |
| P3 | App Shell (Topbar + Sidebar + Router Outlet) + Routing | 0 — Infrastructure | ~40 fichiers | P1, P2 | — | — |
| P4 | Composants Atomiques (risk-badge, tension-badge, score-gauge, ia-disclaimer) | 1 — Design System | ~16 fichiers | P3 | — | — |
| P5 | Composants Moléculaires (pillar-row, shap-chart, stress-chart) | 1 — Design System | ~12 fichiers | P4 | — | — |
| P6 | BLOC 0 — Dashboard Unifié | 2 — Flux Dossier | ~6 fichiers | P5 | — | ✅ |
| P7 | BLOC 1A — Recevabilité & Création | 2 — Flux Dossier | ~6 fichiers | P6 | — | ✅ |
| P8 | BLOC 1B — Gate Documentaire | 2 — Flux Dossier | ~8 fichiers | P7 | — | ✅ |
| P9 | BLOC 2 — États Financiers | 2 — Flux Dossier | ~8 fichiers | P8 | — | ✅ |
| P10 | BLOC 3 — Normalisation IFRS | 2 — Flux Dossier | ~4 fichiers | P9 | — | ✅ |
| P11 | BLOC 4 — Ratios Financiers | 2 — Flux Dossier | ~6 fichiers | P10 | — | ✅ |
| P12 | BLOC 5 — Scoring MCC (Rail 1) | 2 — Flux Dossier | ~8 fichiers | P11 | **P13** | ✅ |
| P13 | BLOC 6 — Prédiction IA (Rail 2) | 2 — Flux Dossier | ~8 fichiers | P11 | **P12** | ✅ |
| P14 | BLOC 7 — Tension MCC ↔ IA | 2 — Flux Dossier | ~6 fichiers | P12, P13 | — | ✅ |
| P15 | BLOC 8 — Stress Test Contractuel | 2 — Flux Dossier | ~6 fichiers | P14 | — | ✅ |
| P16 | BLOC 9 — Expert Review & Conclusion | 3 — Clôture | ~6 fichiers | P15 | — | ✅ |
| P17 | BLOC 10 — Rapport Final + Export | 3 — Clôture | ~6 fichiers | P16 | — | ✅ |
| P18 | BLOC CONSORTIUM | 4 — Cas Spéciaux | ~6 fichiers | P12 | **P19** | ✅ |
| P19 | BLOC ADMIN IA | 4 — Cas Spéciaux | ~8 fichiers | P13 | **P18** | ✅ |
| P20 | Guards Angular (CaseStatusGuard + AuthGuard) | 5 — Robustesse | ~4 fichiers | P17 | — | — |
| P21 | États d'exception (IA indisponible, empty states, skeletons) | 5 — Robustesse | ~12 fichiers | P20 | **P22** | — |
| P22 | Responsive Tablet (1024px) | 5 — Robustesse | ~8 fichiers | P21 | **P21** (partiel) | — |

---

## DIAGRAMME DE DÉPENDANCES

```
PHASE 0                    PHASE 1              PHASE 2                                    PHASE 3         PHASE 4         PHASE 5
─────────                  ─────────            ─────────                                  ─────────       ─────────       ─────────

P1 ─── P2 ─── P3 ──── P4 ──── P5 ──── P6 ── P7 ── P8 ── P9 ── P10 ── P11 ─┬─ P12 ─┬─ P14 ── P15 ── P16 ── P17 ── P20 ── P21 ── P22
                                                                              │        │                                │       │
                                                                              └─ P13 ─┘                                P18    P19
                                                                              (parallèle)                          (parallèle)
```

---

## CHECKPOINTS PAR PHASE

### ✅ PHASE 0 — Infrastructure (P1–P3)
- Application compile et sert sans erreur (`ng serve`)
- Layout principal visible (Topbar + Sidebar + zone contenu)
- Navigation entre pages placeholder via sidebar
- Services HTTP typés prêts à être appelés
- Modèles TypeScript correspondant aux schemas Swagger
- Design tokens CSS disponibles globalement

### ✅ PHASE 1 — Design System (P4–P5)
- 7 composants custom réutilisables testés visuellement
- `finaces-risk-badge` : 4 niveaux × 2 rails × 2 tailles
- `finaces-score-gauge` : animation SVG arc 0→valeur en 800ms
- `finaces-shap-chart` : barres SHAP bidirectionnelles
- `finaces-stress-chart` : line chart mensuel avec seuil critique

### ✅ PHASE 2 — Flux Dossier (P6–P15)
- Dashboard avec KPIs, dossiers récents, graphique 30j
- Création dossier complète (stepper 4 étapes)
- Gate documentaire (upload, checklist, évaluation, scellement)
- Saisie états financiers (4 tabs, multi-exercices, auto-calcul)
- Normalisation IFRS en lecture (tableau comparatif)
- Ratios financiers groupés avec alertes de cohérence
- Scoring MCC avec gauge, 5 piliers, override
- Prédiction IA avec disclaimer, SHAP, what-if
- Tension MCC↔IA avec comparaison côte-à-côte
- Stress test avec chart mensuel et scénarios

### ✅ PHASE 3 — Clôture Dossier (P16–P17)
- Revue expert complète (notes, override, décision, recommandations)
- Rapport final en lecture seule
- Export PDF et Excel
- Flux bout en bout : création → rapport

### ✅ PHASE 4 — Cas Spéciaux (P18–P19)
- Dossiers GROUPEMENT avec membres, scores pondérés, weak link
- Administration modèles IA (tableau, performance, feature importance, monitoring)

### ✅ PHASE 5 — Robustesse (P20–P22)
- Guards protégeant toutes les routes
- Redirection automatique selon statut
- Gestion IA indisponible (fallback + retry)
- Mode pilote
- Empty states pour chaque scénario vide
- Skeleton loaders pendant chargements
- Erreurs inline avec retry
- Responsive tablette 1024px

---

## NOTES DE VIGILANCE INTER-PROMPTS

### ⚠️ 1. Endpoint IA — Confirmation requise avant P13
L'endpoint IA exact (`ia.py`) n'est pas encore confirmé côté backend. Le prompt P13 utilise `GET /api/v1/ia/cases/{id}/prediction` comme convention, mais **le développeur backend doit valider** le chemin exact, le schema de requête (features payload) et le schema de réponse (prediction + SHAP values + confidence intervals) **avant de démarrer P13**.

**Action requise :** Vérifier le fichier `ia.py` du backend FinaCES-API-MCC et confirmer :
- L'URL exacte de l'endpoint de prédiction
- Le format du payload d'entrée (quelles features, format JSON)
- Le format de la réponse (score IA, PDIA, SHAP values, model info)

### ⚠️ 2. Export PDF — Confirmation route backend avant P17
L'export PDF du rapport final est déclenché via une route backend (`export.py`). **Cette route doit être confirmée et opérationnelle** avant P17. Si elle n'est pas prête, P17 peut être partiellement implémenté avec un placeholder pour l'export PDF, en conservant l'export Excel côté client.

**Action requise :** Vérifier dans le backend :
- L'existence d'un endpoint `/api/v1/cases/{id}/export/pdf`
- Le format de réponse (blob PDF en téléchargement)
- Les options disponibles (sections à inclure, langue, format)

### ⚠️ 3. Calcul Consortium — Validation schema avant P18
Le `ConsortiumScorecardOutput` est utilisé dans P18 mais le schema exact dépend du backend. Les champs `synergy_index`, `synergy_bonus`, `weak_link_triggered`, `leader_blocking`, `aggregated_stress` doivent être confirmés.

### ⚠️ 4. Gestion des Guards — Impact sur les tests manuels (P1–P19)
Les guards réels sont implémentés en P20. **Avant P20**, les routes sont protégées par des guards placeholder qui retournent toujours `true`. Cela signifie que pendant le développement des prompts P6–P19, un développeur peut naviguer librement entre les blocs sans contrainte de statut. **Après P20**, la navigation sera strictement contrainte par le `case_status`.

**Implication :** Les tests manuels effectués avant P20 ne valident pas la logique de navigation. Des tests de non-régression doivent être refaits après P20.

### ⚠️ 5. Cohérence app.routes.ts — Extensions cumulatives
Le fichier `app.routes.ts` est créé en P3 avec toutes les routes et lazy-loading. Les prompts P6–P19 marqués `[EXTENSION ROUTING]` **ne modifient pas** la structure des routes (déjà complète en P3), mais ils remplacent les composants placeholder par les vrais composants. **Le fichier app.routes.ts ne nécessite aucune modification après P3** — seuls les fichiers composants changent.

### ⚠️ 6. D3.js vs Chart.js — Choix technique à fixer
Le spec mentionne alternativement D3.js et Chart.js pour les graphiques :
- `finaces-score-gauge` (P4) : **D3.js** (SVG arc)
- `finaces-shap-chart` (P5) : **D3.js** (barres horizontales)
- `finaces-stress-chart` (P5) : **Chart.js** (line chart)
- Dashboard chart (P6) : **Chart.js** (line chart double)
- Feature importance (P19) : **D3.js** (barres horizontales)

**Recommandation :** Installer les deux (`d3` + `chart.js` + `ng2-charts`) dès P1 pour éviter les ajouts tardifs de dépendances.

### ⚠️ 7. ngx-skeleton-loader — Installation requise avant P21
Le package `ngx-skeleton-loader` est utilisé en P21 pour les états de chargement. Il doit être ajouté aux dépendances. **Recommandation :** L'ajouter dès P1 (setup initial) ou au plus tard avant P21.

### ⚠️ 8. Règle MCC-R3 — Vérification systématique
Chaque écran affichant un score ou résultat IA **doit** inclure `<finaces-ia-disclaimer>`. Les blocs concernés sont : P13 (IA), P14 (Tension), P17 (Rapport — section IA), P19 (Admin IA). **Le code review de chaque prompt doit vérifier la présence du disclaimer.**

### ⚠️ 9. Règle MCC-R5 — Validation croisée
La règle "commentaire obligatoire si tension MODERATE ou SEVERE" est implémentée en P14 (Bloc 7 Tension). Mais elle doit aussi être **vérifiée en P16 (Expert Review)** — le dossier ne peut pas être clôturé si un commentaire de tension est manquant. Cette validation croisée entre P14 et P16 doit être testée end-to-end.

### ⚠️ 10. Types TypeScript — Zéro `any`
Les modèles sont strictement typés en P2. **Aucun prompt ultérieur ne doit introduire de `any`**. Si un schema backend évolue, le modèle TypeScript correspondant dans `core/models/` doit être mis à jour en premier, et les impacts propagés.

---

## ESTIMATION EFFORT TOTAL

| Phase | Prompts | Fichiers estimés | Effort (jours dev senior) |
|-------|---------|------------------|---------------------------|
| Phase 0 — Infrastructure | P1–P3 | ~71 | 3 jours |
| Phase 1 — Design System | P4–P5 | ~28 | 2 jours |
| Phase 2 — Flux Dossier | P6–P15 | ~66 | 10 jours |
| Phase 3 — Clôture | P16–P17 | ~12 | 2 jours |
| Phase 4 — Cas Spéciaux | P18–P19 | ~14 | 2 jours |
| Phase 5 — Robustesse | P20–P22 | ~24 | 3 jours |
| **TOTAL** | **22 prompts** | **~215 fichiers** | **~22 jours** |

---

*Document généré le 2026-03-16 — FinaCES Frontend Spec v1.0*
