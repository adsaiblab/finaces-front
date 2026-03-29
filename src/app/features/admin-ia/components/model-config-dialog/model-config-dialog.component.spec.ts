import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModelConfigDialogComponent } from './model-config-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ModelConfigDialogComponent', () => {
  let component: ModelConfigDialogComponent;
  let fixture: ComponentFixture<ModelConfigDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelConfigDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { version: 'v1.0', config: {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ModelConfigDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
