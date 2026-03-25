import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AnalystDecisionPayload } from '../../../../core/models/tension.model';

@Component({
    selector: 'app-analyst-decision',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, MatCardModule, MatRadioModule,
        MatCheckboxModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule
    ],
    templateUrl: './analyst-decision.component.html',
    styleUrls: ['./analyst-decision.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalystDecisionComponent {
    private fb = inject(FormBuilder);

    public requiresJustification = input.required<boolean>();
    public decisionSubmitted = output<AnalystDecisionPayload>();

    public decisionForm: FormGroup = this.fb.group({
        decision: ['FOLLOW_MCC', Validators.required],
        escalate_to_senior: [false],
        justification: ['']
    });

    constructor() {
        // Règle MCC: si justification requise (tension Moderate/Severe), ou si on suit l'IA, on force la justification
        this.decisionForm.valueChanges.subscribe(val => {
            const justifControl = this.decisionForm.get('justification');
            if (!justifControl) return;

            const needsJustif = this.requiresJustification() || val.decision === 'FOLLOW_IA' || val.decision === 'INVESTIGATE';

            if (needsJustif && !justifControl.hasValidator(Validators.required)) {
                justifControl.setValidators([Validators.required, Validators.minLength(10)]);
                justifControl.updateValueAndValidity({ emitEvent: false });
            } else if (!needsJustif && justifControl.hasValidator(Validators.required)) {
                justifControl.clearValidators();
                justifControl.updateValueAndValidity({ emitEvent: false });
            }
        });
    }

    public submitDecision(): void {
        if (this.decisionForm.valid) {
            this.decisionSubmitted.emit(this.decisionForm.value as AnalystDecisionPayload);
        }
    }
}