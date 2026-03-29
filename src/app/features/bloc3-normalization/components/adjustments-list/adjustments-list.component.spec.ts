import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdjustmentsListComponent } from './adjustments-list.component';
import { describe, it, expect, beforeEach } from 'vitest';
import { NormalizationAdjustment } from '../../../../core/models';

describe('AdjustmentsListComponent', () => {
  let component: AdjustmentsListComponent;
  let fixture: ComponentFixture<AdjustmentsListComponent>;

  const mockAdjustments: NormalizationAdjustment[] = [
    {
      line_item: 'EBITDA',
      original_value: 3500000,
      adjusted_value: 4000000,
      reason: 'EBITDA Restatement: Adding back depreciation',
      confidence: 95,
    },
    {
      line_item: 'Inventory',
      original_value: 345678,
      adjusted_value: 328194,
      reason: 'Inventory write-down adjustment',
      confidence: 85,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdjustmentsListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdjustmentsListComponent);
    component = fixture.componentInstance;

    // Set strictly required inputs
    fixture.componentRef.setInput('adjustments', mockAdjustments);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct class for delta colors', () => {
    expect(component.getDeltaColorClass(500)).toBe('text-[color:var(--color-success)]');
    expect(component.getDeltaColorClass(-200)).toBe('text-[color:var(--color-error)]');
    expect(component.getDeltaColorClass(0)).toBe('text-[color:var(--color-success)]');
  });

  it('should display the correct number of adjustments', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.adjustment-item').length).toBe(2);
    expect(compiled.textContent).toContain('EBITDA');
    expect(compiled.textContent).toContain('Inventory');
  });
});
