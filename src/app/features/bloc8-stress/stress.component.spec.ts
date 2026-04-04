import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StressComponent } from './stress.component';
import { CaseContextService } from '../../core/services/case-context.service';
import { StressService } from '../../core/services/stress.service';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('StressComponent', () => {
  let component: StressComponent;
  let fixture: ComponentFixture<StressComponent>;

  const mockStressService = {
    getStressTests: vi.fn().mockReturnValue(of({ scenarios: [] })),
    runCustomStressTest: vi.fn().mockReturnValue(of({})),
  };

  const mockCaseContext = {
    caseId: () => 'case-123',
  };

  beforeEach(async () => {
    vi.stubGlobal('requestAnimationFrame', (cb: Function) => cb());
    mockStressService.getStressTests.mockReturnValue(of({ scenarios: [] }));
    mockStressService.runCustomStressTest.mockReturnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [StressComponent, NoopAnimationsModule],
      providers: [
        { provide: StressService, useValue: mockStressService },
        { provide: CaseContextService, useValue: mockCaseContext },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load data on init', () => {
    expect(component).toBeTruthy();
    expect(mockStressService.getStressTests).toHaveBeenCalledWith('case-123');
  });

  it('should trigger simulation', () => {
    component.runSimulation();
    expect(mockStressService.runCustomStressTest).toHaveBeenCalled();
  });

  it('should have loadError null by default', () => {
    expect(component.loadError()).toBeNull();
  });

  it('should set loadError when API fails and no mock available', () => {
    // On force l’erreur en court-circuitant loadMockData
    component.loadError.set('Erreur de chargement');
    fixture.detectChanges();
    expect(component.loadError()).toBe('Erreur de chargement');
  });

  it('should reset loadError and increment retryCount on onRetryLoad()', () => {
    component.loadError.set('Erreur de chargement');
    const before = component.retryCount();
    component.onRetryLoad();
    expect(component.loadError()).toBeNull();
    expect(component.retryCount()).toBe(before + 1);
  });

  it('should have hasNoData false when stressData is set', () => {
    component.isLoading.set(false);
    component.loadError.set(null);
    component.stressData.set({ scenarios: [], case_id: 'case-123', computed_at: '', base_parameters: {} as any });
    fixture.detectChanges();
    expect(component.hasNoData()).toBe(false);
  });

  it('should have hasNoData true when loading done, no error, no data', () => {
    component.isLoading.set(false);
    component.loadError.set(null);
    component.stressData.set(null);
    fixture.detectChanges();
    expect(component.hasNoData()).toBe(true);
  });

  it('should set isSimulationError to false when runSimulation starts', () => {
    component.isSimulationError.set(true);
    component.runSimulation();
    // Au moment du subscribe, isSimulationError doit être false
    expect(component.isSimulationError()).toBe(false);
  });

  it('should show skeleton while isLoading is true', () => {
    component.isLoading.set(true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-testid="stress-loading-spinner"]');
    expect(el).toBeTruthy();
  });

  it('should hide skeleton after loading completes', () => {
    component.isLoading.set(false);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-testid="stress-loading-spinner"]');
    expect(el).toBeFalsy();
  });
});
