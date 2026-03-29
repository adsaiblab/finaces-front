import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ScoringMccService } from './scoring-mcc.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../../environments/environment';
import { ScoreOverridePayload } from '../../../core/models/scoring.model';

describe('ScoringMccService', () => {
  let service: ScoringMccService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ScoringMccService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ScoringMccService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET on /score endpoint', () => {
    service.getScoring('case-123').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/cases/case-123/score`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should call POST on /score/override endpoint', () => {
    const payload: ScoreOverridePayload = { new_score: 4.5, reason: 'Senior adjustment' };
    service.overrideScore('case-123', payload).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/cases/case-123/score/override`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });
});
