import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KpiRowComponent } from './kpi-row.component';
import { provideRouter } from '@angular/router';
import { DashboardStatsOut } from '../../../../core/models/dashboard.model';
import { describe, it, expect, beforeEach } from 'vitest';

describe('KpiRowComponent', () => {
    let component: KpiRowComponent;
    let fixture: ComponentFixture<KpiRowComponent>;

    const mockStats: DashboardStatsOut = {
        total_active_cases: 12,
        cases_pending_gate: 3,
        cases_with_tension_alert: 1,
        convergence_percentage: 85,
        avg_mcc_score_7days: 2.4,
        avg_ia_score_7days: 2.7,
        divergences_count_7days: 2,
        last_updated: '2026-03-16T16:00:00Z'
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [KpiRowComponent],
            providers: [provideRouter([])] // Nécessaire pour le routerLink
        }).compileComponents();

        fixture = TestBed.createComponent(KpiRowComponent);
        component = fixture.componentInstance;

        // RÈGLE MANIFESTE : Injection propre du signal pour OnPush
        fixture.componentRef.setInput('stats', mockStats);
        fixture.detectChanges();
    });

    it('devrait créer le composant', () => {
        expect(component).toBeTruthy();
    });

    it('devrait afficher le nombre correct de dossiers actifs', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        // On cible la première carte (dossiers actifs)
        const valueElement = compiled.querySelector('.kpi-mcc-border .kpi-value');
        expect(valueElement?.textContent?.trim()).toBe('12');
    });

    it('devrait afficher le pourcentage correct de convergence', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        // On cible la dernière carte (convergence)
        const valueElement = compiled.querySelector('.kpi-ia-border .kpi-value');
        expect(valueElement?.textContent?.trim()).toContain('85%');
    });
});