import { NgClass, DatePipe } from '@angular/common';
import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GateDecisionSchema } from '../../../../core/models/gate.model';
import { GateVerdict } from '../../../../core/models/enums';

@Component({
  selector: 'app-decision-column',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, NgClass, DatePipe],
  templateUrl: './decision-column.component.html',
  styleUrl: './decision-column.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecisionColumnComponent {
  readonly decision = input<GateDecisionSchema | null>(null);
  readonly isEvaluating = input<boolean>(false);

  readonly evaluate = output<void>();
  readonly sealGate = output<void>();
  readonly goToFinancials = output<void>();
  readonly correctDocuments = output<void>();
  readonly goToDashboard = output<void>();

  readonly isPassed = computed(() => this.decision()?.verdict === GateVerdict.PASSED);
  readonly isBlocked = computed(() => this.decision()?.verdict === GateVerdict.BLOCKING);
}
