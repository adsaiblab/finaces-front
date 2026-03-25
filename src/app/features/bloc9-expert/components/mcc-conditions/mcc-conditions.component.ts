import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MccCondition } from '../../../../core/models/expert.model';
import { AddConditionDialogComponent } from '../add-condition-dialog/add-condition-dialog.component';

@Component({
    selector: 'app-mcc-conditions',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatDialogModule],
    templateUrl: './mcc-conditions.component.html',
    styleUrls: ['./mcc-conditions.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MccConditionsComponent {
    conditions = input<MccCondition[]>([]);
    conditionsChange = output<MccCondition[]>();

    private dialog = inject(MatDialog);

    openAddDialog(): void {
        const dialogRef = this.dialog.open(AddConditionDialogComponent, {
            width: '600px',
            disableClose: true
        });

        dialogRef.afterClosed().subscribe((newCondition: MccCondition | undefined) => {
            if (newCondition) {
                this.conditionsChange.emit([...this.conditions(), newCondition]);
            }
        });
    }

    removeCondition(index: number): void {
        const updated = [...this.conditions()];
        updated.splice(index, 1);
        this.conditionsChange.emit(updated);
    }
}