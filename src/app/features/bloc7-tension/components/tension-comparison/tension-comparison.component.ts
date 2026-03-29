import { NgClass, DecimalPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  FinacesScoreGaugeComponent,
  FinacesRiskBadgeComponent,
} from '../../../../shared/components';

@Component({
  selector: 'app-tension-comparison',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    FinacesScoreGaugeComponent,
    FinacesRiskBadgeComponent,
    NgClass,
    DecimalPipe,
  ],
  templateUrl: './tension-comparison.component.html',
  styleUrls: ['./tension-comparison.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TensionComparisonComponent {
  public mccScore = input<number>(0);
  public mccClass = input<string>('');

  public iaScore = input<number>(0);
  public iaClass = input<string>('');

  public deltaScore = input<number>(0);
  public classDivergence = input<boolean>(false);

  public getDeltaColorClass(): string {
    const delta = Math.abs(this.deltaScore());
    if (delta >= 1.0) return 'text-[color:var(--color-error)]';
    if (delta >= 0.5) return 'text-[color:var(--color-warning)]';
    if (delta >= 0.2) return 'text-[color:var(--color-info)]';
    return 'text-[color:var(--color-success)]';
  }
}
