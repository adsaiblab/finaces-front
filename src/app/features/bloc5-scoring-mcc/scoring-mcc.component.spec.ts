import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScoringMccComponent } from './scoring-mcc.component';
import { CaseContextService } from '../../core/services/case-context.service';
import { ScoringMccService } from './services/scoring-mcc.service';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ScoringMccComponent', () => {
  let component: ScoringMccComponent;
  let fixture: ComponentFixture<ScoringMccComponent>;

  const mockScoringData = {
    case_id: 'case-123',
    global_score: 4,
    final_risk_class: 'LOW',
    is_overridden: false,
    pillars: [],
    smart_recommendations: [],
    cross_analysis_alerts: [],
  };

  const mockScoringService = {
    getExistingScoring: vi.fn().mockReturnValue(of(mockScoringData)),
    computeScoring: vi.fn().mockReturnValue(of(mockScoringData)),
    overrideScore: vi.fn().mockReturnValue(of({})),
  };

  const mockCaseContext = {
    caseId: () => 'case-123',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [ScoringMccComponent, NoopAnimationsModule],
      providers: [
        { provide: ScoringMccService, useValue: mockScoringService },
        { provide: CaseContextService, useValue: mockCaseContext },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScoringMccComponent);
    component = fixture.componentInstance;
  });

  it('should create and load scoring data on init via GET', () => {
    fixture.detectChanges(); // Trigger ngOnInit
    expect(component).toBeTruthy();
    expect(mockScoringService.getExistingScoring).toHaveBeenCalledWith('case-123');
    expect(component.isLoading()).toBe(false);
    expect(component.scoringData()).toEqual(mockScoringData);
  });

  it('should show empty state if GET returns 404', () => {
    mockScoringService.getExistingScoring.mockReturnValue(throwError(() => ({ status: 404 })));
    fixture.detectChanges();
    expect(component.scoringData()).toBeNull();
    expect(component.hasNoData()).toBe(true);
  });

  it('should call computeScoring on manual trigger', () => {
    mockScoringService.getExistingScoring.mockReturnValue(throwError(() => ({ status: 404 })));
    fixture.detectChanges();
    
    component.recomputeScoring();
    expect(mockScoringService.computeScoring).toHaveBeenCalledWith('case-123');
  });
});
