import { Pipe, PipeTransform } from '@angular/core';
import { RiskClass } from '../../core/models';

@Pipe({
  name: 'riskClassLabel',
  standalone: true,
})
export class RiskClassLabelPipe implements PipeTransform {
  private readonly labelMap: Record<RiskClass | string, string> = {
    [RiskClass.LOW]: 'Low',
    [RiskClass.MODERATE]: 'Moderate',
    [RiskClass.HIGH]: 'High',
    [RiskClass.CRITICAL]: 'Critical',
  };

  transform(value: RiskClass | string | null): string {
    if (!value) return '—';
    return this.labelMap[value] || value;
  }
}
