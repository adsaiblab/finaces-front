import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrossPillarAlertsComponent } from './cross-pillar-alerts.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

describe('CrossPillarAlertsComponent', () => {
  let component: CrossPillarAlertsComponent;
  let fixture: ComponentFixture<CrossPillarAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrossPillarAlertsComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CrossPillarAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show container if no alerts', () => {
    fixture.componentRef.setInput('alerts', []);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.cross-pillar-alerts')).toBeFalsy();
  });

  it('should get correct icon for rule_id', () => {
    expect(component.getAlertIcon('FALSE_LIQUIDITY')).toBe('water_drop');
    expect(component.getAlertIcon('SCISSORS_EFFECT')).toBe('content_cut');
    expect(component.getAlertIcon('UNKNOWN')).toBe('info');
  });
});
