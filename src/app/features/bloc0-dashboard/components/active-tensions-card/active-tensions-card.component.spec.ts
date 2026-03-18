import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActiveTensionsCardComponent } from './active-tensions-card.component';
import { provideRouter } from '@angular/router';
import { TensionAlertOut } from '../../../../core/models/dashboard.model';
import { CaseType, CaseStatus } from '../../../../core/models/case.model';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ActiveTensionsCardComponent', () => {
    let component: ActiveTensionsCardComponent;
    let fixture: ComponentFixture<ActiveTensionsCardComponent>;

    const mockTensions: TensionAlertOut[] = [
        {
            id: 'alert-123',
            name: 'Projet Sensible',
            bidder_name: 'Corp Alpha',
            country: 'USA',
            sector: 'Energy',
            contract_value: 5000000,
            contract_currency: 'USD',
            contract_months: 24,
            case_type: CaseType.SINGLE,
            status: CaseStatus.SCORING_DONE,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'user1',
            mcc_score: 2.5,
            ia_score: 4.2,
            divergence_level: 'SEVERE',
            divergence_score: 1.7,
            mcc_level: 'MODERATE',
            ia_level: 'HIGH'
        }
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ActiveTensionsCardComponent],
            providers: [provideRouter([])]
        }).compileComponents();

        fixture = TestBed.createComponent(ActiveTensionsCardComponent);
        component = fixture.componentInstance;

        // RÈGLE MANIFESTE : Injection propre du signal pour tester l'OnPush
        fixture.componentRef.setInput('tensions', mockTensions);
        fixture.detectChanges();
    });

    it('devrait créer le composant', () => {
        expect(component).toBeTruthy();
    });

    it('devrait afficher la liste des tensions', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const tensionItems = compiled.querySelectorAll('.tension-item');
        expect(tensionItems.length).toBe(1);

        const bidderName = compiled.querySelector('.tension-title-link');
        expect(bidderName?.textContent?.trim()).toBe('Corp Alpha');

        const deltaBadge = compiled.querySelector('.delta-badge');
        expect(deltaBadge?.textContent).toContain('1.7/5');
    });

    it('devrait afficher l\'état vide', () => {
        fixture.componentRef.setInput('tensions', []);
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        // On vérifie que le message "Aucune tension détectée" est bien présent
        expect(compiled.textContent).toContain('Aucune tension détectée');
    });
});