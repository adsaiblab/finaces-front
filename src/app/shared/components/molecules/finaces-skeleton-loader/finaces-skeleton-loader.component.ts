import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';

export type SkeletonVariant = 'card' | 'table' | 'chart' | 'gauge' | 'kpi' | 'form' | 'list' | 'double';

@Component({
  selector: 'finaces-skeleton-loader',
  standalone: true,
  imports: [],
  templateUrl: './finaces-skeleton-loader.component.html',
  styleUrls: ['./finaces-skeleton-loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinacesSkeletonLoaderComponent {
  readonly variant = input<SkeletonVariant>('card');
  readonly rows = input<number>(3);

  readonly iterableRows = computed<number[]>(() => Array(this.rows()).fill(0));
}
