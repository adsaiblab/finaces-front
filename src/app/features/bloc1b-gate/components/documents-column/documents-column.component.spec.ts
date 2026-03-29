import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentsColumnComponent } from './documents-column.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { GateDocumentOut } from '../../../../core/models/gate.model';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('DocumentsColumnComponent', () => {
  let component: DocumentsColumnComponent;
  let fixture: ComponentFixture<DocumentsColumnComponent>;

  beforeEach(async () => {
    // Stub alert globally for invalid file tests
    vi.stubGlobal('alert', vi.fn());

    await TestBed.configureTestingModule({
      imports: [DocumentsColumnComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentsColumnComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it("devrait mettre à jour le dataSource via l'Input documents", async () => {
    const mockDocs = [
      {
        id: '1',
        case_id: 'c1',
        file_name: 'test.pdf',
        document_type: 'BILAN',
        reliability_level: 'HIGH',
        status: 'PRESENT',
        integrity_status: 'OK',
        red_flags: [],
        uploaded_at: '',
      },
    ] as unknown as GateDocumentOut[];
    fixture.componentRef.setInput('documents', mockDocs);
    await fixture.whenStable();

    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].file_name).toBe('test.pdf');
  });

  it('devrait rejeter un fichier avec une extension non valide', () => {
    const emitSpy = vi.spyOn(component.fileDropped, 'emit');
    const invalidFile = new File([''], 'test.exe', { type: 'application/x-msdownload' });

    // Test logic encapsulée (on utilise any pour bypass le private scope le temps du test)
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
