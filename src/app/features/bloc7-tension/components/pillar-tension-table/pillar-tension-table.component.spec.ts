import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PillarTensionTableComponent } from './pillar-tension-table.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('PillarTensionTableComponent', () => {
  let component: PillarTensionTableComponent;
  let fixture: ComponentFixture<PillarTensionTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PillarTensionTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PillarTensionTableComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('pillars', [
      { pillar_name: 'Liquidity', mcc_score: 3.0, ia_impact: 3.6, delta: 0.6, is_divergent: true },
    ]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should assign error class for delta >= 0.5', () => {
    expect(component.getDeltaColorClass(0.6)).toBe('text-[color:var(--color-error)]');
  });
});
