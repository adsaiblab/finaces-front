import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
    selector: 'app-validation-decision',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatRadioModule, MatFormFieldModule, MatInputModule],
    templateUrl: './validation-decision.component.html',
    styleUrls: ['./validation-decision.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidationDecisionComponent {
    parentGroup = input<FormGroup>(new FormGroup({}));
    decisionControlName = input<string>('');
    reasonControlName = input<string>('');

    get requiresReason(): boolean {
        const val = this.parentGroup().get(this.decisionControlName())?.value;
        return val === 'REJECTED' || val === 'PENDING_INVESTIGATION';
    }
}