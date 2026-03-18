import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule, DecimalPipe, SlicePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { TensionAlertOut } from '../../../../core/models/dashboard.model';
import { FinacesTensionBadgeComponent } from '../../../../shared/components/atoms/finaces-tension-badge/finaces-tension-badge.component';

@Component({
    selector: 'app-active-tensions-card',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        RouterLink,
        FinacesTensionBadgeComponent,
        DecimalPipe,
        SlicePipe
    ],
    templateUrl: './active-tensions-card.component.html',
    styleUrls: ['./active-tensions-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActiveTensionsCardComponent {
    // Input Signal strict (Angular 17.1+)
    readonly tensions = input.required<TensionAlertOut[]>();
}