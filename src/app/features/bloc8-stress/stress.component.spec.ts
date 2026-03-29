import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StressComponent } from './stress.component';
import { CaseContextService } from '../../core/services/case-context.service';
import { StressService } from '../../core/services/stress.service';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('StressComponent', () => {
    let component: StressComponent;
    let fixture: ComponentFixture<StressComponent>;

    const mockStressService = {
        getStressTests: vi.fn().mockReturnValue(of({ scenarios: [] })),
        runCustomStressTest: vi.fn().mockReturnValue(of({}))
    };

    const mockCaseContext = {
        caseId: () => 'case-123'
    };

    beforeEach(async () => {
        vi.stubGlobal('requestAnimationFrame', (cb: Function) => cb());

        await TestBed.configureTestingModule({
            imports: [StressComponent, NoopAnimationsModule],
            providers: [
                { provide: StressService, useValue: mockStressService },
                { provide: CaseContextService, useValue: mockCaseContext }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(StressComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create and load data on init', () => {
        expect(component).toBeTruthy();
        expect(mockStressService.getStressTests).toHaveBeenCalledWith('case-123');
    });

    it('should trigger simulation', () => {
        component.runSimulation();
        expect(mockStressService.runCustomStressTest).toHaveBeenCalled();
    });
});