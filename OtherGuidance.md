
# 📘 FinaCES — Front-end Architecture & UI/UX Guidelines

*Manifeste technique : Centralisation des leçons apprises, résolutions d'anti-patterns et standards SaaS "Enterprise-grade" pour le projet FinaCES.*

---

## 1. Routage Angular : Le piège de l'ID Parent (`ActivatedRoute`)

**Le Problème :**
Lors du chargement d'une route enfant (ex: `GateComponent` chargé via un `<router-outlet>` sous le parent `case-workspace` défini par l'URL `/cases/:id`), appeler `this.route.snapshot.paramMap.get('id')` dans le composant enfant renvoie systématiquement `null`. Cela engendre des crashs de requêtes ou des expulsions silencieuses vers le Dashboard.

**La Règle (Angular Router Trap) :**
Un composant enfant ne possède pas les paramètres de son parent dans son propre snapshot. Il est obligatoire de vérifier l'arbre des routes.

```typescript
// ❌ FAUX (Retourne null en route enfant) :
this.caseId = this.route.snapshot.paramMap.get('id') || '';

// ✅ CORRECT ("Enterprise-grade") :
// On cherche d'abord dans le parent, puis dans l'enfant en fallback
this.caseId = this.route.parent?.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('id') || '';
```

---

## 2. Le "Prototypage UI" : Mocks & Flux Asynchrones

**Le Problème (Anti-pattern "Control Flow via Exceptions") :**
Un développeur souhaitant tester le flux UI sans backend actif ne doit **absolument jamais** utiliser la clause `error` d'un appel HTTP pour déclencher une navigation de succès (ex: passer à l'étape suivante parce que l'API a retourné une 404). Cela masque les véritables erreurs (500, Timeout) le jour du câblage définitif.

**La Règle :**
Pour le prototypage, il faut bypasser **entièrement** l'appel réseau et mocker le comportement de succès directement dans le composant (ou le service), en simulant la latence via `setTimeout` ou `delay()` de RxJS.

```typescript
// ✅ CORRECT (Le Mock "Enterprise-grade" propre) :
const payload = this.buildPayload();
console.log('✅ [MOCK] Payload formaté prêt pour le backend :', payload);

this.isSubmitting.set(true);
this.snackBar.open('Mode Prototype : Simulation...', 'Fermer', { duration: 2000 });

// Simulation de la latence réseau (ex: 800ms)
setTimeout(() => {
    this.isSubmitting.set(false);
    this.router.navigate(['/cases', 'mock-id', 'gate']);
}, 800);

/* == Futur câblage Backend ==
this.caseService.createCase(payload).subscribe({
   next: () => this.router.navigate([...]),
   error: (err) => this.handleError(err) // La vraie erreur sera gérée ici !
});
*/
```

---

## 3. Formulaires "Enterprise-grade" : Material MDC Outline & Typographie

**Le Problème :**
Angular Material propose l'apparence `fill` par défaut (un fond gris plein). Dans un SaaS financier haut de gamme (façon Stripe/Bloomberg), l'apparence `fill` donne un rendu "boueux", lourd et jure avec le Dark Mode. De plus, Material a tendance à écraser les polices Tailwind.

**La Règle (SaaS Moderne) :**

1. L'apparence de tous les `mat-form-field` doit être réglée globalement sur `outline`.
2. La typographie globale de Material ne doit **pas** être activée pour laisser Tailwind gérer le texte.
Dans `src/app/app.config.ts`, injecter le Provider suivant :

```typescript
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } }
  ]
};
```

---

## 4. Angular CDK Overlays & Le Dark Mode Fatal

**Le Problème :**
Dans une architecture où le thème sombre est piloté par la racine HTML (`html[data-theme="dark"]`), les composants flottants (`mat-dialog`, `mat-select`, `mat-menu`) sont injectés par le CDK *en dehors* de `<app-root>`, directement à la fin du `<body>`. Ils apparaissent alors en Light Mode (fond blanc) sur une interface sombre, rendant les textes clairs illisibles.

**La Règle Tiers 1 (Le Blindage du Service Theme) :**
Le `ThemeService` doit forcer l'injection de la classe `.dark` directement dans le conteneur du CDK Overlay natif :

```typescript
import { OverlayContainer } from '@angular/cdk/overlay';

export class ThemeService {
  private overlayContainer = inject(OverlayContainer);
  
  effect(() => {
      const isDark = this.isDarkMode();
      const overlayEl = this.overlayContainer.getContainerElement();
      
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
        overlayEl.classList.add('dark'); // VITAL : CDK INJECTION
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.remove('dark');
        overlayEl.classList.remove('dark');
      }
  })
}
```

**La Règle Tiers 2 (Surcharge Absolue SCSS) :**
Pour contourner la résistance du framework MDC 17/18, il faut forcer les tokens dans le bloc global `styles.scss` :

```scss
html[data-theme="dark"] body, .dark body {
    // Mapping des modales sur les tokens FinaCES
    --mdc-dialog-container-color: var(--color-surface-card);
    --mdc-dialog-subhead-color: var(--color-content-primary);
    --mdc-dialog-supporting-text-color: var(--color-content-secondary);
    
    // Fallback de sécurité (outrepasser le blindage natif si nécessaire)
    .mdc-dialog__surface {
        background-color: var(--color-surface-card) !important;
    }
}
```

---

## 5. CSS SCSS Mappings : La philosophie du "Fail-Fast"

**Le Problème :**
Déclarer une couleur statique en backup (ex: `background-color: var(--color-background-default, #f8fafc);`).
Si la variable `--color-background-default` n'existe pas ou est mal typographiée, le CSS se rabat silencieusement sur `#f8fafc`. En Dark Mode, le composant affichera une énorme tâche gris clair sans déclencher la moindre erreur console. On appelle cela du "Silent Hardcoding".

**La Règle :**
**Interdiction absolue d'utiliser des couleurs Hexa/RGB en dur ou en fallback dans le dossier `features/`.** Chaque style doit pointer exclusivement vers les variables du Manifeste (ex: `var(--color-surface-default)`).
*Pourquoi ?* Si le token est manquant, l'élément n'aura pas de fond (transparent). C'est le principe du **"Fail-Fast"** : une erreur d'UI doit être visible immédiatement pour être corrigée, et non masquée par un fallback statique qui cassera le thème dynamique.

---

## 6. Élévation & Layouts Structuraux : Les standards UX SaaS

**Vider l'Espace Mort (Router Outlet) :**
Enfermer un `<router-outlet>` dans des classes restrictives comme `max-w-7xl mx-auto` engendre d'immenses espaces vides latéraux, inadaptés pour un outil financier nécessitant de la largeur (tableaux, graphiques).
*Solution :* Dans l'ossature globale (`app-layout.component.html`), utiliser `w-full h-full`. Ce sont les vues enfants qui dicteront leur propre structure (grid/flex).

**Détachement des Cartes (L'Élévation en Dark Mode) :**
Dans un vrai SaaS en mode Nuit, les ombres portées (`box-shadow`) sont quasiment invisibles sur des fonds très sombres. La couleur de la page (`--color-surface-default`) et la couleur des cartes (`--color-surface-card`) manquent souvent de contraste.
*Solution :* Pour redonner de la profondeur (Z-Index) en mode sombre, **il faut sculpter la carte formellement avec une bordure rigide**.

```html
<div class="bg-surface-card rounded-xl shadow-md border border-border-strong p-8 mt-6">
  </div>
```

---

## 7. Performance & Stratégie de Détection (Règle d'or absolue)

**Le Problème :**
La détection de changement par défaut d'Angular (`Default`) scanne l'intégralité de l'arbre des composants à chaque événement (clic, timer, XHR), ruinant les performances sur un Dashboard lourd (D3.js, Chart.js, Tableaux massifs).

**La Règle :**
**100% des composants de FinaCES doivent être configurés en `ChangeDetectionStrategy.OnPush`.**
*Conséquence directe :* Les composants enfants ne doivent jamais muter directement leurs `@Input()`. Ils doivent émettre un `@Output()` vers le parent, ou utiliser la nouvelle API des `Signals` (`WritableSignal`, `computed`) pour déclencher une mise à jour ciblée de la vue.

---

## 8. Écosystème de Test (Vitest / JSDOM)

**Le Problème :**
L'utilisation des anciennes méthodes Karma/Jasmine ou l'affectation directe de variables dans les tests de composants `OnPush` faussent les résultats (faux positifs) ou font crasher Vitest.

**La Règle :**

* Ne **jamais** assigner une valeur via `component.monInput = 'valeur'`. Utiliser systématiquement la nouvelle API : `fixture.componentRef.setInput('monInput', 'valeur')`.
* Pour les librairies externes qui utilisent le Canvas (Chart.js), Vitest/JSDOM va générer des warnings. Il faut mocker l'API Canvas dans le `beforeAll()` :

```typescript
beforeAll(() => {
    HTMLCanvasElement.prototype.getContext = () => null as any;
    vi.stubGlobal('ResizeObserver', class ResizeObserver { observe() {} unobserve() {} disconnect() {} });
});
```
