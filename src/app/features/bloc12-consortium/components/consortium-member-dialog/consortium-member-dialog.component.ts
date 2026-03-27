import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ConsortiumMemberCreate } from '../../../../core/models/consortium.model';

@Component({
  selector: 'app-consortium-member-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './consortium-member-dialog.component.html',
  styleUrls: ['./consortium-member-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsortiumMemberDialogComponent {
  private dialogRef = inject(MatDialogRef<ConsortiumMemberDialogComponent>);
  private data = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    member_id: ['', Validators.required],
    role: ['MEMBER', Validators.required],
    participation_pct: [0, [Validators.required, Validators.min(1), Validators.max(100)]],
  });

  isEditMode = false;

  ngOnInit(): void {
    if (this.data?.member) {
      this.isEditMode = true;
      this.form.patchValue(this.data.member);
      this.form.controls.member_id.disable(); // Prevent changing ID on edit
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue() as ConsortiumMemberCreate);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
