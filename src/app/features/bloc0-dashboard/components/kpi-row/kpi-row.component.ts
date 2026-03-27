import { NgClass } from '@angular/common';
import { Component, ChangeDetectionStrategy, input } from '@angular/core';


import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterLink } from '@angular/router';
import { DashboardStatsOut } from '../../../../core/models/dashboard.model';

@Component({
    selector: 'app-kpi-row',
    standalone: true,
    imports: [MatIconModule, MatBadgeModule, RouterLink, NgClass],
    templateUrl: './kpi-row.component.html',
    styleUrls: ['./kpi-row.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class KpiRowComponent {
    // Angular 17.1+ Signal Input obligatoire
    readonly stats = input<DashboardStatsOut | null>(null);
}