import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-groupement-members',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule
    ],
    templateUrl: './groupement-members.component.html',
    styleUrls: ['./groupement-members.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupementMembersComponent {
    readonly membersArray = input.required<FormArray>();
    private readonly fb = inject(FormBuilder);

    addMember(): void {
        const memberGroup = this.fb.group({
            name: ['', Validators.required],
            role: ['MEMBER', Validators.required],
            participation_percentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
        });
        this.membersArray().push(memberGroup);
    }

    removeMember(index: number): void {
        this.membersArray().removeAt(index);
    }
}