import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CasesListComponent, ProcessStep } from './cases-list.component';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

describe('CasesListComponent (Matrix Tracker)', () => {
  let component: CasesListComponent;
  let fixture: ComponentFixture<CasesListComponent>;
  let router: Router;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [CasesListComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CasesListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create Evaluation Hub', () => {
    expect(component).toBeTruthy();
  });

  it('should load mock data and resolve loading state after 800ms delay', async () => {
    expect(component.isLoading()).toBe(true);
    vi.advanceTimersByTime(800);
    await fixture.whenStable();
    expect(component.isLoading()).toBe(false);
    expect(component.cases().length).toBe(5);
  });

  it('should filter cases by specific filter modes', async () => {
    vi.advanceTimersByTime(800);
    await fixture.whenStable();

    // "ALL" by default
    expect(component.filteredCases().length).toBe(5);

    // "PENDING_GATE" filter
    component.setFilterMode('PENDING_GATE');
    expect(component.filterMode()).toBe('PENDING_GATE');
    expect(component.filteredCases().length).toBe(1); // Nexus Infrastructure -> gate ACTIVE

    // "READY_REPORT" filter
    component.setFilterMode('READY_REPORT');
    expect(component.filteredCases().length).toBe(1); // Aeris Holdings -> report ACTIVE
  });

  it('should route to correct step target when goToStep is called with ACTIVE/COMPLETED step', () => {
    const mockStep: ProcessStep = {
      id: 'financials',
      name: 'Fin.',
      status: 'ACTIVE',
      targetRoute: 'bilan',
    };
    component.goToStep('ca-1234', mockStep);
    expect(router.navigate).toHaveBeenCalledWith(['/cases', 'ca-1234', 'bilan']);
  });

  it('should NOT route when goToStep is called with LOCKED step', () => {
    const mockStep: ProcessStep = {
      id: 'scoring',
      name: 'Scor.',
      status: 'LOCKED',
      targetRoute: 'tension',
    };
    component.goToStep('ca-1234', mockStep);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
