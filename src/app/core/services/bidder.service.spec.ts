import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BidderService } from './bidder.service';
import { describe, it, expect, beforeEach } from 'vitest';

describe('BidderService', () => {
    let service: BidderService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [BidderService]
        });
        service = TestBed.inject(BidderService);
    });

    it('devrait être créé', () => {
        expect(service).toBeTruthy();
    });
});