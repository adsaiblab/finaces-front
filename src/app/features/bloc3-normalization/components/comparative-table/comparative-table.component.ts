import { NgClass } from '@angular/common';
import { Component, ChangeDetectionStrategy, input, computed, output } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FinancialStatementNormalizedSchema } from '../../../../core/models';

export interface ComparativeRow {
  id: string;
  label: string;
  rawValue: number;
  normalizedValue: number;
  deltaAmount: number;
  deltaPct: number;
  note: string;
  isHeader?: boolean;
  isTotal?: boolean;
  indentLevel?: number;
}

@Component({
  selector: 'app-comparative-table',
  standalone: true,
  imports: [MatTableModule, MatIconModule, MatTooltipModule, CurrencyPipe, DecimalPipe, NgClass],
  templateUrl: './comparative-table.component.html',
  styleUrls: ['./comparative-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparativeTableComponent {
  public data = input<FinancialStatementNormalizedSchema>(
    null as unknown as FinancialStatementNormalizedSchema,
  );

  // Événement émis lors du clic sur une ligne ayant un ajustement, pour scroller vers les détails
  public rowClick = output<string>();

  public displayedColumns: string[] = ['item', 'raw', 'normalized', 'delta', 'note'];

  // Signal calculé pour transformer le schéma JSON en lignes de tableau aplaties
  public dataSource = computed<ComparativeRow[]>(() => {
    const rawData = this.data();
    if (!rawData) return [];

    // Helper pour générer une ligne (Mock basé sur les ajustements pour P10)
    // Dans une implémentation réelle, on croiserait les données brutes et normalisées
    const rows: ComparativeRow[] = [
      {
        id: 'h1',
        label: 'CURRENT ASSETS',
        rawValue: 0,
        normalizedValue: 0,
        deltaAmount: 0,
        deltaPct: 0,
        note: '',
        isHeader: true,
        indentLevel: 0,
      },
      this.buildRow(
        'Cash & Equivalents',
        123456,
        rawData.normalized_bilan_actif?.liquid_assets || 123456,
        1,
      ),
      this.buildRow(
        'Inventory',
        345678,
        rawData.normalized_bilan_actif?.inventory || 328194,
        1,
        'Δ',
      ),
      {
        id: 't1',
        label: 'Total Current Assets',
        rawValue: 1160490,
        normalizedValue: rawData.normalized_bilan_actif?.current_assets || 1143006,
        deltaAmount: -17484,
        deltaPct: -1.5,
        note: '',
        isTotal: true,
        indentLevel: 0,
      },

      {
        id: 'h2',
        label: 'NON-CURRENT ASSETS',
        rawValue: 0,
        normalizedValue: 0,
        deltaAmount: 0,
        deltaPct: 0,
        note: '',
        isHeader: true,
        indentLevel: 0,
      },
      this.buildRow(
        'Other Non-Current Assets',
        567890,
        rawData.normalized_bilan_actif?.other_noncurrent_assets || 612345,
        1,
        'Δ',
      ),
      {
        id: 't3',
        label: 'TOTAL ASSETS',
        rawValue: 4086416,
        normalizedValue: rawData.normalized_bilan_actif?.total_assets || 4208787,
        deltaAmount: 122371,
        deltaPct: 3.0,
        note: '',
        isTotal: true,
        indentLevel: 0,
      },

      {
        id: 'h3',
        label: 'EQUITY',
        rawValue: 0,
        normalizedValue: 0,
        deltaAmount: 0,
        deltaPct: 0,
        note: '',
        isHeader: true,
        indentLevel: 0,
      },
      {
        id: 't4',
        label: 'Total Equity',
        rawValue: 1000000,
        normalizedValue: rawData.normalized_bilan_passif?.equity || 1050000,
        deltaAmount: 50000,
        deltaPct: 5.0,
        note: '',
        isTotal: true,
        indentLevel: 0,
      },

      {
        id: 'h4',
        label: 'CURRENT LIABILITIES',
        rawValue: 0,
        normalizedValue: 0,
        deltaAmount: 0,
        deltaPct: 0,
        note: '',
        isHeader: true,
        indentLevel: 0,
      },
      {
        id: 't5',
        label: 'Total Current Liabilities',
        rawValue: 2600000,
        normalizedValue: rawData.normalized_bilan_passif?.current_liabilities || 2450000,
        deltaAmount: -150000,
        deltaPct: -5.8,
        note: '',
        isTotal: true,
        indentLevel: 0,
      },

      {
        id: 'h5',
        label: 'NON-CURRENT LIABILITIES',
        rawValue: 0,
        normalizedValue: 0,
        deltaAmount: 0,
        deltaPct: 0,
        note: '',
        isHeader: true,
        indentLevel: 0,
      },
      this.buildRow(
        'Long Term Debt',
        1200000,
        rawData.normalized_bilan_passif?.long_term_debt || 1350000,
        1,
        'Δ',
      ),

      {
        id: 't7',
        label: 'TOTAL LIABILITIES & EQUITY',
        rawValue: 5100000,
        normalizedValue: rawData.normalized_bilan_passif?.total_liabilities || 5150000,
        deltaAmount: 50000,
        deltaPct: 1.0,
        note: '',
        isTotal: true,
        indentLevel: 0,
      },
    ];

    return rows;
  });

  private buildRow(
    label: string,
    raw: number,
    norm: number,
    indent: number,
    manualNote?: string,
  ): ComparativeRow {
    const deltaAmount = norm - raw;
    const deltaPct = raw !== 0 ? (deltaAmount / raw) * 100 : 0;
    let note = 'OK';
    if (manualNote) {
      note = manualNote;
    } else if (Math.abs(deltaPct) > 0) {
      note = 'Δ';
    }

    return {
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      rawValue: raw,
      normalizedValue: norm,
      deltaAmount,
      deltaPct,
      note,
      indentLevel: indent,
    };
  }

  public getDeltaColorClass(deltaPct: number): string {
    const absDelta = Math.abs(deltaPct);
    if (absDelta === 0) return 'text-success';
    if (absDelta > 0 && absDelta <= 10) return 'text-warning';
    return 'text-error';
  }

  public onRowClick(row: ComparativeRow): void {
    if (row.note === 'Δ') {
      this.rowClick.emit(row.id);
    }
  }
}
