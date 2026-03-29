import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChecklistColumnComponent } from './checklist-column.component';
import { GateDocumentOut } from '../../../../core/models/gate.model';
import { DocType, DocStatus } from '../../../../core/models/enums';
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
        fixture.componentRef.setInput('fiscalYears', [2023, 2022, 2021]);
        await fixture.whenStable();
    });

    it('devrait créer le composant', () => {
        expect(component).toBeTruthy();
    });

    it('devrait calculer 0% si aucun document nest uploadé', async () => {
        fixture.componentRef.setInput('documents', []);
        await fixture.whenStable();

        expect(component.totalProgressPercent).toBe(0);
        expect(component.yearlyProgress[0].progressPercent).toBe(0);
    });

    it('devrait calculer correctement la progression avec des documents valides', async () => {
        // Component compares against legacy DocumentDocType strings internally
        const mockDocs = [
            { document_type: 'BILAN', status: DocStatus.PRESENT },
            { document_type: 'CPC', status: DocStatus.PRESENT },
            { document_type: 'TFT', status: DocStatus.PRESENT },
            { document_type: 'ATTESTATION_FISCALE', status: DocStatus.PRESENT }
        ] as unknown as GateDocumentOut[];

        fixture.componentRef.setInput('documents', mockDocs);
        fixture.componentRef.setInput('fiscalYears', [2023, 2022, 2021]);
        await fixture.whenStable();

        // Component matches by document_type across all years (no fiscal_year filter)
        // 4 required types present → all 3 years get 100%, total = 100%
        expect(component.yearlyProgress[0].progressPercent).toBe(100);
        expect(component.totalProgressPercent).toBe(100);
    });

    it('devrait ignorer les documents en statut REJECTED dans la progression', async () => {
        const mockDocs = [
            { document_type: 'BILAN', status: DocStatus.REJECTED }
        ] as unknown as GateDocumentOut[];

        fixture.componentRef.setInput('documents', mockDocs);
        await fixture.whenStable();

        // REJECTED docs are excluded → 0 valid uploads
        expect(component.yearlyProgress[0].progressPercent).toBe(0);
    });
});
