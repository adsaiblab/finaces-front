import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GateDecisionSchema } from '../../../../core/models/gate.model';

@Component({
    selector: 'app-decision-column',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './decision-column.component.html',
    styleUrl: './decision-column.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DecisionColumnComponent {
    @Input() decision: GateDecisionSchema | null = null;
    @Input() isEvaluating = false;

    @Output() evaluate = new EventEmitter<void>();
    @Output() sealGate = new EventEmitter<void>();
    @Output() goToFinancials = new EventEmitter<void>();
    @Output() correctDocuments = new EventEmitter<void>();
    @Output() goToDashboard = new EventEmitter<void>();

    get isPassed(): boolean {
        return this.decision?.verdict === 'PASSÉ';
    }

    get isBlocked(): boolean {
        return this.decision?.verdict === 'BLOQUÉ';
    }
}