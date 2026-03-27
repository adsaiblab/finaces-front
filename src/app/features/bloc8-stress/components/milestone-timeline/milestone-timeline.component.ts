import { Component, ChangeDetectionStrategy, output, inject } from '@angular/core';

import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Milestone } from '../../../../core/models/stress.model';

@Component({
  selector: 'app-milestone-timeline',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './milestone-timeline.component.html',
  styleUrls: ['./milestone-timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MilestoneTimelineComponent {
  private fb = inject(FormBuilder);

  public milestonesChange = output<Milestone[]>();

  public timelineForm: FormGroup = this.fb.group({
    milestones: this.fb.array([]),
  });

  get milestonesArray(): FormArray {
    return this.timelineForm.get('milestones') as FormArray;
  }

  ngOnInit(): void {
    // Initialize with one default milestone
    this.addMilestone();

    this.timelineForm.valueChanges.subscribe((val) => {
      if (this.timelineForm.valid) {
        this.milestonesChange.emit(val.milestones);
      }
    });
  }

  public addMilestone(): void {
    const milestoneForm = this.fb.group({
      id: [crypto.randomUUID()],
      month: [1, [Validators.required, Validators.min(1), Validators.max(12)]],
      amount: [0, [Validators.required, Validators.min(1)]],
      description: ['', Validators.required],
    });
    this.milestonesArray.push(milestoneForm);
  }

  public removeMilestone(index: number): void {
    this.milestonesArray.removeAt(index);
  }
}
