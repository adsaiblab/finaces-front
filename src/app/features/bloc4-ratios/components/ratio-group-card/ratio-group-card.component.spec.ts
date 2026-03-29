import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RatioGroupCardComponent } from './ratio-group-card.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('RatioGroupCardComponent', () => {
  let component: RatioGroupCardComponent;
  let fixture: ComponentFixture<RatioGroupCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatioGroupCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RatioGroupCardComponent);
    component = fixture.componentInstance;

    // Strict Input setting
    fixture.componentRef.setInput('groupName', 'Liquidity');
    fixture.componentRef.setInput('groupIcon', 'water_drop');
    fixture.componentRef.setInput('ratios', {
      current_ratio: {
        current: 1.5,
        unit: 'ratio',
        status: 'GREEN',
        variation_pct: 5,
        trend: [],
        benchmark_min: 1,
        benchmark_max: 2,
      },
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should parse ratios into rows correctly', () => {
    const rows = component.ratioRows();
    expect(rows.length).toBe(1);
    expect(rows[0].key).toBe('current_ratio');
    expect(rows[0].label).toBe('Current Ratio');
  });

  it('should format values based on unit', () => {
    expect(component.formatValue({ current: 12.5, unit: '%' } as any)).toBe('12.5%');
    expect(component.formatValue({ current: 45, unit: 'days' } as any)).toBe('45 days');
    expect(component.formatValue({ current: 1.5, unit: 'ratio' } as any)).toBe('1.50');
  });
});
