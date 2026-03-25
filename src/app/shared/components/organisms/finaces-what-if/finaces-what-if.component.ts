import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ShapFeature, WhatIfScenario } from '../../../../core/models/ia.model';

@Component({
    selector: 'app-finaces-what-if',
    standalone: true,
    imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatSliderModule, MatProgressSpinnerModule],
    templateUrl: './finaces-what-if.component.html',
    styleUrls: ['./finaces-what-if.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesWhatIfComponent {
    public features = input.required<ShapFeature[]>();
    public isSimulating = input<boolean>(false);

    public simulate = output<WhatIfScenario>();
    public reset = output<void>();

    // État local pour stocker les modifications
    public adjustments = signal<Record<string, number>>({});

    // On ne prend que le top 5 pour éviter de surcharger le simulateur
    public topFeatures = computed(() => {
        const feats = this.features();
        if (!feats) return [];
        return [...feats].sort((a, b) => b.magnitude - a.magnitude).slice(0, 5);
    });

    public hasAdjustments = computed(() => Object.keys(this.adjustments()).length > 0);

    public updateAdjustment(featureName: string, newValue: number | null): void {
        this.adjustments.update(current => {
            const updated = { ...current };
            if (newValue === null || isNaN(newValue)) {
                delete updated[featureName];
            } else {
                updated[featureName] = newValue;
            }
            return updated;
        });
    }

    public getAdjustmentValue(featureName: string, originalValue: string | number): number {
        const currentAdj = this.adjustments()[featureName];
        if (currentAdj !== undefined) return currentAdj;

        // Tentative de parsing de la valeur originale si c'est une string (ex: "15.2%")
        if (typeof originalValue === 'string') {
            const parsed = parseFloat(originalValue.replace(/[^0-9.-]/g, ''));
            return isNaN(parsed) ? 0 : parsed;
        }
        return originalValue;
    }

    public triggerSimulation(): void {
        if (this.hasAdjustments()) {
            this.simulate.emit({
                scenario_name: 'Custom User Simulation',
                feature_modifications: this.adjustments()
            });
        }
    }

    public clearSimulation(): void {
        this.adjustments.set({});
        this.reset.emit();
    }
}