import { NgClass } from '@angular/common';
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CoherenceAlert } from '../../../../core/models/ratio.model';

@Component({
  selector: 'app-cross-pillar-alerts',
  standalone: true,
  imports: [MatCardModule, MatIconModule, NgClass],
  template: `
    @if (alerts() && alerts().length > 0) {
      <div class="cross-pillar-container mb-8">
        <div class="section-header flex items-center gap-2 mb-4 px-2">
          <mat-icon class="text-[color:var(--color-primary)]">psychology</mat-icon>
          <h3 class="text-lg font-semibold m-0 tracking-tight">Financial Intelligence Insights</h3>
          <span class="text-xs px-2 py-0.5 rounded-full bg-[color:var(--color-primary-light)] text-[color:var(--color-primary)] font-medium">
            Cross-period Patterns
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (alert of alerts(); track alert.id) {
            <mat-card 
              class="pattern-card border-l-4 !bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              [ngClass]="getSeverityClass(alert.severity)"
            >
              <mat-card-content class="!p-4 flex items-start gap-4">
                <div 
                  class="icon-wrapper p-2 rounded-xl"
                  [ngClass]="getIconWrapperClass(alert.severity)"
                >
                  <mat-icon [class]="getSeverityIconColor(alert.severity)">
                    {{ getAlertIcon(alert.rule_id) }}
                  </mat-icon>
                </div>
                
                <div class="content-wrapper flex-1">
                  <div class="flex justify-between items-start mb-1">
                    <span class="text-[10px] font-bold uppercase tracking-wider opacity-60">
                      {{ alert.rule_id.replace('_', ' ') }}
                    </span>
                    <span 
                      class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter"
                      [ngClass]="getBadgeClass(alert.severity)"
                    >
                      {{ alert.severity }}
                    </span>
                  </div>
                  <h4 class="text-sm font-bold mb-2 text-slate-800 leading-tight">
                    {{ alert.message }}
                  </h4>
                  <p class="text-xs text-slate-500 leading-relaxed m-0">
                    {{ alert.rule_description }}
                  </p>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .pattern-card {
      &.border-critical {
        border-left-color: var(--color-error);
      }
      &.border-warning {
        border-left-color: var(--color-warning);
      }
    }

    .icon-wrapper {
      &.bg-critical {
        background: rgba(var(--color-error-rgb), 0.1);
      }
      &.bg-warning {
        background: rgba(var(--color-warning-rgb), 0.1);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrossPillarAlertsComponent {
  public alerts = input<CoherenceAlert[]>([]);

  public getSeverityClass(severity: string): string {
    return severity === 'CRITICAL' ? 'border-critical' : 'border-warning';
  }

  public getIconWrapperClass(severity: string): string {
    return severity === 'CRITICAL' ? 'bg-critical' : 'bg-warning';
  }

  public getBadgeClass(severity: string): string {
    return severity === 'CRITICAL' 
      ? 'bg-[color:var(--color-error)] text-white' 
      : 'bg-[color:var(--color-warning)] text-white';
  }

  public getSeverityIconColor(severity: string): string {
    return severity === 'CRITICAL' ? 'text-[color:var(--color-error)]' : 'text-[color:var(--color-warning)]';
  }

  public getAlertIcon(ruleId: string): string {
    switch (ruleId) {
      case 'FALSE_LIQUIDITY': return 'water_drop';
      case 'HIDDEN_OVERLEVERAGE': return 'layers';
      case 'TOXIC_WCR': return 'trending_down';
      case 'SCISSORS_EFFECT': return 'content_cut';
      default: return 'info';
    }
  }
}
