import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { StressService } from './stress.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../environments/environment';
import { StressScenarioInputSchema } from '../models/stress.model';

describe('StressService', () => {
    let service: StressService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                StressService,
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });
        service = TestBed.inject(StressService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call GET on /stress endpoint', () => {
        service.getStressTests('case-123').subscribe();

        const req = httpMock.expectOne(`${environment.apiUrl}/cases/case-123/stress`);
        expect(req.request.method).toBe('GET');
        req.flush([]);
    });

    it('should call POST on /stress/simulate endpoint with params', () => {
        const mockParams: StressScenarioInputSchema = {
            revenue_shock: -20,
            cost_inflation: 5,
            receivables_days_increase: 30,
            payment_delays_days: 15,
            interest_rate_increase: 2,
            capex_reduction: 0,
            initial_cash: 500000,
            scenario_name: 'Severe Market Shock'
        };

        service.runCustomStressTest('case-123', mockParams).subscribe();

        const req = httpMock.expectOne(`${environment.apiUrl}/cases/case-123/stress/simulate`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(mockParams);
        req.flush({});
    });
});