import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentsColumnComponent } from './documents-column.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { GateDocumentOut } from '../../../../core/models/gate.model';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('DocumentsColumnComponent', () => {
  let component: DocumentsColumnComponent;
  let fixture: ComponentFixture<DocumentsColumnComponent>;

  beforeEach(async () => {
    vi.stubGlobal('alert', vi.fn());

    await TestBed.configureTestingModule({
      imports: [DocumentsColumnComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentsColumnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it("devrait mettre à jour le tableau via l'Input documents", async () => {
    const mockDocs: GateDocumentOut[] = [
      {
        id: '1',
        case_id: 'c1',
        file_name: 'test.pdf',
        document_type: 'BILAN' as any,
        reliability_level: 'HIGH' as any,
        status: 'PRESENT' as any,
        integrity_status: 'OK' as any,
        red_flags: [],
        uploaded_at: '',
        fiscal_year: 2023,
        file_size: 1024,
      } as any,
    ];
    
    fixture.componentRef.setInput('documents', mockDocs);
    fixture.detectChanges();

    expect(component.documents().length).toBe(1);
    expect(component.documents()[0].file_name).toBe('test.pdf');
  });

  it('devrait rejeter un fichier avec une extension non valide', () => {
    const emitSpy = vi.spyOn(component.fileDropped, 'emit');
    const invalidFile = new File([''], 'test.exe', { type: 'application/x-msdownload' });

    (component as any).handleFile(invalidFile);

    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining('Format de fichier non supporté'),
    );
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('devrait émettre fileDropped si le fichier est valide', () => {
    const emitSpy = vi.spyOn(component.fileDropped, 'emit');
    const validFile = new File([''], 'test.pdf', { type: 'application/pdf' });

    (component as any).handleFile(validFile);

    expect(emitSpy).toHaveBeenCalledWith(validFile);
  });
});
