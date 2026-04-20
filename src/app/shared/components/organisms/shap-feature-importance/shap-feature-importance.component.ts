import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, animate, style, transition } from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ShapLabelPipe } from '../../../pipes/shap-label.pipe';

interface ShapFeature {
  feature: string;
  value: number;
  widthPct: number;
  isRisk: boolean;
}

// Mots-clés indiquant un facteur de risque (barres oranges)
const RISK_KEYWORDS = ['debt', 'gearing', 'interest', 'payable', 'liability', 'days'];

@Component({
  selector: 'app-shap-feature-importance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonToggleModule,
    ShapLabelPipe
  ],
  templateUrl: './shap-feature-importance.component.html',
  styleUrls: ['./shap-feature-importance.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-8px)' }),
        animate('220ms {{delay}}ms ease-out', style({ opacity: 1, transform: 'none' }))
      ], { params: { delay: 0 } })
    ])
  ]
})
export class ShapFeatureImportanceComponent implements OnChanges {
  @Input() rawFeatures: Array<{ feature: string; importance: number }> = [];

  displayMode: 'top10' | 'top20' | 'all' = 'top10';
  features: ShapFeature[] = [];
  visibleFeatures: ShapFeature[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rawFeatures']) {
      this.buildFeatures();
    }
  }

  buildFeatures(): void {
    const sorted = [...this.rawFeatures].sort((a, b) => b.importance - a.importance);
    const maxVal = sorted[0]?.importance ?? 1;

    this.features = sorted.map(f => ({
      feature: f.feature,
      value: f.importance,
      widthPct: Math.round((f.importance / maxVal) * 100),
      isRisk: RISK_KEYWORDS.some(k => f.feature.toLowerCase().includes(k))
    }));

    this.applyDisplayMode();
  }

  onModeChange(): void {
    this.applyDisplayMode();
  }

  private applyDisplayMode(): void {
    const limit = this.displayMode === 'top10' ? 10
                : this.displayMode === 'top20' ? 20
                : this.features.length;
    this.visibleFeatures = this.features.slice(0, limit);
  }
}
