import { NgClass, DecimalPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, input, computed, signal } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { StressScenarioResult } from '../../../../core/models/stress.model';
import { FinacesStressChartComponent, ScenarioFlowSchema } from '../../../../shared/components/organisms/finaces-stress-chart/finaces-stress-chart.component';

@Component({
    selector: 'app-scenario-results',
    standalone: true,
    imports: [MatCardModule, MatIconModule, MatTabsModule, FinacesStressChartComponent, NgClass, DecimalPipe],
    templateUrl: './scenario-results.component.html',
    styleUrls: ['./scenario-results.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScenarioResultsComponent {
    public scenarios = input<StressScenarioResult[]>([]);

    public selectedIndex = signal<number>(0);

    public selectedScenario = computed(() => {
        const sc = this.scenarios();
        return sc && sc.length > 0 ? sc[this.selectedIndex()] : null;
    });

    // Transform the raw cash curve into the schema expected by the D3 Chart
    public chartFlows = computed<ScenarioFlowSchema[]>(() => {
        const scenario = this.selectedScenario();
        if (!scenario || !scenario.cash_curve) return [];

        return scenario.cash_curve.map((cash: number, index: number) => ({
            month: index + 1,
            openingCash: index === 0 ? 0 : scenario.cash_curve[index - 1], // Simplified derived opening
            inflows: 0,
            outflows: 0,
            closingCash: cash
        }));
    });

    public getStatusIcon(status: string): string {
        if (status === 'RESILIENT') return 'check_circle';
        if (status === 'MARGINAL') return 'warning';
        return 'cancel'; // BREACH
    }

    public getStatusClass(status: string): string {
        if (status === 'RESILIENT') return 'text-[color:var(--color-success)] bg-[color:var(--color-success)] bg-opacity-10';
        if (status === 'MARGINAL') return 'text-[color:var(--color-warning)] bg-[color:var(--color-warning)] bg-opacity-10';
        return 'text-[color:var(--color-error)] bg-[color:var(--color-error)] bg-opacity-10'; // BREACH
    }
}