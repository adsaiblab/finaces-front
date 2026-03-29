import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoherenceAlertsComponent } from './coherence-alerts.component';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CoherenceAlertsComponent', () => {
  let component: CoherenceAlertsComponent;
  let fixture: ComponentFixture<CoherenceAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoherenceAlertsComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CoherenceAlertsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('alerts', [
      {
        id: '1',
        severity: 'CRITICAL',
        message: 'Test Alert',
        rule_description: 'Rule text',
        affected_ratios: ['ratio1'],
        suggested_action: 'Fix it',
      },
    ]);
    fixture.componentRef.setInput('status', 'CRITICAL');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get correct color class for CRITICAL status', () => {
    expect(component.getStatusColorClass()).toBe('text-[color:var(--color-error)]');
  });
});
