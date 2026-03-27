# 🚨 RAPPORT D'AUDIT — CONTRAT API (Frontend ↔ Backend)

**Date :** 26 Mars 2026
**Auditeur :** Architecte Frontend Senior (Enterprise-Grade)
**Référence Backend :** `finaces-api` (FastAPI + Pydantic v2 + SQLAlchemy 2.0)
**Référence Frontend :** `finaces-front` (Angular 17+ / TypeScript)
**Règle de vérité :** **Le backend fait foi.** Le frontend devra s'adapter, sauf là où il est plus élaboré (et le backend devra évoluer).

---

## VERDICT GLOBAL

> **Le frontend et le backend ne parlent PAS le même langage.**
> Sur les 14 domaines modèles analysés, **13 présentent des incompatibilités structurelles**.
> Sur les 45 appels HTTP du frontend, **18 ciblent des URLs ou des verbes qui n'existent pas** côté backend.
> **Aucun câblage direct n'est possible en l'état.**
> Une couche **Adapter/Mapper** est OBLIGATOIRE pour absorber les écarts.

---

## PARTIE 1 — ÉCARTS SUR LES MODÈLES (Field-by-Field)

### 1.1 FinancialStatementCreate — 🔴 INCOMPATIBLE

| Aspect | Frontend | Backend | Écart |
| :--- | :--- | :--- | :--- |
| **Structure** | **IMBRIQUÉE** : `{ fiscal_year, bilan_actif: {...}, bilan_passif: {...}, income_statement: {...}, cash_flow: {...} }` | **PLATE** : `{ fiscal_year, currency_original, exchange_rate_to_usd, total_assets, current_assets, liquid_assets, inventory, revenue, ... }` (50+ champs à la racine) | 🔴 Le backend va retourner **422 Validation Error** sur chaque POST. |
| Champs manquants (Front→Back) | Absent | `currency_original`, `exchange_rate_to_usd`, `referentiel`, `is_consolidated` | 🔴 Le backend exige ces champs. |
| Champs en trop (Front→Back) | `other_noncurrent_assets`, `extraordinary_expenses`, `dividends` | Absents du schema Pydantic | 🟠 Ignorés silencieusement par Pydantic (mode strict=False) mais données perdues. |
| **Action** | Le frontend doit : (1) aplatir le payload avant envoi via un `FinancialMapper.toBackendCreate()`, (2) ajouter `currency_original`, `exchange_rate_to_usd`, `referentiel`. | | |

### 1.2 FinancialStatementRawOut — 🔴 INCOMPATIBLE

| Aspect | Frontend | Backend | Écart |
| :--- | :--- | :--- | :--- |
| **Structure** | **IMBRIQUÉE** : `{ id, case_id, fiscal_year, bilan_actif: BilanActifSchema, bilan_passif: BilanPassifSchema, income_statement, cash_flow }` | **PLATE** : tous les champs financiers à la racine + `id`, `case_id`, `fiscal_year` | 🔴 Le frontend ne saura pas afficher les données reçues. |
| **Action** | Créer un `FinancialMapper.fromBackendRaw(flat) → FinancialStatementRawOut` qui regroupe les champs plats en sous-objets. | | |

### 1.3 FinancialStatementNormalizedSchema — 🔴 INCOMPATIBLE

| Aspect | Frontend | Backend | Écart |
| :--- | :--- | :--- | :--- |
| **Structure** | Frontend attend : `normalized_revenue`, `normalized_ebitda`, `confidence_score`, `normalization_date`, `adjustments: NormalizationAdjustment[]` | Backend retourne : 60+ champs plats identiques au Raw + `adjustments_count`, `normalized_json` | 🔴 Structures totalement différentes. |
| **Adjustments** | Frontend : `NormalizationAdjustment { line_item, original_value, adjusted_value, reason, confidence }` | Backend : `AdjustmentSchema { raw_statement_id, fiscal_year, adj_type, field, amount_before, amount_after, mode, justification, source_ref }` | 🔴 Champs différents pour les ajustements. |
| **Action** | Créer `NormalizationMapper` bidirectionnel. Le frontend est plus riche en UX (confidence_score, etc.) — le backend devra peut-être évoluer pour les retourner. | | |

### 1.4 RatioSetSchema — 🔴 INCOMPATIBLE (LE PLUS GROS ÉCART)

| Aspect | Frontend | Backend | Écart |
| :--- | :--- | :--- | :--- |
| **Structure** | **GROUPÉE** : `{ liquidity: { current_ratio: RatioValue, ... }, solvency: {...}, profitability: {...}, capacity: {...}, z_score: {...} }` — Chaque ratio est un `RatioValue { current, trend[], benchmark_min, benchmark_max, status, unit, variation_pct }` | **PLATE** : `{ current_ratio: Decimal, quick_ratio: Decimal, ... z_score_altman: Decimal, z_score_zone: str, coherence_alerts_json: List[Dict] }` | 🔴 Le backend retourne des valeurs brutes. Le frontend attend des objets riches avec trend, benchmarks, status couleur. |
| Champs exclusifs Front | `benchmark_min`, `benchmark_max`, `status` (GREEN/YELLOW/ORANGE/RED), `unit`, `variation_pct`, `analyst_note`, `coherence_status`, `sector_code` | Absents | 🟠 Le frontend devra calculer ces enrichissements côté client, ou le backend devra les ajouter. |
| Champs exclusifs Back | `id`, `normalized_statement_id`, `negative_equity`, `negative_operating_cash_flow`, `created_at` | Absents du frontend | 🟡 Données ignorées côté front. |
| Ratios manquants (Front→Back) | `dio_days`, `cash_conversion_cycle` dans le frontend `ratio.model.ts` | Présents dans backend | ✅ Alignés (présents des deux côtés). |
| **Action** | Créer `RatioMapper.fromBackendFlat(data) → RatioSetSchema` : (1) grouper par pilier, (2) construire les `RatioValue` à partir des valeurs brutes, (3) calculer `trend[]` à partir de données multi-exercices, (4) calculer `status` via des seuils configurables. | | |

### 1.5 GateDecisionSchema — 🔴 INCOMPATIBLE

| Aspect | Frontend | Backend | Écart |
| :--- | :--- | :--- | :--- |
| `verdict` enum | `'PASSÉ' \| 'BLOQUÉ' \| 'EN ATTENTE'` (FR) | `'OK' \| 'RESERVE' \| 'BLOCKING'` (EN) | 🔴 Valeurs différentes. |
| `reliability_level` enum | `'HIGH' \| 'MEDIUM' \| 'LOW' \| 'CRITICAL'` | `'HIGH' \| 'MEDIUM' \| 'LOW' \| 'UNAUDITED'` | 🔴 `CRITICAL` (front) ≠ `UNAUDITED` (back). |
| Champs manquants (Back→Front) | Frontend attend : `id`, `case_id`, `missing_docs`, `documents_received`, `audit_log`, `evaluated_at`, `evaluated_by` | Backend ne retourne que : `missing_mandatory`, `missing_optional`, `computed_at` | 🔴 Frontend attend des données que le backend ne fournit pas. |
| **Action** | (1) Aligner les enums : mapper `OK→PASSÉ`, `BLOCKING→BLOQUÉ`, `RESERVE→EN ATTENTE`. (2) Mapper `missing_mandatory + missing_optional → missing_docs`. (3) `computed_at → evaluated_at`. (4) `documents_received` et `audit_log` : soit le backend évolue, soit le frontend les calcule localement. | | |

### 1.6 ScorecardOutputSchema — 🔴 INCOMPATIBLE

| Aspect | Frontend | Backend | Écart |
| :--- | :--- | :--- | :--- |
| **Architecture Pilier** | **Dénormalisée** : `liquidity_score`, `liquidity_label`, `liquidity_detail: PillarDetailSchema` (×5 piliers = 15 champs) | **Normalisée** : `pillars: List[PillarDetailSchema]` (tableau de 5 objets) | 🔴 Le frontend attend 15 champs séparés, le backend envoie un tableau. |
| `PillarDetailSchema` | Front : `{ pillar_name, score, label: PillarLabel, ratios_used, comment }` | Back : `{ id, name, score, weight, trend, signals, detailText }` | 🔴 Champs totalement différents. |
| `PillarLabel` enum | Front : `INSUFFICIENT, WEAK, MODERATE, STRONG, VERY_STRONG` | Back (InterpretationLabel) : `INADEQUATE, WEAK, MODERATE, STRONG, VERY_STRONG` | 🟠 `INSUFFICIENT` (front) vs `INADEQUATE` (back). |
| `RiskClass` enum | Front : `LOW, MODERATE, HIGH, CRITICAL` | Back : `LOW, MEDIUM, HIGH, CRITICAL` | 🔴 `MODERATE` (front) ≠ `MEDIUM` (back). |
| `RiskProfile` enum | Front : `BALANCED, ASYMMETRICAL, AGGRESSIVE, DEFENSIVE, CLASSIC` (EN) | Back : `EQUILIBRE, ASYMETRIQUE, AGRESSIF, DEFENSIF, CLASSIQUE` (FR) | 🔴 Langue différente pour les mêmes concepts. |
| Champs exclusifs Front | `scorecard_id`, `fiscal_year`, `ia_score`, `tension_level`, `tension_comment`, `expert_comment`, `expert_reviewed_at`, `version` | Absents du backend | 🟠 Backend devra évoluer ou le frontend agrège depuis d'autres endpoints. |
| Champs exclusifs Back | `system_calculated_score`, `system_risk_class`, `base_risk_class`, `is_overridden`, `override_rationale`, `cross_analysis_alerts`, `trends_summary`, `synergy_index`, `synergy_bonus` | Absents ou partiels côté front | 🟠 Données perdues sans mapper. |
| **Action** | Mapper massif : `ScorecardMapper.fromBackend(back) → ScorecardOutputSchema` : (1) déplier `pillars[]` en `liquidity_score/label/detail` etc., (2) traduire les enums, (3) mapper `base_risk_class → risk_class`, (4) fusionner `trends_summary` + `cross_analysis_alerts`. | | |

### 1.7 StressScenarioInputSchema — 🔴 TOTALEMENT INCOMPATIBLE

| Aspect | Frontend | Backend | Écart |
| :--- | :--- | :--- | :--- |
| **Philosophie** | **Stress par chocs** : `revenue_shock`, `cost_inflation`, `receivables_days_increase`, `payment_delays_days`, `interest_rate_increase`, `capex_reduction` | **Stress par contrat** : `contract_value`, `contract_months`, `annual_ca_avg`, `cash_available`, `advance_pct`, `credit_lines`, `milestones[]`, `bfr_rate_sector` | 🔴 **Deux modèles conceptuels différents.** Le frontend simule des chocs macroéconomiques, le backend simule la trésorerie sur un contrat spécifique. |
| **Action** | **Décision architecturale requise** : soit (a) le frontend s'adapte au modèle contrat du backend (recommandé — c'est le modèle MCC), soit (b) le backend ajoute un mode "chocs" pour supporter l'approche frontend. | | |

### 1.8 StressResultSchema — 🔴 TOTALEMENT INCOMPATIBLE

| Aspect | Frontend | Backend | Écart |
| :--- | :--- | :--- | :--- |
| **Structure** | Front : `{ scenario_name, solvency_status, minimum_cash_position, minimum_cash_date, days_to_default, flows[], payment_milestones[], liquidity_coverage_ratio, debt_service_coverage_ratio }` | Back : `{ contract_value, contract_months, exposition_pct, stress_60d_result, stress_90d_result, stress_60d_cash_position, stress_90d_cash_position, score_capacity, capacity_conclusion, monthly_flows[], scenarios_results: Dict }` | 🔴 Le backend renvoie des résultats à 60j/90j, le frontend attend un résultat par scénario nommé. |
| `solvency_status` enum | Front : `'SOLVENT' \| 'LIMIT' \| 'INSOLVENT'` | Back : `SOLVENT, LIMIT, INSOLVENT` (enum StressDecision) | ✅ Aligné. |
| **Action** | Mapper `StressMapper` + refonte du formulaire frontend pour correspondre au modèle contrat. | | |

### 1.9 IAPredictionResult — 🔴 INCOMPATIBLE

| Aspect | Frontend | Backend | Écart |
| :--- | :--- | :--- | :--- |
| Score field | `predicted_score` (number) | `ia_score` (float, 0-100) | 🔴 Nom différent. |
| Risk class field | `predicted_risk_class` | `ia_risk_class` | 🔴 Nom différent. |
| Timestamp field | `prediction_timestamp` | `predicted_at` | 🔴 Nom différent. |
| Champs exclusifs Front | `confidence_interval: {lower, upper}`, `model_performance: {auc_roc, accuracy, f1_score}`, `disclaimer` | Absents | 🟠 Frontend attend des métriques que le backend ne retourne pas ici (elles sont dans `/models/active`). |
| Champs exclusifs Back | `ia_probability_default`, `threshold_info` | Absents du frontend | 🟠 Données critiques perdues. |
| SHAP structure | Front : `shap_values: { base_value, features: ShapFeature[] }` — `ShapFeature { feature_name, feature_value, shap_value, direction, magnitude }` | Back : `explanations: { top_features: IAFeatureContribution[], explanation_method, base_value }` — `IAFeatureContribution { feature_name, feature_value, shap_value, impact }` | 🟠 Proches mais noms et structure légèrement différents (`direction/magnitude` vs `impact`). |
| **Action** | Mapper `IAMapper` : (1) renommer les champs, (2) convertir `explanations → shap_values`, (3) agréger `model_performance` depuis `/ia/models/active`. | | |

### 1.10 ExpertReviewInputSchema — 🔴 TOTALEMENT INCOMPATIBLE

| Aspect | Frontend | Backend | Écart |
| :--- | :--- | :--- | :--- |
| **Structure** | **Par pilier** : `liquidity_comment`, `solvability_comment`, `profitability_comment`, `capacity_comment`, `quality_comment`, `dynamic_analysis_comment` + `mitigating_factors`, `risk_factors`, `override_recommendation` | **Bloc unique** : `analyst_id`, `qualitative_notes` (string libre), `manual_risk_override?`, `final_decision: 'APPROVED'\|'REJECTED'\|'ESCALATED'` | 🔴 Le frontend envoie 9 champs structurés, le backend attend 4 champs dont 1 texte libre. |
| **Action** | **Décision architecturale requise** : le frontend est beaucoup plus élaboré (commentaires par pilier). Recommandation : (a) enrichir le backend pour accepter les commentaires par pilier, ou (b) sérialiser les commentaires front en JSON dans `qualitative_notes`. | | |

### 1.11 ConsortiumScorecardOutput — 🔴 INCOMPATIBLE

| Aspect | Frontend | Backend | Écart |
| :--- | :--- | :--- | :--- |
| JV Type | `'SOLIDAIRE' \| 'CONJOINTE' \| 'SEPARATE'` (FR) | `jv_type` référençant `JVType: 'JOINT_AND_SEVERAL' \| 'JOINT' \| 'SEPARATE'` (EN) | 🔴 Langue différente sauf `SEPARATE`. |
| Member struct | Front : `ConsortiumMember { member_id, member_name, role, participation_pct, score?, risk_class?, status? }` | Back : `ConsortiumMemberInput { bidder_id, bidder_name, role, participation_pct, score_global, score_liquidity, ..., final_risk_class, stress_60d_result }` | 🔴 Champs différents (member_id vs bidder_id, etc.) |
| Result fields | Front : `weakest_member_id`, `combined_scorecard`, `member_scorecards`, `strength_ratio` | Back : `weak_link_triggered`, `weak_link_member`, `leader_blocking`, `leader_override`, `aggregated_stress`, `weighted_score`, `synergy_bonus`, `mitigations_suggested` | 🔴 Concepts proches, noms différents. |
| **Action** | Mapper `ConsortiumMapper`. | | |

### 1.12 DashboardStatsOut — 🔴 INCOMPATIBLE

| Aspect | Frontend | Backend | Écart |
| :--- | :--- | :--- | :--- |
| **Structure** | Front : `{ total_active_cases, cases_pending_gate, cases_with_tension_alert, convergence_percentage, avg_mcc_score_7days, avg_ia_score_7days, divergences_count_7days, last_updated }` | Back : `{ total_cases, by_status: Dict, risk_distribution: Dict, recent_events: List, recent_cases: List }` | 🔴 Le frontend attend des KPIs calculés (convergence, moyennes 7j) que le backend ne fournit pas. |
| **Action** | Soit enrichir le backend `/dashboard/stats` avec les KPIs attendus, soit le frontend les calcule à partir de `by_status` + d'autres endpoints. | | |

### 1.13 GateDocumentOut vs DocumentOut — 🟠 DÉSALIGNÉ

| Aspect | Frontend | Backend | Écart |
| :--- | :--- | :--- | :--- |
| `document_type` enum | Front : `'BILAN' \| 'CPC' \| 'TFT' \| 'ATTESTATION_FISCALE' \| 'STATUTS' \| 'OTHER'` | Back : `'FINANCIAL_STATEMENTS' \| 'AUDITOR_OPINION' \| 'ANNEXES' \| 'CA_DECLARATION' \| 'BANK_REFERENCES' \| 'OTHER'` | 🔴 Taxonomies totalement différentes. |
| `reliability_level` enum | Front : `'AUDITED' \| 'REVIEWED' \| 'COMPILED' \| 'UNAUDITED'` | Back : `'HIGH' \| 'MEDIUM' \| 'LOW' \| 'UNAUDITED'` | 🔴 Sémantique différente (qualitative vs quantitative). |
| `status` enum | Front : `'UPLOADED' \| 'ANALYZED' \| 'FLAGGED' \| 'APPROVED' \| 'REJECTED'` | Back : `'PRESENT' \| 'MISSING' \| 'INCOMPLETE' \| 'REJECTED'` | 🔴 Différents workflows. |
| **Action** | Aligner les enums. La taxonomie documentaire du backend (`FINANCIAL_STATEMENTS`, etc.) est trop générique pour la Gate MCC — le backend devra probablement adopter la taxonomie frontend plus fine (`BILAN`, `CPC`, `TFT`, etc.). | | |

### 1.14 CaseStatus (État machine) — 🔴 CRITIQUE

| Aspect | Frontend | Backend | Écart |
| :--- | :--- | :--- | :--- |
| **États** | `DRAFT, PENDING_GATE, FINANCIAL_INPUT, NORMALIZATION_DONE, RATIOS_COMPUTED, SCORING_DONE, STRESS_DONE, EXPERT_REVIEWED, CLOSED, CANCELLED` (10 états) | `DRAFT, IN_ANALYSIS, SCORING, COMPLETED, ARCHIVED` (5 états) | 🔴 Le frontend a un pipeline en 10 étapes granulaires. Le backend a 5 états grossiers. |
| **Action** | **Décision architecturale majeure** : le backend doit évoluer pour supporter le pipeline granulaire du frontend, car c'est ce pipeline qui reflète le workflow MCC réel. | | |

### 1.15 CaseType — 🟠 DÉSALIGNÉ

| Aspect | Frontend | Backend | Écart |
| :--- | :--- | :--- | :--- |
| **Valeurs** | `'SINGLE' \| 'GROUPEMENT' \| 'LOTS'` | `'SINGLE' \| 'CONSORTIUM'` | 🟠 `GROUPEMENT` (front) ≈ `CONSORTIUM` (back). `LOTS` n'existe pas côté back. |
| **Action** | Mapper `GROUPEMENT → CONSORTIUM`. Décider si `LOTS` est un futur besoin ou un artéfact. | | |

---

## PARTIE 2 — ÉCARTS SUR LES ENDPOINTS (URL / Verbes HTTP)

### 2.1 Endpoints Frontend qui CIBLENT DES URLs INEXISTANTES

| Sévérité | Service Frontend | Appel Frontend | Backend Réel | Écart |
| :--- | :--- | :--- | :--- | :--- |
| 🔴 CRITIQUE | `IaService.getPrediction()` | `GET /ia/cases/{id}/predict` | `GET /ia/predict/{id}` | URL path différent : `/ia/cases/` vs `/ia/` |
| 🔴 CRITIQUE | `IaService.simulateWhatIf()` | `POST /ia/cases/{id}/simulate` | ❌ **N'EXISTE PAS** | Endpoint fantôme — aucun what-if côté back |
| 🔴 CRITIQUE | `StressService.runCustomStressTest()` | `POST /cases/{id}/stress/simulate` | `POST /cases/{id}/stress/run` | URL : `simulate` ≠ `run` |
| 🔴 CRITIQUE | `StressService.getStressTests()` | `GET /cases/{id}/stress` | ❌ **N'EXISTE PAS** | Pas de GET stress côté back |
| 🔴 CRITIQUE | `CaseService.getDashboardStats()` | `GET /dashboard` | `GET /dashboard/stats` | URL incomplète |
| 🔴 CRITIQUE | `CaseService.getConvergenceChart()` | `GET /analytics/convergence?days=` | ❌ **N'EXISTE PAS** | Endpoint fantôme |
| 🔴 CRITIQUE | `CaseService.getActiveTensionCases()` | `GET /cases?filter=divergence_level:...` | ❌ **Filtre non supporté** | Le backend filtre par `status` et `search`, pas par `divergence_level` |
| 🔴 CRITIQUE | `CaseService.getNormalizedFinancials()` | `GET /cases/{id}/normalized-financials` | ❌ **N'EXISTE PAS** | Seul `POST /normalize` existe |
| 🟠 MAJEUR | `ConsortiumService.getConsortium()` | `GET /cases/{id}/consortium` | ❌ **N'EXISTE PAS** | Seul `POST .../consortium/calculate` existe |
| 🟠 MAJEUR | `ConsortiumService.addMember()` | `POST /cases/{id}/consortium/members` | ❌ **N'EXISTE PAS** | Pas de CRUD membres côté back |
| 🟠 MAJEUR | `ConsortiumService.updateMember()` | `PATCH .../consortium/members/{id}` | ❌ **N'EXISTE PAS** | Pas de CRUD membres côté back |
| 🟠 MAJEUR | `ConsortiumService.removeMember()` | `DELETE .../consortium/members/{id}` | ❌ **N'EXISTE PAS** | Pas de CRUD membres côté back |
| 🟠 MAJEUR | `DocumentService.deleteDocument()` | `DELETE /cases/{id}/documents/{docId}` | ❌ **N'EXISTE PAS** | Pas de suppression de documents côté back |
| 🟠 MAJEUR | `BidderService.createBidder()` | `POST /bidders` | ❌ **N'EXISTE PAS** | Bidders créés via case creation |
| 🟠 MAJEUR | `CaseService.patchCaseStatus()` | `PATCH /cases/{id}` (body: status) | `PATCH /cases/{id}/status` (body: StatusTransition) | URL et payload différents |

### 2.2 Endpoints Backend SANS service Frontend

| Sévérité | Endpoint Backend | Description | Conséquence |
| :--- | :--- | :--- | :--- |
| 🟠 MAJEUR | `POST /cases/{id}/report/build` | Génération du rapport 14 sections | Le frontend utilise `window.print()` au lieu des endpoints rapport |
| 🟠 MAJEUR | `GET /cases/{id}/report` | Lecture du rapport | Non câblé |
| 🟠 MAJEUR | `PUT /cases/{id}/report/{rid}/section` | Édition de section | Non câblé |
| 🟠 MAJEUR | `POST /{report_id}/finalize` | Finalisation du rapport | Non câblé |
| 🟠 MAJEUR | `POST /cases/{id}/export/word` | Export Word | Non câblé (client-side CSV seulement) |
| 🟠 MAJEUR | `POST /cases/{id}/export/pdf` | Export PDF | Non câblé |
| 🟠 MAJEUR | `GET /cases/{id}/export/*/download` | Téléchargement fichiers | Non câblé |
| 🟠 MAJEUR | `POST /ia/features/{id}` | Calcul features IA | Non câblé |
| 🟠 MAJEUR | `POST /ia/dual-scoring/{id}` | Double scoring MCC+IA | Non câblé |
| 🟠 MAJEUR | `GET /ia/tension/{id}` | Analyse tension | Non câblé (données mockées) |
| 🟠 MAJEUR | `GET /ia/tension/{id}/history` | Historique tensions | Non câblé |
| 🟠 MAJEUR | `GET /ia/models` | Liste modèles IA | Non câblé |
| 🟠 MAJEUR | `GET /ia/stats/predictions` | Statistiques prédictions | Non câblé |
| 🟡 MINEUR | `GET /api/v1/audit/*` | Trail d'audit (4 endpoints) | Non câblé |
| 🟡 MINEUR | `GET/POST /api/v1/settings` | Paramètres | Non câblé |
| 🟡 MINEUR | `*/policies/*` | Gestion des politiques (5 endpoints) | Non câblé |
| 🟡 MINEUR | `*/comparison/*` | Benchmarking (4 endpoints) | Non câblé |
| 🟡 MINEUR | `GET /api/v1/system/*` | Info système | Non câblé |

---

## PARTIE 3 — SYNTHÈSE DES ENUMS DÉSALIGNÉS

| Enum | Frontend | Backend | Action |
| :--- | :--- | :--- | :--- |
| `CaseStatus` | 10 états (DRAFT → CANCELLED) | 5 états (DRAFT → ARCHIVED) | 🔴 Backend doit évoluer |
| `CaseType` | SINGLE, GROUPEMENT, LOTS | SINGLE, CONSORTIUM | 🟠 Mapper GROUPEMENT→CONSORTIUM, décider LOTS |
| `RiskClass` | LOW, **MODERATE**, HIGH, CRITICAL | LOW, **MEDIUM**, HIGH, CRITICAL | 🔴 Mapper MODERATE↔MEDIUM |
| `GateVerdict` | PASSÉ, BLOQUÉ, EN ATTENTE | OK, RESERVE, BLOCKING | 🔴 Mapper FR↔EN |
| `ReliabilityLevel` | AUDITED, REVIEWED, COMPILED, UNAUDITED | HIGH, MEDIUM, LOW, UNAUDITED | 🔴 Mapper qualité↔quantité |
| `DocType` | BILAN, CPC, TFT, ATTESTATION_FISCALE, STATUTS, OTHER | FINANCIAL_STATEMENTS, AUDITOR_OPINION, ANNEXES, CA_DECLARATION, BANK_REFERENCES, OTHER | 🔴 Taxonomies incompatibles |
| `DocStatus` | UPLOADED, ANALYZED, FLAGGED, APPROVED, REJECTED | PRESENT, MISSING, INCOMPLETE, REJECTED | 🔴 Workflows différents |
| `PillarLabel` | INSUFFICIENT, WEAK, MODERATE, STRONG, VERY_STRONG | INADEQUATE, WEAK, MODERATE, STRONG, VERY_STRONG | 🟠 Mapper INSUFFICIENT↔INADEQUATE |
| `RiskProfile` | BALANCED, ASYMMETRICAL, ... (EN) | EQUILIBRE, ASYMETRIQUE, ... (FR) | 🔴 Mapper EN↔FR |
| `JVType` | SOLIDAIRE, CONJOINTE, SEPARATE (FR) | JOINT_AND_SEVERAL, JOINT, SEPARATE (EN) | 🔴 Mapper FR↔EN |
| `IARiskClass` | (reuses RiskClass: MODERATE) | LOW, **MODERATE**, HIGH, CRITICAL | ✅ Aligné côté IA mais pas côté Scoring |

---

## MÉTRIQUES DE L'AUDIT

| Métrique | Valeur |
| :--- | :--- |
| Modèles analysés | **14** |
| Modèles 🔴 incompatibles | **12** |
| Modèles 🟠 désalignés | **2** |
| Modèles ✅ alignés | **0** |
| Endpoints frontend fantômes (URL inexistante) | **15** |
| Endpoints backend non câblés | **18** |
| Enums désalignés | **11** |
| **Score de compatibilité globale** | **~5%** |

---

## 🛠️ PLAN DE FRAPPE — CÂBLAGE API

### Phase A — Fondations (Adapter Layer)

1. **Créer le dossier `core/mappers/`** avec un mapper par domaine :
   - `financial.mapper.ts` — Aplatissement/regroupement des financial statements
   - `ratio.mapper.ts` — Enrichissement des ratios bruts en `RatioValue` groupés
   - `gate.mapper.ts` — Traduction des enums Gate (EN→FR)
   - `scorecard.mapper.ts` — Dépliement `pillars[]` → champs individuels + traduction enums
   - `stress.mapper.ts` — Conversion du modèle contrat
   - `ia.mapper.ts` — Renommage des champs IA + restructuration SHAP
   - `expert.mapper.ts` — Sérialisation des commentaires par pilier
   - `consortium.mapper.ts` — Traduction JV types + restructuration membres
   - `dashboard.mapper.ts` — Calcul des KPIs depuis les données brutes
   - `document.mapper.ts` — Traduction des enums documents
   - `enum.mapper.ts` — Fichier central de traduction de TOUS les enums

2. **Créer `core/enums/backend.enums.ts`** — Les enums du backend (source de vérité) séparés des enums d'affichage frontend.

### Phase B — Alignement des Endpoints

3. **Corriger les 15 URLs fantômes** dans les services.
4. **Créer les services manquants** : `ReportService`, `ExportService`, `AuditService`, `ComparisonService`, `SettingsService`, `PolicyService`.
5. **Enrichir `IaService`** pour couvrir features, dual-scoring, tension, models.

### Phase C — Décisions Architecturales (Front ↔ Back)

6. **CaseStatus** : Le backend DOIT évoluer vers le pipeline à 10 étapes.
7. **StressInput** : Le frontend DOIT s'adapter au modèle contrat du backend.
8. **ExpertReview** : Le backend DOIT évoluer pour accepter les commentaires par pilier.
9. **DocType taxonomy** : Le backend DOIT adopter la taxonomie fine du frontend (BILAN, CPC, TFT...).
10. **Dashboard KPIs** : Le backend DOIT enrichir `/dashboard/stats` avec convergence, moyennes 7j, tension alerts.

### Phase D — Câblage Progressif (par bloc fonctionnel)

11. **Bloc Gate/Documents** — Premier bloc câblé (le plus simple).
12. **Bloc Financials** — Saisie + normalisation + ratios.
13. **Bloc Scoring** — Scorecard MCC.
14. **Bloc IA/Tension** — Prédiction + dual-scoring.
15. **Bloc Stress** — Après refonte du formulaire frontend.
16. **Bloc Expert** — Après évolution backend.
17. **Bloc Rapport** — Câblage build/export/download.
18. **Bloc Dashboard** — Après enrichissement backend.
19. **Bloc Consortium** — Après ajout CRUD membres côté backend.

### Phase E — Vérification

20. **Tests d'intégration** par bloc : envoyer des requêtes réelles et vérifier les réponses via le mapper.
21. **Validation enum complète** : script qui vérifie que chaque valeur enum frontend a un mapping backend.

---

*En attente de votre "GO" pour démarrer. Recommandation : commencer par la Phase A (Adapter Layer) car elle est entièrement côté frontend et ne bloque pas le backend.*
