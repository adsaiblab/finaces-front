import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsortiumComponent } from './consortium.component';
import { CaseContextService } from '../../core/services/case-context.service';
import { ConsortiumService } from '../../core/services/consortium.service';
import { CaseService } from '../../core/services/case.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConsortiumScorecardOutput } from '../../core/models/consortium.model';

const MOCK_CONSORTIUM: ConsortiumScorecardOutput = {
  joint_venture_type: 'SOLIDAIRE',
  synergy_index: 0.5,
  weakest_member_id: 'member-2',
  combined_scorecard: { final_score: 3.45, risk_class: 'MODERATE' },
  members: [
    { member_id: 'member-1', member_name: 'Alpha SA', role: 'LEADER', participation_pct: 60, score: 3.8, risk_class: 'LOW', status: 'ACTIVE' },
    { member_id: 'member-2', member_name: 'Beta Corp', role: 'MEMBER', participation_pct: 40, score: 2.1, risk_class: 'HIGH', status: 'ACTIVE' },
  ],
} as ConsortiumScorecardOutput;

describe('ConsortiumComponent', () => {
  let component: ConsortiumComponent;
  let fixture: ComponentFixture<ConsortiumComponent>;

  const mockCaseContext = { caseId: () => 'case-abc' };
  const mockCaseService = { getCaseDetail: vi.fn().mockReturnValue(of(null).pipe(delay(0))) };
  const mockConsortiumService = {
    getConsortium: vi.fn().mockReturnValue(of(MOCK_CONSORTIUM).pipe(delay(0))),
    addMember: vi.fn(),
    updateMember: vi.fn(),
    removeMember: vi.fn(),
    calculateConsortium: vi.fn(),
  };

  beforeEach(async () => {
    vi.stubGlobal('requestAnimationFrame', (cb: Function) => setTimeout(cb, 0));
    mockCaseService.getCaseDetail.mockReturnValue(of(null).pipe(delay(0)));
    mockConsortiumService.getConsortium.mockReturnValue(of(MOCK_CONSORTIUM).pipe(delay(0)));

    await TestBed.configureTestingModule({
      imports: [ConsortiumComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'dashboard', children: [] }]),
        { provide: CaseContextService, useValue: mockCaseContext },
        { provide: CaseService, useValue: mockCaseService },
        { provide: ConsortiumService, useValue: mockConsortiumService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsortiumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have loadError null par défaut', () => {
    expect(component.loadError()).toBeNull();
  });

  it('should set loadError when consortium API fails', async () => {
    component.isLoading.set(false);
    component.loadError.set('Impossible de charger les données du consortium.');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.loadError()).not.toBeNull();
    const errorEl = fixture.nativeElement.querySelector('[data-testid="consortium-load-error"]');
    expect(errorEl).toBeTruthy();
  });

  it('should reset loadError and increment retryCount on onRetryLoad()', () => {
    component.loadError.set('Erreur');
    const before = component.retryCount();
    component.onRetryLoad();
    expect(component.loadError()).toBeNull();
    expect(component.retryCount()).toBe(before + 1);
  });

  it('should compute hasNoMembers false when members are loaded', async () => {
    component.isLoading.set(false);
    component.loadError.set(null);
    component.currentConsortium.set(MOCK_CONSORTIUM);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.hasNoMembers()).toBe(false);
  });

  it('should compute hasNoMembers true when consortium has empty members', async () => {
    component.isLoading.set(false);
    component.loadError.set(null);
    component.currentConsortium.set({ ...MOCK_CONSORTIUM, members: [] });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.hasNoMembers()).toBe(true);
  });

  it('should show empty-state "Aucun membre" when hasNoMembers is true', async () => {
    component.isLoading.set(false);
    component.loadError.set(null);
    component.currentConsortium.set({ ...MOCK_CONSORTIUM, members: [] });
    fixture.detectChanges();
    await fixture.whenStable();
    const emptyEl = fixture.nativeElement.querySelector('[data-testid="consortium-no-members"]');
    expect(emptyEl).toBeTruthy();
    expect(emptyEl.textContent).toContain('Aucun membre');
  });

  it('should compute totalParticipation = 100 for mock data', () => {
    component.currentConsortium.set(MOCK_CONSORTIUM);
    expect(component.totalParticipation()).toBe(100);
  });

  it('should show participation warning when total !== 100', async () => {
    component.isLoading.set(false);
    component.loadError.set(null);
    component.currentConsortium.set({
      ...MOCK_CONSORTIUM,
      members: [
        { ...MOCK_CONSORTIUM.members[0], participation_pct: 50 },
        { ...MOCK_CONSORTIUM.members[1], participation_pct: 30 },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const warnEl = fixture.nativeElement.querySelector('[data-testid="consortium-participation-error"]');
    expect(warnEl).toBeTruthy();
  });

  it('should show skeleton while isLoading is true', async () => {
    component.isLoading.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const skEl = fixture.nativeElement.querySelector('[data-testid="consortium-loading-spinner"]');
    expect(skEl).toBeTruthy();
  });

  it('should hide skeleton after loading completes', async () => {
    component.isLoading.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    const skEl = fixture.nativeElement.querySelector('[data-testid="consortium-loading-spinner"]');
    expect(skEl).toBeFalsy();
  });
});
