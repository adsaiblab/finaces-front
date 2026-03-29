import { NgClass, DecimalPipe } from '@angular/common';
import { Component, input, output, computed, ChangeDetectionStrategy, effect } from '@angular/core';

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
    FormsModule,
    MatExpansionModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FinacesRiskBadgeComponent,
    NgClass,
    DecimalPipe,
  ],
  templateUrl: './finaces-pillar-row.component.html',
  styleUrls: ['./finaces-pillar-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinacesPillarRowComponent {
  readonly pillar = input.required<PillarDetailSchema>();
  readonly isExpanded = input<boolean>(false);
  readonly isReadonly = input<boolean>(false, { alias: 'readonly' });

  readonly toggleExpand = output<string>();
  readonly commentChange = output<string>();

  displayedColumns: string[] = ['indicator', 'value', 'score', 'weight', 'contribution'];

  private readonly pillarMetadataMap: Record<string, PillarMetadata> = {
    LIQUIDITE: {
      icon: 'water_drop',
      colorClass: 'text-info',
      description: 'Capacité à faire face aux dettes à court terme',
    },
    SOLVABILITE: {
      icon: 'shield',
      colorClass: 'text-success',
      description: 'Structure de financement et endettement',
    },
    RENTABILITE: {
      icon: 'trending_up',
      colorClass: 'text-warning',
      description: 'Génération de profits et marges',
    },
    CAPACITE: {
      icon: 'bolt',
      colorClass: 'text-primary',
      description: 'Capacité de remboursement du contrat',
    },
    QUALITE: {
      icon: 'star',
      colorClass: 'text-error',
      description: 'Qualité des données et cohérence',
    },
  };

  readonly metadata = computed<PillarMetadata | null>(() => {
    const p = this.pillar();
    return p ? this.pillarMetadataMap[p.pillarKey] || null : null;
  });

  editingComment: string = '';

  constructor() {
    effect(() => {
      const p = this.pillar();
      if (p) {
        this.editingComment = p.comment || '';
      }
    });
  }

  // VIO-07 FIX: Ne plus muter @Input isExpanded.
  // Le composant émet l'événement et laisse le PARENT décider du nouvel état.
  onExpandToggle(): void {
    const p = this.pillar();
    if (p) {
      this.toggleExpand.emit(p.pillarKey);
    }
  }

  onCommentBlur(): void {
    const p = this.pillar();
    if (p && this.editingComment !== p.comment) {
      this.commentChange.emit(this.editingComment);
    }
  }

  getProgressValue(): number {
    const p = this.pillar();
    if (!p?.maxScore) return 0;
    return Math.min(100, Math.max(0, (p.score / p.maxScore) * 100));
  }

  getProgressColorClass(): string {
    const p = this.pillar();
    if (!p) return 'bg-warning';
    const riskColorMap: Record<RiskClass, string> = {
      LOW: 'bg-success',
      MODERATE: 'bg-warning',
      HIGH: 'bg-mcc-high',
      CRITICAL: 'bg-error',
    };
    return riskColorMap[p.riskClass] || 'bg-warning';
  }
}
