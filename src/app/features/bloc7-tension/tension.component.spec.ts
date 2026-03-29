import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TensionComponent } from './tension.component';
import { ActivatedRoute } from '@angular/router';
import { ScoringMccService } from '../bloc5-scoring-mcc/services/scoring-mcc.service';
import { IaService } from '../../core/services/ia.service';
import { TensionCalculatorService } from './services/tension-calculator.service';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('TensionComponent', () => {
  let component: TensionComponent;
  let fixture: ComponentFixture<TensionComponent>;

  const mockScoringService = { getScoring: vi.fn().mockReturnValue(of({})) };
  const mockIaService = { getPrediction: vi.fn().mockReturnValue(of({})) };
  const mockTensionCalc = { calculateTension: vi.fn().mockReturnValue({}) };

  const mockActivatedRoute = {
    snapshot: { paramMap: { get: () => 'case-123' } },
    parent: { snapshot: { paramMap: { get: () => 'case-123' } } },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TensionComponent, NoopAnimationsModule],
      providers: [
        { provide: ScoringMccService, useValue: mockScoringService },
        { provide: IaService, useValue: mockIaService },
        { provide: TensionCalculatorService, useValue: mockTensionCalc },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TensionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
