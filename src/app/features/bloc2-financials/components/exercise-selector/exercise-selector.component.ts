import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-exercise-selector',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './exercise-selector.component.html',
    styleUrls: ['./exercise-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExerciseSelectorComponent {
    // Utilisation de la nouvelle API Angular Signals pour les Inputs/Outputs
    public years = input.required<number[]>();
    public selectedYear = input.required<number>();

    public yearChange = output<number>();

    public selectYear(year: number): void {
        if (year !== this.selectedYear()) {
            this.yearChange.emit(year);
        }
    }
}