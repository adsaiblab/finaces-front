import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ScoreOverridePayload, ScoreOverride } from '../../../../core/models/scoring.model';

@Component({
    selector: 'app-override-zone',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        DatePipe
    ],
    templateUrl: './override-zone.component.html',
    styleUrls: ['./override-zone.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverrideZoneComponent {
    private fb = inject(FormBuilder);

    public isOverridden = input.required<boolean>();
    public overrideDetails = input<ScoreOverride | undefined>();
    public originalScore = input.required<number>();
    public isSubmitting = input<boolean>(false);

    public overrideSubmit = output<ScoreOverridePayload>();

    public overrideForm: FormGroup = this.fb.group({
        newScore: [null, [Validators.required, Validators.min(0), Validators.max(5)]],
        reason: ['', [Validators.required, Validators.minLength(10)]]
    });

    public submitOverride(): void {
        if (this.overrideForm.valid) {
            this.overrideSubmit.emit({
                new_score: this.overrideForm.value.newScore,
                reason: this.overrideForm.value.reason
            });
        }
    }
}