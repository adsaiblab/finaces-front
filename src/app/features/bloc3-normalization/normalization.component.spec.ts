import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NormalizationComponent } from './normalization.component';
import { ActivatedRoute } from '@angular/router';
import { CaseService } from '../../core/services/case.service';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('NormalizationComponent', () => {
    let component: NormalizationComponent;
    let fixture: ComponentFixture<NormalizationComponent>;

    const mockCaseService = {
        getNormalizedFinancials: vi.fn().mockReturnValue(of({
            statement_id: 'mock',
            fiscal_year: 2023,
            adjustments: []
        })),
        normalizeFinancials: vi.fn().mockReturnValue(of({})),
        computeRatios: vi.fn().mockReturnValue(of({}))
    };

    const mockActivatedRoute = {
        snapshot: { paramMap: { get: () => 'case-123' } },
        parent: { snapshot: { paramMap: { get: () => 'case-123' } } }
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NormalizationComponent, NoopAnimationsModule],
            providers: [
                { provide: CaseService, useValue: mockCaseService },
                { provide: ActivatedRoute, useValue: mockActivatedRoute }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(NormalizationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create and load data on init', () => {
        expect(component).toBeTruthy();
        expect(mockCaseService.getNormalizedFinancials).toHaveBeenCalledWith('case-123');
        expect(component.isLoading()).toBe(false);
        expect(component.normalizedData()?.fiscal_year).toBe(2023);
    });
});