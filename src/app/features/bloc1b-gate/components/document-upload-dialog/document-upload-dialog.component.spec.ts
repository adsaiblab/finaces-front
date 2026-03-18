import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentUploadDialogComponent } from './document-upload-dialog.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('DocumentUploadDialogComponent', () => {
    let component: DocumentUploadDialogComponent;
    let fixture: ComponentFixture<DocumentUploadDialogComponent>;
    let mockDialogRef: any;

    beforeEach(async () => {
        mockDialogRef = { close: vi.fn() };
        const mockData = { file: new File([''], 'test.pdf') };

        await TestBed.configureTestingModule({
            imports: [DocumentUploadDialogComponent, ReactiveFormsModule, NoopAnimationsModule],
            providers: [
                FormBuilder,
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: mockData }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(DocumentUploadDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('devrait créer le composant', () => {
        expect(component).toBeTruthy();
    });

    it('devrait fermer avec la data lors du submit si valide', () => {
        component.uploadForm.patchValue({
            document_type: 'BILAN',
            fiscal_year: 2023,
            reliability_level: 'UNAUDITED'
        });
        component.onSubmit();
        expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('devrait rendre auditeur requis si fiabilité est AUDITED', () => {
        component.uploadForm.patchValue({ reliability_level: 'AUDITED' });
        fixture.detectChanges();
        const auditorControl = component.uploadForm.get('auditor_name');
        expect(auditorControl?.hasError('required')).toBeTruthy();
    });
});