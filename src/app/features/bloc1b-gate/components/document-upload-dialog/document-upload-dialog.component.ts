import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export interface UploadDialogData {
    file: File;
}

@Component({
    selector: 'app-document-upload-dialog',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, MatDialogModule,
        MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule
    ],
    templateUrl: './document-upload-dialog.component.html',
    styleUrl: './document-upload-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentUploadDialogComponent {
    uploadForm: FormGroup;
    fileName: string;
    currentYear = new Date().getFullYear();
    years = [this.currentYear, this.currentYear - 1, this.currentYear - 2, this.currentYear - 3];

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<DocumentUploadDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: UploadDialogData
    ) {
        this.fileName = data.file.name;

        this.uploadForm = this.fb.group({
            document_type: ['', Validators.required],
            fiscal_year: [this.currentYear - 1, Validators.required],
            reliability_level: ['', Validators.required],
            auditor_name: [''],
            notes: ['']
        });

        this.uploadForm.get('reliability_level')?.valueChanges.subscribe(level => {
            const auditorControl = this.uploadForm.get('auditor_name');
            if (level === 'AUDITED') {
                auditorControl?.setValidators([Validators.required]);
            } else {
                auditorControl?.clearValidators();
            }
            auditorControl?.updateValueAndValidity();
        });
    }

    onSubmit(): void {
        if (this.uploadForm.valid) {
            this.dialogRef.close({
                file: this.data.file,
                metadata: this.uploadForm.value
            });
        }
    }

    onCancel(): void {
        this.dialogRef.close(null);
    }
}