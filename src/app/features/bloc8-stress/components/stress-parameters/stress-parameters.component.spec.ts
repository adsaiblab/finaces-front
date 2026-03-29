import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StressParametersComponent } from './stress-parameters.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('StressParametersComponent', () => {
  let component: StressParametersComponent;
  let fixture: ComponentFixture<StressParametersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StressParametersComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(StressParametersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should emit paramsChange on valid form change', () => {
    const emitSpy = vi.spyOn(component.paramsChange, 'emit');
    component.paramsForm.patchValue({
      contract_value: 100000,
      initial_cash: 50000,
      available_credit: 10000,
      operating_cash_flow: 5000,
    });
    expect(emitSpy).toHaveBeenCalled();
  });
});
