import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RatioCalculationService } from './ratio-calculation.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../../environments/environment';

describe('RatioCalculationService', () => {
  let service: RatioCalculationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RatioCalculationService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RatioCalculationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call the compute endpoint', () => {
    service.computeRatios('case-123').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/cases/case-123/ratios/compute`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should correctly identify if a ratio requires a deep dive', () => {
    expect(service.requiresDeepDive({ status: 'RED' } as any)).toBe(true);
    expect(service.requiresDeepDive({ status: 'GREEN' } as any)).toBe(false);
  });
});
