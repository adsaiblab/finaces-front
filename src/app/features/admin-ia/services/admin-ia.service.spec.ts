import { TestBed } from '@angular/core/testing';
import { AdminIaService } from './admin-ia.service';

describe('AdminIaService', () => {
    let service: AdminIaService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AdminIaService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return mock dashboard data', () => {
        return new Promise<void>((resolve) => {
            service.getDashboardData().subscribe(data => {
                expect(data).toBeTruthy();
                expect(data.models.length).toBeGreaterThan(0);
                expect(data.alerts.length).toBeGreaterThan(0);
                resolve();
            });
        });
    });
});