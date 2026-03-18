import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-step4-confirmation',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule],
    templateUrl: './step4-confirmation.component.html',
    styleUrls: ['./step4-confirmation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Step4ConfirmationComponent {
    readonly submitCase = output<void>();
}