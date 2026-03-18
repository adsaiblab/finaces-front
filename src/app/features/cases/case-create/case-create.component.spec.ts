import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CaseCreateComponent } from './case-create.component';
import { CaseService } from '../../../core/services/case.service';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('CaseCreateComponent', () => {
    let component: CaseCreateComponent;
    let fixture: ComponentFixture<CaseCreateComponent>;
    let mockCaseService: any;

    beforeEach(async () => {
        mockCaseService = {
            saveCaseDraft: vi.fn().mockReturnValue(of({ id: '123', status: 'DRAFT' }))
        };

        await TestBed.configureTestingModule({
            imports: [CaseCreateComponent],
            providers: [
                provideRouter([]),
                provideAnimations(), // Nécessaire pour le MatStepper
                { provide: CaseService, useValue: mockCaseService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CaseCreateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('devrait créer le composant', () => {
        expect(component).toBeTruthy();
    });

    it('devrait initialiser le formulaire avec la devise EUR par défaut', () => {
        expect(component.caseForm.get('marketInfo.contract_currency')?.value).toBe('EUR');
    });

    it('devrait appeler saveCaseDraft lors du clic sur le bouton de brouillon', () => {
        component.saveDraft();
        expect(mockCaseService.saveCaseDraft).toHaveBeenCalled();
    });
});