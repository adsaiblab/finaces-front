import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NormalizationComponent } from './normalization.component';
import { CaseContextService } from '../../core/services/case-context.service';
import { CaseService } from '../../core/services/case.service';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('NormalizationComponent', () => {
  let component: NormalizationComponent;
  let fixture: ComponentFixture<NormalizationComponent>;

  const mockCaseService = {
    getNormalizedFinancials: vi.fn().mockReturnValue(of([])),
    normalizeFinancials: vi.fn().mockReturnValue(of([])),
    computeRatios: vi.fn().mockReturnValue(of([])),
  };

  const mockCaseContext = {
    caseId: signal('case-123'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NormalizationComponent, NoopAnimationsModule],
      providers: [
        { provide: CaseService, useValue: mockCaseService },
        { provide: CaseContextService, useValue: mockCaseContext },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NormalizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load data on init', () => {
    expect(component).toBeTruthy();
    expect(mockCaseService.getNormalizedFinancials).toHaveBeenCalledWith('case-123');
    expect(component.isLoading()).toBe(false);
  });
});
