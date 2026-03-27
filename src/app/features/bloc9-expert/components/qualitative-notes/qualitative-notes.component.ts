import { Component, ChangeDetectionStrategy, input } from '@angular/core';

import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-qualitative-notes',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './qualitative-notes.component.html',
  styleUrls: ['./qualitative-notes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QualitativeNotesComponent {
  parentGroup = input<FormGroup>(new FormGroup({}));
  controlName = input<string>('');
  tensionLabel = input<string | undefined>(undefined);

  get isTensionHigh(): boolean {
    const label = this.tensionLabel();
    return label === 'MODERATE' || label === 'SEVERE';
  }
}
