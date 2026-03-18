import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChecklistColumnComponent } from './checklist-column.component';
import { GateDocumentOut } from '../../../../core/models/gate.model';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ChecklistColumnComponent', () => {
    let component: ChecklistColumnComponent;
    let fixture: ComponentFixture<ChecklistColumnComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ChecklistColumnComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ChecklistColumnComponent);
        component = fixture.componentInstance;
        // Set par défaut
        fixture.componentRef.setInput('fiscalYears', [2023, 2022, 2021]);
        fixture.detectChanges();
    });

    it('devrait créer le composant', () => {
        expect(component).toBeTruthy();
    });

    it('devrait calculer 0% si aucun document nest uploadé', () => {
        fixture.componentRef.setInput('documents', []);
        fixture.detectChanges();

        expect(component.totalProgressPercent).toBe(0);
        expect(component.yearlyProgress[0].progressPercent).toBe(0);
    });

    it('devrait calculer correctement la progression avec des documents valides', () => {
        const mockDocs: Partial<GateDocumentOut>[] = [
            { document_type: 'BILAN', fiscal_year: 2023, integrity_status: 'OK' },
            { document_type: 'CPC', fiscal_year: 2023, integrity_status: 'WARN' },
            { document_type: 'TFT', fiscal_year: 2023, integrity_status: 'OK' },
            { document_type: 'ATTESTATION_FISCALE', fiscal_year: 2023, integrity_status: 'OK' }
        ];

        fixture.componentRef.setInput('documents', mockDocs as GateDocumentOut[]);
        fixture.detectChanges();

        // 4 requis sur 4 pour 2023 = 100% pour l'année
        expect(component.yearlyProgress[0].progressPercent).toBe(100);
        // 4 requis uploadés sur 12 au total = 33%
        expect(component.totalProgressPercent).toBe(33);
    });

    it('devrait ignorer les documents en statut KO dans la progression', () => {
        const mockDocs: Partial<GateDocumentOut>[] = [
            { document_type: 'BILAN', fiscal_year: 2023, integrity_status: 'KO' }
        ];

        fixture.componentRef.setInput('documents', mockDocs as GateDocumentOut[]);
        fixture.detectChanges();

        expect(component.yearlyProgress[0].progressPercent).toBe(0);
    });
});