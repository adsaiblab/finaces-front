import { NgClass, DecimalPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

import { EvaluationCaseDetailOut } from '../../../../core/models/case.model';
import { FinacesScoreGaugeComponent } from '../../../../shared/components/atoms/finaces-score-gauge/finaces-score-gauge.component';
import { FinacesTensionBadgeComponent } from '../../../../shared/components/atoms/finaces-tension-badge/finaces-tension-badge.component';
import { FinacesRiskBadgeComponent } from '../../../../shared/components/atoms/finaces-risk-badge/finaces-risk-badge.component';

@Component({
  selector: 'app-decision-recap',
  standalone: true,
  imports: [
    FinacesScoreGaugeComponent,
    FinacesTensionBadgeComponent,
    FinacesRiskBadgeComponent,
    NgClass,
    DecimalPipe,
  ],
  templateUrl: './decision-recap.component.html',
  styleUrls: ['./decision-recap.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecisionRecapComponent {
  caseData = input<EvaluationCaseDetailOut>(null as unknown as EvaluationCaseDetailOut);
}
