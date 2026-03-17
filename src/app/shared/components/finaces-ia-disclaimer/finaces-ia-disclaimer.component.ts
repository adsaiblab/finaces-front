import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type DisclaimerType = 'info' | 'warning';

@Component({
    selector: 'finaces-ia-disclaimer',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    templateUrl: './finaces-ia-disclaimer.component.html',
    styleUrls: ['./finaces-ia-disclaimer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesIaDisclaimerComponent {
    @Input() message: string = "Cette analyse a été générée par l'Assistant IA et nécessite une validation experte.";
    @Input() type: DisclaimerType = 'info';

    get disclaimerClass(): string {
        return `disclaimer-${this.type}`;
    }

    get iconName(): string {
        return this.type === 'warning' ? 'warning_amber' : 'auto_awesome';
    }
}