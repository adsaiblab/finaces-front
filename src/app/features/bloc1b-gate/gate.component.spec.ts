import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GateComponent } from './gate.component';
import { ActivatedRoute, Router } from '@angular/router';
import { CaseService } from '../../core/services/case.service';
import { DocumentService } from '../../core/services/document.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, firstValueFrom } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('GateComponent', () => {
    let component: GateComponent;
    let fixture: ComponentFixture<GateComponent>;

    let mockRouter: { navigate: ReturnType<typeof vi.fn> };
    let mockCaseService: { getCaseDetail: ReturnType<typeof vi.fn>; evaluateGate: ReturnType<typeof vi.fn>; patchCaseStatus: ReturnType<typeof vi.fn> };
    let mockDocumentService: { getGateDocuments: ReturnType<typeof vi.fn>; uploadGateDocument: ReturnType<typeof vi.fn>; deleteDocument: ReturnType<typeof vi.fn> };
    let mockDialog: { open: ReturnType<typeof vi.fn> };
    let mockSnackBar: { open: ReturnType<typeof vi.fn> };

    beforeEach(async () => {
        mockRouter = { navigate: vi.fn() };
        mockCaseService = {
            getCaseDetail: vi.fn().mockReturnValue(of({
                id: '1', name: 'Test Case', bidder_name: 'Test Corp', status: 'PENDING_GATE'
            })),
            evaluateGate: vi.fn().mockReturnValue(of({
                id: 'dec-1', case_id: '1', verdict: 'PASSÉ', is_passed: true,
                reliability_score: 80, reliability_level: 'HIGH',
                blocking_reasons: [], reserve_flags: [], missing_docs: [],
                documents_received: {}, audit_log: [], evaluated_at: '', evaluated_by: ''
            })),
            patchCaseStatus: vi.fn().mockReturnValue(of({}))
        };
        mockDocumentService = {
            getGateDocuments: vi.fn().mockReturnValue(of([])),
            uploadGateDocument: vi.fn().mockReturnValue(of({})),
            deleteDocument: vi.fn().mockReturnValue(of({}))
        };
        mockDialog = { open: vi.fn().mockReturnValue({ afterClosed: () => of(null) }) };
        mockSnackBar = { open: vi.fn() };

        await TestBed.configureTestingModule({
            imports: [GateComponent, NoopAnimationsModule],
            providers: [
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
                { provide: Router, useValue: mockRouter },
                { provide: CaseService, useValue: mockCaseService },
                { provide: DocumentService, useValue: mockDocumentService },
                { provide: MatDialog, useValue: mockDialog },
                { provide: MatSnackBar, useValue: mockSnackBar }
            ]
        });

        // Pour les composants standalone qui importent MatSnackBarModule/MatDialogModule
        // directement, les providers du TestBed sont ignorés → overrideProvider est nécessaire.
        TestBed.overrideProvider(MatSnackBar, { useValue: mockSnackBar });
        TestBed.overrideProvider(MatDialog, { useValue: mockDialog });

        await TestBed.compileComponents();

        fixture = TestBed.createComponent(GateComponent);
        component = fixture.componentInstance;
    });

    it('devrait créer le composant', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('devrait récupérer les détails du case à l\'initialisation', () => {
        fixture.detectChanges();
        expect(mockCaseService.getCaseDetail).toHaveBeenCalledWith('1');
    });

    it('devrait lancer l\'évaluation et mettre à jour le state', async () => {
        fixture.detectChanges();
        component.onEvaluateGate();

        // Attendre que le Subject soit mis à jour via firstValueFrom
        const decision = await firstValueFrom(component.decision$);
        expect(mockCaseService.evaluateGate).toHaveBeenCalledWith('1');
        expect(decision).toBeTruthy();
        expect(decision?.verdict).toBe('PASSÉ');
    });

    it('devrait sceller le gate et naviguer', async () => {
        fixture.detectChanges();
        component.onSealGate();

        // Attendre la fin du subscribe via une microtask
        await Promise.resolve();

        expect(mockCaseService.patchCaseStatus).toHaveBeenCalledWith('1', 'FINANCIAL_INPUT');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/cases/1/financials']);
        expect(mockSnackBar.open).toHaveBeenCalled();
    });
});