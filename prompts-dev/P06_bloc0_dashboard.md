═══════════════════════════════════════════════════════════
PROMPT 6 — BLOC 0 — Dashboard Unifié (Liste Dossiers + KPIs + Graphique)
Dépend de : PROMPT 5 (Custom Components)
Peut être parallélisé avec : Aucun
═══════════════════════════════════════════════════════════

## CONTEXTE

Le tableau de bord unifié est le point d'entrée principal de l'application FinaCES. Il agrège:
- **KPI agrégés** : nombre de dossiers en cours, validations en attente, alertes de tension
- **Liste compacte des dossiers récents** : aperçu rapide avec statut, montant, classe MCC
- **Graphique de convergence MCC/IA** : tendance des scores sur 30 jours derniers
- **Tensions actives** : affichage des cas avec divergences MCC/IA

Cette page respecte le "double rail" :
- **Rail MCC (vert→rouge)** : décision officielle, source unique d'autorité (MCC-R1)
- **Rail IA (bleu→violet)** : challenge, toujours accompagné de disclaimer (MCC-R3)

Le dashboard doit être **responsive** et offrir une navigation fluide vers les trois workflows principaux:
1. Création de nouveau dossier
2. Révision en attente
3. Entrée de données financières

---

## RÈGLES MÉTIER APPLICABLES

**MCC-R1** : MCC est la source unique de décision. Le dashboard affiche les scores MCC en priorité.

**MCC-R2** : IA n'est jamais une décision. Le graphique affiche IA en tirets pour indiquer son statut non-décisionnel.

**MCC-R3** : Tout affichage IA doit être accompagné d'une disclaimer (visible ou accessible).

**MCC-R4** : MCC > IA en hiérarchie visuelle. Sur le graphique, la ligne MCC est plus épaisse et en premier plan.

**MCC-R5** : Si tension MODERATE ou SEVERE entre MCC et IA, affichage obligatoire avec badge rouge.

**Statut Workflow** :
- DRAFT : sauvegarde locale, visible uniquement dans le contexte du dossier
- PENDING_GATE : en attente de validation documentaire
- FINANCIAL_INPUT : entrée de données financières en cours
- NORMALIZATION_DONE : données normalisées, prêtes pour ratios
- RATIOS_COMPUTED : ratios calculés, prêts pour scoring
- SCORING_DONE : scoring MCC complété
- STRESS_DONE : stress tests complétés
- EXPERT_REVIEWED : avis d'expert capturés
- CLOSED : archivé ou finalisé
- CANCELLED : rejeté à une étape quelconque

---

## FICHIERS À CRÉER / MODIFIER

### Création :
1. `src/app/pages/dashboard/dashboard.component.ts`
2. `src/app/pages/dashboard/dashboard.component.html`
3. `src/app/pages/dashboard/dashboard.component.scss`
4. `src/app/pages/dashboard/components/kpi-row.component.ts`
5. `src/app/pages/dashboard/components/kpi-row.component.html`
6. `src/app/pages/dashboard/components/recent-cases-table.component.ts`
7. `src/app/pages/dashboard/components/recent-cases-table.component.html`
8. `src/app/pages/dashboard/components/active-tensions-card.component.ts`
9. `src/app/pages/dashboard/components/active-tensions-card.component.html`
10. `src/app/pages/dashboard/components/convergence-chart.component.ts`
11. `src/app/pages/dashboard/components/convergence-chart.component.html`

### Modification :
1. `src/app/app.routes.ts` : ajouter route `/dashboard` (par défaut)
2. `src/app/app.component.ts` : définir `/dashboard` comme route par défaut
3. `src/app/services/case.service.ts` : ajouter méthode `getDashboardStats()`

---

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### Route et Navigation
- **Route** : `/dashboard` (défaut, sans authentification pour MVP)
- **Breadcrumb** : "FinaCES / Dashboard"
- **Page Title** : "FinaCES — Tableau de Bord"

### Layout Principal

```
┌─────────────────────────────────────────────────────────┐
│ FinaCES — Tableau de Bord                   [+ Nouveau] │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────┬──────────┬─────────┬──────────────────┐   │
│  │ Dossiers│ En att.  │ Alertes │ Convergence IA   │   │
│  │ en cours│validation│Tensions │ (%)              │   │
│  │  [12]   │   [3]    │   [1]   │    [85]          │   │
│  └─────────┴──────────┴─────────┴──────────────────┘   │
│                                                           │
│  ┌─────────────────────────┬───────────────────────┐   │
│  │  Dossiers Récents       │  Tensions Actives     │   │
│  │  (5 derniers)           │                       │   │
│  │                         │                       │   │
│  │ Ref │ Soumiss. │ €uro  │ Status │ Classe │ Act.│   │
│  │     │ + Avatar │       │        │        │     │   │
│  │ ... │ ...      │ ...   │ ...    │ ...    │ ... │   │
│  │                         │ Tension card         │   │
│  │                         │ Tension card         │   │
│  └─────────────────────────┴───────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Convergence MCC/IA (30 derniers jours)          │   │
│  │                                                  │   │
│  │ [Graphique : lignes MCC/IA, points rouges      │   │
│  │  sur divergences, légende stats]                │   │
│  │                                                  │   │
│  │ Corrélation: 0.92  |  Divergences: 2 jours    │   │
│  │ Convergence: 96%                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### KPI Row (4 Cards)

Composant réutilisable `kpi-row.component`:

**Card 1 - Dossiers en cours**
- Icône: `folder_open` (Material Icons)
- Titre: "Dossiers en cours"
- Nombre: total des cas avec statut ∈ {PENDING_GATE, FINANCIAL_INPUT, NORMALIZATION_DONE, RATIOS_COMPUTED, SCORING_DONE, STRESS_DONE, EXPERT_REVIEWED}
- Sous-titre: "Actifs cette semaine: X"
- Click → `/cases?status=active`

**Card 2 - En attente validation**
- Icône: `pending_actions`
- Titre: "En attente validation"
- Nombre: cas avec statut = PENDING_GATE
- Sous-titre: "Gate documentaire"
- Click → `/cases?status=PENDING_GATE`

**Card 3 - Alertes Tensions**
- Icône: `warning`
- Titre: "Alertes Tensions"
- Nombre: count(cas avec divergence_level ∈ {MODERATE, SEVERE})
- Badge rouge if > 0
- Click → `/cases?filter=tension_alert`

**Card 4 - Convergence IA**
- Icône: `smart_toy`
- Titre: "Convergence IA"
- Nombre: pourcentage de convergence (formule: cas_convergents / total_cas * 100)
- Sous-titre: "Accord MCC/IA"
- Couleur: vert si >90%, orange si 70-90%, rouge si <70%

**Style Matériel** : `mat-card` avec bordure gauche colorée (vert MCC pour cards 1-3, bleu IA pour card 4). Contenu centré, icône grande (48px).

### Recent Cases Table

Composant réutilisable `recent-cases-table.component`:

**Données affichées** (5 derniers dossiers triés par date de modification décroissante):

| Colonne | Contenu | Type | Notes |
|---------|---------|------|-------|
| Ref | ex: MCC-2024-001 | text | lien → /cases/{id} |
| Soumissionnaire | Avatar (2 lettres) + nom (max 20 chars) + flag pays | avatar + text | avatar coloré aléatoire basé hash du nom |
| Montant | ex: 2.5M USD | currency | formatage locale |
| Statut | PENDING_GATE, FINANCIAL_INPUT, RATIOS_COMPUTED, etc. | badge | couleur selon statut |
| Classe MCC | FAIBLE, MODERE, ELEVE, CRITIQUE | badge risk | utilise finaces-risk-badge (P4) |
| Actions | [Voir] [Éditer] | buttons | liens /cases/{id} et /cases/{id}/edit |

**Table Material**:
- Striped alternée (rgba(0,0,0,0.02) sur row pair)
- Hover effect (0.05 opacity)
- Sortable by: Ref, Date modification, Montant, Statut
- Pagination: 5 rows, paginator below
- Empty state: "Aucun dossier. Créer un nouveau dossier?"

### Active Tensions Card

Composant `active-tensions-card.component`:

Affiche une liste scrollable (max 3 visible, overflow scroll) de "tension cards" pour chaque cas avec divergence MCC/IA >= MODERATE:

**Par cas**:
- `finaces-tension-badge` de P4 (composant custom pour MODERATE/SEVERE)
- Titre: "{bidder_name} — {ref}"
- Détail: "MCC: {mcc_level} → IA: {ia_level} | Δ={delta_score}/5"
- Lien: click → `/cases/{id}/tension` (future page comparaison MCC/IA)

**Style** : cards empilées, borderRadius=8px, ombrage léger, padding=16px.

### Convergence Chart (30 derniers jours)

Composant `convergence-chart.component`:

**Technologie** : Chart.js (ngx-charts) ou D3.js selon préférence. Chart.js recommandé pour MVP.

**Données**:
- X-axis: 30 derniers jours (format: "Mar 16", "Mar 15", ...)
- Y-axis: Scores MCC/IA (0 à 5, labels FAIBLE=1, MODERE=2.5, ELEVE=4, CRITIQUE=5)
- Série MCC: ligne solide, couleur --mcc-moderate (#4CAF50 vert), épaisseur 3px
- Série IA: ligne tirets, couleur --ia-moderate (#2196F3 bleu), épaisseur 2px
- Points d'alertes: points rouges sur jours où |mcc_score - ia_score| > 1 niveau

**Tooltip au survol**:
```
[16 Mar 2026]
MCC: 2.5 (MODERE)
IA: 3.0 (ELEVE)
Divergence: OUI (Δ=0.5)
```

**Légende** (en bas):
```
— MCC Score (Décision)    - - - IA Challenge    🔴 Divergence Alert
```

**Stats affichées sous graphique**:
```
Corrélation: 0.92  |  Divergences détectées: 2 jours  |  Convergence globale: 96%
```

**Empty State** : "Pas de données. Commencer les évaluations pour voir la convergence."

### Button "+ Nouveau Dossier"

Bouton `mat-raised-button` color="primary" avec icône `add`:
- Position: top-right du dashboard
- Lien: `/cases/new`
- Texte: "+ Nouveau dossier"

---

## CONTRAINTES ANGULAR

### Standalone Components
Tous les composants dashboard doivent être `standalone: true`:

```typescript
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MaterialModule, /* ... */],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  // ...
}
```

### Material Modules à importer

```typescript
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
```

### Services à injecter

```typescript
constructor(
  private caseService: CaseService,
  private router: Router
) {}
```

### Change Detection
Utiliser `OnPush` strategy pour performance:

```typescript
changeDetection: ChangeDetectionStrategy.OnPush
```

---

## BINDING API

### 1. DashboardComponent

**GET /api/v1/cases** (tous les cas, pour KPI)
```json
Response:
{
  "cases": [
    {
      "id": "uuid",
      "reference": "MCC-2024-001",
      "bidder_name": "Société XYZ",
      "bidder_country": "MA",
      "contract_value": 2500000,
      "contract_currency": "USD",
      "status": "RATIOS_COMPUTED",
      "mcc_score": 2.5,
      "mcc_level": "MODERE",
      "ia_score": 3.2,
      "ia_level": "ELEVE",
      "divergence_level": "MODERATE",
      "divergence_score": 0.7,
      "updated_at": "2026-03-16T10:30:00Z",
      "created_at": "2026-03-01T08:00:00Z"
    },
    // ...
  ],
  "total": 47,
  "page": 1,
  "page_size": 100
}
```

**GET /api/v1/dashboard** (stats agrégées)
```json
Response:
{
  "total_active_cases": 12,
  "cases_pending_gate": 3,
  "cases_with_tension_alert": 1,
  "convergence_percentage": 85,
  "avg_mcc_score_7days": 2.4,
  "avg_ia_score_7days": 2.7,
  "divergences_count_7days": 2,
  "last_updated": "2026-03-16T16:00:00Z"
}
```

### 2. Convergence Chart Component

**GET /api/v1/analytics/convergence?days=30**
```json
Response:
{
  "dates": ["2026-02-15", "2026-02-16", ..., "2026-03-16"],
  "mcc_scores": [2.1, 2.3, ..., 2.5],
  "ia_scores": [2.0, 2.5, ..., 3.2],
  "divergence_flags": [false, true, false, ...],
  "correlation": 0.92,
  "convergence_percentage": 96
}
```

### 3. Service Methods to Add/Extend

```typescript
// case.service.ts

getDashboardStats(): Observable<DashboardStatsOut> {
  return this.http.get<DashboardStatsOut>(
    `${this.apiUrl}/dashboard`
  );
}

getRecentCases(limit: number = 5): Observable<EvaluationCaseDetailOut[]> {
  return this.http.get<EvaluationCaseDetailOut[]>(
    `${this.apiUrl}/cases?limit=${limit}&sort=-updated_at`
  );
}

getConvergenceChart(days: number = 30): Observable<ConvergenceChartOut> {
  return this.http.get<ConvergenceChartOut>(
    `${this.apiUrl}/analytics/convergence?days=${days}`
  );
}

getActiveTensionCases(): Observable<TensionAlertOut[]> {
  return this.http.get<TensionAlertOut[]>(
    `${this.apiUrl}/cases?filter=divergence_level:MODERATE,SEVERE`
  );
}
```

---

## CRITÈRES DE VALIDATION

### Fonctionnel

- [ ] Route `/dashboard` affiche le layout complet
- [ ] KPI row affiche les 4 cards avec nombres corrects
- [ ] Click sur card KPI navigue vers la bonne liste filtrée
- [ ] Table affiche les 5 derniers dossiers triés par date
- [ ] Click [Voir] sur une row navigue vers `/cases/{id}`
- [ ] Tensions actives affichées si divergence >= MODERATE
- [ ] Graphique affiche lignes MCC/IA correctement (solide vs tirets)
- [ ] Points rouges sur divergences > 1 niveau
- [ ] Tooltip graphique affiche date + scores + statut divergence
- [ ] Stats (Corrélation, Divergences, Convergence) calcul corrects
- [ ] Button "+ Nouveau" navigue vers `/cases/new`
- [ ] Pagination table: 5 rows, paginator fonctionne

### Visuel & UX

- [ ] Layout responsive (mobile: empiler KPI, table 100%, graphique 100%)
- [ ] Hiérarchie visuelle: MCC > IA (ligne MCC plus épaisse, couleurs MCC en premier)
- [ ] Icônes Material correctes et alignées
- [ ] Spacing/padding cohérent (Tailwind utilities ou SCSS)
- [ ] Risk badge de P4 integré et coloré correctement
- [ ] Tension badge de P4 integré
- [ ] Empty states clairs et informatifs

### Performance

- [ ] Dashboard charge en < 1s (API rapide)
- [ ] Table virtualisée si > 100 rows (cdkVirtualScrollViewport)
- [ ] Graphique Chart.js rendu smooth (FPS > 30)
- [ ] OnPush change detection activée partout

### Accessibilité

- [ ] ARIA labels sur icônes
- [ ] Contraste couleurs >= 4.5:1
- [ ] Boutons au moins 44x44px
- [ ] Navigable au clavier (Tab, Enter)

---

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

1. `src/app/pages/dashboard/dashboard.component.ts` — composant principal
2. `src/app/pages/dashboard/dashboard.component.html` — template
3. `src/app/pages/dashboard/dashboard.component.scss` — styles
4. `src/app/pages/dashboard/components/kpi-row.component.ts` — KPI cards
5. `src/app/pages/dashboard/components/kpi-row.component.html`
6. `src/app/pages/dashboard/components/recent-cases-table.component.ts` — table
7. `src/app/pages/dashboard/components/recent-cases-table.component.html`
8. `src/app/pages/dashboard/components/active-tensions-card.component.ts` — tensions
9. `src/app/pages/dashboard/components/active-tensions-card.component.html`
10. `src/app/pages/dashboard/components/convergence-chart.component.ts` — graphique
11. `src/app/pages/dashboard/components/convergence-chart.component.html`
12. `src/app/app.routes.ts` — modifié (route /dashboard)
13. `src/app/app.component.ts` — modifié (default route)
14. `src/app/services/case.service.ts` — modifié (3 nouvelles méthodes + getDashboardStats)
15. `src/models/dashboard.model.ts` — nouvelles interfaces (DashboardStatsOut, ConvergenceChartOut, TensionAlertOut)

---

## NOTES TECHNIQUES

- Couleurs: utiliser variables Tailwind (--mcc-* et --ia-* définis en P1)
- Chart.js: `npm install chart.js ngx-charts` (déjà inclus en P1)
- Avatar: initiales 2 lettres du nom + couleur basée `Math.abs(hashCode(name) % colors.length)`
- Currency: `DecimalPipe` Angular avec locale appropriée (ex: `en-US` ou `fr-FR` selon navigateur)
- Timezone: tous les timestamps en UTC, afficher en local utilisateur via pipe custom
- Date formatting: "Mar 16" pour le graphique (short format)

---

**FIN P6 — BLOC 0 — Dashboard Unifié**
