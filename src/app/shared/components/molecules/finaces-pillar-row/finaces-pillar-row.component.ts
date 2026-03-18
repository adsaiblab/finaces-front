import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
    OnInit,
    OnChanges,
    SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// CORRECTION DES CHEMINS RELATIFS : On pointe vers le dossier "atoms"
import { FinacesRiskBadgeComponent } from '../../atoms/finaces-risk-badge/finaces-risk-badge.component';
import { RiskClass, Rail } from '../../atoms/finaces-risk-badge/finaces-risk-badge.component';

export interface PillarIndicator {
    name: string;
    value: string | number;
    score: number;
    weight: number;
    contribution: number;
}

export interface PillarTrend {
    name: string;
    direction: 'UP' | 'DOWN';
    slope: number;
}

export interface PillarDetailSchema {
    pillarKey: 'LIQUIDITE' | 'SOLVABILITE' | 'RENTABILITE' | 'CAPACITE' | 'QUALITE';
    label: string;
    score: number;
    maxScore: number;
    riskClass: RiskClass;
    rail: Rail;
    indicators?: PillarIndicator[];
    signals?: string[];
    trends?: PillarTrend[];
    comment?: string;
}

interface PillarMetadata {
    icon: string;
    colorClass: string; // Classe Tailwind → var(--token), jamais de HEX
    description: string;
}

@Component({
    selector: 'finaces-pillar-row',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatExpansionModule,
        MatTableModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        FinacesRiskBadgeComponent
    ],
    templateUrl: './finaces-pillar-row.component.html',
    styleUrls: ['./finaces-pillar-row.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesPillarRowComponent implements OnInit, OnChanges {
    @Input({ required: true }) pillar!: PillarDetailSchema;
    @Input() isExpanded: boolean = false;   // Lecture seule — muté uniquement par le parent
    @Input() readonly: boolean = false;

    @Output() toggleExpand = new EventEmitter<string>();
    @Output() commentChange = new EventEmitter<string>();

    displayedColumns: string[] = ['indicator', 'value', 'score', 'weight', 'contribution'];

    private readonly pillarMetadataMap: Record<string, PillarMetadata> = {
        LIQUIDITE: { icon: 'water_drop', colorClass: 'text-info', description: 'Capacité à faire face aux dettes à court terme' },
        SOLVABILITE: { icon: 'shield', colorClass: 'text-success', description: 'Structure de financement et endettement' },
        RENTABILITE: { icon: 'trending_up', colorClass: 'text-warning', description: 'Génération de profits et marges' },
        CAPACITE: { icon: 'bolt', colorClass: 'text-primary', description: 'Capacité de remboursement du contrat' },
        QUALITE: { icon: 'star', colorClass: 'text-error', description: 'Qualité des données et cohérence' }
    };

    metadata: PillarMetadata | null = null;
    editingComment: string = '';

    ngOnInit(): void {
        this.initData();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['pillar']) this.initData();
    }

    private initData(): void {
        if (this.pillar) {
            this.metadata = this.pillarMetadataMap[this.pillar.pillarKey] || null;
            this.editingComment = this.pillar.comment || '';
        }
    }

    // VIO-07 FIX: Ne plus muter @Input isExpanded.
    // Le composant émet l'événement et laisse le PARENT décider du nouvel état.
    onExpandToggle(): void {
        if (this.pillar) {
            this.toggleExpand.emit(this.pillar.pillarKey);
        }
    }

    onCommentBlur(): void {
        if (this.pillar && this.editingComment !== this.pillar.comment) {
            this.commentChange.emit(this.editingComment);
        }
    }

    getProgressValue(): number {
        if (!this.pillar?.maxScore) return 0;
        return Math.min(100, Math.max(0, (this.pillar.score / this.pillar.maxScore) * 100));
    }

    getProgressColorClass(): string {
        if (!this.pillar) return 'bg-warning';
        const riskColorMap: Record<RiskClass, string> = {
            LOW: 'bg-success',
            MODERATE: 'bg-warning',
            HIGH: 'bg-mcc-high',
            CRITICAL: 'bg-error'
        };
        return riskColorMap[this.pillar.riskClass] || 'bg-warning';
    }
}