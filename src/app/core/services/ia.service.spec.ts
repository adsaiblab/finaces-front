import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { IaService } from './ia.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../environments/environment';
import { WhatIfScenarioInput } from '../models/ia.model';

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
});
