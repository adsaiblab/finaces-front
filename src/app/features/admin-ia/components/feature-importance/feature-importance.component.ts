import { NgClass, DecimalPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, input, computed, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';

import { IaFeatureImportance } from '../../../../core/models/ia-admin.model';

type FilterMode = 'top10' | 'top20' | 'all';

const PILLAR_CONFIG: Record<string, { label: string; bar: string; badge: string; dot: string }> = {
  LIQUIDITY: { label: 'Liquidity', bar: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
  SOLVENCY: { label: 'Solvency', bar: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', dot: 'bg-purple-500' },
  PROFITABILITY: { label: 'Profitability', bar: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  CAPACITY: { label: 'Capacity', bar: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' },
  MACRO: { label: 'Macro', bar: 'bg-teal-500', badge: 'bg-teal-500/10 text-teal-600 dark:text-teal-400', dot: 'bg-teal-500' },
};

function formatFeatureName(raw: string): string {
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

@Component({
  selector: 'app-feature-importance',
  standalone: true,
  imports: [NgClass, DecimalPipe, MatButtonToggleModule, FormsModule],
  templateUrl: './feature-importance.component.html',
  styleUrls: ['./feature-importance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureImportanceComponent {
  features = input<IaFeatureImportance[]>([]);

  filterMode = signal<FilterMode>('top10');

  displayedFeatures = computed(() => {
    const all = [...this.features()].sort(
      (a, b) => b.importance_score - a.importance_score
    );
    const mode = this.filterMode();
    if (mode === 'top10') return all.slice(0, 10);
    if (mode === 'top20') return all.slice(0, 20);
    return all;
  });

  maxScore = computed(() =>
    Math.max(...this.displayedFeatures().map((f) => f.importance_score), 0.01)
  );

  formatName = formatFeatureName;

  getPillar(pillar: string) {
    return PILLAR_CONFIG[pillar] ?? {
      label: pillar,
      bar: 'bg-gray-400',
      badge: 'bg-gray-500/10 text-gray-500',
      dot: 'bg-gray-400',
    };
  }

  barWidthPct(score: number): number {
    return (score / this.maxScore()) * 100;
  }
}