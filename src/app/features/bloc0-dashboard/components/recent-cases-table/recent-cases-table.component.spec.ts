import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecentCasesTableComponent } from './recent-cases-table.component';
import { provideRouter } from '@angular/router';
import { EvaluationCaseDetailOut, CaseType, CaseStatus } from '../../../../core/models/case.model';
import { describe, it, expect, beforeEach } from 'vitest';
import { FinacesRiskBadgeComponent } from '../../../../shared/components/atoms/finaces-risk-badge/finaces-risk-badge.component';

describe('RecentCasesTableComponent', () => {
    let component: RecentCasesTableComponent;
    let fixture: ComponentFixture<RecentCasesTableComponent>;

    const mockCases: EvaluationCaseDetailOut[] = [
        {
            id: '12345678-uuid',
            name: 'Projet Test',
            bidder_name: 'Tech Corp',
            country: 'FRA',
            sector: 'IT',
            contract_value: 1000000,
            contract_currency: 'EUR',
            contract_months: 12,
            case_type: CaseType.SINGLE,
            status: CaseStatus.PENDING_GATE,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'user1',
            risk_class: 'MODERATE'
        }
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RecentCasesTableComponent, FinacesRiskBadgeComponent],
            providers: [provideRouter([])] // Nécessaire pour les routerLink
        }).compileComponents();

        fixture = TestBed.createComponent(RecentCasesTableComponent);
        component = fixture.componentInstance;

        // RÈGLE MANIFESTE : Injection propre du signal pour tester l'OnPush
        fixture.componentRef.setInput('cases', mockCases);
        fixture.detectChanges();
    });

    it('devrait créer le composant', () => {
        expect(component).toBeTruthy();
    });

    it('devrait afficher le tableau avec les données fournies', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const rows = compiled.querySelectorAll('.mat-mdc-row');
        expect(rows.length).toBe(1);

        // Correction : cibler la cellule dans la ligne de données (tr.mat-mdc-row)
        const bidderCell = compiled.querySelector('tr.mat-mdc-row .mat-column-bidder');
        expect(bidderCell?.textContent).toContain('Tech Corp');
    });

    it('devrait afficher l\'état vide si aucune donnée', () => {
        // Changement de l'input et redétection
        fixture.componentRef.setInput('cases', []);
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        const emptyState = compiled.querySelector('.empty-state');
        expect(emptyState).toBeTruthy();
        expect(emptyState?.textContent).toContain('Aucun dossier récent');
    });
});