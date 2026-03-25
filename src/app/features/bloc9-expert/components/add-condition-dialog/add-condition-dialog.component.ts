import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MccCondition } from '../../../../core/models/expert.model';

@Component({
    selector: 'app-add-condition-dialog',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, MatDialogModule,
        MatFormFieldModule, MatInputModule, MatSelectModule,
        MatRadioModule, MatButtonModule
    ],
    templateUrl: './add-condition-dialog.component.html',
    styleUrls: ['./add-condition-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddConditionDialogComponent {
    private dialogRef = inject(MatDialogRef<AddConditionDialogComponent>);
    private fb = inject(FormBuilder);

    types = ['CAUTION', 'REPORTING', 'PLAFOND', 'CLAUSE_REVISION', 'AUDIT', 'AUTRE'];

    form = this.fb.group({
        type: ['', Validators.required],
        description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
        importance: ['OBLIGATOIRE', Validators.required],
        dueDate: ['']
    });

    onSubmit(): void {
        if (this.form.valid) {
            this.dialogRef.close(this.form.value as MccCondition);
        } else {
            this.form.markAllAsTouched();
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}