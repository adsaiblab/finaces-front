import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-risk-override',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatButtonModule],
    templateUrl: './risk-override.component.html',
    styleUrls: ['./risk-override.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RiskOverrideComponent {
    parentGroup = input.required<FormGroup>();
    controlName = input.required<string>();
    currentRiskClass = input.required<string>();

    overrideOptions = ['AUCUN', 'FAIBLE', 'MODÉRÉ', 'ÉLEVÉ', 'CRITIQUE'];

    get isOverridden(): boolean {
        const ctrl = this.parentGroup().get(this.controlName());
        return !!ctrl && ctrl.value !== 'AUCUN';
    }

    resetOverride(): void {
        this.parentGroup().get(this.controlName())?.setValue('AUCUN');
    }
}