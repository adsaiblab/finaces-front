import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MccConditionsComponent } from './mcc-conditions.component';
import { MatDialogModule } from '@angular/material/dialog';

describe('MccConditionsComponent', () => {
  let component: MccConditionsComponent;
  let fixture: ComponentFixture<MccConditionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MccConditionsComponent, MatDialogModule],
    }).compileComponents();

    fixture = TestBed.createComponent(MccConditionsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('conditions', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
