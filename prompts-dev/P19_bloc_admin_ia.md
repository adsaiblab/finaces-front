═══════════════════════════════════════════════════════════════════════════════
PROMPT 19 — BLOC ADMIN IA (modèles + feature importance + monitoring)
Dépend de : PROMPT 13 (Bloc 7 — Scoring IA)
Peut être parallélisé avec : PROMPT 18 (Bloc Consortium)
═══════════════════════════════════════════════════════════════════════════════

## CONTEXTE

Le bloc Admin IA est réservé aux administrateurs ML et administrateurs système (ROLE in ADMIN_ML, ADMIN).
Il permet de :

1. Visualiser les modèles IA déployés et en test
2. Monitorer les performances (ROC-AUC, F1, précision, recall)
3. Afficher l'importance des features (via SHAP ou coefficients)
4. Détecter les dérives (data drift, model drift)
5. Gérer le cycle de vie des modèles (création, entraînement, test, déploiement, archivage)
6. Exporter configurations et lancer réentraînement

Ce bloc n'est pas décisionnel; c'est un outil d'opération/gouvernance IA.
Les analystes FinaCES y accèdent en READ-ONLY pour comprendre les prédictions.

## RÈGLES MÉTIER APPLICABLES

**IA Rules (from MCC):**

1. **MCC-R3 — IA Disclaimer:**
   Tout affichage de scoring IA doit inclure disclaimer:
   "Le scoring IA est un outil d'aide à la décision, non décisionnel."

2. **Model Versioning:**
   Chaque modèle a version sémantique (ex: FinaCES-v2.1.0).
   Backend maintient liste de modèles actifs, en test, archivés.

3. **Feature Importance:**
   Affichée par groupe (Liquidité, Solvabilité, Rentabilité, Capacité, Qualité).
   Couleurs: blue(Liquidité), purple(Solvabilité), orange(Rentabilité),
            green(Capacité), teal(Qualité).

4. **Data Drift Detection:**
   Monitoring sur 7j: écart de distribution features vs training set.
   Seuil alerte: drift > 2σ (z-score).
   Alert: "Drift détecté sur feature X — recalibrage recommandé"

5. **Model Drift Detection:**
   Comparaison des prédictions vs actuel (ex: si beaucoup de FP récents).
   Alert: "Baisse de F1-Score sur validation — réentraînement recommandé"

6. **Pilot Mode:**
   Flag backend: pilot_mode = true/false.
   Si true: banner visible sur tous blocs IA + modèle en mode TEST only.

## FICHIERS À CRÉER / MODIFIER

**Créer:**
- `src/app/features/admin/ia/admin-ia.component.ts`
- `src/app/features/admin/ia/admin-ia.component.html`
- `src/app/features/admin/ia/admin-ia.component.scss`
- `src/app/features/admin/ia/admin-ia.service.ts`
- `src/app/features/admin/ia/models-table/models-table.component.ts|html|scss`
- `src/app/features/admin/ia/performance-metrics/performance-metrics.component.ts|html|scss`
- `src/app/features/admin/ia/feature-importance/feature-importance.component.ts|html|scss`
- `src/app/features/admin/ia/monitoring/monitoring.component.ts|html|scss`
- `src/app/features/admin/ia/model-config-dialog/model-config-dialog.component.ts|html|scss`

**Modifier:**
- `src/app/app.routes.ts` → route `/admin/ia`

**Dépendances réutilisables:**
- Chart.js / D3.js (for feature importance bar chart)
- Material Table (mat-table)
- Material Tabs (mat-tab-group)

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### Route & Accès

```
Route: /admin/ia
Method: GET (view all), POST (train), PATCH (deploy)
Roles: ADMIN_ML, ADMIN
Access: Restricted to role-based AuthGuard
```

### Layout Principal

```
┌─────────────────────────────────────────────────────────────┐
│ IA ADMINISTRATION                              [← Retour] │
│                                                              │
│ Modèle Actif: FinaCES-v2.1.0 | ROC-AUC: 0.847               │
│ Prédictions (7j): 1,245 | Temps moyen: 240ms                │
└─────────────────────────────────────────────────────────────┘

┌─ KPI CARDS (3 items) ──────────────────────────────────────┐
│                                                              │
│ ┌────────────────────┐  ┌────────────────────┐              │
│ │ MODÈLE ACTIF       │  │ PERFORMANCE        │              │
│ │                    │  │                    │              │
│ │ FinaCES-v2.1.0     │  │ ROC-AUC: 0.847     │              │
│ │ Trained: 2025-02-14│  │ F1-Score: 0.791    │              │
│ │ Status: ACTIF 🟢   │  │ Precision: 0.802   │              │
│ │ Model Type: EM-4v  │  │ Recall: 0.781      │              │
│ └────────────────────┘  └────────────────────┘              │
│                                                              │
│ ┌────────────────────┐                                      │
│ │ VOLUME (7 jours)   │                                      │
│ │                    │                                      │
│ │ Prédictions: 1,245 │                                      │
│ │ Succès: 1,234 (99%)│                                      │
│ │ Erreurs: 11 (0.9%) │                                      │
│ │ Temp moy: 240 ms   │                                      │
│ └────────────────────┘                                      │
│                                                              │
└────────────────────────────────────────────────────────────┘

┌─ TABLEAU MODÈLES ─────────────────────────────────────────┐
│                                                              │
│ mat-table: ID | Nom | Version | ROC-AUC | F1 | Statut      │
│                       | Entraîné | Actions                  │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ FinaCES-v2.1.0 | ROC-AUC: 0.847 | F1: 0.791             │ │
│ │ Status: ACTIF 🟢 | Trained: 2025-02-14                   │ │
│ │ [Métriques] [Config] [Activer] [Déployer] [Archiver]    │ │
│ │                                                          │ │
│ │ FinaCES-v2.0.5 | ROC-AUC: 0.832 | F1: 0.778             │ │
│ │ Status: ARCHIVÉ | Trained: 2025-01-10                    │ │
│ │ [Métriques] [Config] [Restaurer]                         │ │
│ │                                                          │ │
│ │ FinaCES-v3.0.0-beta | ROC-AUC: 0.856 | F1: 0.803        │ │
│ │ Status: TEST 🔵 | Trained: 2025-02-20                    │ │
│ │ [Métriques] [Config] [Promouvoir en ACTIF] [Supprimer]  │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ [+ Créer nouveau modèle] [↻ Réentraîner]                    │
└────────────────────────────────────────────────────────────┘

┌─ PERFORMANCE (Active Model) ───────────────────────────────┐
│ Tab-group: Train | Validation | Test                       │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ MÉTRIQUES DE PERFORMANCE (Train set)                     │ │
│ │                                                          │ │
│ │ Métrique          Train       Validation    Test         │ │
│ │ ─────────────────────────────────────────────────────    │ │
│ │ ROC-AUC           0.847       0.841         0.835        │ │
│ │ Precision         0.802       0.795         0.789        │ │
│ │ Recall            0.781       0.774         0.768        │ │
│ │ F1-Score          0.791       0.784         0.777        │ │
│ │ Accuracy          0.823       0.816         0.811        │ │
│ │ Log Loss          0.412       0.425         0.435        │ │
│ │ Matthews CC       0.641       0.632         0.624        │ │
│ │                                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ROC Curve (D3/Chart.js):                                     │ │
│ ┌────────────────────────────────────────────────────────┐  │ │
│ │ ROC — Train (AUC 0.847)                                │  │ │
│ │                         ╱╱╱╱ ← Validation (0.841)      │  │ │
│ │          ╱╱╱╱           ╱╱╱  ← Test (0.835)            │  │ │
│ │     ╱╱╱╱               ╱╱╱                              │  │ │
│ │   ╱╱╱  ........................                           │  │ │
│ │ ╱╱╱     (random classifier)                             │  │ │
│ │ Y                                                       │  │ │
│ │ │                                                       │  │ │
│ │ └────────────────────────────────────────────────────── X │ │
│ │                                                          │ │
│ │ [Télécharger courbes]                                    │ │
│ └────────────────────────────────────────────────────────┘  │ │
│                                                              │
│ Confusion Matrix (Test set):                                │ │
│ ┌────────────────────────────────────────────────────────┐  │ │
│ │           Prédiction Positive | Prédiction Négative    │  │ │
│ │ Actual Pos.      412                    95             │  │ │
│ │ Actual Neg.       58                   445             │  │ │
│ │                                                        │  │ │
│ │ Sensitivity (TPR): 81.3%                               │  │ │
│ │ Specificity (TNR): 88.5%                               │  │ │
│ └────────────────────────────────────────────────────────┘  │ │
└────────────────────────────────────────────────────────────┘

┌─ FEATURE IMPORTANCE ───────────────────────────────────────┐
│ Top 20 Features (by SHAP mean |value|)                     │
│                                                              │
│ Horizontal Bar Chart (D3/Chart.js):                         │
│ X-axis: Mean |SHAP value| (importance score)                │
│ Y-axis: Feature names                                       │
│ Colors by pillar:                                           │
│   - Liquidité: #3b82f6 (blue)                               │
│   - Solvabilité: #8b5cf6 (purple)                           │
│   - Rentabilité: #f97316 (orange)                           │
│   - Capacité: #22c55e (green)                               │
│   - Qualité: #14b8a6 (teal)                                 │
│   - Autres: #6b7280 (gray)                                  │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                              SHAP Feature Importance    │ │
│ │ marge_nette                ████████████████ 0.284      │ │ ← Orange (Rentabilité)
│ │ current_ratio               ██████████████ 0.256       │ │ ← Blue (Liquidité)
│ │ debt_to_equity              ████████████ 0.218         │ │ ← Purple (Solvabilité)
│ │ cfo_cash_flow               ███████████ 0.201          │ │ ← Green (Capacité)
│ │ ebitda_margin               ██████████ 0.187           │ │ ← Orange (Rentabilité)
│ │ roa                         █████████ 0.156            │ │ ← Orange (Rentabilité)
│ │ inventory_turnover          ████████ 0.134             │ │ ← Green (Capacité)
│ │ gearing_ratio               ███████ 0.118              │ │ ← Purple (Solvabilité)
│ │ audit_status                ██████ 0.101               │ │ ← Teal (Qualité)
│ │ revenue_growth_cagr         █████ 0.089                │ │ ← Rentabilité
│ │ ...                         ...                         │ │
│ │ feature_20                  ██ 0.038                   │ │
│ │                                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Stats:                                                       │ │
│ Total Features in Model: 45                                  │ │
│ Top 10 Cumulative Importance: 62.3%                          │ │
│ Top 20 Cumulative Importance: 87.5%                          │ │
│                                                              │
│ [Afficher all 45 features] [Exporter données]                │ │
└────────────────────────────────────────────────────────────┘

┌─ MONITORING & ALERTES ────────────────────────────────────┐
│ 7-day Statistics:                                           │
│                                                              │
│ │ Metric                  Value        Trend              │ │
│ │ ─────────────────────────────────────────────────────── │ │
│ │ Total Predictions       1,245        ↑ +8% vs prev week │ │
│ │ Success Rate            99.1%        → stable           │ │
│ │ Avg Prediction Time     240 ms       ↓ -12ms (↓5%)      │ │
│ │ Error Rate              0.9%         → stable           │ │
│ │ False Positive Rate     3.2%         ↑ +0.5% ⚠️         │ │
│ │ False Negative Rate     1.8%         → stable           │ │
│ │                                                          │ │
│ Alerts (sortés par sévérité):                              │ │
│ ┌──────────────────────────────────────────────────────┐  │ │
│ │ 🟡 Slight FP increase (3.2% vs 2.7%)                │  │ │
│ │    Action: Monitor next 7 days; if >5%, retrain     │  │ │
│ │    Last updated: 2025-02-21 10:30                   │  │ │
│ │                                                     │  │ │
│ │ 🔵 Prediction volume up 8%                          │  │ │
│ │    Note: Normal seasonal trend (Feb contracts)      │  │ │
│ │    Last updated: 2025-02-21 09:15                   │  │ │
│ │                                                     │  │ │
│ │ ✅ No data drift detected (7-day window)            │  │ │
│ │    All features within ±2σ of training dist.        │  │ │
│ │    Last updated: 2025-02-21 06:00                   │  │ │
│ └──────────────────────────────────────────────────────┘  │ │
│                                                              │
│ Alert Configuration:                                         │ │
│ ☑ Data Drift Alert (threshold: 2σ)                          │ │
│ ☑ Model Performance Alert (F1 < 0.75)                       │ │
│ ☑ Volume Alert (daily predictions < 100)                    │ │
│ ☑ Latency Alert (avg > 500ms)                               │ │
│ □ FP Rate Alert (threshold: 5%)                             │ │
│                                                              │
│ [Save configuration]                                        │ │
└────────────────────────────────────────────────────────────┘

┌─ ACTIONS MODEL ────────────────────────────────────────────┐
│                                                              │
│ [Export Config JSON]    ← Download model config (hyperparams)
│ [Réentraîner]            ← Trigger backend training job    │
│ [Déployer Nouveau]       ← Promote TEST model to ACTIVE    │
│ [Afficher Courbes ROC]   ← Popup chart                      │
│ [Matrice Confusion]      ← Popup chart                      │
│ [Pilot Mode: ON/OFF] ← Toggle pilot_mode flag             │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Admin IA Schema (Backend)

```typescript
ModelInfo {
  id: UUID,
  name: string (e.g., "FinaCES"),
  version: string (e.g., "2.1.0"),
  model_type: string (e.g., "xgboost", "ensemble"),
  status: "ACTIF" | "TEST" | "ARCHIVÉ",

  // Performance
  roc_auc_train: number,
  roc_auc_val: number,
  roc_auc_test: number,
  f1_score_train: number,
  f1_score_val: number,
  f1_score_test: number,
  precision_train: number,
  precision_val: number,
  precision_test: number,
  recall_train: number,
  recall_val: number,
  recall_test: number,
  accuracy: number,
  log_loss: number,
  matthews_cc: number,

  // Metadata
  trained_at: ISO timestamp,
  deployed_at: ISO timestamp,
  trained_by: UUID,
  training_samples: number,
  features_count: number,
  feature_names: string[],

  // Config
  hyperparameters: {[key: string]: any},
  feature_importance: {feature: string, importance: number, pillar: string}[],
  shap_values?: {...},

  // Monitoring
  predictions_7d: number,
  error_rate_7d: number,
  avg_inference_time_ms: number,
  false_positive_rate_7d: number,
  false_negative_rate_7d: number,
  data_drift_detected: boolean,
  alerts: {type: string, severity: string, message: string, timestamp: ISO}[]
}

AdminIAStatsDTO {
  active_model: ModelInfo,
  all_models: ModelInfo[],
  pilot_mode: boolean,

  // 7-day stats
  total_predictions_7d: number,
  success_rate_7d: number,
  avg_prediction_time_ms: number,
  error_count_7d: number,
  false_positive_count: number,
  false_negative_count: number,

  // Alerts
  active_alerts: AlertDTO[],
  drift_features: string[],
  recommended_actions: string[]
}
```

## CONTRAINTES ANGULAR

**Composants:**
- Main: AdminIaComponent (OnInit, ChangeDetectionStrategy.OnPush)
- Sub-components:
  - ModelsTableComponent (mat-table)
  - PerformanceMetricsComponent (tabs + charts)
  - FeatureImportanceComponent (D3/Chart.js bar chart)
  - MonitoringComponent (alerts + KPI cards)
  - ModelConfigDialogComponent

**State Management:**
- AdminIAService.getAdminStats() → Observable<AdminIAStatsDTO>
- AdminIAService.trainModel(modelId) → Observable (long-running)
- AdminIAService.deployModel(modelId) → Observable
- AdminIAService.exportConfig(modelId) → blob (JSON)
- AdminIAService.updateAlertConfig(config) → Observable

**Charts:**
- Chart.js for ROC curves, confusion matrices
- D3.js or Chart.js for feature importance bar chart
- Responsive sizing (resize observer)

**Role-Based Access:**
- AuthGuard: roles must include ADMIN_ML or ADMIN
- If ANALYST: show READ-ONLY view (no action buttons)

**Change Detection:**
- OnPush (data loaded once)
- Polling for monitoring (opt-in, 30s interval)

## BINDING API

### GET Admin Stats
```
GET /api/v1/admin/ia/stats
→ AdminIAStatsDTO {
    active_model, all_models, pilot_mode, 7d metrics, alerts
  }
```

### GET Model Details
```
GET /api/v1/admin/ia/models/{modelId}
→ ModelInfo (full details + hyperparameters)
```

### POST Train Model
```
POST /api/v1/admin/ia/models/{modelId}/train
Request: {} or {train_config: {...}}
Response: {job_id, status: "QUEUED", estimated_duration_hours: 2}
  (Client polls GET /api/v1/admin/ia/jobs/{jobId} for progress)
```

### PATCH Deploy Model
```
PATCH /api/v1/admin/ia/models/{modelId}/deploy
Request: {action: "promote_to_active" | "promote_to_test" | "archive"}
Response: ModelInfo {status: ACTIF/TEST/ARCHIVÉ}
```

### POST Export Config
```
GET /api/v1/admin/ia/models/{modelId}/config/export
Response: JSON blob {hyperparameters, feature_names, etc.}
```

### PATCH Update Alert Config
```
PATCH /api/v1/admin/ia/alerts/config
Request: {
  data_drift_alert: boolean,
  fp_rate_threshold: number,
  ...
}
Response: {updated_config}
```

## CRITÈRES DE VALIDATION

### Validation Data
1. ✅ ROC-AUC values in [0, 1] for all models
2. ✅ F1-Score, Precision, Recall in [0, 1]
3. ✅ Feature importance sums (SHAP) meaningfully
4. ✅ Exactly 1 model with status = ACTIF
5. ✅ Pilot mode flag correctly propagates (all IA predictions show warning if true)
6. ✅ Confusion matrix TP+FP+TN+FN = total_test_samples

### Validation UI
1. ✅ All 3 KPI cards display (model, performance, volume)
2. ✅ Models table shows all models, status badges color-coded
3. ✅ Performance metrics tabs switch correctly (Train/Val/Test)
4. ✅ Feature importance chart displays top 20, colors by pillar
5. ✅ Monitoring alerts displayed (sorted by severity)
6. ✅ Action buttons disabled during API calls (spinner shown)
7. ✅ Alerts configuration checkboxes working (PATCH on change)

### Validation API
1. ✅ 401 Unauthorized (not ADMIN_ML) → redirect /auth/login
2. ✅ 403 Forbidden (ANALYST role) → finaces-alert-box warning + READ-ONLY
3. ✅ 404 Not Found (model inexistant) → alert + back
4. ✅ 500 Server Error (train fails) → toast error + retry button
5. ✅ Training job polling: show progress bar, ETA

### Validation Monitoring
1. ✅ 7-day stats accurate (calls backend stats endpoint)
2. ✅ Alerts list updates (no manual refresh needed if polling enabled)
3. ✅ Data drift detection: features listed if drift detected
4. ✅ Recommended actions displayed (from backend)

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

1. **src/app/features/admin/ia/admin-ia.component.ts**
   - Load stats, handle model selection
   - Trigger train/deploy actions
   - Polling for monitoring (optional)

2. **src/app/features/admin/ia/admin-ia.component.html**
   - KPI cards, models table, tabs (performance, feature importance, monitoring)
   - Action buttons

3. **src/app/features/admin/ia/admin-ia.component.scss**
   - KPI card grid, table styling
   - Alert colors (warn/error), badge colors (ACTIF/TEST/ARCHIVÉ)

4. **src/app/features/admin/ia/admin-ia.service.ts**
   - HttpClient wrappers for all API calls
   - getAdminStats(), trainModel(), deployModel(), exportConfig()
   - Error handling

5. **src/app/features/admin/ia/models-table/models-table.component.ts|html|scss**
   - mat-table displaying all models
   - Sortable columns (version, ROC-AUC, trained_at)
   - Expandable rows (show hyperparameters on expand)

6. **src/app/features/admin/ia/performance-metrics/performance-metrics.component.ts|html|scss**
   - Tab group (Train/Val/Test)
   - Metrics table + ROC curve chart + confusion matrix

7. **src/app/features/admin/ia/feature-importance/feature-importance.component.ts|html|scss**
   - D3/Chart.js horizontal bar chart
   - Colors by pillar (blue/purple/orange/green/teal)
   - Tooltips on hover

8. **src/app/features/admin/ia/monitoring/monitoring.component.ts|html|scss**
   - 7-day stats cards (trend arrows)
   - Alerts section (sortable by severity)
   - Alert configuration checkboxes

9. **src/app/features/admin/ia/model-config-dialog/model-config-dialog.component.ts|html|scss**
   - Dialog showing full model config (JSON-like display)
   - Download button (export-config.service)

10. **app.routes.ts update**
    - Route: `/admin/ia`
    - Component: AdminIaComponent
    - Guards: [AuthGuard] with roles check
    - Data: {roles: ['ADMIN_ML', 'ADMIN']}

---

## CHECKPOINT PHASE 4 ─────────────────────────────────────

À ce stade, l'application doit :

✅ Gérer les dossiers GROUPEMENT avec membres, scores pondérés, weak link detection
✅ Afficher l'admin IA avec tableau des modèles, performance metrics
✅ Montrer feature importance charts (SHAP, colors by pillar)
✅ Afficher le monitoring IA avec alertes de drift (7-day view)
✅ Permettre le pilote mode (banner, warning sur IA scores)
✅ Gérer le cycle de vie des modèles (ACTIF/TEST/ARCHIVÉ)
✅ Exporter config JSON et lancer réentraînement (async jobs)

─────────────────────────────────────────────────────────────

