import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverrideZoneComponent } from './override-zone.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('OverrideZoneComponent', () => {
  let component: OverrideZoneComponent;
  let fixture: ComponentFixture<OverrideZoneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverrideZoneComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(OverrideZoneComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('originalScore', 3.5);
    fixture.componentRef.setInput('isOverridden', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit overrideSubmit when form is valid and submitted', () => {
    const emitSpy = vi.spyOn(component.overrideSubmit, 'emit');

    component.overrideForm.patchValue({
      newScore: 4.2,
      reason: 'Valid and detailed reason for override.',
    });

    component.submitOverride();
    expect(emitSpy).toHaveBeenCalledWith({
      new_score: 4.2,
      reason: 'Valid and detailed reason for override.',
    });
  });

  it('should NOT emit overrideSubmit when form is invalid', () => {
    const emitSpy = vi.spyOn(component.overrideSubmit, 'emit');

    component.overrideForm.patchValue({
      newScore: 6, // invalid max
      reason: 'too short',
    });

    component.submitOverride();
    expect(emitSpy).not.toHaveBeenCalled();
  });
});
