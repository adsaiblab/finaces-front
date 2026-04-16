import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FinancialYearService } from './financial-year.service';
import { environment } from '../../../environments/environment';

describe('FinancialYearService', () => {
  let service: FinancialYearService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FinancialYearService],
    });
    service = TestBed.inject(FinancialYearService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch distinct available years and sort descending', () => {
    const caseId = 'test-case-123';
    const mockResponse = [
      { fiscal_year: 2022 },
      { fiscal_year: 2024 },
      { fiscal_year: 2022 },
      { fiscal_year: 2023 }
    ];

    service.loadAvailableYears(caseId).subscribe(years => {
      // Must extract unique years: 2022, 2023, 2024
      // Must sort descending: 2024, 2023, 2022
      expect(years).toEqual([2024, 2023, 2022]);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/cases/${caseId}/financials`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should add a fiscal year', () => {
    const caseId = 'test-case-123';
    const year = 2025;

    service.addFiscalYear(caseId, year).subscribe(response => {
      expect(response.status).toBe('success');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/cases/${caseId}/financials`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      fiscal_year: 2025,
      currency_original: 'MAD',
      exchange_rate_to_usd: 1.0,
      referentiel: 'PCM',
      is_consolidated: false,
      balance_sheet_assets: { liquid_assets: 0, inventory: 0, other_noncurrent_assets: 0 },
      balance_sheet_liabilities: { long_term_debt: 0 },
      income_statement: { revenue: 0 },
      cash_flow: { operating_cash_flow: 0, investing_cash_flow: 0, financing_cash_flow: 0 },
    });
    req.flush({ status: 'success' });
  });
});
