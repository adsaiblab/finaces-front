import { TestBed } from '@angular/core/testing';
import { RapportExportService } from './rapport-export.service';

describe('RapportExportService', () => {
    let service: RapportExportService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(RapportExportService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});