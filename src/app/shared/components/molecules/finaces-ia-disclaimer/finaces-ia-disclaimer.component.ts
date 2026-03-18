import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export type DisclaimerVariant = 'banner' | 'inline' | 'chip';

@Component({
    selector: 'finaces-ia-disclaimer',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule],
    templateUrl: './finaces-ia-disclaimer.component.html',
    styleUrls: ['./finaces-ia-disclaimer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesIaDisclaimerComponent {
    @Input() variant: DisclaimerVariant = 'banner';
    @Input() dismissible: boolean = false;
    @Input() pilotMode: boolean = false;
    @Output() dismissed = new EventEmitter<void>();

    isDismissed: boolean = false;
    readonly disclaimerText = 'Ce scoring IA est un outil de challenge NON DÉCISIONNEL. Il ne remplace pas le score MCC.';
    readonly pilotModeText = 'Mode pilote IA : résultats expérimentaux, à titre informatif uniquement.';

    onDismiss(): void {
        this.isDismissed = true;
        this.dismissed.emit();
    }
}