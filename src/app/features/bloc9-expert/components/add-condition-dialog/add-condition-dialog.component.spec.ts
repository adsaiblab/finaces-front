import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddConditionDialogComponent } from './add-condition-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('AddConditionDialogComponent', () => {
  let component: AddConditionDialogComponent;
  let fixture: ComponentFixture<AddConditionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddConditionDialogComponent, NoopAnimationsModule],
      providers: [{ provide: MatDialogRef, useValue: { close: vi.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(AddConditionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
