import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScoringMccComponent } from './scoring-mcc.component';
import { CaseContextService } from '../../core/services/case-context.service';
import { ScoringMccService } from './services/scoring-mcc.service';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ScoringMccComponent', () => {
  let component: ScoringMccComponent;
  let fixture: ComponentFixture<ScoringMccComponent>;

  const mockScoringService = {
    getScoring: vi.fn().mockReturnValue(
      of({
        case_id: 'case-123',
        global_score: 4,
        risk_class: 'LOW',
        status: 'COMPUTED',
        pillars: [],
        recommendations: [],
        cross_analysis_alerts: [],
      }),
    ),
    overrideScore: vi.fn().mockReturnValue(of({})),
  };

  const mockCaseContext = {
    caseId: () => 'case-123',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScoringMccComponent, NoopAnimationsModule],
      providers: [
        { provide: ScoringMccService, useValue: mockScoringService },
        { provide: CaseContextService, useValue: mockCaseContext },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScoringMccComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load scoring data on init', () => {
    expect(component).toBeTruthy();
    expect(mockScoringService.getScoring).toHaveBeenCalledWith('case-123');
    expect(component.isLoading()).toBe(false);
  });
});
