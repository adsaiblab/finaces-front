import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TensionBannerComponent } from './tension-banner.component';
import { describe, it, expect, beforeEach } from 'vitest';
import { TensionLevel } from '../../../../core/models/scoring.model';

describe('TensionBannerComponent', () => {
  let component: TensionBannerComponent;
  let fixture: ComponentFixture<TensionBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TensionBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TensionBannerComponent);
    component = fixture.componentInstance;

    // Strict OnPush setup
    fixture.componentRef.setInput('level', TensionLevel.SEVERE);
    fixture.componentRef.setInput('direction', 'UP');
    fixture.componentRef.setInput('deltaScore', 1.2);
    fixture.componentRef.setInput('recommendation', 'Investigate immediately.');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return the correct configuration for SEVERE tension', () => {
    const config = component.getBannerConfig();
    expect(config.icon).toBe('warning');
    expect(config.title).toBe('CRITICAL DIVERGENCE');
    expect(config.classes).toContain('var(--color-error)');
  });

  it('should display the correct direction text', () => {
    expect(component.getDirectionText()).toBe('AI is more optimistic (+)');
  });
});
