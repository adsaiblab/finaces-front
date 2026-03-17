import { Pipe, PipeTransform } from '@angular/core';
import { RiskClass } from '../../core/models';

@Pipe({
    name: 'riskClassLabel',
    standalone: true,
})
export class RiskClassLabelPipe implements PipeTransform {
    private readonly labelMap: Record<RiskClass | string, string> = {
        [RiskClass.FAIBLE]: 'Faible',
        [RiskClass.MODERE]: 'Modéré',
        [RiskClass.ELEVE]: 'Élevé',
        [RiskClass.CRITIQUE]: 'Critique',
    };

    transform(value: RiskClass | string | null): string {
        if (!value) return '—';
        return this.labelMap[value] || value;
    }
}