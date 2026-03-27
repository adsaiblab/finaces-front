import { NgClass, DecimalPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

import { MatExpansionModule } from '@angular/material/expansion';
import { ConsortiumMember } from '../../../../core/models/consortium.model';
import { FinacesRiskBadgeComponent } from '../../../../shared/components/atoms/finaces-risk-badge/finaces-risk-badge.component';
import { FinacesScoreGaugeComponent } from '../../../../shared/components/atoms/finaces-score-gauge/finaces-score-gauge.component';
import { UiDetailedPillarScore, UiMemberDetailedScoring } from '../../consortium-ui.model';

@Component({
    selector: 'app-consortium-member-accordion',
    standalone: true,
    imports: [MatExpansionModule, FinacesRiskBadgeComponent, FinacesScoreGaugeComponent, NgClass, DecimalPipe],
    templateUrl: './consortium-member-accordion.component.html',
    styleUrls: ['./consortium-member-accordion.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsortiumMemberAccordionComponent {
    // Safe inputs (default values prevent test crashes, satisfy trinity)
    member = input<ConsortiumMember>({
        member_id: 'UNKNOWN', member_name: 'Member Name', role: 'MEMBER', participation_pct: 0
    } as ConsortiumMember);

    isBlocking = input<boolean>(false);
    isWeakLink = input<boolean>(false);

    // [UI SIMULATION] - Generate plausible mock data for the detailed view
    detailedScoring = computed<UiMemberDetailedScoring>(() => {
        const mem = this.member();
        const memScore = mem.score || 0;

        // Simple deterministic mocks based on member ID and global score
        const generatePillar = (name: string, weight: number): UiDetailedPillarScore => {
            // Mock score variance based on original score +/- some factor
            const score = Math.max(1, Math.min(5, memScore + (mem.member_id.charCodeAt(0) % 3) - 1));
            let label: any = 'MODERATE';
            if (score >= 4) label = 'STRONG';
            if (score < 2) label = 'WEAK';

            return {
                name,
                score,
                label,
                comment: `Automated assessment of ${name} pillar. Based on current available data and simulated targets. Risks are moderate.`
            };
        };

        return {
            member_id: mem.member_id,
            pillars: {
                liquidity: generatePillar('Liquidity', 0.25),
                solvency: generatePillar('Solvency', 0.25),
                profitability: generatePillar('Profitability', 0.20),
                capacity: generatePillar('Capacity', 0.15),
                quality: generatePillar('Quality', 0.15)
            }
        };
    });
}