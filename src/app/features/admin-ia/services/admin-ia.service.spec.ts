import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminIaService } from './admin-ia.service';

describe('AdminIaService', () => {
  let service: AdminIaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminIaService]
    });
    service = TestBed.inject(AdminIaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return mock dashboard data', () => {
    // The service uses forkJoin for stats, runs, events
    service.getDashboardData().subscribe(data => {
      expect(data).toBeTruthy();
    });

    // Mock responses for the multiple parallel calls
    const statsReq = httpMock.expectOne(req => req.url.includes('/admin-ia/stats'));
    statsReq.flush({ active_model: null, latest_metrics: {} });

    const runsReq = httpMock.expectOne(req => req.url.includes('/admin-ia/runs'));
    runsReq.flush([]);

    const eventsReq = httpMock.expectOne(req => req.url.includes('/admin-ia/events'));
    eventsReq.flush([]);
  });
});
