import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { IaService } from './ia.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../environments/environment';
import { WhatIfScenarioInput } from '../models/ia.model';
import { ConvergenceChartResponse } from '../models/ia-admin.model';

describe('IaService', () => {
  let service: IaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IaService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(IaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET on /predict endpoint', () => {
    service.getPrediction('case-123').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/ia/predict/case-123`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should call POST on /what-if endpoint with WhatIfScenario', () => {
    const mockScenario: WhatIfScenarioInput = {
      scenario_name: 'Stress Test',
      parameter_overrides: { 'EBITDA Margin': 15.5 },
    };

    service.simulateWhatIf('case-123', mockScenario).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/ia/cases/case-123/simulate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockScenario);
    req.flush({});
  });

  it('should call GET /ia/analytics/convergence with default days=30', () => {
    const mockResponse: ConvergenceChartResponse = {
      days: 30,
      data_points: [],
      convergence_pct: 0.0,
    };

    service.getConvergenceChart().subscribe((res) => {
      expect(res.days).toBe(30);
      expect(res.data_points).toEqual([]);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/ia/analytics/convergence` &&
        r.params.get('days') === '30',
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should call GET /ia/analytics/convergence with custom days param', () => {
    service.getConvergenceChart(90).subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/ia/analytics/convergence` &&
        r.params.get('days') === '90',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ days: 90, data_points: [], convergence_pct: 0.5 });
  });
});
